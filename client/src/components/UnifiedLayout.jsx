import React from 'react';
import { useMediaQuery } from "@uidotdev/usehooks";
import { useClickOutside } from "../hooks/use-click-outside";
import { cn } from "../utils/cn";
import { useEffect, useRef, useState } from "react";

const UnifiedLayout = ({ sidebarContent, headerContent, children, externalCollapsed, externalSetCollapsed }) => {
  const isDesktopDevice = useMediaQuery("(min-width: 768px)");
  const [internalCollapsed, setInternalCollapsed] = useState(!isDesktopDevice);

  const sidebarRef = useRef(null);

  // Use external state if provided, otherwise use internal state
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed = externalSetCollapsed || setInternalCollapsed;

  useEffect(() => {
    if (externalCollapsed === undefined) {
      setInternalCollapsed(!isDesktopDevice);
    }
  }, [isDesktopDevice, externalCollapsed]);

  useClickOutside([sidebarRef], () => {
    if (!isDesktopDevice && !collapsed) {
      setCollapsed(true);
    }
  });

  return (
    <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-950">
      <div
        className={cn(
          "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity",
          !collapsed && "max-md:pointer-events-auto max-md:z-50 max-md:opacity-30",
        )}
      />
      <div
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-[240px] transform bg-white shadow-lg transition-transform dark:bg-slate-900",
          collapsed ? "-translate-x-full" : "translate-x-0",
          "md:relative md:translate-x-0 md:shadow-none",
        )}
      >
        {sidebarContent}
      </div>
      <div className={cn("transition-[margin] duration-300", collapsed ? "md:ml-0" : "md:ml-[240px]")}>
        <header className="bg-white shadow-sm border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 h-16 flex items-center px-6">
          {headerContent}
        </header>
        <div className="h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default UnifiedLayout;
