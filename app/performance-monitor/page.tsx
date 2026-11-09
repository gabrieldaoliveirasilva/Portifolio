import PerformanceMonitorView from "@/components/performance-monitor-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PERFORMANCE MONITOR | Telemetria & Produtividade Operacional",
  description:
    "Dashboard executivo e operacional de telemetria construído em Google Apps Script (HtmlService) e Next.js com dados 100% sintéticos e resilientes."
};

export default function PerformanceMonitorPage() {
  return <PerformanceMonitorView />;
}

