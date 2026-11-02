"use client";

// AI maintenance map: canonical layout/sidebar for every app/(gerot) route.
// Page names and slugs belong in gerot-navigation.ts, not in this component.
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/app-header";
import { gerotNavigation, getGerotPageByPath, gerotPath } from "@/components/gerot-navigation";
import { useAutoCollapseSidebar } from "@/components/use-auto-collapse-sidebar";

export default function GerotLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activePage = getGerotPageByPath(pathname);
  const activeGroup = activePage?.group.slug;
  const {
    collapseSidebar,
    sidebarCollapsed,
    toggleSidebar
  } = useAutoCollapseSidebar("gerot-sidebar");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    [activeGroup ?? "cost"]: true
  }));
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => ({
    leftover: pathname.startsWith("/gerot-leftover-")
  }));

  return (
    <main className="gerot-page page">
      <AppHeader title="GEROT" />
      <div className={`gerot-layout ${sidebarCollapsed ? "collapsed" : ""}`}>
      <aside className={`gerot-sidebar side-nav card ${sidebarCollapsed ? "collapsed" : ""}`}>
        <button
          aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          className="gerot-collapse side-collapse"
          onClick={toggleSidebar}
          type="button"
        >
          {sidebarCollapsed ? ">" : "<"}
        </button>

        <Link className="gerot-back side-item side-oraculo-link" href="/" aria-label="Voltar ao início">
          <span className="side-icon" aria-hidden="true">{"<"}</span>
          {!sidebarCollapsed && <span className="side-label">Início</span>}
          {!sidebarCollapsed && <span className="side-arrow" aria-hidden="true">{">"}</span>}
        </Link>

        <div className="gerot-brand">
          <span className="gerot-brand-mark">G</span>
          {!sidebarCollapsed && <div>
            <span>GEROT</span>
            <strong>KPIs Performance</strong>
          </div>}
        </div>

        <nav className="gerot-nav" aria-label="Menu GEROT">
          <Link
            className={`gerot-subitem side-item side-subitem gerot-primary-page has-data ${pathname === "/gerot-geral-gerot" ? "active" : ""}`}
            href="/gerot-geral-gerot"
            onClick={collapseSidebar}
          >
            <span className="side-icon" aria-hidden="true">G</span>
            {!sidebarCollapsed && <span className="side-label">GEROT</span>}
            {!sidebarCollapsed && <span className="side-arrow" aria-hidden="true">{">"}</span>}
          </Link>

          {gerotNavigation.map((group) => {
            const isOpen = openGroups[group.slug] ?? group.slug === activeGroup;
            return (
              <section className="gerot-group side-group" key={group.slug}>
                <button
                  className="gerot-group-toggle side-topic"
                  onClick={() => setOpenGroups((current) => ({ ...current, [group.slug]: !isOpen }))}
                  type="button"
                  aria-expanded={isOpen}
                >
                  <span className="gerot-group-icon side-topic-letter" aria-hidden="true">{group.icon}</span>
                  {!sidebarCollapsed && <span className="side-topic-label">{group.label}</span>}
                  {!sidebarCollapsed && <span className="gerot-group-arrow side-topic-arrow" aria-hidden="true">{isOpen ? "v" : ">"}</span>}
                </button>
                {isOpen && !sidebarCollapsed && (
                  <div className="gerot-subitems side-subitems">
                    {group.items.map((item) => {
                      if (item.children?.length) {
                        const isItemOpen = openItems[item.slug] ?? item.children.some(
                          (child) => pathname === gerotPath(child.slug)
                        );

                        return (
                          <div className="gerot-nested-group" key={item.slug}>
                            <button
                              aria-expanded={isItemOpen}
                              className={`gerot-subitem side-item side-subitem gerot-nested-toggle ${
                                item.children.some((child) => pathname === gerotPath(child.slug)) ? "active" : ""
                              }`}
                              onClick={() => setOpenItems((current) => ({
                                ...current,
                                [item.slug]: !isItemOpen
                              }))}
                              type="button"
                            >
                              <span className="side-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                              <span className="side-label">{item.label}</span>
                              <span className="side-arrow" aria-hidden="true">{isItemOpen ? "v" : ">"}</span>
                            </button>

                            {isItemOpen && (
                              <div className="gerot-nested-items">
                                {item.children.map((child) => {
                                  const childHref = gerotPath(child.slug);
                                  return (
                                    <Link
                                      className={`gerot-subitem side-item side-subitem gerot-nested-item ${
                                        child.hasData ? "has-data" : ""
                                      } ${pathname === childHref ? "active" : ""}`}
                                      href={childHref}
                                      key={child.slug}
                                      onClick={collapseSidebar}
                                    >
                                      <span className="side-icon" aria-hidden="true">{child.label.slice(0, 1)}</span>
                                      <span className="side-label">{child.label}</span>
                                      <span className="side-arrow" aria-hidden="true">{">"}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      const href = gerotPath(item.slug);
                      return (
                        <Link
                          className={`gerot-subitem side-item side-subitem ${item.hasData ? "has-data" : ""} ${pathname === href ? "active" : ""}`}
                          href={href}
                          key={item.slug}
                          onClick={collapseSidebar}
                        >
                          <span className="side-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                          <span className="side-label">{item.label}</span>
                          <span className="side-arrow" aria-hidden="true">{">"}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </nav>
      </aside>

      <section className="gerot-content">{children}</section>
      </div>
    </main>
  );
}
