"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppHeader from "@/components/app-header";
import { useAutoCollapseSidebar } from "@/components/use-auto-collapse-sidebar";

const PEOPLE_TRACK_URL =
  "https://script.google.com/a/macros/shopee.com/s/AKfycbz5JZEubKOxgKr4c5CQF61AwLu3ecUV8Ui5V9tfMhRo3ua0R8WgCsHc0yA8gqSKThxv/exec";
const REGISTRO_PRESENCA_URL =
  "https://script.google.com/a/macros/shopee.com/s/AKfycbyycDhG_lameR4_fqpoR4VDFsTWnJLKwpNP9ONRI1_AdKQ6V4g4kP04_XdS4YUw6PtY/exec";
const ABS_URL =
  "https://script.google.com/a/macros/shopee.com/s/AKfycby8SO2v8COQ0XKs8C3fulyZosnIA3b7INsZB_xafaBwjdegYF7rZHybq1D0iKjdHVFVVQ/exec";
const SPAN_URL =
  "https://script.google.com/a/macros/shopee.com/s/AKfycbyvG4PN2xolJ2tpliGmYn3Fx8valA_xmzX7WPArLcQA64ov6_ejdOXtfz7hr8Dwb8-7/exec";
const LOAD_TIMEOUT_MS = 25000;

const sections = ["People Track", "Registro de presença", "ABS", "SPAN"] as const;
type PeopleSection = (typeof sections)[number];

const embeddedApps: Partial<Record<PeopleSection, string>> = {
  "People Track": PEOPLE_TRACK_URL,
  "Registro de presença": REGISTRO_PRESENCA_URL,
  "ABS": ABS_URL,
  "SPAN": SPAN_URL
};

export default function PeopleWorkspace() {
  const [activeSection, setActiveSection] = useState<PeopleSection>("People Track");
  const { collapseSidebar, sidebarCollapsed, toggleSidebar } = useAutoCollapseSidebar("people-sidebar");
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeStatus, setIframeStatus] = useState<"loading" | "ready" | "error">("loading");
  const activeAppUrl = embeddedApps[activeSection];
  const embeddedPageHasNativeHeader = Boolean(activeAppUrl);

  useEffect(() => {
    if (!activeAppUrl || iframeStatus !== "loading") return;

    const timeout = window.setTimeout(() => setIframeStatus("error"), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [activeAppUrl, iframeKey, iframeStatus]);

  const retryEmbeddedApp = () => {
    setIframeStatus("loading");
    setIframeKey((current) => current + 1);
  };

  return (
    <>
      <div
        aria-hidden={embeddedPageHasNativeHeader}
        className={`people-app-header ${embeddedPageHasNativeHeader ? "collapsed" : ""}`}
      >
        <AppHeader title="People" />
      </div>

      <div className={`people-layout ${sidebarCollapsed ? "collapsed" : ""}`}>
      <aside className={`people-sidebar side-nav card ${sidebarCollapsed ? "collapsed" : ""}`}>
        <button
          aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          className="side-collapse"
          onClick={toggleSidebar}
          type="button"
        >
          {sidebarCollapsed ? ">" : "<"}
        </button>

        <Link className="side-item side-oraculo-link" href="/">
          <span className="side-icon" aria-hidden="true">I</span>
          {!sidebarCollapsed && <span className="side-label">Início</span>}
          {!sidebarCollapsed && <span className="side-arrow" aria-hidden="true" />}
        </Link>

        <div className="people-menu-title">
          <span className="side-topic-letter" aria-hidden="true">P</span>
          {!sidebarCollapsed && <strong>PEOPLE</strong>}
        </div>

        <nav className="people-nav" aria-label="Menu People">
          {sections.map((section) => (
            <button
              aria-current={activeSection === section ? "page" : undefined}
              className={`side-item side-subitem ${activeSection === section ? "active" : ""}`}
              key={section}
              onClick={() => {
                setActiveSection(section);
                if (embeddedApps[section]) {
                  setIframeStatus("loading");
                  setIframeKey((current) => current + 1);
                  collapseSidebar();
                }
              }}
              type="button"
            >
              <span className="side-icon" aria-hidden="true">{section.slice(0, 1)}</span>
              {!sidebarCollapsed && <span className="side-label">{section}</span>}
              {!sidebarCollapsed && <span className="side-arrow" aria-hidden="true" />}
            </button>
          ))}
        </nav>
      </aside>

      <section className="people-content" aria-live="polite">
        {activeAppUrl ? (
          <section className="people-embed" aria-label={activeSection}>
            {iframeStatus === "loading" && (
              <div className="people-embed-state">
                <span className="packet-productivity-spinner" aria-hidden="true" />
                <strong>Carregando {activeSection}...</strong>
              </div>
            )}

            {iframeStatus === "error" && (
              <div className="people-embed-state" role="alert">
                <strong>Não foi possível abrir {activeSection}.</strong>
                <p>Verifique sua conexão e tente carregar o painel novamente.</p>
                <div className="people-embed-actions">
                  <button onClick={retryEmbeddedApp} type="button">Tentar novamente</button>
                  <a href={activeAppUrl} rel="noreferrer" target="_blank">Abrir em nova aba</a>
                </div>
              </div>
            )}

            <iframe
              allow="clipboard-read; clipboard-write; fullscreen"
              allowFullScreen
              className={iframeStatus === "ready" ? "ready" : ""}
              key={iframeKey}
              onError={() => setIframeStatus("error")}
              onLoad={() => setIframeStatus("ready")}
              src={activeAppUrl}
              title={activeSection}
            />
          </section>
        ) : (
          <section className="card people-section-placeholder">
            <span className="oraculo-option-eyebrow">People</span>
            <h2>{activeSection}</h2>
            <p>Em construção</p>
          </section>
        )}
      </section>
      </div>
    </>
  );
}
