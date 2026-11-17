import {query} from "./_generated/server";
import {v} from "convex/values";
import {getCurrentProfile} from "./lib/auth";
export const list=query({
  args:{},returns:v.array(v.object({_id:v.id("addresses"),_creationTime:v.number(),customerId:v.id("customerProfiles"),label:v.string(),barangay:v.string(),street:v.string(),blockLot:v.optional(v.string()),landmark:v.optional(v.string()),city:v.string(),isDefault:v.boolean()})),
  handler:async(ctx)=>{const profile=await getCurrentProfile(ctx);if(!profile)return [];return await ctx.db.query("addresses").withIndex("by_customer",q=>q.eq("customerId",profile._id)).take(50);},
});
