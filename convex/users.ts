import {internalMutation,mutation,query} from "./_generated/server";
import {v} from "convex/values";
import {components} from "./_generated/api";
import {requireUser} from "./lib/auth";

const profileValidator=v.object({_id:v.id("customerProfiles"),_creationTime:v.number(),userId:v.optional(v.id("users")),firstName:v.string(),lastName:v.string(),fullName:v.string(),phone:v.string(),email:v.optional(v.string()),notes:v.optional(v.string()),loyaltyPoints:v.number()});
const addressValidator=v.object({_id:v.id("addresses"),_creationTime:v.number(),customerId:v.id("customerProfiles"),label:v.string(),barangay:v.string(),street:v.string(),blockLot:v.optional(v.string()),landmark:v.optional(v.string()),city:v.string(),isDefault:v.boolean()});
export const me=query({args:{},returns:v.union(v.null(),v.object({user:v.object({_id:v.id("users"),_creationTime:v.number(),name:v.optional(v.string()),email:v.optional(v.string()),image:v.optional(v.string()),role:v.optional(v.union(v.literal("customer"),v.literal("staff"),v.literal("admin")))}),profile:v.union(v.null(),profileValidator),addresses:v.array(addressValidator)})),handler:async(ctx)=>{
  const user=await requireUser(ctx),profile=await ctx.db.query("customerProfiles").withIndex("by_user",q=>q.eq("userId",user._id)).unique();
  const addresses=profile?await ctx.db.query("addresses").withIndex("by_customer",q=>q.eq("customerId",profile._id)).take(50):[];
  return {user:{_id:user._id,_creationTime:user._creationTime,name:user.name,email:user.email,image:user.image,role:user.role},profile,addresses};
}});

export const completeOnboarding=mutation({
  args:{firstName:v.string(),lastName:v.string(),phone:v.string(),address:v.object({label:v.string(),barangay:v.string(),street:v.string(),blockLot:v.optional(v.string()),landmark:v.optional(v.string())})},
  returns:v.id("customerProfiles"),
  handler:async(ctx,args)=>{
    const user=await requireUser(ctx);if(user.role!==undefined&&user.role!=="customer")throw new Error("Only customer accounts can complete customer onboarding.");
    const phone=args.phone.replace(/[\s-]/g, ""),firstName=args.firstName.trim(),lastName=args.lastName.trim();if(!firstName||!lastName||!(/^(?:09\d{9}|\+639\d{9})$/.test(phone)))throw new Error("Enter a valid Philippine mobile number.");
    const existing=await ctx.db.query("customerProfiles").withIndex("by_user",q=>q.eq("userId",user._id)).unique();
    const fullName=`${firstName} ${lastName}`;
    let profileId;
    if(existing){profileId=existing._id;await ctx.db.patch(existing._id,{firstName,lastName,fullName,phone,email:user.email});}
    else profileId=await ctx.db.insert("customerProfiles",{userId:user._id,firstName,lastName,fullName,phone,email:user.email,loyaltyPoints:0});
    const addressCount=await ctx.db.query("addresses").withIndex("by_customer",q=>q.eq("customerId",profileId)).take(1);
    if(addressCount.length===0)await ctx.db.insert("addresses",{...args.address,city:"Calamba City",customerId:profileId,isDefault:true});
    const verifiedEmail=(await ctx.runQuery(components.authEmail.verifiedEmails.getPrimaryEmail,{userId:user._id}))?.toLowerCase();
    const isAdmin=verifiedEmail===process.env.ADMIN_EMAIL?.trim().toLowerCase();
    await ctx.db.patch(user._id,{name:fullName,email:verifiedEmail??user.email,role:isAdmin?"admin":"customer"});
    if(verifiedEmail)await ctx.db.patch(profileId,{email:verifiedEmail});
    return profileId;
  },
});

export const updateProfile=mutation({args:{firstName:v.string(),lastName:v.string(),phone:v.string()},returns:v.null(),handler:async(ctx,args)=>{
  const user=await requireUser(ctx);if(user.role!=="customer")throw new Error("Customer access required.");const profile=await ctx.db.query("customerProfiles").withIndex("by_user",q=>q.eq("userId",user._id)).unique();if(!profile)throw new Error("Complete onboarding first.");
    const firstName=args.firstName.trim(),lastName=args.lastName.trim(),phone=args.phone.replace(/[\s-]/g, "");if(!firstName||!lastName||!(/^(?:09\d{9}|\+639\d{9})$/.test(phone)))throw new Error("Enter a valid Philippine mobile number.");const fullName=`${firstName} ${lastName}`;
  await ctx.db.patch(profile._id,{firstName,lastName,fullName,phone});await ctx.db.patch(user._id,{name:fullName});return null;
}});

export const createUser=internalMutation({
  args:{method:v.object({name:v.string(),profile:v.object({id:v.optional(v.string()),email:v.optional(v.string()),emailVerified:v.optional(v.boolean()),name:v.optional(v.string()),picture:v.optional(v.string())})})},
  returns:v.id("users"),
  handler:async(ctx,args)=>{
    const profile=args.method.profile,email=profile.email?.toLowerCase(),name=profile.name?.trim()||email?.split("@")[0]||"Customer";
    const [firstName,...lastParts]=name.split(/\s+/),lastName=lastParts.join(" ");
    const adminEmail=process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const userId=await ctx.db.insert("users",{name,email,image:profile.picture,role:email&&adminEmail&&email===adminEmail?"admin":"customer"});
    await ctx.db.insert("customerProfiles",{userId,firstName,lastName,fullName:name,phone:"",email,loyaltyPoints:0});
    return userId;
  },
});
