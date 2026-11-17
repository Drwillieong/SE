import {internal} from "./_generated/api";
import {internalMutation,mutation,type MutationCtx} from "./_generated/server";
import {v} from "convex/values";
import {requireStaffOrAdmin} from "./lib/auth";
import {changeOrderStatus} from "./lib/changeStatus";
import {nextStage,type OrderStatus} from "./lib/statusMachine";

type Stage="washing"|"drying"|"folding";
async function scheduleStage(ctx:MutationCtx,orderId:import("./_generated/dataModel").Id<"orders">,stage:Stage,autoAdvance=true){
  const settings=await ctx.db.query("settings").withIndex("by_key",q=>q.eq("key","shop")).unique();if(!settings)throw new Error("Shop settings not found.");
  const duration=settings.stageMinutes[stage]*60_000,startsAt=Date.now(),endsAt=startsAt+duration;
  const timerId=await ctx.db.insert("orderTimers",{orderId,stage,startsAt,endsAt,autoAdvance,active:true});
  if(autoAdvance){const scheduledFnId=await ctx.scheduler.runAt(endsAt,internal.timers.autoAdvance,{orderId,timerId});await ctx.db.patch(timerId,{scheduledFnId});}
  return timerId;
}
export async function stopActiveTimer(ctx:MutationCtx,orderId:import("./_generated/dataModel").Id<"orders">){
  const timers=await ctx.db.query("orderTimers").withIndex("by_order",q=>q.eq("orderId",orderId)).take(100);
  for(const timer of timers){if(timer.active){if(timer.scheduledFnId)await ctx.scheduler.cancel(timer.scheduledFnId);await ctx.db.patch(timer._id,{active:false,scheduledFnId:undefined});}}
}
export async function startStageTimer(ctx:MutationCtx,orderId:import("./_generated/dataModel").Id<"orders">,stage:OrderStatus){
  if(stage==="washing"||stage==="drying"||stage==="folding")return await scheduleStage(ctx,orderId,stage,true);
}

export const start=mutation({args:{orderId:v.id("orders")},returns:v.id("orderTimers"),handler:async(ctx,args)=>{
  await requireStaffOrAdmin(ctx);const order=await ctx.db.get(args.orderId);if(!order)throw new Error("Order not found.");
  if(order.status!=="washing"&&order.status!=="drying"&&order.status!=="folding")throw new Error("Timers can only run during wash, dry or fold.");
  await stopActiveTimer(ctx,order._id);return await scheduleStage(ctx,order._id,order.status,true);
}});
export const stop=mutation({args:{orderId:v.id("orders")},returns:v.null(),handler:async(ctx,args)=>{await requireStaffOrAdmin(ctx);await stopActiveTimer(ctx,args.orderId);return null;}});
export const toggleAutoAdvance=mutation({args:{orderId:v.id("orders"),enabled:v.boolean()},returns:v.null(),handler:async(ctx,args)=>{
  await requireStaffOrAdmin(ctx);const timers=await ctx.db.query("orderTimers").withIndex("by_order",q=>q.eq("orderId",args.orderId)).order("desc").take(20);const timer=timers.find(row=>row.active);if(!timer)throw new Error("No active timer found.");
  if(args.enabled){const scheduledFnId=await ctx.scheduler.runAt(timer.endsAt,internal.timers.autoAdvance,{orderId:args.orderId,timerId:timer._id});await ctx.db.patch(timer._id,{autoAdvance:true,scheduledFnId});}
  else{if(timer.scheduledFnId)await ctx.scheduler.cancel(timer.scheduledFnId);await ctx.db.patch(timer._id,{autoAdvance:false,scheduledFnId:undefined});}return null;
}});
export const autoAdvance=internalMutation({args:{orderId:v.id("orders"),timerId:v.id("orderTimers")},returns:v.null(),handler:async(ctx,args)=>{
  const timer=await ctx.db.get(args.timerId);const order=await ctx.db.get(args.orderId);
  if(!timer||!order||!timer.active||!timer.autoAdvance||timer.orderId!==order._id||order.status!==timer.stage)return null;
  await ctx.db.patch(timer._id,{active:false,scheduledFnId:undefined});
  const next=nextStage(order.status as OrderStatus,order.serviceOption);if(!next)return null;
  await changeOrderStatus(ctx,order,next,undefined);
  if(next==="drying"||next==="folding")await scheduleStage(ctx,order._id,next,true);
  return null;
}});
