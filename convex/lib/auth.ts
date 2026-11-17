import {getAuthUserId} from "@convex-dev/auth/server";
import type {Doc,Id} from "../_generated/dataModel";
import type {MutationCtx,QueryCtx} from "../_generated/server";
type Context=QueryCtx|MutationCtx;
export async function requireUser(ctx:Context):Promise<Doc<"users">>{
  const userId=await getAuthUserId(ctx);
  if(!userId)throw new Error("Authentication required.");
  const user=await ctx.db.get(userId);
  if(!user||user.disabledAt!==undefined)throw new Error("This account is unavailable.");
  return user;
}
export async function requireRole(ctx:Context,roles:readonly ("customer"|"staff"|"admin")[]):Promise<Doc<"users">>{
  const user=await requireUser(ctx);
  if(!user.role||!roles.includes(user.role))throw new Error("You do not have permission to do this.");
  return user;
}
export function requireStaffOrAdmin(ctx:Context){return requireRole(ctx,["staff","admin"]);}
export async function getCurrentProfile(ctx:Context,userId?:Id<"users">){
  const user=userId?await ctx.db.get(userId):await requireUser(ctx);
  if(!user)return null;
  return await ctx.db.query("customerProfiles").withIndex("by_user",q=>q.eq("userId",user._id)).unique();
}
