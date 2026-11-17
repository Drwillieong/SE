import type {MutationCtx} from "../_generated/server";
import {todayManila} from "./dates";
export async function nextOrderNumber(ctx:MutationCtx,date=todayManila()):Promise<string>{
  const prefix=`WII-${date.replaceAll("-","")}-`;
  const latest=await ctx.db.query("orders").withIndex("by_orderNumber",q=>q.gte("orderNumber",prefix).lt("orderNumber",`${prefix}\uffff`)).order("desc").first();
  const sequence=latest?Number(latest.orderNumber.slice(prefix.length))+1:1;
  return `${prefix}${String(sequence).padStart(3,"0")}`;
}
