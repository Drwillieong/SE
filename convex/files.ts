import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireRole } from "./lib/auth";

export const generatePaymentUploadUrl=mutation({args:{},returns:v.string(),handler:async(ctx)=>{
  await requireRole(ctx,["customer"]);return await ctx.storage.generateUploadUrl();
}});
