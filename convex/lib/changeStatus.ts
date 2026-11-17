import type {Id} from "../_generated/dataModel";
import {internal} from "../_generated/api";
import type {MutationCtx} from "../_generated/server";
import type {OrderStatus} from "./statusMachine";
import {canTransition} from "./statusMachine";
import {adjustDayCount} from "../availability";

export async function changeOrderStatus(ctx:MutationCtx,order:Awaited<ReturnType<MutationCtx["db"]["get"]>> & {status:OrderStatus;serviceOption:"pickupOnly"|"pickupAndDelivery";pickupDate:string;_id:Id<"orders">},to:OrderStatus,actorId:Id<"users">|undefined,note?:string){
  if(!canTransition(order.status,to,order.serviceOption))throw new Error(`Cannot move an order from ${order.status} to ${to}.`);
  if((to==="rejected"||to==="cancelled")&&!note?.trim())throw new Error("A reason is required.");
  const now=Date.now();
  const patch:{status:OrderStatus;rejectionReason?:string;cancelReason?:string;completedAt?:number;archivedAt?:number}={status:to};
  if(to==="rejected")patch.rejectionReason=note;
  if(to==="cancelled")patch.cancelReason=note;
  if(to==="completed"){
    patch.completedAt=now;
    const settings=await ctx.db.query("settings").withIndex("by_key",q=>q.eq("key","shop")).unique();
    if(settings?.autoArchiveDays===0)patch.archivedAt=now;
  }
  await ctx.db.patch(order._id,patch);
  await ctx.db.insert("orderStatusHistory",{orderId:order._id,from:order.status,to,actorId,note});
  if(to==="rejected"||to==="cancelled")await adjustDayCount(ctx,order.pickupDate,-1);
  await ctx.scheduler.runAfter(0,internal.notify.orderEvent,{orderId:order._id,event:to});
}
