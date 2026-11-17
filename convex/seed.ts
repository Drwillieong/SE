import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const free = new Set(["Brgy. 1", "Brgy. 2", "Brgy. 3", "Brgy. 4", "Brgy. 5", "Brgy. 6", "Brgy. 7", "Lecheria", "San Juan", "San Jose", "Looc", "Ba\u00f1adero", "Palingon", "Lingga", "Sampiruhan", "Parian"]);
const barangays = ["Brgy. 1", "Brgy. 2", "Brgy. 3", "Brgy. 4", "Brgy. 5", "Brgy. 6", "Brgy. 7", "Banlic", "Barandal", "Batino", "Bubuyan", "Bucal", "Bunggo", "Ba\u00f1adero", "Burol", "Camaligan", "Canlubang", "Halang", "Hornalan", "Kay-Anlog", "La Mesa", "Laguerta", "Lawa", "Lecheria", "Lingga", "Looc", "Mabato", "Majada Labas", "Makiling", "Mapagong", "Masili", "Maunong", "Mayapa", "Paciano Rizal", "Palingon", "Palo-Alto", "Pansol", "Parian", "Prinza", "Punta", "Puting Lupa", "Real", "Saimsim", "Sampiruhan", "San Cristobal", "San Jose", "San Juan", "Sirang Lupa", "Sucol", "Turbina", "Ulango", "Uwisan"];
const services = [
  { key:"fullService",name:"Full Service (Wash, Dry & Fold)",category:"laundry" as const,pricingType:"per_load" as const,price:19900,description:"Detergent, fabcon and colorsafe bleach included.",includesSupplies:true,active:true,sortOrder:1 },
  { key:"washDryFold",name:"Wash, Dry & Fold",category:"laundry" as const,pricingType:"per_load" as const,price:17900,description:"Bring your own detergent and fabcon.",includesSupplies:false,active:true,sortOrder:2 },
  ...[["barong","Barong",35000],["coat","Coat",40000],["gown","Gown",65000],["weddingGown","Wedding Gown",150000]].map(([key,label,start],i)=>({key:`dryClean_${key}`,name:`Dry Cleaning: ${label}`,category:"dryCleaning" as const,pricingType:"quote" as const,price:0,startingPrice:Number(start),description:`Professional dry cleaning for ${String(label).toLowerCase()}.`,includesSupplies:false,active:true,sortOrder:3+i})),
  ...[["addon_extraDry","Extra Dry (10 min)",2500],["addon_extraWash","Extra Wash (38 min)",7500],["addon_extraRinseSpin","Extra Rinse & Spin (28 min)",4500]].map(([key,name,price],i)=>({key:String(key),name:String(name),category:"addon" as const,pricingType:"flat" as const,price:Number(price),description:"Laundry add-on service.",includesSupplies:false,active:true,sortOrder:7+i})),
  ...[["selfService_wash","Self Service Wash (38 min)",6500],["selfService_dry","Self Service Dry (40 min)",7500],["selfService_fold","Self Service Fold (with free plastic)",3500]].map(([key,name,price],i)=>({key:String(key),name:String(name),category:"selfService" as const,pricingType:"flat" as const,price:Number(price),description:"Walk-in only.",includesSupplies:false,active:true,sortOrder:10+i})),
  ...[["washFold","Wash & Fold",15000],["hangDry","Hang Dry",10000]].map(([key,name,price],i)=>({key:String(key),name:String(name),category:"laundry" as const,pricingType:"per_load" as const,price:Number(price),description:"Legacy service.",includesSupplies:false,active:false,sortOrder:13+i})),
];

export const seed = internalMutation({
  args: {}, returns: v.null(),
  handler: async (ctx) => {
    const adminEmail=process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if(adminEmail){const admin=await ctx.db.query("users").withIndex("email",q=>q.eq("email",adminEmail)).unique();if(admin&&admin.role!=="admin")await ctx.db.patch(admin._id,{role:"admin"});}
    for (const service of services) {
      const existing = await ctx.db.query("services").withIndex("by_key", q=>q.eq("key", service.key)).unique();
      if (!existing) await ctx.db.insert("services", service);
    }
    for (const barangay of barangays) {
      const existing = await ctx.db.query("deliveryZones").withIndex("by_barangay", q=>q.eq("barangay", barangay)).unique();
      if (!existing) await ctx.db.insert("deliveryZones", { barangay, isFreeZone: free.has(barangay), fee: 3000, freeMinLoads: 2, active: true });
    }
    const settings = await ctx.db.query("settings").withIndex("by_key", q=>q.eq("key", "shop")).unique();
    if (!settings) await ctx.db.insert("settings", { key:"shop",dailyLimit:3,maxLoads:5,advanceBookingDays:30,timeSlots:[{id:"am",label:"7am-10am"},{id:"pm",label:"5pm-7pm"}],stageMinutes:{washing:30,drying:45,folding:15},gcashNumber:"SET_GCASH_NUMBER",gcashAccountName:"SET_GCASH_ACCOUNT_NAME",shop:{name:"Wash It Izzy",phone:"SET_SHOP_PHONE",address:"Calamba City, Laguna",hours:"Hours to be announced",facebookUrl:"https://www.facebook.com/washitizzy"},autoArchiveDays:0 });
    return null;
  },
});
