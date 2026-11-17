import {mutation,query,type MutationCtx} from "./_generated/server";
import {v} from "convex/values";
import {requireRole,requireUser} from "./lib/auth";
import {addDays,todayManila} from "./lib/dates";

export async function adjustDayCount(ctx:MutationCtx,date:string,delta:number){
  const row=await ctx.db.query("dayCounts").withIndex("by_date",q=>q.eq("date",date)).unique();
  const booked=Math.max(0,(row?.booked??0)+delta);
  if(row)await ctx.db.patch(row._id,{booked});else if(booked>0)await ctx.db.insert("dayCounts",{date,booked});
}

export const getMonth=query({
  args:{month:v.string()},
  returns:v.array(v.object({date:v.string(),booked:v.number(),limit:v.number(),closed:v.boolean(),full:v.boolean()})),
  handler:async(ctx,args)=>{
    await requireUser(ctx);
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(args.month))throw new Error("Month must use YYYY-MM format.");
    const settings=await ctx.db.query("settings").withIndex("by_key",q=>q.eq("key","shop")).unique();
    const defaultLimit=settings?.dailyLimit??3;
    const [year,month]=args.month.split("-").map(Number);
    const days=new Date(Date.UTC(year,month,0)).getUTCDate();
    const from=`${args.month}-01`,to=`${args.month}-${String(days).padStart(2,"0")}`;
    const [counts,overrides]=await Promise.all([
      ctx.db.query("dayCounts").withIndex("by_date",q=>q.gte("date",from).lte("date",to)).take(31),
      ctx.db.query("dayOverrides").withIndex("by_date",q=>q.gte("date",from).lte("date",to)).take(31),
    ]);
    return Array.from({length:days},(_,index)=>{
      const date=`${args.month}-${String(index+1).padStart(2,"0")}`;
      const booked=counts.find(row=>row.date===date)?.booked??0;
      const override=overrides.find(row=>row.date===date);
      const limit=override?.limit??defaultLimit,closed=override?.closed??false;
      return {date,booked,limit,closed,full:closed||booked>=limit};
    });
  },
});

export const setOverride=mutation({
  args:{date:v.string(),limit:v.optional(v.number()),closed:v.boolean(),reason:v.optional(v.string()),clear:v.optional(v.boolean())},
  returns:v.null(),
  handler:async(ctx,args)=>{
    await requireRole(ctx,["admin"]);
    const existing=await ctx.db.query("dayOverrides").withIndex("by_date",q=>q.eq("date",args.date)).unique();
    if(args.clear){if(existing)await ctx.db.delete(existing._id);return null;}
    if(args.limit!==undefined&&args.limit<0)throw new Error("Limit cannot be negative.");
    const value={date:args.date,limit:args.limit,closed:args.closed,reason:args.reason};
    if(existing)await ctx.db.replace(existing._id,value);else await ctx.db.insert("dayOverrides",value);
    return null;
  },
});

export function validateAvailabilityDate(date:string,advanceBookingDays:number){
  const today=todayManila();
  if(date<today)throw new Error("Pickup date cannot be in the past.");
  if(date>addDays(today,advanceBookingDays))throw new Error("Pickup date is outside the booking window.");
}
