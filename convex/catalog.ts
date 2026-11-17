import { query } from "./_generated/server";
import { v } from "convex/values";

export const listServices = query({
  args: {},
  returns: v.array(v.object({ _id: v.id("services"), key: v.string(), name: v.string(), description: v.string(), category: v.string(), pricingType: v.string(), price: v.number(), startingPrice: v.optional(v.number()), includesSupplies: v.boolean(), active: v.boolean(), sortOrder: v.number() })),
  handler: async (ctx) => {
    const rows = await ctx.db.query("services").withIndex("by_active_sort", (q) => q.eq("active", true)).take(100);
    return rows;
  },
});

export const listZones = query({
  args: {},
  returns: v.array(v.object({ _id: v.id("deliveryZones"), barangay: v.string(), isFreeZone: v.boolean(), fee: v.number(), freeMinLoads: v.number(), active: v.boolean() })),
  handler: async (ctx) => (await ctx.db.query("deliveryZones").withIndex("by_barangay").take(100)).filter((zone) => zone.active),
});

export const getShopSettings = query({
  args: {},
  returns: v.union(v.null(), v.object({ name: v.string(), phone: v.string(), address: v.string(), hours: v.string(), facebookUrl: v.optional(v.string()) })),
  handler: async (ctx) => (await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "shop")).unique())?.shop ?? null,
});

export const quoteDelivery = query({
  args: { barangay: v.string(), loads: v.number() },
  returns: v.union(v.null(), v.number()),
  handler: async (ctx, args) => {
    const zone = await ctx.db.query("deliveryZones").withIndex("by_barangay", (q) => q.eq("barangay", args.barangay)).unique();
    if (!zone || !zone.active) return null;
    return zone.isFreeZone && args.loads >= zone.freeMinLoads ? 0 : zone.fee;
  },
});
