import { BadgeCheck, Ban, CircleDot, Droplets, PackageCheck, Shirt, Sparkles, Truck } from "lucide-react";
import type { ReactNode } from "react";

const styles: Record<string, { label: string; className: string; icon: ReactNode }> = {
  requested: { label: "Requested", className: "bg-amber-50 text-amber-800", icon: <CircleDot/> },
  approved: { label: "Approved", className: "bg-sky-50 text-sky-800", icon: <BadgeCheck/> },
  picked_up: { label: "Picked up", className: "bg-indigo-50 text-indigo-800", icon: <Truck/> },
  received: { label: "Received", className: "bg-violet-50 text-violet-800", icon: <PackageCheck/> },
  washing: { label: "Washing", className: "bg-cyan-50 text-cyan-800", icon: <Droplets/> },
  drying: { label: "Drying", className: "bg-orange-50 text-orange-800", icon: <Sparkles/> },
  folding: { label: "Folding", className: "bg-fuchsia-50 text-fuchsia-800", icon: <Shirt/> },
  ready: { label: "Ready", className: "bg-emerald-50 text-emerald-800", icon: <PackageCheck/> },
  out_for_delivery: { label: "Out for delivery", className: "bg-teal-50 text-teal-800", icon: <Truck/> },
  completed: { label: "Completed", className: "bg-green-50 text-green-800", icon: <BadgeCheck/> },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-800", icon: <Ban/> },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-700", icon: <Ban/> },
};

export function StatusBadge({ status }: { status: string }) {
  const item = styles[status] ?? styles.requested;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${item.className}`}>{item.icon}{item.label}</span>;
}
