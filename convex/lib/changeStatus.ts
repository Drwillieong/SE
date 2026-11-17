import type {Doc,Id} from "../_generated/dataModel";
import {internal} from "../_generated/api";
import type {MutationCtx} from "../_generated/server";
import type {OrderStatus} from "./statusMachine";
import {canTransition} from "./statusMachine";
import {adjustDayCount} from "../availability";
import {todayManila} from "./dates";

export async function changeOrderStatus(ctx:MutationCtx,order:Doc<"orders">,to:OrderStatus,actorId:Id<"users">|undefined,note?:string){
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
    const profile=await ctx.db.get(order.customerId);
    if(profile)await ctx.db.patch(profile._id,{loyaltyPoints:profile.loyaltyPoints+Math.floor(order.total/10000)});
    const date=todayManila(new Date(now)),stats=await ctx.db.query("dailyStats").withIndex("by_date",q=>q.eq("date",date)).unique();
    const items=await ctx.db.query("orderItems").withIndex("by_order",q=>q.eq("orderId",order._id)).take(100);
    const byService={...(stats?.byService??{})},byPayment={...(stats?.byPayment??{})};
    for(const item of items)byService[item.name]=(byService[item.name]??0)+1;
    byPayment[order.paymentMethod]=(byPayment[order.paymentMethod]??0)+1;
    if(stats)await ctx.db.patch(stats._id,{orders:stats.orders+1,revenue:stats.revenue+order.total,byService,byPayment});
    else await ctx.db.insert("dailyStats",{date,orders:1,revenue:order.total,byService,byPayment});
  }
  await ctx.db.patch(order._id,patch);
  await ctx.db.insert("orderStatusHistory",{orderId:order._id,from:order.status,to,actorId,note});
  if(to==="rejected"||to==="cancelled")await adjustDayCount(ctx,order.pickupDate,-1);
  await ctx.scheduler.runAfter(0,internal.notify.orderEvent,{orderId:order._id,event:to});
}
