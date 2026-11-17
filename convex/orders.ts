import {paginationOptsValidator,paginationResultValidator} from "convex/server";
import {internal} from "./_generated/api";
import {mutation,query} from "./_generated/server";
import {v} from "convex/values";
import {adjustDayCount,validateAvailabilityDate} from "./availability";
import {getCurrentProfile,requireRole} from "./lib/auth";
import {computeQuote} from "./lib/pricing";
import {nextOrderNumber} from "./lib/orderNumber";
import {historyDocValidator,itemDocValidator,orderDocValidator,timerDocValidator} from "./lib/validators";
import {changeOrderStatus} from "./lib/changeStatus";

const addressInput=v.object({label:v.string(),barangay:v.string(),street:v.string(),blockLot:v.optional(v.string()),landmark:v.optional(v.string()),city:v.string()});
const commonArgs={
  selections:v.array(v.object({serviceId:v.id("services"),quantity:v.number()})),loads:v.number(),
  serviceOption:v.union(v.literal("pickupOnly"),v.literal("pickupAndDelivery")),pickupDate:v.string(),pickupSlotId:v.string(),
  addressId:v.optional(v.id("addresses")),newAddress:v.optional(addressInput),contact:v.object({fullName:v.string(),phone:v.string()}),
  instructions:v.optional(v.string()),paymentMethod:v.union(v.literal("cash"),v.literal("gcash")),
};
type CreateArgs={selections:{serviceId:import("./_generated/dataModel").Id<"services">;quantity:number}[];loads:number;serviceOption:"pickupOnly"|"pickupAndDelivery";pickupDate:string;pickupSlotId:string;addressId?:import("./_generated/dataModel").Id<"addresses">;newAddress?:{label:string;barangay:string;street:string;blockLot?:string;landmark?:string;city:string};contact:{fullName:string;phone:string};instructions?:string;paymentMethod:"cash"|"gcash"};
async function resolveQuote(ctx:import("./_generated/server").MutationCtx,args:CreateArgs,ignoreOrderId?:import("./_generated/dataModel").Id<"orders">){
  if(args.selections.length===0)throw new Error("Choose at least one service.");
  if(args.selections.some(selection=>!Number.isInteger(selection.quantity)||selection.quantity<1))throw new Error("Service quantities must be positive whole numbers.");
  if(!args.contact.fullName.trim()||!(/^(?:09\d{9}|\+639\d{9})$/.test(args.contact.phone.replace(/[\s-]/g,""))))throw new Error("Enter a contact name and valid Philippine mobile number.");
  const profile=await getCurrentProfile(ctx);
  if(!profile)throw new Error("Complete your customer profile before booking.");
  if(!Number.isInteger(args.loads)||args.loads<1)throw new Error("Select at least one load.");
  const settings=await ctx.db.query("settings").withIndex("by_key",q=>q.eq("key","shop")).unique();
  if(!settings)throw new Error("Shop settings are not configured.");
  if(args.loads>settings.maxLoads)throw new Error(`A maximum of ${settings.maxLoads} loads can be booked at once.`);
  validateAvailabilityDate(args.pickupDate,settings.advanceBookingDays);
  if(!settings.timeSlots.some(slot=>slot.id===args.pickupSlotId))throw new Error("Select an available pickup time.");
  let address=args.addressId?await ctx.db.get(args.addressId):null;
  if(args.addressId&&(!address||address.customerId!==profile._id))throw new Error("That address is not available on this account.");
  if(!address&&args.newAddress){const id=await ctx.db.insert("addresses",{...args.newAddress,customerId:profile._id,isDefault:false});address=await ctx.db.get(id);}
  if(!address)throw new Error("Select or enter a pickup address.");
  if(address.city!=="Calamba City"||!address.street.trim()||!address.barangay.trim())throw new Error("Enter a valid Calamba City pickup address.");
  const override=await ctx.db.query("dayOverrides").withIndex("by_date",q=>q.eq("date",args.pickupDate)).unique();
  if(override?.closed)throw new Error(override.reason??"This day is closed.");
  const count=await ctx.db.query("dayCounts").withIndex("by_date",q=>q.eq("date",args.pickupDate)).unique();
  const limit=override?.limit??settings.dailyLimit;
  if((count?.booked??0)>=limit&&(!ignoreOrderId||args.pickupDate!==(await ctx.db.get(ignoreOrderId))?.pickupDate))throw new Error("This day is fully booked");
  const activeStatuses=["requested","approved","picked_up","received","washing","drying","folding","ready","out_for_delivery"] as const;
  for(const status of activeStatuses){
    const conflict=await ctx.db.query("orders").withIndex("by_customer_date_slot_status",q=>q.eq("customerId",profile._id).eq("pickupDate",args.pickupDate).eq("pickupSlotId",args.pickupSlotId).eq("status",status)).first();
    if(conflict&&conflict._id!==ignoreOrderId)throw new Error("You already have an active order for this date and time.");
  }
  const zone=await ctx.db.query("deliveryZones").withIndex("by_barangay",q=>q.eq("barangay",address.barangay)).unique();
  if(args.serviceOption==="pickupAndDelivery"&&(!zone||!zone.active))throw new Error("We do not deliver to that barangay yet.");
  const services=await Promise.all(args.selections.map(selection=>ctx.db.get(selection.serviceId)));
  if(services.some(service=>!service||!service.active||service.category==="selfService"))throw new Error("One or more selected services are unavailable for pickup.");
  const quote=computeQuote({services:services.filter((service):service is NonNullable<typeof service>=>service!==null),selections:args.selections,loads:args.loads,serviceOption:args.serviceOption,zone});
  return {profile,address,quote,settings};
}

export const create=mutation({
  args:commonArgs,
  returns:v.object({orderId:v.id("orders"),orderNumber:v.string(),total:v.number()}),
  handler:async(ctx,args)=>{
    const user=await requireRole(ctx,["customer"]);
    const {profile,address,quote}=await resolveQuote(ctx,args as CreateArgs);
    const orderNumber=await nextOrderNumber(ctx);
    const orderId=await ctx.db.insert("orders",{orderNumber,customerId:profile._id,createdBy:"customer",status:"requested",serviceOption:args.serviceOption,pickupDate:args.pickupDate,pickupSlotId:args.pickupSlotId,loads:args.loads,instructions:args.instructions,isRush:false,addressSnapshot:{fullName:args.contact.fullName,phone:args.contact.phone,barangay:address.barangay,street:address.street,blockLot:address.blockLot,landmark:address.landmark,city:address.city},subtotal:quote.subtotal,deliveryFee:quote.deliveryFee,discount:0,total:quote.total,paymentMethod:args.paymentMethod,paymentStatus:"unpaid"});
    for(const line of quote.lines){await ctx.db.insert("orderItems",{orderId,serviceId:line.serviceId as import("./_generated/dataModel").Id<"services">,name:line.name,pricingType:line.pricingType,unitPrice:line.unitPrice,quantity:line.quantity,subtotal:line.subtotal});}
    await ctx.db.insert("payments",{orderId,method:args.paymentMethod,amount:quote.total,status:"unpaid"});
    await ctx.db.insert("orderStatusHistory",{orderId,to:"requested",actorId:user._id});
    await adjustDayCount(ctx,args.pickupDate,1);
    await ctx.scheduler.runAfter(0,internal.notify.orderEvent,{orderId,event:"created"});
    return {orderId,orderNumber,total:quote.total};
  },
});

export const cancel=mutation({
  args:{orderId:v.id("orders"),reason:v.optional(v.string())},returns:v.null(),
  handler:async(ctx,args)=>{
    const user=await requireRole(ctx,["customer"]),profile=await getCurrentProfile(ctx);
    const order=await ctx.db.get(args.orderId);
    if(!profile||!order||order.customerId!==profile._id)throw new Error("Order not found.");
    if(order.status!=="requested")throw new Error("Only requested orders can be cancelled.");
    await changeOrderStatus(ctx,order,"cancelled",user._id,args.reason?.trim()||"Cancelled by customer");
    return null;
  },
});

export const update=mutation({
  args:{orderId:v.id("orders"),...commonArgs},
  returns:v.object({orderId:v.id("orders"),orderNumber:v.string(),total:v.number()}),
  handler:async(ctx,args)=>{
    await requireRole(ctx,["customer"]);const profile=await getCurrentProfile(ctx),order=await ctx.db.get(args.orderId);
    if(!profile||!order||order.customerId!==profile._id)throw new Error("Order not found.");
    if(order.status!=="requested")throw new Error("Only requested orders can be edited.");
    const {address,quote}=await resolveQuote(ctx,args,order._id);
    for(const item of await ctx.db.query("orderItems").withIndex("by_order",q=>q.eq("orderId",order._id)).take(100))await ctx.db.delete(item._id);
    for(const line of quote.lines)await ctx.db.insert("orderItems",{orderId:order._id,serviceId:line.serviceId as import("./_generated/dataModel").Id<"services">,name:line.name,pricingType:line.pricingType,unitPrice:line.unitPrice,quantity:line.quantity,subtotal:line.subtotal});
    await ctx.db.patch(order._id,{serviceOption:args.serviceOption,pickupDate:args.pickupDate,pickupSlotId:args.pickupSlotId,loads:args.loads,instructions:args.instructions,addressSnapshot:{fullName:args.contact.fullName,phone:args.contact.phone,barangay:address.barangay,street:address.street,blockLot:address.blockLot,landmark:address.landmark,city:address.city},subtotal:quote.subtotal,deliveryFee:quote.deliveryFee,discount:0,total:quote.total,paymentMethod:args.paymentMethod,paymentStatus:"unpaid"});
    const payment=await ctx.db.query("payments").withIndex("by_order",q=>q.eq("orderId",order._id)).unique();if(payment)await ctx.db.patch(payment._id,{amount:quote.total,method:args.paymentMethod,status:"unpaid"});
    if(order.pickupDate!==args.pickupDate){await adjustDayCount(ctx,order.pickupDate,-1);await adjustDayCount(ctx,args.pickupDate,1);}
    await ctx.scheduler.runAfter(0,internal.notify.orderEvent,{orderId:order._id,event:"updated"});
    return {orderId:order._id,orderNumber:order.orderNumber,total:quote.total};
  },
});

export const myOrders=query({
  args:{paginationOpts:paginationOptsValidator},
  returns:paginationResultValidator(orderDocValidator),
  handler:async(ctx,args)=>{
    await requireRole(ctx,["customer"]);
    const profile=await getCurrentProfile(ctx);if(!profile)throw new Error("Customer profile not found.");
    const result=await ctx.db.query("orders").withIndex("by_customer",q=>q.eq("customerId",profile._id)).order("desc").paginate(args.paginationOpts);
    return {...result,page:result.page.filter(order=>!["completed","rejected","cancelled"].includes(order.status)&&order.deletedAt===undefined&&order.archivedAt===undefined)};
  },
});

export const myHistory=query({
  args:{paginationOpts:paginationOptsValidator,status:v.optional(v.string()),search:v.optional(v.string())},returns:paginationResultValidator(orderDocValidator),
  handler:async(ctx,args)=>{
    await requireRole(ctx,["customer"]);
    const profile=await getCurrentProfile(ctx);if(!profile)throw new Error("Customer profile not found.");
    const result=await ctx.db.query("orders").withIndex("by_customer",q=>q.eq("customerId",profile._id)).order("desc").paginate(args.paginationOpts);
    const history=result.page.filter(order=>["completed","rejected","cancelled"].includes(order.status)&&order.deletedAt===undefined&&(args.status===undefined||order.status===args.status)&&(args.search===undefined||order.orderNumber.toLowerCase().includes(args.search.toLowerCase())));
    return {...result,page:history};
  },
});

export const getMine=query({
  args:{orderId:v.id("orders")},returns:v.union(v.null(),v.object({order:orderDocValidator,items:v.array(itemDocValidator),photos:v.array(v.object({_id:v.id("orderPhotos"),_creationTime:v.number(),orderId:v.id("orders"),storageId:v.id("_storage"),kind:v.union(v.literal("intake"),v.literal("ready"),v.literal("issue")),uploadedBy:v.id("users"),url:v.union(v.string(),v.null())})),timer:v.union(v.null(),timerDocValidator),history:v.array(historyDocValidator)})),
  handler:async(ctx,args)=>{
    await requireRole(ctx,["customer"]);
    const profile=await getCurrentProfile(ctx);const order=await ctx.db.get(args.orderId);
    if(!profile||!order||order.customerId!==profile._id||order.deletedAt!==undefined)return null;
    const [items,photos,timer,history]=await Promise.all([
      ctx.db.query("orderItems").withIndex("by_order",q=>q.eq("orderId",order._id)).take(50),
      ctx.db.query("orderPhotos").withIndex("by_order",q=>q.eq("orderId",order._id)).take(50),
      ctx.db.query("orderTimers").withIndex("by_order",q=>q.eq("orderId",order._id)).order("desc").first(),
      ctx.db.query("orderStatusHistory").withIndex("by_order",q=>q.eq("orderId",order._id)).order("desc").take(100),
    ]);
    const photoUrls=await Promise.all(photos.map(async photo=>({...photo,url:await ctx.storage.getUrl(photo.storageId)})));
    return {order,items,photos:photoUrls,timer,history};
  },
});
