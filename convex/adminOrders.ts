import {paginationOptsValidator,paginationResultValidator} from "convex/server";
import {mutation,query,type MutationCtx} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {requireRole,requireStaffOrAdmin} from "./lib/auth";
import {changeOrderStatus} from "./lib/changeStatus";
import {nextStage,type OrderStatus} from "./lib/statusMachine";
import {startStageTimer,stopActiveTimer} from "./timers";
import {adjustDayCount} from "./availability";
import {computeQuote} from "./lib/pricing";
import {nextOrderNumber} from "./lib/orderNumber";
import {orderDocValidator,paymentDocValidator,itemDocValidator,timerDocValidator,historyDocValidator,profileDocValidator} from "./lib/validators";

export const list=query({
  args:{paginationOpts:paginationOptsValidator,status:v.optional(v.union(v.literal("requested"),v.literal("approved"),v.literal("picked_up"),v.literal("received"),v.literal("washing"),v.literal("drying"),v.literal("folding"),v.literal("ready"),v.literal("out_for_delivery"),v.literal("completed"),v.literal("rejected"),v.literal("cancelled"))),fromDate:v.optional(v.string()),toDate:v.optional(v.string()),serviceOption:v.optional(v.union(v.literal("pickupOnly"),v.literal("pickupAndDelivery"))),includeArchived:v.optional(v.boolean()),includeDeleted:v.optional(v.boolean())},
  returns:paginationResultValidator(orderDocValidator),
  handler:async(ctx,args)=>{
    await requireStaffOrAdmin(ctx);
    let source;
    if(args.status){source=ctx.db.query("orders").withIndex("by_status",q=>q.eq("status",args.status as OrderStatus));}
    else source=ctx.db.query("orders").withIndex("by_pickupDate",q=>args.fromDate?q.gte("pickupDate",args.fromDate):q);
    const result=await source.order("desc").paginate(args.paginationOpts);
    const page=result.page.filter(order=>(args.toDate===undefined||order.pickupDate<=args.toDate)&&(args.fromDate===undefined||order.pickupDate>=args.fromDate)&&(args.serviceOption===undefined||order.serviceOption===args.serviceOption)&&(args.includeArchived||order.archivedAt===undefined)&&(args.includeDeleted||order.deletedAt===undefined));
    return {...result,page};
  },
});

export const get=query({
  args:{orderId:v.id("orders")},returns:v.union(v.null(),v.object({order:orderDocValidator,customer:v.union(v.null(),profileDocValidator),items:v.array(itemDocValidator),photos:v.array(v.object({_id:v.id("orderPhotos"),_creationTime:v.number(),orderId:v.id("orders"),storageId:v.id("_storage"),kind:v.union(v.literal("intake"),v.literal("ready"),v.literal("issue")),uploadedBy:v.id("users"),url:v.union(v.string(),v.null())})),timer:v.union(v.null(),timerDocValidator),history:v.array(historyDocValidator),payment:v.union(v.null(),paymentDocValidator)})),
  handler:async(ctx,args)=>{
    await requireStaffOrAdmin(ctx);const order=await ctx.db.get(args.orderId);if(!order)return null;
    const [customer,items,photos,timer,history,payment]=await Promise.all([
      ctx.db.get(order.customerId),ctx.db.query("orderItems").withIndex("by_order",q=>q.eq("orderId",order._id)).take(100),
      ctx.db.query("orderPhotos").withIndex("by_order",q=>q.eq("orderId",order._id)).take(50),
      ctx.db.query("orderTimers").withIndex("by_order",q=>q.eq("orderId",order._id)).order("desc").first(),
      ctx.db.query("orderStatusHistory").withIndex("by_order",q=>q.eq("orderId",order._id)).order("desc").take(100),
      ctx.db.query("payments").withIndex("by_order",q=>q.eq("orderId",order._id)).unique(),
    ]);
    return {order,customer,items,photos:await Promise.all(photos.map(async photo=>({...photo,url:await ctx.storage.getUrl(photo.storageId)}))),timer,history,payment};
  },
});

async function getOrder(ctx:MutationCtx,orderId:import("./_generated/dataModel").Id<"orders">){
  const order=await ctx.db.get(orderId);if(!order||order.deletedAt!==undefined)throw new Error("Order not found.");return order;
}
function actionMutation(target:"approved"|"rejected"|"picked_up"|"cancelled"|"completed"){
  return mutation({args:{orderId:v.id("orders"),reason:v.optional(v.string())},returns:v.null(),handler:async(ctx,args)=>{
    const user=await requireStaffOrAdmin(ctx),order=await getOrder(ctx,args.orderId);
    await changeOrderStatus(ctx,order,target,user._id,args.reason);return null;
  }});
}
export const approve=actionMutation("approved");
export const reject=actionMutation("rejected");
export const markPickedUp=actionMutation("picked_up");
export const cancel=actionMutation("cancelled");
export const complete=actionMutation("completed");

export const advance=mutation({
  args:{orderId:v.id("orders")},returns:v.null(),
  handler:async(ctx,args)=>{const user=await requireStaffOrAdmin(ctx),order=await getOrder(ctx,args.orderId);if(order.status==="picked_up")throw new Error("Record intake kilos and photos before receiving this order.");const next=nextStage(order.status as OrderStatus,order.serviceOption);if(!next)throw new Error("This order has no next stage.");await stopActiveTimer(ctx,order._id);await changeOrderStatus(ctx,order,next,user._id);await startStageTimer(ctx,order._id,next);return null;},
});

export const setStage=mutation({
  args:{orderId:v.id("orders"),status:v.union(v.literal("washing"),v.literal("drying"),v.literal("folding"),v.literal("ready"))},returns:v.null(),
  handler:async(ctx,args)=>{const user=await requireStaffOrAdmin(ctx),order=await getOrder(ctx,args.orderId);await stopActiveTimer(ctx,order._id);await changeOrderStatus(ctx,order,args.status,user._id,"Stage updated by staff");await startStageTimer(ctx,order._id,args.status);return null;},
});

export const recordIntake=mutation({
  args:{orderId:v.id("orders"),kilos:v.number(),photoStorageIds:v.array(v.id("_storage")),adjustedTotal:v.optional(v.number()),adjustReason:v.optional(v.string())},returns:v.null(),
  handler:async(ctx,args)=>{
    const user=await requireStaffOrAdmin(ctx),order=await getOrder(ctx,args.orderId);
    if(args.kilos<=0)throw new Error("Weight must be greater than zero.");
    if(args.photoStorageIds.length<1||args.photoStorageIds.length>6)throw new Error("Add between 1 and 6 intake photos.");
    if(args.adjustedTotal!==undefined&&(user.role!=="admin"||!args.adjustReason?.trim()))throw new Error("Only admins can adjust a total, and a reason is required.");
    for(const storageId of args.photoStorageIds){const meta=await ctx.db.system.get("_storage",storageId);if(!meta||!meta.contentType?.startsWith("image/")||meta.size>5*1024*1024)throw new Error("Each intake photo must be an image no larger than 5 MB.");}
    if(order.status!=="picked_up"&&!(order.createdBy!=="customer"&&order.status==="approved"))throw new Error("This order is not ready for intake.");
    await ctx.db.patch(order._id,{kilos:args.kilos,...(args.adjustedTotal===undefined?{}:{total:args.adjustedTotal})});
    for(const storageId of args.photoStorageIds)await ctx.db.insert("orderPhotos",{orderId:order._id,storageId,kind:"intake",uploadedBy:user._id});
    if(args.adjustedTotal!==undefined){const payment=await ctx.db.query("payments").withIndex("by_order",q=>q.eq("orderId",order._id)).unique();if(payment)await ctx.db.patch(payment._id,{amount:args.adjustedTotal});await ctx.db.insert("auditLogs",{actorId:user._id,action:"adjust_total",entity:"order",entityId:order._id,meta:{oldTotal:order.total,newTotal:args.adjustedTotal,reason:args.adjustReason}});}
    await ctx.db.patch(order._id,{estimatedReadyAt:Date.now()+48*60*60*1000});
    await changeOrderStatus(ctx,order,"received",user._id,"Intake recorded");
    return null;
  },
});

export const archive=mutation({args:{orderId:v.id("orders")},returns:v.null(),handler:async(ctx,args)=>{await requireStaffOrAdmin(ctx);const order=await getOrder(ctx,args.orderId);await ctx.db.patch(order._id,{archivedAt:Date.now()});return null;}});
export const restore=mutation({args:{orderId:v.id("orders")},returns:v.null(),handler:async(ctx,args)=>{await requireStaffOrAdmin(ctx);const order=await ctx.db.get(args.orderId);if(!order)throw new Error("Order not found.");if(order.deletedAt!==undefined&&order.status!=="rejected"&&order.status!=="cancelled")await adjustDayCount(ctx,order.pickupDate,1);await ctx.db.patch(order._id,{archivedAt:undefined,deletedAt:undefined});return null;}});
export const softDelete=mutation({args:{orderId:v.id("orders")},returns:v.null(),handler:async(ctx,args)=>{await requireStaffOrAdmin(ctx);const order=await getOrder(ctx,args.orderId);await stopActiveTimer(ctx,order._id);if(order.status!=="rejected"&&order.status!=="cancelled")await adjustDayCount(ctx,order.pickupDate,-1);await ctx.db.patch(order._id,{deletedAt:Date.now()});return null;}});
export const purge=mutation({args:{orderId:v.id("orders")},returns:v.null(),handler:async(ctx,args)=>{
  await requireRole(ctx,["admin"]);const order=await ctx.db.get(args.orderId);if(!order)throw new Error("Order not found.");if(order.status!=="completed"&&order.status!=="rejected"&&order.status!=="cancelled"&&order.archivedAt===undefined&&order.deletedAt===undefined)throw new Error("Archive or hide an order before purging it.");
  const [items,photos,timers,history,payments]=await Promise.all([
    ctx.db.query("orderItems").withIndex("by_order",q=>q.eq("orderId",order._id)).take(100),ctx.db.query("orderPhotos").withIndex("by_order",q=>q.eq("orderId",order._id)).take(100),ctx.db.query("orderTimers").withIndex("by_order",q=>q.eq("orderId",order._id)).take(100),ctx.db.query("orderStatusHistory").withIndex("by_order",q=>q.eq("orderId",order._id)).take(100),ctx.db.query("payments").withIndex("by_order",q=>q.eq("orderId",order._id)).take(100),
  ]);
  if(order.deletedAt===undefined&&order.status!=="rejected"&&order.status!=="cancelled")await adjustDayCount(ctx,order.pickupDate,-1);
  for(const photo of photos){await ctx.storage.delete(photo.storageId);await ctx.db.delete(photo._id);}for(const row of [...items,...timers,...history,...payments])await ctx.db.delete(row._id);await ctx.db.delete(order._id);return null;
}});

export const generateUploadUrl=mutation({args:{},returns:v.string(),handler:async(ctx)=>{await requireStaffOrAdmin(ctx);return await ctx.storage.generateUploadUrl();}});

export const customersSearch=query({
  args:{query:v.string()},returns:v.array(profileDocValidator),
  handler:async(ctx,args)=>{
    await requireStaffOrAdmin(ctx);const search=args.query.trim();if(!search)return [];
    const byPhone=await ctx.db.query("customerProfiles").withIndex("by_phone",q=>q.eq("phone",search)).take(10);
    const byName=await ctx.db.query("customerProfiles").withSearchIndex("search_name",q=>q.search("fullName",search)).take(20);
    const combined=[...byPhone,...byName];return combined.filter((profile,index)=>combined.findIndex(other=>other._id===profile._id)===index).slice(0,20);
  },
});

export const adminCreate=mutation({
  args:{selections:v.array(v.object({serviceId:v.id("services"),quantity:v.number(),finalUnitPrice:v.optional(v.number())})),loads:v.number(),serviceOption:v.union(v.literal("pickupOnly"),v.literal("pickupAndDelivery")),pickupDate:v.string(),pickupSlotId:v.string(),paymentMethod:v.union(v.literal("cash"),v.literal("gcash")),customerId:v.optional(v.id("customerProfiles")),guest:v.optional(v.object({firstName:v.string(),lastName:v.string(),phone:v.string(),email:v.optional(v.string())})),address:v.object({fullName:v.string(),phone:v.string(),barangay:v.string(),street:v.string(),blockLot:v.optional(v.string()),landmark:v.optional(v.string()),city:v.string()}),instructions:v.optional(v.string()),startAtReceived:v.boolean()},
  returns:v.object({orderId:v.id("orders"),orderNumber:v.string(),total:v.number()}),
  handler:async(ctx,args)=>{
    const actor=await requireStaffOrAdmin(ctx);const settings=await ctx.db.query("settings").withIndex("by_key",q=>q.eq("key","shop")).unique();if(!settings)throw new Error("Shop settings are not configured.");if(args.loads<1||args.loads>settings.maxLoads||!Number.isInteger(args.loads))throw new Error(`Loads must be between 1 and ${settings.maxLoads}.`);if(args.selections.length===0)throw new Error("Choose at least one service.");if(!settings.timeSlots.some(slot=>slot.id===args.pickupSlotId))throw new Error("Choose a valid pickup time slot.");if(args.address.city!=="Calamba City"||!args.address.street.trim()||!args.address.barangay.trim())throw new Error("Enter a valid Calamba City pickup address.");if(!args.address.fullName.trim()||!(/^(?:09\d{9}|\+639\d{9})$/.test(args.address.phone.replace(/[\s-]/g,""))))throw new Error("Enter a valid contact name and Philippine mobile number.");
    if(actor.role!=="admin"&&args.selections.some(item=>item.finalUnitPrice!==undefined))throw new Error("Only admins can set a final dry-cleaning price.");
    let customer=args.customerId?await ctx.db.get(args.customerId):null;
    if(args.customerId&&!customer)throw new Error("Customer not found.");
    if(!customer&&args.guest){const fullName=`${args.guest.firstName} ${args.guest.lastName}`.trim();const id=await ctx.db.insert("customerProfiles",{firstName:args.guest.firstName,lastName:args.guest.lastName,fullName,phone:args.guest.phone,email:args.guest.email,loyaltyPoints:0});customer=await ctx.db.get(id);}
    if(!customer)throw new Error("Choose a customer or enter guest details.");
    const services=await Promise.all(args.selections.map(item=>ctx.db.get(item.serviceId)));
    if(services.some(service=>!service||!service.active))throw new Error("A selected service is unavailable.");
    const zone=await ctx.db.query("deliveryZones").withIndex("by_barangay",q=>q.eq("barangay",args.address.barangay)).unique();
    if(args.serviceOption==="pickupAndDelivery"&&(!zone||!zone.active))throw new Error("Delivery is not available in that barangay.");
    const quote=computeQuote({services:services.filter((service):service is NonNullable<typeof service>=>service!==null),selections:args.selections,loads:args.loads,serviceOption:args.serviceOption,zone});
    for(let i=0;i<args.selections.length;i++){
      const selection=args.selections[i],service=services[i];if(selection.finalUnitPrice!==undefined&&(!Number.isInteger(selection.finalUnitPrice)||selection.finalUnitPrice<0))throw new Error("Final service price must be non-negative centavos.");if(service?.pricingType==="quote"&&selection.finalUnitPrice!==undefined){const line=quote.lines.find(item=>item.serviceId===selection.serviceId);if(line){line.unitPrice=selection.finalUnitPrice;line.subtotal=line.unitPrice*line.quantity;}}
    }
    quote.subtotal=quote.lines.reduce((sum,line)=>sum+line.subtotal,0);quote.total=quote.subtotal+quote.deliveryFee;
    const orderNumber=await nextOrderNumber(ctx),status=args.startAtReceived?"received":"requested";
    const orderId=await ctx.db.insert("orders",{orderNumber,customerId:customer._id,createdBy:actor.role==="admin"?"admin":"staff",status,serviceOption:args.serviceOption,pickupDate:args.pickupDate,pickupSlotId:args.pickupSlotId,loads:args.loads,instructions:args.instructions,isRush:false,addressSnapshot:args.address,subtotal:quote.subtotal,deliveryFee:quote.deliveryFee,discount:0,total:quote.total,paymentMethod:args.paymentMethod,paymentStatus:"unpaid"});
    for(const line of quote.lines)await ctx.db.insert("orderItems",{orderId,serviceId:line.serviceId as import("./_generated/dataModel").Id<"services">,name:line.name,pricingType:line.pricingType,unitPrice:line.unitPrice,quantity:line.quantity,subtotal:line.subtotal,quoteAdjustedBy:line.pricingType==="quote"&&line.unitPrice>0?actor._id:undefined});
    await ctx.db.insert("payments",{orderId,method:args.paymentMethod,amount:quote.total,status:"unpaid"});
    await ctx.db.insert("orderStatusHistory",{orderId,to:status,actorId:actor._id,note:"Created by staff"});
    await adjustDayCount(ctx,args.pickupDate,1);
    await ctx.scheduler.runAfter(0,internal.notify.orderEvent,{orderId,event:"created"});
    return {orderId,orderNumber,total:quote.total};
  },
});
