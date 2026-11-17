/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addresses from "../addresses.js";
import type * as adminOrders from "../adminOrders.js";
import type * as adminSettings from "../adminSettings.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as availability from "../availability.js";
import type * as catalog from "../catalog.js";
import type * as crons from "../crons.js";
import type * as files from "../files.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_changeStatus from "../lib/changeStatus.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_legacyMapping from "../lib/legacyMapping.js";
import type * as lib_orderNumber from "../lib/orderNumber.js";
import type * as lib_pricing from "../lib/pricing.js";
import type * as lib_statusMachine from "../lib/statusMachine.js";
import type * as lib_validators from "../lib/validators.js";
import type * as maintenance from "../maintenance.js";
import type * as notifications from "../notifications.js";
import type * as notify from "../notify.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as seed from "../seed.js";
import type * as timers from "../timers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addresses: typeof addresses;
  adminOrders: typeof adminOrders;
  adminSettings: typeof adminSettings;
  analytics: typeof analytics;
  auth: typeof auth;
  availability: typeof availability;
  catalog: typeof catalog;
  crons: typeof crons;
  files: typeof files;
  "lib/auth": typeof lib_auth;
  "lib/changeStatus": typeof lib_changeStatus;
  "lib/dates": typeof lib_dates;
  "lib/legacyMapping": typeof lib_legacyMapping;
  "lib/orderNumber": typeof lib_orderNumber;
  "lib/pricing": typeof lib_pricing;
  "lib/statusMachine": typeof lib_statusMachine;
  "lib/validators": typeof lib_validators;
  maintenance: typeof maintenance;
  notifications: typeof notifications;
  notify: typeof notify;
  orders: typeof orders;
  payments: typeof payments;
  seed: typeof seed;
  timers: typeof timers;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  auth: import("@convex-dev/auth/_generated/component.js").ComponentApi<"auth">;
  authEmail: import("@convex-dev/auth/components/email/_generated/component.js").ComponentApi<"authEmail">;
  authPassword: import("@convex-dev/auth/components/password/_generated/component.js").ComponentApi<"authPassword">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  authGoogle: import("@convex-dev/auth/components/google/_generated/component.js").ComponentApi<"authGoogle">;
};
