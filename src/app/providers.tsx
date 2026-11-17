"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useState, type ReactNode } from "react";
import { ThemeProvider } from "@/components/shared/theme-provider";
export function Providers({children}:{children:ReactNode}){
  const [client]=useState(()=>new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "http://127.0.0.1:3210"));
  return <ConvexProvider client={client}><ThemeProvider>{children}</ThemeProvider></ConvexProvider>;
}
