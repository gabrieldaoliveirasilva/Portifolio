"use client";

import { useCallback, useEffect, useState } from "react";

type AutoCollapseSidebar = {
  collapseSidebar: () => void;
  collapseSidebarForNavigation: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

export function useAutoCollapseSidebar(storageKey: string): AutoCollapseSidebar {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const shouldCollapseAfterNavigation =
      window.sessionStorage.getItem(storageKey) === "collapse-next";

    window.sessionStorage.removeItem(storageKey);
    setSidebarCollapsed(shouldCollapseAfterNavigation);
  }, [storageKey]);

  const collapseSidebar = useCallback(() => {
    setSidebarCollapsed(true);
    window.sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  const collapseSidebarForNavigation = useCallback(() => {
    setSidebarCollapsed(true);
    window.sessionStorage.setItem(storageKey, "collapse-next");
  }, [storageKey]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((current) => {
      window.sessionStorage.removeItem(storageKey);
      return !current;
    });
  }, [storageKey]);

  return {
    collapseSidebar,
    collapseSidebarForNavigation,
    sidebarCollapsed,
    toggleSidebar
  };
}
