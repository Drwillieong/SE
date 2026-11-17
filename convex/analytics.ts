import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireRole } from "./lib/auth";
import { addDays, todayManila } from "./lib/dates";
import type { OrderStatus } from "./lib/statusMachine";

const rangeValidator=v.union(v.literal("1d"),v.literal("7d"),v.literal("30d"),v.literal("90d"));
export const dashboard=query({args:{range:rangeValidator},returns:v.object({todayPickups:v.number(),pendingApprovals:v.number(),inProgress:v.number(),ready:v.number(),unpaidCompleted:v.number(),gcashAwaitingReview:v.number(),revenue:v.number(),completedOrders:v.number(),averageOrderValue:v.number(),revenueSeries:v.array(v.object({date:v.string(),revenue:v.number(),orders:v.number()})),statusDistribution:v.array(v.object({status:v.string(),count:v.number()})),needsAttention:v.array(v.object({type:v.string(),count:v.number()}))}),handler:async(ctx,args)=>{
  await requireRole(ctx,["admin"]);
  const today=todayManila(),days=args.range==="1d"?1:args.range==="7d"?7:args.range==="30d"?30:90,start=addDays(today,-(days-1));
  const [stats,pickups,requested,readyRows,unpaid,pending,timers]=await Promise.all([
    ctx.db.query("dailyStats").withIndex("by_date",q=>q.gte("date",start).lte("date",today)).take(100),
    ctx.db.query("orders").withIndex("by_pickupDate",q=>q.eq("pickupDate",today)).take(500),
    ctx.db.query("orders").withIndex("by_status",q=>q.eq("status","requested")).take(500),
    ctx.db.query("orders").withIndex("by_status",q=>q.eq("status","ready")).take(500),
    ctx.db.query("orders").withIndex("by_status",q=>q.eq("status","completed")).take(500),
    ctx.db.query("payments").withIndex("by_status",q=>q.eq("status","pending_review")).take(500),
    ctx.db.query("orderTimers").withIndex("by_active_end",q=>q.eq("active",true)).take(500),
  ]);
  const activeStatuses=["picked_up","received","washing","drying","folding","out_for_delivery"];
  const progressed=await Promise.all(activeStatuses.map(status=>ctx.db.query("orders").withIndex("by_status",q=>q.eq("status",status as OrderStatus)).take(500)));
  const completed=unpaid.filter(order=>order.paymentStatus!=="paid"&&order.paymentStatus!=="refunded"&&order.deletedAt===undefined),revenue=stats.reduce((sum,row)=>sum+row.revenue,0),completedOrders=stats.reduce((sum,row)=>sum+row.orders,0);
  const statusDistribution=[{status:"requested",count:requested.length},{status:"in_progress",count:progressed.reduce((s,rows)=>s+rows.length,0)},{status:"ready",count:readyRows.length},{status:"completed",count:completedOrders}];
  return {todayPickups:pickups.filter(o=>o.deletedAt===undefined).length,pendingApprovals:requested.length,inProgress:progressed.reduce((s,rows)=>s+rows.length,0),ready:readyRows.length,unpaidCompleted:completed.length,gcashAwaitingReview:pending.length,revenue,completedOrders,averageOrderValue:completedOrders?Math.round(revenue/completedOrders):0,revenueSeries:stats.sort((a,b)=>a.date.localeCompare(b.date)).map(({date,revenue,orders})=>({date,revenue,orders})),statusDistribution,needsAttention:[{type:"overdueTimers",count:timers.filter(timer=>timer.endsAt<=Date.now()).length},{type:"unpaidCompleted",count:completed.length},{type:"gcashProofs",count:pending.length}]};
}});

export const operations=query({args:{},returns:v.object({todayPickups:v.number(),pendingApprovals:v.number(),inProgress:v.number(),ready:v.number()}),handler:async(ctx)=>{
  await requireRole(ctx,["staff","admin"]);const today=todayManila();
  const [pickups,requested,ready]=await Promise.all([ctx.db.query("orders").withIndex("by_pickupDate",q=>q.eq("pickupDate",today)).take(500),ctx.db.query("orders").withIndex("by_status",q=>q.eq("status","requested")).take(500),ctx.db.query("orders").withIndex("by_status",q=>q.eq("status","ready")).take(500)]);
  const statuses=["picked_up","received","washing","drying","folding","out_for_delivery"];
  const inProgress=await Promise.all(statuses.map(status=>ctx.db.query("orders").withIndex("by_status",q=>q.eq("status",status as OrderStatus)).take(500)));
  return {todayPickups:pickups.length,pendingApprovals:requested.length,ready:ready.length,inProgress:inProgress.reduce((sum,rows)=>sum+rows.length,0)};
}});
