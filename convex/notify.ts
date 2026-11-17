import {internalMutation} from "./_generated/server";
import {v} from "convex/values";
export const orderEvent=internalMutation({
  args:{orderId:v.id("orders"),event:v.string()},returns:v.null(),
  handler:async(_ctx,args)=>{console.log("Order event",args.event,args.orderId);return null;},
});
