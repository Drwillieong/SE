import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const orderStatus = v.union(
  v.literal("requested"), v.literal("approved"), v.literal("picked_up"),
  v.literal("received"), v.literal("washing"), v.literal("drying"),
  v.literal("folding"), v.literal("ready"), v.literal("out_for_delivery"),
  v.literal("completed"), v.literal("rejected"), v.literal("cancelled"),
);
const payStatus = v.union(v.literal("unpaid"), v.literal("pending_review"), v.literal("paid"), v.literal("rejected"), v.literal("refunded"));
const payMethod = v.union(v.literal("cash"), v.literal("gcash"));

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()), email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()), image: v.optional(v.string()),
    role: v.optional(v.union(v.literal("customer"), v.literal("staff"), v.literal("admin"))),
    disabledAt: v.optional(v.number()),
  }).index("email", ["email"]).index("by_role", ["role"]),
  customerProfiles: defineTable({ userId: v.optional(v.id("users")), firstName: v.string(), lastName: v.string(), fullName: v.string(), phone: v.string(), email: v.optional(v.string()), notes: v.optional(v.string()), loyaltyPoints: v.number() }).index("by_user", ["userId"]).index("by_phone", ["phone"]).searchIndex("search_name", { searchField: "fullName" }),
  addresses: defineTable({ customerId: v.id("customerProfiles"), label: v.string(), barangay: v.string(), street: v.string(), blockLot: v.optional(v.string()), landmark: v.optional(v.string()), city: v.string(), isDefault: v.boolean() }).index("by_customer", ["customerId"]),
  services: defineTable({ key: v.string(), name: v.string(), description: v.string(), category: v.union(v.literal("laundry"), v.literal("dryCleaning"), v.literal("addon"), v.literal("selfService")), pricingType: v.union(v.literal("per_load"), v.literal("per_kilo"), v.literal("flat"), v.literal("quote")), price: v.number(), startingPrice: v.optional(v.number()), includesSupplies: v.boolean(), active: v.boolean(), sortOrder: v.number() }).index("by_key", ["key"]).index("by_active_sort", ["active", "sortOrder"]),
  deliveryZones: defineTable({ barangay: v.string(), isFreeZone: v.boolean(), fee: v.number(), freeMinLoads: v.number(), active: v.boolean() }).index("by_barangay", ["barangay"]),
  settings: defineTable({ key: v.string(), dailyLimit: v.number(), maxLoads: v.number(), advanceBookingDays: v.number(), timeSlots: v.array(v.object({ id: v.string(), label: v.string(), capacity: v.optional(v.number()) })), stageMinutes: v.object({ washing: v.number(), drying: v.number(), folding: v.number() }), gcashNumber: v.string(), gcashAccountName: v.string(), gcashQrStorageId: v.optional(v.id("_storage")), shop: v.object({ name: v.string(), phone: v.string(), address: v.string(), hours: v.string(), facebookUrl: v.optional(v.string()) }), autoArchiveDays: v.number(), rushSurcharge: v.optional(v.number()), rushTurnaroundHours: v.optional(v.number()) }).index("by_key", ["key"]),
  dayOverrides: defineTable({ date: v.string(), limit: v.optional(v.number()), closed: v.boolean(), reason: v.optional(v.string()) }).index("by_date", ["date"]),
  dayCounts: defineTable({ date: v.string(), booked: v.number() }).index("by_date", ["date"]),
  orders: defineTable({ orderNumber: v.string(), customerId: v.id("customerProfiles"), createdBy: v.union(v.literal("customer"), v.literal("admin"), v.literal("staff")), status: orderStatus, serviceOption: v.union(v.literal("pickupOnly"), v.literal("pickupAndDelivery")), pickupDate: v.string(), pickupSlotId: v.string(), loads: v.number(), kilos: v.optional(v.number()), instructions: v.optional(v.string()), isRush: v.boolean(), addressSnapshot: v.object({ fullName: v.string(), phone: v.string(), barangay: v.string(), street: v.string(), blockLot: v.optional(v.string()), landmark: v.optional(v.string()), city: v.string() }), subtotal: v.number(), deliveryFee: v.number(), discount: v.number(), total: v.number(), promoCode: v.optional(v.string()), paymentMethod: payMethod, paymentStatus: payStatus, estimatedReadyAt: v.optional(v.number()), rejectionReason: v.optional(v.string()), cancelReason: v.optional(v.string()), completedAt: v.optional(v.number()), archivedAt: v.optional(v.number()), deletedAt: v.optional(v.number()) }).index("by_orderNumber", ["orderNumber"]).index("by_customer", ["customerId"]).index("by_customer_date_slot_status", ["customerId", "pickupDate", "pickupSlotId", "status"]).index("by_status", ["status", "archivedAt"]).index("by_pickupDate", ["pickupDate"]).index("by_archived", ["archivedAt"]),
  orderItems: defineTable({ orderId: v.id("orders"), serviceId: v.id("services"), name: v.string(), pricingType: v.string(), unitPrice: v.number(), quantity: v.number(), subtotal: v.number(), quoteAdjustedBy: v.optional(v.id("users")), note: v.optional(v.string()) }).index("by_order", ["orderId"]),
  orderPhotos: defineTable({ orderId: v.id("orders"), storageId: v.id("_storage"), kind: v.union(v.literal("intake"), v.literal("ready"), v.literal("issue")), uploadedBy: v.id("users") }).index("by_order", ["orderId"]),
  orderTimers: defineTable({ orderId: v.id("orders"), stage: v.string(), startsAt: v.number(), endsAt: v.number(), autoAdvance: v.boolean(), scheduledFnId: v.optional(v.id("_scheduled_functions")), active: v.boolean() }).index("by_order", ["orderId"]).index("by_active_end", ["active", "endsAt"]),
  orderStatusHistory: defineTable({ orderId: v.id("orders"), from: v.optional(v.string()), to: v.string(), actorId: v.optional(v.id("users")), note: v.optional(v.string()) }).index("by_order", ["orderId"]),
  payments: defineTable({ orderId: v.id("orders"), method: payMethod, amount: v.number(), status: payStatus, referenceNumber: v.optional(v.string()), proofStorageId: v.optional(v.id("_storage")), reviewedBy: v.optional(v.id("users")), reviewNote: v.optional(v.string()), paidAt: v.optional(v.number()) }).index("by_order", ["orderId"]).index("by_status", ["status"]).index("by_reference", ["referenceNumber"]),
  notifications: defineTable({ userId: v.id("users"), type: v.string(), title: v.string(), body: v.string(), orderId: v.optional(v.id("orders")), readAt: v.optional(v.number()) }).index("by_user_read", ["userId", "readAt"]),
  emailLogs: defineTable({ to: v.string(), template: v.string(), orderId: v.optional(v.id("orders")), status: v.string(), error: v.optional(v.string()) }).index("by_order", ["orderId"]),
  reviews: defineTable({ orderId: v.id("orders"), customerId: v.id("customerProfiles"), rating: v.number(), comment: v.optional(v.string()) }).index("by_order", ["orderId"]),
  promoCodes: defineTable({ code: v.string(), type: v.union(v.literal("percent"), v.literal("fixed")), value: v.number(), minTotal: v.optional(v.number()), expiresAt: v.optional(v.number()), maxUses: v.optional(v.number()), uses: v.number(), active: v.boolean() }).index("by_code", ["code"]),
  dailyStats: defineTable({ date: v.string(), orders: v.number(), revenue: v.number(), byService: v.record(v.string(), v.number()), byPayment: v.record(v.string(), v.number()) }).index("by_date", ["date"]),
  auditLogs: defineTable({ actorId: v.id("users"), action: v.string(), entity: v.string(), entityId: v.string(), meta: v.optional(v.any()) }).index("by_entity", ["entity", "entityId"]),
  legacyMap: defineTable({ entity: v.string(), legacyId: v.string(), convexId: v.string() }).index("by_entity_legacy", ["entity", "legacyId"]),
});
