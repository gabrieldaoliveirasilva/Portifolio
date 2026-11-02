"use client";

// AI maintenance map: canonical Gerencial shell, sidebar and page UI.
// routeByTab/tabLabels define navigation; data comes from app/dashboard-route.tsx.
// Do not edit the legacy copy under lib/components. See AI_EDITING_GUIDE.md.
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { CSSProperties, Dispatch, MouseEvent, ReactNode, SetStateAction } from "react";
import AppHeader from "@/components/app-header";
import DatePeriodPicker, { todayIsoDate } from "@/components/date-period-picker";
import PageActions from "@/components/page-actions";
import { useAutoCollapseSidebar } from "@/components/use-auto-collapse-sidebar";
import type { HistoricoInboundData } from "@/lib/historico-inbound";
import type { HistoricoOutboundData } from "@/lib/historico-outbound";
import type { HistoricoPackingData } from "@/lib/historico-packing";
import type { TesteData } from "@/lib/teste";
import type { Doca, InboundDashboard, InboundVehicle, Insight, ProductivityDashboard, ProductivityRawRow, ProgramacaoRow, StageRow } from "@/lib/types";

const HistoricoOutboundPage = dynamic(() => import("@/components/historico-outbound-page"), {
  loading: () => <InlineLoadingPanel label="Carregando historico..." />
});
const HistoricoPackingPage = dynamic(() => import("@/components/historico-packing-page"), {
  loading: () => <InlineLoadingPanel label="Carregando historico..." />
});
const TestePage = dynamic(() => import("@/components/teste-page"), {
  loading: () => <InlineLoadingPanel label="Carregando pagina..." />
});

type Props = {
  painel: {
    kpis: {
      docasOperando: number;
      limiteCpt: number;
      chegadasProximas: number;
      carregando: number;
      aguardando: number;
    };
    graficoDemandaHoras: Array<{ hora: string; qtd: number }>;
    monitorCpt: Array<{ lh: string; destino: string; cpt: string; minutos: number; criticidade: string }>;
    ocupacaoCritica: Array<{
      station: string;
      tos: number;
      percentual: number;
      nivel: string;
      packs?: Array<{ nome: string; qtd: number }>;
    }>;
  };
  programacao: ProgramacaoRow[];
  stage: {
    kpis: {
      totalTos: number;
      totalPacotes: number;
      packed: number;
      packing: number;
      ruasOcupadas: number;
      conclusaoTo: number;
    };
    linhas: StageRow[];
  };
  docas: Doca[];
  contagem: {
    kpis: { destinos: number; pacotes: number; tos: number; criticos: number };
    destinos: Array<{ nome: string; station: string; ocupacao: number; paletes: number; capacidade: number; pacotes: number }>;
  };
  inteligencia: {
    geradoEm: string;
    resumo: { totalInsights: number; alta: number; media: number; baixa: number };
    insights: Insight[];
  };
  inbound: InboundDashboard;
  productivity: ProductivityDashboard;
  historicoOutbound: HistoricoOutboundData;
  historicoInbound: HistoricoInboundData;
  historicoPacking: HistoricoPackingData;
  teste: TesteData;
  initialTab?: Tab;
  cacheWarnings?: string[];
};

const tabs = ["stageIn", "historicoInbound", "nova", "historico", "produtividade", "historicoOutbound", "programacao", "inbound", "geral", "inteligencia", "stage", "docas", "contagem", "teste"] as const;
type Tab = (typeof tabs)[number];
export type DashboardTab = Tab;
const oldTabs: Tab[] = [];
const SHOW_OUTBOUND_MENU = true;
const SHOW_LEGACY_OUTBOUND_LINKS = false;

const routeByTab: Record<Tab, string> = {
  stageIn: "/inbound-live",
  historicoInbound: "/historico-lh-inbound",
  nova: "/live-prod-esteiras",
  historico: "/historico-packing",
  produtividade: "/live-prod-hc",
  historicoOutbound: "/historico-lh-outbound",
  programacao: "/programacao",
  inbound: "/inbound-live",
  geral: "/geral",
  inteligencia: "/inteligencia",
  stage: "/stage-out",
  docas: "/docas",
  contagem: "/contagem",
  teste: "/teste"
};

const tabLabels: Record<Tab, string> = {
  stageIn: "Inbound live",
  historicoInbound: "Histórico LH Inbound",
  nova: "Live Prod Esteiras",
  historico: "Histórico Prod Esteiras",
  produtividade: "Live Prod HC",
  historicoOutbound: "Histórico LH Outbound",
  programacao: "Programa\u00e7\u00e3o",
  inbound: "Inbound live",
  geral: "Geral",
  inteligencia: "Intelig\u00eancia",
  stage: "Stage Out",
  docas: "Docas",
  contagem: "Contagem",
  teste: "Teste"
};

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean).filter((value) => value !== "-"))).sort((a, b) => a.localeCompare(b));
}

function includesValue(value: string, query: string) {
  return value.toUpperCase().includes(query.trim().toUpperCase());
}

function numberFormat(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function timeToMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function hourOptions() {
  return Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
}

function matchesHourInterval(time: string, selectedHour: string) {
  if (!selectedHour) return true;
  const timeMinutes = timeToMinutes(time);
  const selectedMinutes =
    timeToMinutes(selectedHour) ??
    (selectedHour.trim().match(/^\d{1,2}$/) ? Number(selectedHour.trim()) * 60 : null);
  if (timeMinutes === null || selectedMinutes === null) return false;
  return timeMinutes >= selectedMinutes && timeMinutes < selectedMinutes + 60;
}

function saoPauloNowMs() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric"
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
}

function saoPauloCurrentMinutes() {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function saoPauloCurrentHourStartMs() {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric"
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), 0, 0);
}

function parseSheetDateTimeMs(value: string) {
  const textValue = value.trim();
  const iso = textValue.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (iso) {
    return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), Number(iso[4]), Number(iso[5]), Number(iso[6] ?? 0));
  }
  const br = textValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (br) {
    const first = Number(br[1]);
    const second = Number(br[2]);
    const day = first > 12 ? first : second > 12 ? second : first;
    const month = first > 12 ? second : second > 12 ? first : second;
    return Date.UTC(Number(br[3]), month - 1, day, Number(br[4]), Number(br[5]), Number(br[6] ?? 0));
  }
  return null;
}

function diffMinutesFromNow(rawDateTime: string, fallbackTime: string) {
  const parsed = parseSheetDateTimeMs(rawDateTime);
  if (parsed !== null) return (parsed - saoPauloNowMs()) / 60000;

  const target = timeToMinutes(fallbackTime);
  if (target === null) return 9999;
  return target - saoPauloCurrentMinutes();
}

function stdSortValue(rawDateTime: string, fallbackTime: string) {
  return parseSheetDateTimeMs(rawDateTime) ?? timeToMinutes(fallbackTime) ?? Number.MAX_SAFE_INTEGER;
}

function isDeparted(status: string) {
  return status.toUpperCase() === "DEPARTED";
}

function isLoading(status: string) {
  const value = status.toUpperCase();
  return value === "LOADING" || value === "CARREGANDO";
}

function isWaiting(status: string) {
  const value = status.toUpperCase();
  return value === "ARRIVED";
}

function vehicleCapacity(vehicle: string) {
  const value = vehicle.toUpperCase();
  if (value.includes("CARRETA")) return 28;
  if (value.includes("TRUCK")) return 14;
  if (value.includes("TOCO")) return 8;
  if (value === "HR" || value.includes(" HR") || value.includes("HR ")) return 4;
  return 0;
}

function packResumoName(packName: string) {
  const value = packName.toUpperCase();
  if (value.includes("SCUTTLE") || value.includes("PALLET") || value.includes("VOLUMOSO")) return "Scuttle,Pallet,Vol.";
  return packName || "N/A";
}

function statusClass(status: string) {
  const value = status.toUpperCase();
  if (value === "DEPARTED") return "departed";
  if (value === "LOADING" || value === "CARREGANDO") return "loading";
  if (value === "ARRIVED") return "arrived";
  if (value === "IN QUEUE" || value === "ESPERA" || value === "AGUARDANDO") return "queue";
  if (value.includes("CANCEL")) return "cancelled";
  return "default";
}

function hasDock(dock: string) {
  const value = dock.trim().toUpperCase();
  return Boolean(value && value !== "-" && value !== "N/A" && value !== "NULL" && value !== "UNDEFINED");
}

function todayPtBr() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric"
  }).format(new Date());
}

function formatDuration(ms: number) {
  if (ms <= 0 || !Number.isFinite(ms)) return "00:00:00";
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function inboundRuntime(
  vehicle: InboundVehicle,
  nowMs: number
): { tFilaMs: number; tDocaMs: number; tTotalMs: number; processo: InboundVehicle["processo"] } {
  let tFilaMs = 0;
  let tDocaMs = 0;

  if (vehicle.status === "Arrived") {
    tFilaMs = vehicle.tsQueue ? nowMs - vehicle.tsQueue : 0;
  } else if (vehicle.status === "Unseal") {
    if (vehicle.tsQueue && vehicle.tsUpdate) {
      tFilaMs = vehicle.tsUpdate - vehicle.tsQueue;
      tDocaMs = nowMs - vehicle.tsUpdate;
    }
  }

  tFilaMs = Math.max(tFilaMs, 0);
  tDocaMs = Math.max(tDocaMs, 0);
  return {
    tFilaMs,
    tDocaMs,
    tTotalMs: tFilaMs + tDocaMs,
    processo: vehicle.status === "Arrived" ? "Em Fila" : "Em Doca"
  };
}

type InboundRuntimeRow = InboundVehicle & ReturnType<typeof inboundRuntime>;

function inboundSacas(row: InboundVehicle) {
  return row.mixCounts.sacasNaoTransbordo + row.mixCounts.sacasTransbordo;
}

function inboundScuttlePallet(row: InboundVehicle) {
  return row.mixCounts.scuttleOuPalletNaoTransbordo + row.mixCounts.scuttleOuPalletTransbordo;
}

function inboundTotalPackages(row: InboundVehicle) {
  return inboundSacas(row) + inboundScuttlePallet(row);
}

function inboundToSaca(row: InboundVehicle) {
  return row.inboundMetrics?.toSaca ?? 0;
}

function inboundScuttlePalletTos(row: InboundVehicle) {
  const metrics = row.inboundMetrics;
  return (metrics?.toScuttle ?? 0) + (metrics?.toPallet ?? 0) + (metrics?.toOthers ?? 0);
}

function inboundScuttlePalletPackages(row: InboundVehicle) {
  const metrics = row.inboundMetrics;
  return (metrics?.ordersScuttle ?? 0) + (metrics?.ordersPallet ?? 0) + (metrics?.ordersOthers ?? 0);
}

function inboundPerfilPM(row: InboundVehicle) {
  const metrics = row.inboundMetrics;
  return (metrics?.contagemIdsPOrPpNaoTransbordo ?? 0) + (metrics?.contagemIdMNaoTransbordo ?? 0);
}

function countByPredicate(rows: InboundRuntimeRow[], predicate: (row: InboundRuntimeRow) => boolean) {
  return rows.filter(predicate).length;
}

function avgDuration(rows: InboundRuntimeRow[], field: "tFilaMs" | "tDocaMs" | "tTotalMs") {
  if (!rows.length) return 0;
  return rows.reduce((sum, row) => sum + row[field], 0) / rows.length;
}

function stageInOriginCount(rows: InboundRuntimeRow[], origin: string) {
  return rows.filter((row) => row.origem.toUpperCase().includes(origin)).length;
}

function stageInCluster(rows: InboundRuntimeRow[], field: "tFilaMs" | "tDocaMs", ranges: Array<{ label: string; min: number; max: number }>) {
  const total = Math.max(rows.length, 1);
  return ranges.map((range) => {
    const qtd = rows.filter((row) => {
      const hours = row[field] / 3600000;
      return hours >= range.min && hours < range.max;
    }).length;
    return { ...range, qtd, pct: Math.round((qtd / total) * 100) };
  });
}

function MenuIcon({ name }: { name: string }) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    viewBox: "0 0 24 24"
  };

  const icons: Record<string, ReactNode> = {
    stageIn: (
      <svg {...common}>
        <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    packing: (
      <svg {...common}>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="m4.5 8 7.5 4 7.5-4M12 12v8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
    outbound: (
      <svg {...common}>
        <path d="M4 7h10v8H4V7Zm10 3h3l3 3v2h-6v-5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    inbound: (
      <svg {...common}>
        <path d="M12 5v11m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    live: (
      <svg {...common}>
        <path d="M4 13h4l2-6 4 10 2-4h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    productivity: (
      <svg {...common}>
        <path d="M5 19V9m7 10V5m7 14v-7" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M3 19h18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
    history: (
      <svg {...common}>
        <path d="M4 12a8 8 0 1 0 2.3-5.6L4 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M4 4v4h4m4-1v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    H: (
      <svg {...common}>
        <path d="M4 12a8 8 0 1 0 2.3-5.6L4 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M4 4v4h4m4-1v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    programacao: (
      <svg {...common}>
        <path d="M7 4v3m10-3v3M5 8h14M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    geral: (
      <svg {...common}>
        <path d="M4 13a8 8 0 0 1 16 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="m12 13 4-4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M6 19h12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
    docas: (
      <svg {...common}>
        <path d="M5 7h9v8H5V7Zm9 3h3l2 3v2h-5v-5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M7 18h10" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
    contagem: (
      <svg {...common}>
        <path d="M9 4 7 20m10-16-2 16M4 9h16M3 15h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
    stageOut: (
      <svg {...common}>
        <path d="M5 6h14M5 12h14M5 18h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
    home: (
      <svg {...common}>
        <path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9 20v-6h6v6" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    )
  };

  return <>{icons[name] ?? <span>{name}</span>}</>;
}

function LoadingSpinner({ label = "Carregando dados..." }: { label?: string }) {
  return (
    <div className="page-loading-box" role="status" aria-live="polite">
      <span className="page-loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

function PageLoadingOverlay({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="page-loading-overlay">
      <LoadingSpinner />
    </div>
  );
}

function InlineLoadingPanel({ label }: { label: string }) {
  return (
    <section className="card panel inline-loading-panel">
      <LoadingSpinner label={label} />
    </section>
  );
}

function SideGroup({
  children,
  collapsed,
  icon,
  label,
  onToggle,
  open
}: {
  children: ReactNode;
  collapsed: boolean;
  icon: string;
  label: string;
  onToggle: () => void;
  open: boolean;
}) {
  return (
    <div className="side-group">
      <button className="side-topic" onClick={onToggle} type="button">
        <span className="side-topic-letter"><MenuIcon name={icon} /></span>
        {!collapsed && <span className="side-topic-label">{label}</span>}
        {!collapsed && <span className="side-topic-arrow">{open ? "v" : ">"}</span>}
      </button>
      {open && !collapsed && <div className="side-subitems">{children}</div>}
    </div>
  );
}

function SideLink({
  active,
  href,
  icon,
  label,
  onNavigate
}: {
  active: boolean;
  href: string;
  icon: string;
  label: string;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link className={`side-item side-subitem ${active ? "active" : ""}`} href={href} onClick={onNavigate} prefetch={false}>
      <span className="side-icon"><MenuIcon name={icon} /></span>
      <span className="side-label">{label}</span>
      <span className="side-arrow">{">"}</span>
    </Link>
  );
}

function inboundCardTone(real: number, meta: number) {
  if (!meta) return "";
  return real > meta ? "red" : "green";
}

function productivityEfficiency(real: number, meta: number) {
  return meta > 0 ? Math.round((real / meta) * 1000) / 10 : 0;
}

function productivityTone(value: number) {
  if (value >= 100) return "green";
  if (value >= 85) return "orange";
  return "red";
}

const PRODUCTIVITY_OPERATION_HOURS = Array.from({ length: 24 }, (_, index) => (index + 6) % 24);
const PRODUCTIVITY_TURN_HOURS = {
  T1: [6, 7, 8, 9, 10, 11, 12, 13],
  T2: [14, 15, 16, 17, 18, 19, 20, 21],
  T3: [22, 23, 0, 1, 2, 3, 4, 5]
};
type ProductivityTurnKey = keyof typeof PRODUCTIVITY_TURN_HOURS;
type ProductivitySmallTurnFilter = "AUTO" | ProductivityTurnKey;

function productivityHourNumber(value: string) {
  const parsed = Number(String(value ?? "").replace("h", ""));
  return Number.isFinite(parsed) ? parsed : -1;
}

function productivityHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}h`;
}

function currentProductivityTurnHours() {
  const hour = saoPauloNowParts().hour;
  if (hour >= 6 && hour < 14) return PRODUCTIVITY_TURN_HOURS.T1;
  if (hour >= 14 && hour < 22) return PRODUCTIVITY_TURN_HOURS.T2;
  return PRODUCTIVITY_TURN_HOURS.T3;
}

function productivitySmallTurnHours(turnFilter: ProductivitySmallTurnFilter) {
  return turnFilter === "AUTO" ? currentProductivityTurnHours() : PRODUCTIVITY_TURN_HOURS[turnFilter];
}

function filterProductivityTurnHours(
  hours: Array<{ hora: string; real: number; meta: number; gap: number; eficiencia: number }>,
  turnFilter: ProductivitySmallTurnFilter
) {
  const turnHours = new Set(productivitySmallTurnHours(turnFilter));
  return hours.filter((hour) => turnHours.has(productivityHourNumber(hour.hora)));
}

function saoPauloNowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return {
    dateKey: `${part("year")}-${part("month")}-${part("day")}`,
    hour: Number(part("hour"))
  };
}

function normalizeDateKey(value: string) {
  const textValue = String(value ?? "").trim();
  const iso = textValue.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const br = textValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;

  return textValue;
}

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function productivityOperationalDateKey(row: ProductivityRawRow) {
  const dateKey = normalizeDateKey(row.cutoffData);
  return productivityHourNumber(row.hora) < 6 ? addDaysToDateKey(dateKey, -1) : dateKey;
}

function productivityHourIndex(hour: number) {
  return PRODUCTIVITY_OPERATION_HOURS.indexOf(hour);
}

function currentProductivityCycle() {
  const now = saoPauloNowParts();
  const currentHour = Number.isFinite(now.hour) ? now.hour : 0;
  return {
    dateKey: currentHour < 6 ? addDaysToDateKey(now.dateKey, -1) : now.dateKey,
    hourIndex: productivityHourIndex(currentHour)
  };
}

function isProductivityMetaAteMomento(row: ProductivityRawRow) {
  const now = currentProductivityCycle();
  const rowDate = productivityOperationalDateKey(row);
  const rowIndex = productivityHourIndex(productivityHourNumber(row.hora));

  if (rowDate < now.dateKey) return true;
  if (rowDate > now.dateKey) return false;
  return rowIndex >= 0 && rowIndex <= now.hourIndex;
}

function buildProductivityHours(rows: ProductivityRawRow[]) {
  const byHour = new Map<number, { real: number; metas: Map<string, number> }>();
  rows.forEach((row) => {
    const hour = productivityHourNumber(row.hora);
    if (hour < 0) return;
    const current = byHour.get(hour) ?? { real: 0, metas: new Map<string, number>() };
    current.real += row.shipments;
    const key = `${row.key || row.esteira}-${productivityOperationalDateKey(row)}-${hour}`;
    current.metas.set(key, Math.max(current.metas.get(key) ?? 0, row.metaHora));
    byHour.set(hour, current);
  });

  return PRODUCTIVITY_OPERATION_HOURS.map((hour) => {
      const item = byHour.get(hour) ?? { real: 0, metas: new Map<string, number>() };
      const meta = Array.from(item.metas.values()).reduce((sum, value) => sum + value, 0);
      return {
        hora: productivityHourLabel(hour),
        real: item.real,
        meta,
        gap: item.real - meta,
        eficiencia: productivityEfficiency(item.real, meta)
      };
    });
}

function buildProductivityView(rows: ProductivityRawRow[]) {
  const hours = buildProductivityHours(rows);
  const belts = Array.from(new Set(rows.map((row) => row.esteira).filter(Boolean)))
    .map((esteira) => {
      const beltRows = rows.filter((row) => row.esteira === esteira);
      const beltHours = buildProductivityHours(beltRows);
      const real = beltRows.reduce((sum, row) => sum + row.shipments, 0);
      const metaAtualMap = new Map<string, number>();
      const metaTurnoMap = new Map<string, number>();
      const atividadeMap = new Map<string, number>();
      const operadorMap = new Map<string, number>();
      const estacaoMap = new Map<string, number>();
      beltRows.forEach((row) => {
        const hour = productivityHourNumber(row.hora);
        const turnKey = `${row.key || row.esteira}-${productivityOperationalDateKey(row)}-${hour}`;
        if (isProductivityMetaAteMomento(row)) {
          metaAtualMap.set(turnKey, Math.max(metaAtualMap.get(turnKey) ?? 0, row.metaHora));
        }
        metaTurnoMap.set(turnKey, Math.max(metaTurnoMap.get(turnKey) ?? 0, row.metaHora));
        atividadeMap.set(row.atividade || "N/A", (atividadeMap.get(row.atividade || "N/A") ?? 0) + row.shipments);
        operadorMap.set(row.nome || "N/A", (operadorMap.get(row.nome || "N/A") ?? 0) + row.shipments);
        estacaoMap.set(row.estacao || "N/A", (estacaoMap.get(row.estacao || "N/A") ?? 0) + row.shipments);
      });
      const metaAtual = Array.from(metaAtualMap.values()).reduce((sum, value) => sum + value, 0);
      const metaTurno = Array.from(metaTurnoMap.values()).reduce((sum, value) => sum + value, 0);
      const top = (map: Map<string, number>) =>
        Array.from(map.entries()).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);
      return {
        esteira,
        real,
        metaAtual,
        metaTurno,
        eficiencia: productivityEfficiency(real, metaTurno),
        hours: beltHours,
        atividades: top(atividadeMap),
        operadores: top(operadorMap),
        estacoes: top(estacaoMap)
      };
    })
    .sort((a, b) => b.real - a.real);
  const real = rows.reduce((sum, row) => sum + row.shipments, 0);
  const metaAtualMap = new Map<string, number>();
  rows.forEach((row) => {
    if (!isProductivityMetaAteMomento(row)) return;
    const hour = productivityHourNumber(row.hora);
    const key = `${row.key || row.esteira}-${productivityOperationalDateKey(row)}-${hour}`;
    metaAtualMap.set(key, Math.max(metaAtualMap.get(key) ?? 0, row.metaHora));
  });
  const metaAtual = Array.from(metaAtualMap.values()).reduce((sum, value) => sum + value, 0);
  const metaTurno = belts.reduce((sum, row) => sum + row.metaTurno, 0);

  return {
    resumo: {
      real,
      metaAtual,
      metaTurno,
      eficiencia: productivityEfficiency(real, metaTurno),
      esteiras: belts.length
    },
    hours,
    belts
  };
}

function activeProductivityTurn() {
  const hour = saoPauloNowParts().hour;
  if (hour >= 6 && hour < 14) return "T1";
  if (hour >= 14 && hour < 22) return "T2";
  return "T3";
}

function defaultProductivityBelt(esteiras: string[]) {
  return esteiras.find((esteira) => esteira.toUpperCase() === "HUB 2") ?? esteiras[0] ?? "";
}

function visibleProductivityHours(turno: string, dateKey: string) {
  const baseHours =
    PRODUCTIVITY_TURN_HOURS[turno as keyof typeof PRODUCTIVITY_TURN_HOURS] ?? currentProductivityTurnHours();
  const current = currentProductivityCycle();
  const activeTurn = activeProductivityTurn();

  if (turno !== activeTurn || normalizeDateKey(dateKey) !== current.dateKey) return baseHours;

  return baseHours.filter((hour) => {
    const index = productivityHourIndex(hour);
    return index >= 0 && index <= current.hourIndex;
  });
}

function productivityTurnHours(turno: string) {
  return PRODUCTIVITY_TURN_HOURS[turno as keyof typeof PRODUCTIVITY_TURN_HOURS] ?? PRODUCTIVITY_OPERATION_HOURS;
}

function activeProductivityCollaboratorKeys(rows: ProductivityRawRow[]) {
  return new Set(
    rows
      .filter((row) => row.shipments > 0)
      .map((row) => `${row.opsId || "-"}-${row.nome || "Sem colaborador"}`)
  );
}

function productivityMetaTotal(rows: ProductivityRawRow[], hours: number[]) {
  const hourSet = new Set(hours);
  const metas = new Map<string, number>();

  rows.forEach((row) => {
    const hour = productivityHourNumber(row.hora);
    if (!hourSet.has(hour)) return;

    const key = `${row.key || row.esteira}-${productivityOperationalDateKey(row)}-${hour}`;
    metas.set(key, Math.max(metas.get(key) ?? 0, row.metaHora));
  });

  return Array.from(metas.values()).reduce((sum, value) => sum + value, 0);
}

function buildProductivityLeaderboard(rows: ProductivityRawRow[], hours: number[], metaPorColaborador?: number) {
  const hourSet = new Set(hours);
  const grouped = new Map<
    string,
    {
      nome: string;
      opsId: string;
      total: number;
      metas: Map<string, number>;
      horas: Map<number, number>;
    }
  >();

  rows.forEach((row) => {
    const hour = productivityHourNumber(row.hora);
    if (!hourSet.has(hour)) return;

    const opsId = row.opsId || "-";
    const nome = row.nome || "Sem colaborador";
    const key = `${opsId}-${nome}`;
    const current =
      grouped.get(key) ??
      {
        nome,
        opsId,
        total: 0,
        metas: new Map<string, number>(),
        horas: new Map<number, number>()
      };

    current.total += row.shipments;
    current.horas.set(hour, (current.horas.get(hour) ?? 0) + row.shipments);
    const metaKey = `${row.key || key}-${productivityOperationalDateKey(row)}-${hour}`;
    current.metas.set(metaKey, Math.max(current.metas.get(metaKey) ?? 0, row.metaHora));
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map((item) => {
      const meta = Array.from(item.metas.values()).reduce((sum, value) => sum + value, 0);
      const effectiveMeta = typeof metaPorColaborador === "number" ? metaPorColaborador : meta;
      return {
        ...item,
        meta: effectiveMeta,
        performance: productivityEfficiency(item.total, effectiveMeta)
      };
    })
    .sort((a, b) => b.total - a.total);
}

export default function DashboardShell({
  painel,
  programacao,
  stage,
  docas,
  contagem,
  inteligencia,
  inbound,
  productivity,
  historicoOutbound,
  historicoInbound,
  historicoPacking,
  teste,
  initialTab = "nova",
  cacheWarnings = []
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [refreshPending, startRefreshTransition] = useTransition();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [pageLoading, setPageLoading] = useState(false);
  const {
    collapseSidebar,
    collapseSidebarForNavigation,
    sidebarCollapsed,
    toggleSidebar
  } = useAutoCollapseSidebar("gerencial-sidebar");
  const [openSections, setOpenSections] = useState({
    stageIn: true,
    packing: true,
    outbound: true
  });
  const [nowMs, setNowMs] = useState(inbound.serverNowMs || Date.now());
  const [inboundFilters, setInboundFilters] = useState({
    processo: "Todos",
    tipos: { Transbordo: true, Mista: true, Comum: true }
  });
  const [stageInFilters, setStageInFilters] = useState({
    arrivedLt: "",
    arrivedOrigem: "",
    unsealLt: "",
    unsealOrigem: ""
  });
  const [inboundSort, setInboundSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "tTotalMs", dir: "desc" });
  const [expandedInboundLt, setExpandedInboundLt] = useState("");
  const [progFilters, setProgFilters] = useState({
    query: "",
    data: todayPtBr(),
    hora: "",
    turno: "",
    status: "",
    station: ""
  });
  const [geralFilters, setGeralFilters] = useState({
    query: "",
    data: "",
    hora: "",
    turno: "",
    status: "",
    station: ""
  });
  const [stageFilters, setStageFilters] = useState({
    rua: "",
    station: ""
  });
  const [productivityFilters, setProductivityFilters] = useState({
    turno: "",
    esteira: "",
    atividade: "",
    operador: "",
    estacao: ""
  });
  const [productivitySmallTurnFilter, setProductivitySmallTurnFilter] = useState<ProductivitySmallTurnFilter>("AUTO");
  const [rawProductivityFilters, setRawProductivityFilters] = useState({
    dataInicio: todayIsoDate(),
    dataFim: todayIsoDate(),
    turno: "",
    esteira: "",
    operador: ""
  });
  const [selectedStageRua, setSelectedStageRua] = useState("");
  const isInboundTab = tab === "stageIn" || tab === "inbound";
  const isProgramacaoTab = tab === "programacao";
  const isGeralTab = tab === "geral";
  const isStageTab = tab === "stage";
  const isProductivityOverviewTab = tab === "nova";
  const isProductivityRawTab = tab === "produtividade";
  const needsStageComputed = isStageTab || isProgramacaoTab;

  useEffect(() => {
    if (!isInboundTab) return;

    const interval = window.setInterval(() => setNowMs((current) => current + 15000), 15000);
    return () => window.clearInterval(interval);
  }, [isInboundTab]);

  const handleSideNavigate = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const nextPath = new URL(event.currentTarget.href).pathname;
    if (nextPath === pathname) {
      collapseSidebar();
      return;
    }

    collapseSidebarForNavigation();
    setPageLoading(true);
  }, [collapseSidebar, collapseSidebarForNavigation, pathname]);

  const programacaoOptions = useMemo(
    () =>
      isProgramacaoTab
        ? {
            data: uniq(programacao.map((row) => row.stdData)),
            hora: hourOptions(),
            turno: uniq(programacao.map((row) => row.turno)),
            status: uniq(programacao.map((row) => row.status)),
            station: uniq(programacao.map((row) => row.station))
          }
        : { data: [], hora: [], turno: [], status: [], station: [] },
    [isProgramacaoTab, programacao]
  );

  const filteredProductivityRows = useMemo(() => {
    if (!isProductivityOverviewTab) return [];

    return productivity.linhas.filter((row) => {
      return (
        (!productivityFilters.turno || row.turno === productivityFilters.turno) &&
        (!productivityFilters.esteira || row.esteira === productivityFilters.esteira) &&
        (!productivityFilters.atividade || row.atividade === productivityFilters.atividade) &&
        (!productivityFilters.operador || row.nome === productivityFilters.operador) &&
        (!productivityFilters.estacao || row.estacao === productivityFilters.estacao)
      );
    });
  }, [isProductivityOverviewTab, productivity.linhas, productivityFilters]);

  const productivityView = useMemo(() => buildProductivityView(filteredProductivityRows), [filteredProductivityRows]);
  const productivityTurnSummary = useMemo(
    () => ({
      T1: buildProductivityView(filteredProductivityRows.filter((row) => row.turno === "T1")).resumo,
      T2: buildProductivityView(filteredProductivityRows.filter((row) => row.turno === "T2")).resumo,
      T3: buildProductivityView(filteredProductivityRows.filter((row) => row.turno === "T3")).resumo
    }),
    [filteredProductivityRows]
  );

  const productivityPage = useMemo(() => {
    if (!isProductivityRawTab) {
      return {
        data: "",
        turno: "",
        esteira: "",
        colaborador: "",
        beltOptions: [],
        collaboratorOptions: [],
        hours: [],
        rows: [],
        leaderboard: [],
        kpis: {
          total: 0,
          hc: 0,
          meta: 0,
          metaPorHc: 0,
          aderencia: 0,
          abaixo90: 0
        }
      };
    }

    const dataInicio = rawProductivityFilters.dataInicio || todayIsoDate();
    const dataFim = rawProductivityFilters.dataFim || dataInicio;
    const baseRows = productivity.linhas.filter((row) => {
      const rowDate = productivityOperationalDateKey(row);
      return rowDate >= normalizeDateKey(dataInicio) && rowDate <= normalizeDateKey(dataFim);
    });
    const activeTurn = activeProductivityTurn();
    const turnOptionsFromDate = uniq(baseRows.map((row) => row.turno));
    const turno = rawProductivityFilters.turno || (turnOptionsFromDate.includes(activeTurn) ? activeTurn : turnOptionsFromDate[0] || activeTurn);
    const rowsByTurn = baseRows.filter((row) => row.turno === turno);
    const beltOptions = uniq(rowsByTurn.map((row) => row.esteira));
    const esteira = beltOptions.includes(rawProductivityFilters.esteira)
      ? rawProductivityFilters.esteira
      : defaultProductivityBelt(beltOptions);
    const rowsByBelt = rowsByTurn.filter((row) => row.esteira === esteira);
    const collaboratorOptions = uniq(rowsByBelt.map((row) => row.nome));
    const colaborador = collaboratorOptions.includes(rawProductivityFilters.operador) ? rawProductivityFilters.operador : "";
    const hours = productivityTurnHours(turno);
    const hourSet = new Set(hours);
    const rows = rowsByBelt.filter((row) => {
      return !colaborador || row.nome === colaborador;
    });
    const activeCollaborators = activeProductivityCollaboratorKeys(rows);
    const hc = activeCollaborators.size;
    const total = rows
      .filter((row) => hourSet.has(productivityHourNumber(row.hora)))
      .reduce((sum, row) => sum + row.shipments, 0);
    const meta = productivityMetaTotal(rows, hours);
    const metaPorHc = hc > 0 ? total / hc : null;
    const leaderboard = buildProductivityLeaderboard(rows, hours, metaPorHc ?? 0);
    const abaixo90 = leaderboard.filter((row) => row.performance < 90).length;

    return {
      data: dataInicio,
      turno,
      esteira,
      colaborador,
      beltOptions,
      collaboratorOptions,
      hours,
      rows,
      leaderboard,
      kpis: {
        total,
        hc,
        meta,
        metaPorHc,
        aderencia: productivityEfficiency(total, meta),
        abaixo90
      }
    };
  }, [isProductivityRawTab, productivity.filtros.datas, productivity.linhas, rawProductivityFilters]);

  const geralOptions = useMemo(
    () =>
      isGeralTab
        ? {
            data: uniq([...programacao.map((row) => row.data), ...programacao.map((row) => row.stdData)]),
            hora: hourOptions(),
            turno: uniq(programacao.map((row) => row.turno)),
            status: uniq(programacao.map((row) => row.status)),
            station: uniq(programacao.map((row) => row.station))
          }
        : { data: [], hora: [], turno: [], status: [], station: [] },
    [isGeralTab, programacao]
  );

  const filteredTrips = useMemo(() => {
    if (!isProgramacaoTab) return [];

    return programacao
      .filter((row) => {
        const queryMatch =
          !progFilters.query ||
          [row.lh, row.status, row.destino, row.station, row.driver, row.operator, row.vehicle].some((field) =>
            includesValue(String(field), progFilters.query)
          );

        return (
          queryMatch &&
          (!progFilters.data || row.stdData === progFilters.data) &&
          matchesHourInterval(row.std, progFilters.hora) &&
          (!progFilters.turno || row.turno === progFilters.turno) &&
          (!progFilters.status || row.status === progFilters.status) &&
          (!progFilters.station || row.station === progFilters.station)
        );
      })
      .sort((a, b) => stdSortValue(a.stdRaw, a.std) - stdSortValue(b.stdRaw, b.std) || a.lh.localeCompare(b.lh));
  }, [isProgramacaoTab, programacao, progFilters]);

  const stationCards = useMemo(() => {
    const map = new Map<
      string,
      { station: string; tipo: string; qtd: number; posicoes: number; firstStd: number; stds: Map<string, { viagens: number; posicoes: number }> }
    >();
    filteredTrips.forEach((row) => {
      const current = map.get(row.station) ?? {
        station: row.station,
        tipo: row.destino.toUpperCase().startsWith("SOC") ? "SOC STATION" : "HUB STATION",
        qtd: 0,
        posicoes: 0,
        firstStd: Number.MAX_SAFE_INTEGER,
        stds: new Map<string, { viagens: number; posicoes: number }>()
      };
      const posicoes = vehicleCapacity(row.vehicle);
      current.firstStd = Math.min(current.firstStd, stdSortValue(row.stdRaw, row.std));
      current.qtd += 1;
      current.posicoes += posicoes;
      if (row.std !== "-") {
        const stdInfo = current.stds.get(row.std) ?? { viagens: 0, posicoes: 0 };
        stdInfo.viagens += 1;
        stdInfo.posicoes += posicoes;
        current.stds.set(row.std, stdInfo);
      }
      map.set(row.station, current);
    });
    return Array.from(map.values()).sort((a, b) => a.firstStd - b.firstStd || a.station.localeCompare(b.station));
  }, [filteredTrips]);

  const stageAlocado = useMemo(() => {
    if (!needsStageComputed) return [];
    return stage.linhas.filter((row) => row.ilha.trim().toUpperCase() === "ALOCADO");
  }, [needsStageComputed, stage.linhas]);

  const stageOptions = useMemo(
    () =>
      isStageTab
        ? {
            rua: uniq(stageAlocado.map((row) => row.rua)),
            station: uniq(stageAlocado.map((row) => row.station))
          }
        : { rua: [], station: [] },
    [isStageTab, stageAlocado]
  );

  const filteredStage = useMemo(() => {
    if (!isStageTab) return [];

    return stageAlocado.filter((row) => {
      return (
        (!stageFilters.rua || row.rua === stageFilters.rua) &&
        (!stageFilters.station || row.station === stageFilters.station)
      );
    });
  }, [isStageTab, stageAlocado, stageFilters]);

  const stageKpis = useMemo(() => {
    if (!isStageTab) return { totalTos: 0, pacotes: 0, transbordo: 0, ruas: 0 };

    const totalTos = filteredStage.reduce((sum, row) => sum + row.tos, 0);
    const pacotes = filteredStage.reduce((sum, row) => sum + row.pacotes, 0);
    const transbordo = filteredStage.filter((row) => row.status.toUpperCase().includes("TRANSBORDO")).length;
    return {
      totalTos,
      pacotes,
      transbordo,
      ruas: uniq(filteredStage.map((row) => row.rua)).length
    };
  }, [isStageTab, filteredStage]);

  const stageByStation = useMemo(() => {
    if (!isProgramacaoTab) {
      return new Map<
        string,
        {
          ruas: Map<string, number>;
          packs: Map<string, number>;
          minimosAdo: Set<string>;
          tos: number;
          pacotes: number;
        }
      >();
    }

    const map = new Map<
      string,
      {
        ruas: Map<string, number>;
        packs: Map<string, number>;
        minimosAdo: Set<string>;
        tos: number;
        pacotes: number;
      }
    >();
    stageAlocado.forEach((row) => {
      const current = map.get(row.station) ?? {
        ruas: new Map<string, number>(),
        packs: new Map<string, number>(),
        minimosAdo: new Set<string>(),
        tos: 0,
        pacotes: 0
      };
      current.tos += row.tos;
      current.pacotes += row.pacotes;
      current.ruas.set(row.rua, (current.ruas.get(row.rua) ?? 0) + row.tos);
      const packName = packResumoName(row.packName);
      current.packs.set(packName, (current.packs.get(packName) ?? 0) + row.tos);
      if (row.minimoAdo) current.minimosAdo.add(row.minimoAdo);
      map.set(row.station, current);
    });
    return map;
  }, [isProgramacaoTab, stageAlocado]);

  const packChart = useMemo(() => {
    if (!isStageTab) return [];

    const map = new Map<string, number>();
    filteredStage.forEach((row) => map.set(row.packName, (map.get(row.packName) ?? 0) + row.tos));
    return Array.from(map.entries())
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 8);
  }, [isStageTab, filteredStage]);

  const filtrarGeral = useCallback((dateField: "data" | "stdData", hourField: "sta" | "std", usarDataHora = true) => {
    if (!isGeralTab) return [];

    return programacao.filter((row) => {
      const queryMatch =
        !geralFilters.query ||
        [row.lh, row.status, row.destino, row.station, row.driver, row.operator, row.vehicle].some((field) =>
          includesValue(String(field), geralFilters.query)
        );

      return (
        queryMatch &&
        (!usarDataHora || !geralFilters.data || row[dateField] === geralFilters.data) &&
        (!usarDataHora || matchesHourInterval(row[hourField], geralFilters.hora)) &&
        (!geralFilters.turno || row.turno === geralFilters.turno) &&
        (!geralFilters.status || row.status === geralFilters.status) &&
        (!geralFilters.station || row.station === geralFilters.station)
      );
    });
  }, [isGeralTab, programacao, geralFilters]);

  const geralTripsSta = useMemo(() => {
    return filtrarGeral("data", "sta");
  }, [filtrarGeral]);

  const geralTripsStd = useMemo(() => {
    return filtrarGeral("stdData", "std");
  }, [filtrarGeral]);

  const geralTripsStdJanela = useMemo(() => {
    return filtrarGeral("stdData", "std", false);
  }, [filtrarGeral]);

  const geralMetrics = useMemo(() => {
    const monitorCpt = geralTripsStdJanela
      .filter((row) => !isDeparted(row.status))
      .map((row) => {
        const minutos = Math.floor(diffMinutesFromNow(row.stdRaw, row.std));
        return {
          lh: row.lh,
          destino: row.destino,
          cpt: row.std,
          minutos,
          criticidade: minutos < 30 ? "critico" : "alerta"
        };
      })
      .filter((row) => row.minutos >= 0 && row.minutos <= 60)
      .sort((a, b) => a.minutos - b.minutos);

    const currentHourStart = saoPauloCurrentHourStartMs();
    const demanda = Array.from({ length: 24 }, (_, index) => {
      const slotStart = currentHourStart + index * 60 * 60 * 1000;
      const slotEnd = slotStart + 60 * 60 * 1000;
      const hour = new Date(slotStart).getUTCHours();
      const hourText = String(hour).padStart(2, "0");
      const label = `${hourText}:00`;
      const qtd = geralTripsStdJanela.filter((row) => {
        const stdMs = parseSheetDateTimeMs(row.stdRaw);
        return stdMs !== null && stdMs >= slotStart && stdMs < slotEnd;
      }).length;
      return { hora: label, qtd };
    });

    return {
      kpis: {
        docasOperando: geralTripsSta.filter((row) => hasDock(row.dock)).length,
        limiteCpt: monitorCpt.filter((item) => item.minutos < 30).length,
        chegadasProximas: geralTripsSta.filter((row) => {
          const diff = diffMinutesFromNow(row.staRaw, row.sta);
          return !isDeparted(row.status) && diff >= 0 && diff <= 90;
        }).length,
        atrasadasCpt: geralTripsStd.filter((row) => !isDeparted(row.status) && diffMinutesFromNow(row.stdRaw, row.std) < 0).length,
        carregando: geralTripsSta.filter((row) => isLoading(row.status)).length,
        aguardando: geralTripsSta.filter((row) => isWaiting(row.status)).length
      },
      demanda,
      monitorCpt
    };
  }, [geralTripsSta, geralTripsStd, geralTripsStdJanela]);

  const geralOcupacaoCritica = useMemo(() => {
    if (!isGeralTab) return [];
    return geralFilters.station ? painel.ocupacaoCritica.filter((item) => item.station === geralFilters.station) : painel.ocupacaoCritica;
  }, [isGeralTab, geralFilters.station, painel.ocupacaoCritica]);

  const maxDemand = Math.max(...geralMetrics.demanda.map((row) => row.qtd), 1);
  const maxPack = Math.max(...packChart.map((row) => row.qtd), 1);
  const activeDocas = geralMetrics.kpis.docasOperando;
  const inboundRows = useMemo<InboundRuntimeRow[]>(() => {
    if (!isInboundTab) return [];

    const rows = inbound.veiculos
      .map((vehicle): InboundRuntimeRow => {
        const baseVehicle: InboundVehicle = {
          ...vehicle,
          processo: vehicle.processo === "Em Doca" ? "Em Doca" : "Em Fila",
          tipoCarga:
            vehicle.tipoCarga === "Mista" || vehicle.tipoCarga === "Transbordo"
              ? vehicle.tipoCarga
              : "Comum"
        };
        return { ...baseVehicle, ...inboundRuntime(baseVehicle, nowMs) };
      })
      .filter((vehicle) => {
        const tipoOk = inboundFilters.tipos[vehicle.tipoCarga as keyof typeof inboundFilters.tipos];
        const processoOk = inboundFilters.processo === "Todos" || vehicle.processo === inboundFilters.processo;
        return tipoOk && processoOk;
      });

    return rows.sort((a, b) => {
      const aValue = a[inboundSort.key as keyof typeof a];
      const bValue = b[inboundSort.key as keyof typeof b];
      const aComparable = typeof aValue === "number" ? aValue : String(aValue ?? "");
      const bComparable = typeof bValue === "number" ? bValue : String(bValue ?? "");
      const result =
        typeof aComparable === "number" && typeof bComparable === "number"
          ? aComparable - bComparable
          : String(aComparable).localeCompare(String(bComparable));
      return inboundSort.dir === "asc" ? result : -result;
    });
  }, [isInboundTab, inbound.veiculos, inboundFilters, inboundSort, nowMs]);
  const stageInOrigins = useMemo(() => (isInboundTab ? uniq(inboundRows.map((row) => row.origem)) : []), [isInboundTab, inboundRows]);
  const stageInArrivedRows = useMemo(
    () =>
      inboundRows.filter(
        (row) =>
          row.processo === "Em Fila" &&
          (!stageInFilters.arrivedLt || includesValue(row.lt, stageInFilters.arrivedLt)) &&
          (!stageInFilters.arrivedOrigem || row.origem === stageInFilters.arrivedOrigem)
      ),
    [inboundRows, stageInFilters.arrivedLt, stageInFilters.arrivedOrigem]
  );
  const stageInUnsealRows = useMemo(
    () =>
      inboundRows.filter(
        (row) =>
          row.processo === "Em Doca" &&
          (!stageInFilters.unsealLt || includesValue(row.lt, stageInFilters.unsealLt)) &&
          (!stageInFilters.unsealOrigem || row.origem === stageInFilters.unsealOrigem)
      ),
    [inboundRows, stageInFilters.unsealLt, stageInFilters.unsealOrigem]
  );
  const setInboundSortKey = (key: string) =>
    setInboundSort((current) => ({ key, dir: current.key === key && current.dir === "desc" ? "asc" : "desc" }));
  const toggleInboundTipo = (tipo: keyof typeof inboundFilters.tipos) =>
    setInboundFilters((current) => ({ ...current, tipos: { ...current.tipos, [tipo]: !current.tipos[tipo] } }));
  const limparFiltrosProgramacao = () =>
    setProgFilters({
      query: "",
      data: todayPtBr(),
      hora: "",
      turno: "",
      status: "",
      station: ""
    });
  const limparFiltrosGeral = () =>
    setGeralFilters({
      query: "",
      data: "",
      hora: "",
      turno: "",
      status: "",
    station: ""
  });
  const forceRefreshPage = useCallback(() => {
    startRefreshTransition(() => {
      router.replace(`${pathname}?refresh=${Date.now()}`, { scroll: false });
      router.refresh();
    });
  }, [pathname, router, startRefreshTransition]);

  return (
    <main className="page">
      <PageLoadingOverlay active={pageLoading || refreshPending} />
      <AppHeader title={tabLabels[tab]} />

      {cacheWarnings.length > 0 && (
        <div className="cache-warning" role="status">
          {cacheWarnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      )}

      <div className={`dashboard-layout ${sidebarCollapsed ? "collapsed" : ""}`}>
        <aside className={`side-nav card ${sidebarCollapsed ? "collapsed" : ""}`}>
          <button
            aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            className="side-collapse"
            onClick={toggleSidebar}
            type="button"
          >
            {sidebarCollapsed ? ">" : "<"}
          </button>

          <Link className="side-item side-oraculo-link" href="/">
            <span className="side-icon"><MenuIcon name="home" /></span>
            {!sidebarCollapsed && <span className="side-label">Início</span>}
            {!sidebarCollapsed && <span className="side-arrow">{">"}</span>}
          </Link>

          <div className="side-section grouped">
            <SideGroup
              collapsed={sidebarCollapsed}
              icon="stageIn"
              label="INBOUND"
              open={openSections.stageIn}
              onToggle={() => setOpenSections((current) => ({ ...current, stageIn: !current.stageIn }))}
            >
              <SideLink active={tab === "stageIn"} href={routeByTab.stageIn} icon="inbound" label="Inbound live" onNavigate={handleSideNavigate} />
              <SideLink active={tab === "historicoInbound"} href={routeByTab.historicoInbound} icon="history" label="Histórico LH Inbound" onNavigate={handleSideNavigate} />
            </SideGroup>

            <SideGroup
              collapsed={sidebarCollapsed}
              icon="packing"
              label="Packing"
              open={openSections.packing}
              onToggle={() => setOpenSections((current) => ({ ...current, packing: !current.packing }))}
            >
              <SideLink active={tab === "produtividade"} href={routeByTab.produtividade} icon="productivity" label="Live Prod HC" onNavigate={handleSideNavigate} />
              <SideLink active={tab === "nova"} href={routeByTab.nova} icon="productivity" label="Live Prod Esteiras" onNavigate={handleSideNavigate} />
              <SideLink active={tab === "historico"} href={routeByTab.historico} icon="H" label="Histórico Prod Esteiras" onNavigate={handleSideNavigate} />
            </SideGroup>

            {SHOW_OUTBOUND_MENU && <SideGroup
              collapsed={sidebarCollapsed}
              icon="outbound"
              label="OUTBOUND"
              open={openSections.outbound}
              onToggle={() => setOpenSections((current) => ({ ...current, outbound: !current.outbound }))}
            >
              <SideLink active={tab === "historicoOutbound"} href={routeByTab.historicoOutbound} icon="history" label="Histórico LH Outbound" onNavigate={handleSideNavigate} />
              {SHOW_LEGACY_OUTBOUND_LINKS && (
                <>
                  <SideLink active={tab === "programacao"} href={routeByTab.programacao} icon="P" label="Programacao" onNavigate={handleSideNavigate} />
                  <SideLink active={tab === "geral"} href={routeByTab.geral} icon="G" label="Geral" onNavigate={handleSideNavigate} />
                  <SideLink active={tab === "docas"} href={routeByTab.docas} icon="D" label="Docas" onNavigate={handleSideNavigate} />
                  <SideLink active={tab === "contagem"} href={routeByTab.contagem} icon="C" label="Contagem" onNavigate={handleSideNavigate} />
                  <SideLink active={tab === "stage"} href={routeByTab.stage} icon="S" label="Stage Out" onNavigate={handleSideNavigate} />
                </>
              )}
            </SideGroup>}
          </div>

          <div className="side-section legacy-hidden">
            <span className="side-section-title">Paginas</span>
            {false && <a className="side-item old" href="/historico-packing">
              <span className="side-icon">H</span>
              <span className="side-label">Historico Prod Esteiras</span>
              <span className="side-arrow">{">"}</span>
            </a>}
            {oldTabs.map((item) => (
              <button className={`side-item old ${tab === item ? "active" : ""}`} key={item} onClick={() => setTab(item)} type="button">
                <span className="side-icon">{tabLabels[item].slice(0, 1)}</span>
                <span className="side-label">{tabLabels[item]}</span>
                <span className="side-arrow">{">"}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="dashboard-content">

      {tab === "stageIn" && (
        <>
          <PageActions
            onClear={() => setStageInFilters({ arrivedLt: "", arrivedOrigem: "", unsealLt: "", unsealOrigem: "" })}
            onRefresh={forceRefreshPage}
            refreshDisabled={refreshPending}
          />
          <StageInDashboard
            arrivedRows={stageInArrivedRows}
            filters={stageInFilters}
            origins={stageInOrigins}
            setFilters={setStageInFilters}
            unsealRows={stageInUnsealRows}
          />
        </>
      )}

      {tab === "historico" && <HistoricoPackingPage initialData={historicoPacking} embedded />}

      {tab === "historicoOutbound" && <HistoricoOutboundPage initialData={historicoOutbound} />}

      {tab === "historicoInbound" && <HistoricoOutboundPage initialData={historicoInbound} variant="inbound" />}

      {tab === "teste" && <TestePage data={teste} />}

      {tab === "nova" && (
        <>
          <div className="productivity-refresh-row">
            <PageActions
              onRefresh={forceRefreshPage}
              refreshDisabled={refreshPending}
            />
          </div>

          <section className="card filter-card productivity-filter">
            <ListFilter
              label="Turno"
              options={productivity.filtros.turnos}
              value={productivityFilters.turno}
              onChange={(value) => setProductivityFilters({ ...productivityFilters, turno: value })}
            />
            <ListFilter
              label="Esteira"
              options={productivity.filtros.esteiras}
              value={productivityFilters.esteira}
              onChange={(value) => setProductivityFilters({ ...productivityFilters, esteira: value })}
            />
            <ListFilter
              label="Atividade"
              options={productivity.filtros.atividades}
              value={productivityFilters.atividade}
              onChange={(value) => setProductivityFilters({ ...productivityFilters, atividade: value })}
            />
            <ListFilter
              label="Operador"
              options={productivity.filtros.operadores}
              value={productivityFilters.operador}
              onChange={(value) => setProductivityFilters({ ...productivityFilters, operador: value })}
            />
            <ListFilter
              label="Estacao"
              options={productivity.filtros.estacoes}
              value={productivityFilters.estacao}
              onChange={(value) => setProductivityFilters({ ...productivityFilters, estacao: value })}
            />
            <PageActions
              onClear={() =>
                setProductivityFilters({ turno: "", esteira: "", atividade: "", operador: "", estacao: "" })
              }
              onRefresh={forceRefreshPage}
              refreshDisabled={refreshPending}
            />
          </section>

          <section className="card productivity-small-turn-card" aria-label="Filtro de turno dos cards de esteira">
            <div>
              <span>Turno dos cards</span>
              <small>
                {productivitySmallTurnFilter === "AUTO"
                  ? `AUTO usando ${activeProductivityTurn()} pelo horario atual`
                  : `Exibindo ${productivitySmallTurnFilter}`}
              </small>
            </div>
            <div className="segmented-control" role="group" aria-label="Turno dos cards menores">
              {(["AUTO", "T1", "T2", "T3"] as const).map((option) => (
                <button
                  aria-pressed={productivitySmallTurnFilter === option}
                  className={productivitySmallTurnFilter === option ? "active" : ""}
                  key={option}
                  onClick={() => setProductivitySmallTurnFilter(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="card productivity-main">
            <div className="panel-title">Resumo geral (galpao) e producao por hora</div>
            <div className="productivity-main-grid">
              <div className="productivity-summary-cards">
                <ProductivitySummaryCard label="Real global" resumo={productivityView.resumo} />
                <ProductivitySummaryCard label="T1" resumo={productivityTurnSummary.T1} />
                <ProductivitySummaryCard label="T2" resumo={productivityTurnSummary.T2} />
                <ProductivitySummaryCard label="T3" resumo={productivityTurnSummary.T3} />
              </div>
              <ProductivityHourChart hours={productivityView.hours} />
            </div>
          </section>

          <section className="productivity-belt-grid">
            {productivityView.belts.map((belt) => (
              <ProductivityBeltCard key={belt.esteira} belt={belt} turnFilter={productivitySmallTurnFilter} />
            ))}
            {!productivityView.belts.length && (
              <div className="card panel">Sem dados na aba raw para os filtros selecionados.</div>
            )}
          </section>
        </>
      )}

      {tab === "produtividade" && (
        <>
          <section className="card raw-filter-card">
            <div className="raw-filter-head">
              <div className="raw-filter-spacer" aria-hidden="true" />
              <div aria-hidden="true" />
              <PageActions
                onClear={() => {
                  const today = todayIsoDate();
                  setRawProductivityFilters({ dataInicio: today, dataFim: today, turno: "", esteira: "", operador: "" });
                }}
                onRefresh={forceRefreshPage}
                refreshDisabled={refreshPending}
              />
            </div>

            <div className="raw-filter-grid">
              <DatePeriodPicker
                endDate={rawProductivityFilters.dataFim}
                label="Data / periodo"
                onChange={(dataInicio, dataFim) => setRawProductivityFilters({ ...rawProductivityFilters, dataInicio, dataFim })}
                startDate={rawProductivityFilters.dataInicio}
              />
              <label className="filter-field raw-turn-field">
                <span>Turno</span>
                <select value={rawProductivityFilters.turno} onChange={(event) => setRawProductivityFilters({ ...rawProductivityFilters, turno: event.target.value })}>
                  <option value="">Auto</option>
                  <option value="T1">T1</option>
                  <option value="T2">T2</option>
                  <option value="T3">T3</option>
                </select>
              </label>
              <SelectFilter
                label="Esteira"
                options={productivityPage.beltOptions}
                value={productivityPage.esteira}
                onChange={(value) => setRawProductivityFilters({ ...rawProductivityFilters, esteira: value })}
              />
              <ListFilter
                label="Colaborador"
                options={productivityPage.collaboratorOptions}
                value={productivityPage.colaborador}
                onChange={(value) => setRawProductivityFilters({ ...rawProductivityFilters, operador: value })}
              />
              <div className="raw-active-turn">Turno ativo: {productivityPage.turno}</div>
            </div>
          </section>

          <section className="raw-kpi-grid">
            <RawKpi icon="#" label="Produzido" sub="Volume total no recorte" value={numberFormat(Math.round(productivityPage.kpis.total))} />
            <RawKpi icon="HC" label="HC ativo" sub={`${numberFormat(productivityPage.kpis.hc)} colaboradores no recorte`} value={numberFormat(productivityPage.kpis.hc)} tone="green" />
            <RawKpi
              icon="M"
              label="Meta HC"
              sub="Produzido / HC ativo"
              value={productivityPage.kpis.metaPorHc === null ? "—" : productivityPage.kpis.metaPorHc.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              tone="orange"
            />
            <RawKpi icon="%" label="Aderencia" sub="Produzido x meta HC" value={`${productivityPage.kpis.aderencia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`} tone={productivityPage.kpis.aderencia >= 90 ? "green" : "red"} />
            <RawKpi icon="!" label="Abaixo 90%" sub="Colaboradores no recorte" value={numberFormat(productivityPage.kpis.abaixo90)} tone="red" />
          </section>

          <section className="card raw-legend">
            <span className="green">Verde &gt;=100%</span>
            <span className="orange">Amarelo &gt;=90%</span>
            <span className="red">Vermelho &lt;90%</span>
            <span>Atualizado: {productivity.atualizadoEm || "-"}</span>
          </section>

          <section className="card raw-table-card">
            <div className="raw-table-head">
              <div>
                <span>Esteira</span>
                <strong>{productivityPage.esteira || "Todas"}</strong>
              </div>
              <div className="raw-table-badges">
                <span>Total: {numberFormat(Math.round(productivityPage.kpis.total))}</span>
                <span>HC: {numberFormat(productivityPage.kpis.hc)}</span>
                <span>Perf.: {productivityPage.kpis.aderencia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
                <span>Abaixo 90%: {numberFormat(productivityPage.kpis.abaixo90)}</span>
              </div>
            </div>

            <div className="raw-table-wrap">
              <table className="raw-production-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Ops</th>
                    <th>Total</th>
                    <th>Performance</th>
                    {productivityPage.hours.map((hour) => (
                      <th key={hour}>{hour}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productivityPage.leaderboard.map((row) => (
                    <tr key={`${row.opsId}-${row.nome}`}>
                      <td className="raw-collaborator">[{row.opsId}]{row.nome}</td>
                      <td>{row.opsId}</td>
                      <td>{numberFormat(Math.round(row.total))}</td>
                      <td className={productivityTone(row.performance)}>{row.performance.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</td>
                      {productivityPage.hours.map((hour) => {
                        const value = row.horas.get(hour) ?? 0;
                        return (
                          <td className={productivityTone(productivityEfficiency(value, row.meta / Math.max(1, productivityPage.hours.length)))} key={hour}>
                            {value ? numberFormat(Math.round(value)) : "0"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {!productivityPage.leaderboard.length && (
                    <tr>
                      <td colSpan={4 + productivityPage.hours.length}>Sem dados na aba raw para os filtros selecionados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === "inbound" && (
        <>
          <section className="grid inbound-kpis">
            <InboundMetric label="Turno atual" value={inbound.resumo.turno} />
            <InboundMetric
              label="Descarregados"
              sub={`Sendo ${numberFormat(inbound.resumo.transbordo.desc)} Transbordos`}
              value={numberFormat(inbound.resumo.descarregados)}
            />
            <InboundMetric
              label="Veiculos na fila"
              sub={`Sendo ${numberFormat(inbound.resumo.transbordo.fila)} Transbordos`}
              value={numberFormat(inbound.resumo.emFila)}
            />
            <InboundMetric
              label="Veiculos na doca"
              sub={`Sendo ${numberFormat(inbound.resumo.transbordo.doca)} Transbordos`}
              value={numberFormat(inbound.resumo.emDoca)}
            />
          </section>

          <section className="grid inbound-performance">
            <InboundMetric
              label="Media fila"
              sub={`Transbordo: ${formatDuration(inbound.resumo.fila.tReal)}`}
              tone={inboundCardTone(inbound.resumo.fila.real, inbound.resumo.fila.meta)}
              value={formatDuration(inbound.resumo.fila.real)}
              meta={`Meta: ${formatDuration(inbound.resumo.fila.meta)}`}
            />
            <InboundMetric
              label="Media doca"
              sub={`Transbordo: ${formatDuration(inbound.resumo.doca.tReal)}`}
              tone={inboundCardTone(inbound.resumo.doca.real, inbound.resumo.doca.meta)}
              value={formatDuration(inbound.resumo.doca.real)}
              meta={`Meta: ${formatDuration(inbound.resumo.doca.meta)}`}
            />
            <InboundMetric
              label="AWT medio"
              sub={`Transbordo: ${formatDuration(inbound.resumo.total.tReal)}`}
              tone={inboundCardTone(inbound.resumo.total.real, inbound.resumo.total.meta)}
              value={formatDuration(inbound.resumo.total.real)}
              meta={`Meta: ${formatDuration(inbound.resumo.total.meta)}`}
            />
          </section>

          <section className="card panel inbound-live-panel">
            <div className="panel-head inbound-head">
              <div>
                <div className="panel-title">Live Inbound</div>
                <div className="item-meta">{numberFormat(inboundRows.length)} veiculos em monitoramento</div>
              </div>
              <div className="inbound-controls">
                <div className="inbound-checks">
                  <strong>Tipos:</strong>
                  {(["Transbordo", "Mista", "Comum"] as const).map((tipo) => (
                    <label key={tipo}>
                      <input checked={inboundFilters.tipos[tipo]} onChange={() => toggleInboundTipo(tipo)} type="checkbox" />
                      {tipo}
                    </label>
                  ))}
                </div>
                <select
                  className="inbound-select"
                  onChange={(event) => setInboundFilters({ ...inboundFilters, processo: event.target.value })}
                  value={inboundFilters.processo}
                >
                  <option value="Todos">Todos os processos</option>
                  <option value="Em Fila">Em Fila</option>
                  <option value="Em Doca">Em Doca</option>
                </select>
              </div>
            </div>

            <div className="table-wrap inbound-table">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => setInboundSortKey("lt")}>LT</th>
                    <th onClick={() => setInboundSortKey("processo")}>Processo</th>
                    <th onClick={() => setInboundSortKey("tipoCarga")}>Tipo</th>
                    <th onClick={() => setInboundSortKey("placa")}>Placa</th>
                    <th onClick={() => setInboundSortKey("origem")}>Origem</th>
                    <th onClick={() => setInboundSortKey("doca")}>Doca</th>
                    <th onClick={() => setInboundSortKey("driver")}>Driver</th>
                    <th onClick={() => setInboundSortKey("turno")}>Turno</th>
                    <th onClick={() => setInboundSortKey("pendingInboundToPackType")}>Pending Pack Type</th>
                    <th onClick={() => setInboundSortKey("toTotal")}>TO Total</th>
                    <th onClick={() => setInboundSortKey("pendingInboundTo")}>Pending Inbound TO</th>
                    <th className="col-fila" onClick={() => setInboundSortKey("tFilaMs")}>Tempo fila</th>
                    <th className="col-fila" onClick={() => setInboundSortKey("metaFilaMs")}>Meta fila</th>
                    <th className="col-doca" onClick={() => setInboundSortKey("tDocaMs")}>Tempo doca</th>
                    <th className="col-doca" onClick={() => setInboundSortKey("metaDocaMs")}>Meta doca</th>
                    <th className="col-total" onClick={() => setInboundSortKey("tTotalMs")}>Tempo total</th>
                    <th className="col-total" onClick={() => setInboundSortKey("metaAwtMs")}>Meta AWT</th>
                  </tr>
                </thead>
                <tbody>
                  {inboundRows.map((row) => {
                    const isMista = row.tipoCarga === "Mista";
                    const isExpanded = isMista && expandedInboundLt === row.lt;

                    return (
                      <Fragment key={`${row.lt}-${row.status}-${row.doca}`}>
                        <tr
                          className={isMista ? "inbound-expandable-row" : undefined}
                          role={isMista ? "button" : undefined}
                          aria-expanded={isMista ? isExpanded : undefined}
                          tabIndex={isMista ? 0 : undefined}
                          onClick={() => {
                            if (isMista) setExpandedInboundLt((current) => (current === row.lt ? "" : row.lt));
                          }}
                          onKeyDown={(event) => {
                            if (!isMista || (event.key !== "Enter" && event.key !== " ")) return;
                            event.preventDefault();
                            setExpandedInboundLt((current) => (current === row.lt ? "" : row.lt));
                          }}
                        >
                          <td>
                            <span className="inbound-lt-cell">
                              {isMista && <span className="inbound-expand-icon">{isExpanded ? "-" : "+"}</span>}
                              {row.lt}
                            </span>
                          </td>
                          <td><span className={`status-cell ${row.processo === "Em Doca" ? "loading" : "arrived"}`}>{row.processo}</span></td>
                          <td><span className={`inbound-type ${row.tipoCarga.toLowerCase()}`}>{row.tipoCarga}</span></td>
                          <td>{row.placa}</td>
                          <td>{row.origem}</td>
                          <td>{row.doca}</td>
                          <td>{row.driver}</td>
                          <td>{row.turno}</td>
                          <td>{row.pendingInboundToPackType}</td>
                          <td>{row.toTotal}</td>
                          <td>{row.pendingInboundTo}</td>
                          <td className={row.tFilaMs > row.metaFilaMs ? "estouro-red col-fila" : "col-fila"}>{formatDuration(row.tFilaMs)}</td>
                          <td className="col-fila">{row.metaFilaFmt}</td>
                          <td className={row.tDocaMs > row.metaDocaMs ? "estouro-red col-doca" : "col-doca"}>{formatDuration(row.tDocaMs)}</td>
                          <td className="col-doca">{row.metaDocaFmt}</td>
                          <td className={row.tTotalMs > row.metaAwtMs ? "estouro-red col-total" : "col-total"}>{formatDuration(row.tTotalMs)}</td>
                          <td className="col-total">{row.metaAwtFmt}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="inbound-detail-row">
                            <td colSpan={17}>
                              <div className="inbound-mix-card">
                                <div className="inbound-mix-grid">
                                  <span>
                                    <small>TO Total</small>
                                    <b>{row.toTotal || "-"}</b>
                                  </span>
                                  <span>
                                    <small>Saca N/T</small>
                                    <b>{numberFormat(row.mixCounts.sacasNaoTransbordo)}</b>
                                  </span>
                                  <span>
                                    <small>Scut/Pall N/T</small>
                                    <b>{numberFormat(row.mixCounts.scuttleOuPalletNaoTransbordo)}</b>
                                  </span>
                                  <span>
                                    <small>Saca T</small>
                                    <b>{numberFormat(row.mixCounts.sacasTransbordo)}</b>
                                  </span>
                                  <span>
                                    <small>Scut/Pall T</small>
                                    <b>{numberFormat(row.mixCounts.scuttleOuPalletTransbordo)}</b>
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {!inboundRows.length && (
                    <tr>
                      <td colSpan={17}>Nenhum veiculo encontrado no Live Inbound.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === "programacao" && (
        <>
          <section className="card filter-card">
            <TextFilter label="LH Trip" value={progFilters.query} onChange={(value) => setProgFilters({ ...progFilters, query: value })} />
            <ListFilter
              label="Data (STD)"
              options={programacaoOptions.data}
              value={progFilters.data}
              onChange={(value) => setProgFilters({ ...progFilters, data: value })}
            />
            <ListFilter
              label="Horario (CPT)"
              options={programacaoOptions.hora}
              value={progFilters.hora}
              onChange={(value) => setProgFilters({ ...progFilters, hora: value })}
            />
            <ListFilter
              label="Turno"
              options={programacaoOptions.turno}
              value={progFilters.turno}
              onChange={(value) => setProgFilters({ ...progFilters, turno: value })}
            />
            <ListFilter
              label="Status"
              options={programacaoOptions.status}
              value={progFilters.status}
              onChange={(value) => setProgFilters({ ...progFilters, status: value })}
            />
            <ListFilter
              label="Station Code"
              options={programacaoOptions.station}
              value={progFilters.station}
              onChange={(value) => setProgFilters({ ...progFilters, station: value })}
            />
            <PageActions
              onClear={limparFiltrosProgramacao}
              onRefresh={forceRefreshPage}
              refreshDisabled={refreshPending}
            />
          </section>

          <SectionTitle title="Demanda consolidada por station" />
          <div className="station-grid">
            {stationCards.map((item) => {
              const stageInfo = stageByStation.get(item.station);
              return (
                <button
                  className={`station-card card ${progFilters.station === item.station ? "selected" : ""}`}
                  key={item.station}
                  onClick={() => setProgFilters({ ...progFilters, station: item.station })}
                  type="button"
                >
                  <span>{item.tipo}</span>
                  <strong>{item.station}</strong>
                  <small>Viagens | Posicoes</small>
                  <b>{item.qtd}</b>
                  <small className="station-positions">{numberFormat(item.posicoes)} posicoes</small>
                  {progFilters.station === item.station && (
                    <div className="std-list">
                      {Array.from(item.stds.entries())
                        .sort((a, b) => stdSortValue("", a[0]) - stdSortValue("", b[0]))
                        .slice(0, 8)
                        .map(([std, resumo]) => (
                          <em key={std}>STD {std} <b>{numberFormat(resumo.posicoes)} pos.</b></em>
                        ))}
                    </div>
                  )}
                  {progFilters.station === item.station && stageInfo && (
                    <div className="station-stage-detail">
                      <strong>Stage Out</strong>
                      <small>{numberFormat(stageInfo.tos)} TOs | {numberFormat(stageInfo.pacotes)} pacotes</small>
                      <div>
                        {Array.from(stageInfo.ruas.entries())
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4)
                          .map(([rua, qtd]) => (
                            <em key={rua}>{rua}: {numberFormat(qtd)}</em>
                          ))}
                      </div>
                      <div>
                        {Array.from(stageInfo.packs.entries())
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4)
                          .map(([pack, qtd]) => (
                            <em key={pack}>{pack}: {numberFormat(qtd)}</em>
                          ))}
                      </div>
                      {stageInfo.minimosAdo.size > 0 && <small>Minimo ADO: {Array.from(stageInfo.minimosAdo).slice(0, 3).join(" | ")}</small>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <section className="card panel">
            <div className="panel-head">
              <div className="panel-title">Fluxo de viagens programadas</div>
              <span className="count-pill">{numberFormat(filteredTrips.length)} registros</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>LH Trip Number</th>
                    <th>Status</th>
                    <th>On Time</th>
                    <th>Vehicle</th>
                    <th>STA</th>
                    <th>STD</th>
                    <th>ATA</th>
                    <th>ETD</th>
                    <th>Doca</th>
                    <th>Destino</th>
                    <th>Station</th>
                    <th>Motorista</th>
                    <th>Operador</th>
                    <th>Agencia</th>
                    <th>Classif.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((row) => (
                    <tr key={`${row.lh}-${row.std}-${row.station}`}>
                      <td>{row.lh}</td>
                      <td>
                        <span className={`status-cell ${statusClass(row.status)}`}>{row.status}</span>
                      </td>
                      <td>{row.ontime}</td>
                      <td>{row.vehicle}</td>
                      <td>{row.sta}</td>
                      <td>{row.std}</td>
                      <td>{row.ata}</td>
                      <td>{row.etd}</td>
                      <td>{row.dock}</td>
                      <td>{row.destino}</td>
                      <td>{row.station}</td>
                      <td>{row.driver}</td>
                      <td>{row.operator}</td>
                      <td>{row.agency}</td>
                      <td>{row.classif}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === "geral" && (
        <>
          <section className="card filter-card">
            <TextFilter label="LH Trip" value={geralFilters.query} onChange={(value) => setGeralFilters({ ...geralFilters, query: value })} />
            <ListFilter
              label="Data (STA/STD)"
              options={geralOptions.data}
              value={geralFilters.data}
              onChange={(value) => setGeralFilters({ ...geralFilters, data: value })}
            />
            <ListFilter
              label="Horario (STA/STD)"
              options={geralOptions.hora}
              value={geralFilters.hora}
              onChange={(value) => setGeralFilters({ ...geralFilters, hora: value })}
            />
            <ListFilter
              label="Turno"
              options={geralOptions.turno}
              value={geralFilters.turno}
              onChange={(value) => setGeralFilters({ ...geralFilters, turno: value })}
            />
            <ListFilter
              label="Status"
              options={geralOptions.status}
              value={geralFilters.status}
              onChange={(value) => setGeralFilters({ ...geralFilters, status: value })}
            />
            <ListFilter
              label="Station Code"
              options={geralOptions.station}
              value={geralFilters.station}
              onChange={(value) => setGeralFilters({ ...geralFilters, station: value })}
            />
            <PageActions
              onClear={limparFiltrosGeral}
              onRefresh={forceRefreshPage}
              refreshDisabled={refreshPending}
            />
          </section>

          <section className="grid kpis kpis-six">
            <Kpi label="Veiculos Docados" value={geralMetrics.kpis.docasOperando} />
            <Kpi label="CPT vencendo proximos 30 min" value={geralMetrics.kpis.limiteCpt} tone="red" />
            <Kpi label="Veiculos para chegar proximos 90min" value={geralMetrics.kpis.chegadasProximas} tone="blue" />
            <Kpi label="CPT atrasado" value={geralMetrics.kpis.atrasadasCpt} tone="orange" />
            <Kpi label="Aguardando" value={geralMetrics.kpis.aguardando} tone="blue" />
          </section>

          <section className="grid geral-grid">
            <div className="card panel">
              <div className="panel-title">Distribuicao de docas</div>
              <div className="donut-wrap">
                <div
                  className="donut"
                  style={{ background: `conic-gradient(var(--orange) 0 ${activeDocas * 12}deg, #10b981 ${activeDocas * 12}deg 360deg)` }}
                />
                <strong>Ativas: {activeDocas} / {docas.length}</strong>
              </div>
            </div>

            <div className="card panel">
              <div className="panel-title">Demanda por hora (CPTO / STD)</div>
              <div className="demand-chart refined">
                {geralMetrics.demanda.map((row) => (
                  <div className="demand-col" key={row.hora} tabIndex={0} title={`Hora ${row.hora} | LH Trip Number: ${numberFormat(row.qtd)}`}>
                    <span>{row.qtd}</span>
                    <div style={{ height: `${Math.max((row.qtd / maxDemand) * 150, row.qtd ? 12 : 2)}px` }} />
                    <div className="hist-chart-tooltip" role="tooltip">
                      <div><span>Hora</span><b>{row.hora}</b></div>
                      <div><span>LH Trips</span><b>{numberFormat(row.qtd)}</b></div>
                    </div>
                    <small>{row.hora}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid section-grid">
            <div className="card panel">
              <div className="panel-head">
                <div className="panel-title">Monitor CPT (60 min)</div>
              </div>
              <div className="list">
                {geralMetrics.monitorCpt.length ? (
                  geralMetrics.monitorCpt.map((item) => (
                    <div className={`item cpt-item ${item.minutos < 30 ? "danger" : ""}`} key={item.lh}>
                      <span className={`badge ${item.minutos < 30 ? "red" : "amber"}`}>{item.minutos} min</span>
                      <div className="item-title">{item.destino}</div>
                      <div className="item-meta">{item.lh} - CPT {item.cpt}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-ok">Sem CPT nos proximos 60 minutos.</div>
                )}
              </div>
            </div>

            <div className="card panel">
              <div className="panel-head">
                <div className="panel-title">Ocupacao critica (tos_packed)</div>
              </div>
              <OcupacaoList rows={geralOcupacaoCritica} />
            </div>
          </section>
        </>
      )}

      {tab === "stage" && (
        <>
          <section className="card filter-card stage-filter">
            <ListFilter label="Rua" options={stageOptions.rua} value={stageFilters.rua} onChange={(value) => setStageFilters({ ...stageFilters, rua: value })} />
            <ListFilter
              label="Station Code"
              options={stageOptions.station}
              value={stageFilters.station}
              onChange={(value) => setStageFilters({ ...stageFilters, station: value })}
            />
            <PageActions
              onClear={() => setStageFilters({ rua: "", station: "" })}
              onRefresh={forceRefreshPage}
              refreshDisabled={refreshPending}
            />
          </section>

          <section className="grid kpis">
            <Kpi label="TOs total packed" value={numberFormat(stageKpis.totalTos)} />
            <Kpi label="Pacotes" value={numberFormat(stageKpis.pacotes)} tone="green" />
            <Kpi label="Ruas ocupadas" value={numberFormat(stageKpis.ruas)} tone="blue" />
            <Kpi label="Transbordo" value={numberFormat(stageKpis.transbordo)} tone="orange" />
          </section>

          <section className="card panel">
            <div className="panel-title">Pack_Name</div>
            <div className="pack-chart">
              {packChart.map((item) => (
                <div className="pack-bar" key={item.nome} tabIndex={0} title={`${item.nome} | Quantidade: ${numberFormat(item.qtd)}`}>
                  <span>{item.nome}</span>
                  <div className="bar-track">
                    <div className="bar-fill blue-fill" style={{ width: `${(item.qtd / maxPack) * 100}%` }} />
                  </div>
                  <strong>{numberFormat(item.qtd)}</strong>
                  <div className="hist-chart-tooltip" role="tooltip">
                    <div><span>Pack</span><b>{item.nome}</b></div>
                    <div><span>TOs</span><b>{numberFormat(item.qtd)}</b></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card panel">
            <StageList
              rows={filteredStage}
              selectedRua={selectedStageRua}
              onSelectRua={(rua) => setSelectedStageRua(selectedStageRua === rua ? "" : rua)}
            />
          </section>
        </>
      )}

      {tab === "docas" && (
        <>
          <section className="dock-summary">
            <MiniSummary label="Total" value={docas.length} />
            <MiniSummary label="Livres" value={docas.filter((dock) => dock.status === "LIVRE").length} tone="green" />
            <MiniSummary label="Carregando" value={docas.filter((dock) => dock.status === "CARREGANDO").length} tone="orange" />
            <MiniSummary label="Espera" value={docas.filter((dock) => dock.status === "ESPERA").length} tone="blue" />
          </section>
          <section className="dock-grid">
            {docas.map((dock) => (
              <div className={`dock-card card ${dock.status.toLowerCase()}`} key={dock.nome}>
                <div className="dock-top">
                  <span>Doca</span>
                  <b>{dock.numero}</b>
                  <em>{dock.status}</em>
                </div>
                <div className="dock-trip">{dock.trip || "-"}</div>
                <div className="dock-destino">{dock.destino || "Sem viagem alocada"}</div>
                <div className="dock-details">
                  <span>STD: {dock.std}</span>
                  <span>Vehicle: {dock.vehicle || "-"}</span>
                  <span>TO Packed: {dock.toPacked}</span>
                  <span>TO Loaded: {dock.toLoaded}</span>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {tab === "contagem" && (
        <>
          <section className="grid kpis">
            <Kpi label="Destinos" value={contagem.kpis.destinos} />
            <Kpi label="Pacotes" value={numberFormat(contagem.kpis.pacotes)} tone="orange" />
            <Kpi label="TOs" value={numberFormat(contagem.kpis.tos)} />
            <Kpi label="Criticos" value={contagem.kpis.criticos} tone="red" />
          </section>
          <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {contagem.destinos.map((item) => (
              <div
                className="card panel"
                key={item.station}
                title={`${item.nome} | Ocupacao: ${item.ocupacao}% | Paletes: ${item.paletes}/${item.capacidade} | Pacotes: ${numberFormat(item.pacotes)}`}
              >
                <div className="item-title">{item.nome}</div>
                <div className="item-meta">{item.paletes}/{item.capacidade} PLT - {item.pacotes} pacotes</div>
                <div className="bar-track" style={{ marginTop: 12 }}>
                  <div className="bar-fill" style={{ width: `${Math.min(item.ocupacao, 100)}%` }} />
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {tab === "inteligencia" && (
        <>
          <section className="grid kpis">
            <Kpi label="Alertas ativos" value={inteligencia.resumo.totalInsights} />
            <Kpi label="Alta prioridade" value={inteligencia.resumo.alta} tone="red" />
            <Kpi label="Media prioridade" value={inteligencia.resumo.media} tone="orange" />
            <Kpi
              label="Baixa prioridade"
              value={Math.max(inteligencia.resumo.totalInsights - inteligencia.resumo.alta - inteligencia.resumo.media, 0)}
              tone="blue"
            />
          </section>
          <section className="grid section-grid">
            <div className="card panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Alertas e acoes sugeridas</div>
                  <div className="item-meta">Gerado em {inteligencia.geradoEm}</div>
                </div>
                <span className="count-pill">{numberFormat(inteligencia.insights.length)} insights</span>
              </div>
              <div className="list">
                {inteligencia.insights.map((item) => (
                  <div className={`item ${item.prioridade === "Alta" ? "cpt-item danger" : ""}`} key={item.id}>
                    <span className={`badge ${item.prioridade === "Alta" ? "red" : item.prioridade === "Media" ? "amber" : "blue"}`}>
                      {item.prioridade}
                    </span>
                    <div className="item-title">{item.titulo}</div>
                    <div className="item-meta">{item.insight}</div>
                    <div className="item-meta"><strong>Acao:</strong> {item.acao}</div>
                  </div>
                ))}
                {inteligencia.insights.length === 0 && <div className="empty-state">Sem alertas relevantes no momento.</div>}
              </div>
            </div>
            <div className="card panel">
              <div className="panel-title">Resumo operacional</div>
              <div className="list">
                <div className="item">
                  <span className="badge red">{geralMetrics.kpis.atrasadasCpt}</span>
                  <div className="item-title">CPT atrasado</div>
                  <div className="item-meta">Viagens nao expedidas com STD vencido.</div>
                </div>
                <div className="item">
                  <span className="badge amber">{painel.kpis.limiteCpt}</span>
                  <div className="item-title">CPT proximos 30 min</div>
                  <div className="item-meta">Viagens que precisam de acao imediata.</div>
                </div>
                <div className="item">
                  <span className="badge blue">{painel.ocupacaoCritica.filter((item) => item.percentual >= 60).length}</span>
                  <div className="item-title">Stations criticas</div>
                  <div className="item-meta">Stations com concentracao elevada em tos_packed.</div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
        </section>
      </div>
    </main>
  );
}

function TextFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} placeholder="TODOS" value={value} />
    </label>
  );
}

function ListFilter({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  const id = `${label.replace(/\W+/g, "-")}-${options.length}`;
  return (
    <label className="filter-field">
      <span>{label}</span>
      <input list={id} onChange={(event) => onChange(event.target.value)} placeholder="TODOS" value={value} />
      <datalist id={id}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

function SelectFilter({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {!options.length && <option value="">Sem opcoes</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div className="section-title">{title}</div>;
}

function Kpi({ label, value, tone }: { label: string; value: number | string; tone?: "orange" | "red" | "green" | "blue" }) {
  return (
    <div className={`card kpi ${tone ?? ""}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function RawKpi({
  icon,
  label,
  sub,
  tone,
  value
}: {
  icon: string;
  label: string;
  sub: string;
  tone?: "orange" | "red" | "green";
  value: string;
}) {
  return (
    <div className="card raw-kpi">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
      <i className={tone ?? ""}>{icon}</i>
    </div>
  );
}

function ProductivitySummaryCard({
  label,
  resumo
}: {
  label: string;
  resumo: { real: number; metaAtual: number; metaTurno: number; eficiencia: number };
}) {
  return (
    <div className="productivity-summary-card">
      <div className="productivity-summary-title">{label}</div>
      <small>Meta atual</small>
      <strong>{numberFormat(Math.round(resumo.metaAtual))}</strong>
      <small>Meta turno</small>
      <strong>{numberFormat(Math.round(resumo.metaTurno))}</strong>
      <small>Real</small>
      <strong>{numberFormat(Math.round(resumo.real))}</strong>
      <b className={`productivity-percent ${productivityTone(resumo.eficiencia)}`}>{resumo.eficiencia.toFixed(1)}%</b>
    </div>
  );
}

function ProductivityHourChart({ hours }: { hours: Array<{ hora: string; real: number; meta: number; gap: number; eficiencia: number }> }) {
  const maxValue = Math.max(1, ...hours.map((hour) => Math.max(hour.real, hour.meta)));
  const metaPoints = hours
    .map((hour, index) => {
      const x = hours.length > 1 ? (index / (hours.length - 1)) * 100 : 50;
      const y = 150 - Math.min(150, (hour.meta / maxValue) * 150);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div className="productivity-hour-chart">
      <div className="productivity-chart-bars">
        <svg className="productivity-meta-line" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={metaPoints} />
        </svg>
        {hours.map((hour) => {
          const gap = Math.round(hour.gap);
          const tooltipGap = `${gap >= 0 ? "+" : ""}${numberFormat(gap)}`;
          const tooltip = `Hora ${hour.hora}. Real ${numberFormat(Math.round(hour.real))}. Meta hora ${numberFormat(
            Math.round(hour.meta)
          )}. Diferenca ${tooltipGap}. Cumprimento ${hour.eficiencia.toFixed(1)}%.`;

          return (
            <div className="productivity-hour" key={hour.hora} tabIndex={0} aria-label={tooltip}>
              <div className="productivity-hour-plot">
                <span className="productivity-meta-dot" style={{ bottom: `${Math.min(100, (hour.meta / maxValue) * 100)}%` }}>
                  {hour.meta > 0 ? numberFormat(Math.round(hour.meta)) : ""}
                </span>
                <div className="productivity-bar" style={{ height: `${Math.max(3, (hour.real / maxValue) * 100)}%` }}>
                  <span>{hour.real > 0 ? numberFormat(Math.round(hour.real)) : ""}</span>
                </div>
              </div>
              <div className="productivity-tooltip" role="tooltip">
                <div><span>Hora</span><b>{hour.hora}</b></div>
                <div><span>Real</span><b>{numberFormat(Math.round(hour.real))}</b></div>
                <div><span>Meta hora</span><b>{numberFormat(Math.round(hour.meta))}</b></div>
                <div><span>Diferenca</span><b className={gap >= 0 ? "positive" : "negative"}>{tooltipGap}</b></div>
                <div><span>Cumprimento</span><b>{hour.eficiencia.toFixed(1)}%</b></div>
              </div>
              <b>{hour.hora}</b>
              <small className={hour.gap >= 0 ? "positive" : "negative"}>{numberFormat(Math.round(hour.gap))}</small>
              <small className={productivityTone(hour.eficiencia)}>{Math.round(hour.eficiencia)}%</small>
            </div>
          );
        })}
      </div>
      <div className="productivity-legend"><span>Real</span><span>Meta</span></div>
    </div>
  );
}

function ProductivityGauge({ value }: { value: number }) {
  const percent = Math.max(0, Math.min(110, value));
  const gaugeStyle = { "--gauge-value": percent } as CSSProperties;
  return (
    <div className="productivity-gauge">
      <div className={`gauge-arc ${productivityTone(value)}`} style={gaugeStyle} />
      <div className="gauge-label">% Eficiencia</div>
      <strong>{Math.round(value)}%</strong>
      <div className="gauge-scale"><span>0%</span><span>110%</span></div>
    </div>
  );
}

function ProductivityBeltCard({
  belt,
  turnFilter
}: {
  belt: {
    esteira: string;
    real: number;
    metaAtual: number;
    metaTurno: number;
    eficiencia: number;
    hours: Array<{ hora: string; real: number; meta: number; gap: number; eficiencia: number }>;
    atividades: Array<{ nome: string; qtd: number }>;
    operadores: Array<{ nome: string; qtd: number }>;
    estacoes: Array<{ nome: string; qtd: number }>;
  };
  turnFilter: ProductivitySmallTurnFilter;
}) {
  const currentTurnHours = filterProductivityTurnHours(belt.hours, turnFilter);
  const hasTurnData = currentTurnHours.some((hour) => hour.real > 0 || hour.meta > 0);

  return (
    <div className="card productivity-belt-card">
      <div className="productivity-belt-head">
        <div>
          <span className="mini-alert">!</span>
          <b>{belt.esteira}</b>
        </div>
        <small>
          Real: {numberFormat(Math.round(belt.real))}
          <br />
          Meta ate o momento atual: {numberFormat(Math.round(belt.metaAtual))}
          <br />
          Meta turno: {numberFormat(Math.round(belt.metaTurno))}
        </small>
      </div>
      <div className="productivity-belt-body">
        <ProductivityGauge value={belt.eficiencia} />
        <div>
          {hasTurnData ? (
            <ProductivityHourChart hours={currentTurnHours} />
          ) : (
            <div className="productivity-empty-turn">Sem dados para o turno selecionado</div>
          )}
        </div>
      </div>
    </div>
  );
}

function InboundMetric({
  label,
  value,
  meta,
  sub,
  tone
}: {
  label: string;
  value: string;
  meta?: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className={`card inbound-metric ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {meta && <small>{meta}</small>}
      {sub && <em>{sub}</em>}
    </div>
  );
}

function StageInDashboard({
  arrivedRows,
  filters,
  origins,
  setFilters,
  unsealRows
}: {
  arrivedRows: InboundRuntimeRow[];
  filters: {
    arrivedLt: string;
    arrivedOrigem: string;
    unsealLt: string;
    unsealOrigem: string;
  };
  origins: string[];
  setFilters: Dispatch<
    SetStateAction<{
      arrivedLt: string;
      arrivedOrigem: string;
      unsealLt: string;
      unsealOrigem: string;
    }>
  >;
  unsealRows: InboundRuntimeRow[];
}) {
  return (
    <section className="stage-in-page">
      <StageInPanel
        badgeTone="blue"
        filters={filters}
        kind="arrived"
        origins={origins}
        rows={arrivedRows}
        setFilters={setFilters}
        title="Carros em Arrived"
      />
      <StageInPanel
        badgeTone="orange"
        filters={filters}
        kind="unseal"
        origins={origins}
        rows={unsealRows}
        setFilters={setFilters}
        title="Carros em Unseal"
      />
    </section>
  );
}

function StageInPanel({
  badgeTone,
  filters,
  kind,
  origins,
  rows,
  setFilters,
  title
}: {
  badgeTone: "blue" | "orange";
  filters: {
    arrivedLt: string;
    arrivedOrigem: string;
    unsealLt: string;
    unsealOrigem: string;
  };
  kind: "arrived" | "unseal";
  origins: string[];
  rows: InboundRuntimeRow[];
  setFilters: Dispatch<
    SetStateAction<{
      arrivedLt: string;
      arrivedOrigem: string;
      unsealLt: string;
      unsealOrigem: string;
    }>
  >;
  title: string;
}) {
  const ltKey = kind === "arrived" ? "arrivedLt" : "unsealLt";
  const origemKey = kind === "arrived" ? "arrivedOrigem" : "unsealOrigem";
  const clusters =
    kind === "arrived"
      ? stageInCluster(rows, "tFilaMs", [
          { label: "Ate 2h", min: 0, max: 2 },
          { label: "2h a 4h", min: 2, max: 4 },
          { label: "4h a 6h", min: 4, max: 6 },
          { label: "6h a 8h", min: 6, max: 8 },
          { label: "8h a 10h", min: 8, max: 10 },
          { label: "10h a 12h", min: 10, max: 12 },
          { label: "Mais 12h", min: 12, max: Infinity }
        ])
      : stageInCluster(rows, "tDocaMs", [
          { label: "Ate 30 Min", min: 0, max: 0.5 },
          { label: "30m a 1h", min: 0.5, max: 1 },
          { label: "1h a 1h30", min: 1, max: 1.5 },
          { label: "1h30 a 2h", min: 1.5, max: 2 },
          { label: "2h a 3h", min: 2, max: 3 },
          { label: "3h a 4h", min: 3, max: 4 },
          { label: "Mais 4h", min: 4, max: Infinity }
        ]);
  const avgField = kind === "arrived" ? "tFilaMs" : "tDocaMs";
  const tableRows = rows.slice(0, 12);
  const totalRows = Array.isArray(rows) ? rows.length : 0;

  return (
    <div className="card stage-in-panel">
      <div className="stage-in-filters">
        <TextFilter
          label="Filtrar por LT"
          value={filters[ltKey]}
          onChange={(value) => setFilters((current) => ({ ...current, [ltKey]: value }))}
        />
        <ListFilter
          label="Origem"
          options={origins}
          value={filters[origemKey]}
          onChange={(value) => setFilters((current) => ({ ...current, [origemKey]: value }))}
        />
      </div>

      <div className="stage-in-title">
        <h2>{title}</h2>
        <span className={`stage-in-badge ${badgeTone}`}>{numberFormat(totalRows)}</span>
      </div>

      <div className="stage-in-grid">
        <div className="stage-in-left">
          <div className="stage-in-mini-grid">
            <StageInMini label="Reversa" value={stageInOriginCount(rows, "REV")} />
            <StageInMini label="SP8" value={stageInOriginCount(rows, "SP8")} />
            <StageInMini label="Sem Sacas" value={countByPredicate(rows, (row) => inboundSacas(row) === 0)} />
            <StageInMini label="RJ2" value={stageInOriginCount(rows, "RJ2")} />
          </div>
          <StageInMini wide label="Ate 50 Sacas" value={countByPredicate(rows, (row) => inboundToSaca(row) > 0 && inboundToSaca(row) <= 50)} />
          <StageInMini wide label="Entre 50 e 100 Sacas" value={countByPredicate(rows, (row) => inboundToSaca(row) > 50 && inboundToSaca(row) <= 100)} />
          <StageInMini wide label="Entre 100 e 200 Sacas" value={countByPredicate(rows, (row) => inboundToSaca(row) > 100 && inboundToSaca(row) <= 200)} />
          <StageInMini wide label="Mais que 200 Sacas" value={countByPredicate(rows, (row) => inboundToSaca(row) > 200)} />
        </div>

        <div className="stage-in-middle">
          <StageInMini label="P/M" value={rows.reduce((sum, row) => sum + inboundPerfilPM(row), 0)} />
          <StageInMini label="G" value={rows.reduce((sum, row) => sum + (row.inboundMetrics?.contagemIdGNaoTransbordo ?? 0), 0)} />
          <StageInMini label="Bulky" value={rows.reduce((sum, row) => sum + (row.inboundMetrics?.contagemIdBulkyOrUltrabulkyNaoTransbordo ?? 0), 0)} />
        </div>

        <div className="stage-in-packages">
          <StageInMini label="Saca Transbordo (TOs)" value={rows.reduce((sum, row) => sum + row.mixCounts.sacasTransbordo, 0)} />
          <StageInMini label="Saca Transbordo (Pcts)" value={rows.reduce((sum, row) => sum + (row.inboundMetrics?.contagemIdsSacasTransbordo ?? 0), 0)} />
          <StageInMini label="Saca Esteira (TOs)" value={rows.reduce((sum, row) => sum + row.mixCounts.sacasNaoTransbordo, 0)} />
          <StageInMini label="Saca Esteira (Pcts)" value={rows.reduce((sum, row) => sum + (row.inboundMetrics?.contagemIdsSacasNaoTransbordo ?? 0), 0)} />
          <StageInMini label="Scuttle / Pallet (TOs)" value={rows.reduce((sum, row) => sum + inboundScuttlePalletTos(row), 0)} />
          <StageInMini label="Scuttle / Pallet (Pcts)" value={rows.reduce((sum, row) => sum + inboundScuttlePalletPackages(row), 0)} />
        </div>

        <div className="stage-in-clusters">
          <div className="stage-in-cluster-title">{kind === "arrived" ? "Clusters Fila" : "Clusters Doca"}</div>
          {clusters.map((cluster, index) => (
            <div className={`stage-in-cluster ${index === 0 ? "ok" : index < 3 ? "warn" : "risk"}`} key={cluster.label}>
              <span>{cluster.label}</span>
              <strong>{numberFormat(cluster.qtd)}</strong>
              <small>({cluster.pct}%)</small>
            </div>
          ))}
        </div>
      </div>

      <div className="stage-in-big-kpis">
        <div>
          <span>{kind === "arrived" ? "Carros em Fila" : "Carros em Doca"}</span>
          <strong>{numberFormat(rows.length)}</strong>
        </div>
        <div>
          <span>{kind === "arrived" ? "Tempo de Fila" : "Tempo em Doca"}</span>
          <strong>{formatDuration(avgDuration(rows, avgField))}</strong>
        </div>
        {kind === "unseal" && (
          <div>
            <span>Tempo Total</span>
            <strong>{formatDuration(avgDuration(rows, "tTotalMs"))}</strong>
          </div>
        )}
      </div>

      <div className="table-wrap stage-in-table">
        <table>
          <thead>
            <tr>
              <th>LT</th>
              <th>Placa</th>
              <th>Origem</th>
              <th>Horario do Status</th>
              <th>Chamadas</th>
              <th>{kind === "arrived" ? "Tempo em Fila" : "Tempo em Doca"}</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={`${row.lt}-${row.placa}-${row.status}`}>
                <td>{row.lt}</td>
                <td>{row.placa}</td>
                <td>{row.origem}</td>
                <td>{row.tsUpdate ? new Date(row.tsUpdate).toLocaleString("pt-BR") : row.tsQueue ? new Date(row.tsQueue).toLocaleString("pt-BR") : "-"}</td>
                <td><span className="inbound-call-pill">1x</span></td>
                <td>
                  <span className={row[avgField] > (kind === "arrived" ? row.metaFilaMs : row.metaDocaMs) ? "time-chip danger" : "time-chip"}>
                    {formatDuration(row[avgField])}
                  </span>
                </td>
              </tr>
            ))}
            {!tableRows.length && (
              <tr>
                <td colSpan={6}>Sem carros para os filtros selecionados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StageInMini({ label, value, wide = false }: { label: string; value: number; wide?: boolean }) {
  return (
    <div className={`stage-in-mini ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{numberFormat(value)}</strong>
    </div>
  );
}

function MiniSummary({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className={`card mini-summary ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PackIcon({ kind }: { kind: string }) {
  if (kind === "volumoso") {
    return (
      <svg aria-hidden="true" className="pack-svg volumoso" fill="none" viewBox="0 0 32 32">
        <path d="M6 11.5 16 6l10 5.5v10.8L16 28 6 22.3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.1" />
        <path d="M6.5 12 16 17.4 25.5 12M16 17.5V28" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <path d="M12.2 21.7h7.6l-.8-4.2a2 2 0 0 0-2-1.7h-2a2 2 0 0 0-2 1.7Zm2.9-5.8c0-1 .7-1.7 1.6-1.7s1.6.7 1.6 1.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.55" />
      </svg>
    );
  }

  if (kind === "saca") {
    return (
      <svg aria-hidden="true" className="pack-svg saca" fill="none" viewBox="0 0 32 32">
        <path d="M11 10c.4-2.6 2.2-4 5-4s4.6 1.4 5 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M9 11h14l2 14.5A2.2 2.2 0 0 1 22.8 28H9.2A2.2 2.2 0 0 1 7 25.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.2" />
        <path d="M12 17h8M12 21h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={`pack-svg ${kind === "scuttle" ? "scuttle" : "pallet"}`} fill="none" viewBox="0 0 32 32">
      <rect height="10" rx="1.5" stroke="currentColor" strokeWidth="2.2" width="22" x="5" y="9" />
      <path d="M7 13h20M7 17h20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M8 22h4M14 22h4M20 22h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
      <path d="M9 20v4M23 20v4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function StageList({ rows, selectedRua, onSelectRua }: { rows: StageRow[]; selectedRua: string; onSelectRua: (rua: string) => void }) {
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        rua: string;
        corredor: string;
        tos: number;
        pacotes: number;
        packed: number;
        packing: number;
        stations: Set<string>;
        areas: Set<string>;
        packs: Map<string, number>;
        packPacotes: Map<string, number>;
        itens: Array<{
          toNumber?: string;
          station: string;
          area?: string;
          packName: string;
          tos: number;
          pacotes: number;
          status: string;
          ilha: string;
          cage?: string;
          stagedDuration?: string;
          transbordo?: string;
          spp?: number;
        }>;
      }
    >();
    rows.forEach((row) => {
      const corredor = row.rua.match(/[A-Za-z]+/)?.[0]?.toUpperCase() ?? "OUTROS";
      const current = map.get(row.rua) ?? {
        rua: row.rua,
        corredor,
        tos: 0,
        pacotes: 0,
        packed: 0,
        packing: 0,
        stations: new Set<string>(),
        areas: new Set<string>(),
        packs: new Map<string, number>(),
        packPacotes: new Map<string, number>(),
        itens: []
      };
      current.tos += row.tos;
      current.pacotes += row.pacotes;
      current.packed += row.packed;
      current.packing += row.packing;
      current.stations.add(row.station);
      if (row.area) current.areas.add(row.area);
      current.packs.set(row.packName, (current.packs.get(row.packName) ?? 0) + row.tos);
      current.packPacotes.set(row.packName, (current.packPacotes.get(row.packName) ?? 0) + row.pacotes);
      current.itens.push({
        toNumber: row.toNumber,
        station: row.station,
        area: row.area,
        packName: row.packName,
        tos: row.tos,
        pacotes: row.pacotes,
        status: row.status,
        ilha: row.ilha,
        cage: row.cage,
        stagedDuration: row.stagedDuration,
        transbordo: row.transbordo,
        spp: row.spp
      });
      map.set(row.rua, current);
    });
    return Array.from(map.values()).sort((a, b) => a.corredor.localeCompare(b.corredor) || a.rua.localeCompare(b.rua));
  }, [rows]);
  const selectedItem = grouped.find((item) => item.rua === selectedRua) ?? null;
  const ruaRange = grouped.length ? `${grouped[0].rua} a ${grouped[grouped.length - 1].rua}` : "-";

  const packIcon = (pack: string) => {
    const normalized = pack.toUpperCase();
    if (normalized.includes("SACA")) return "saca";
    if (normalized.includes("SCUTTLE")) return "scuttle";
    if (normalized.includes("VOLUMOSO")) return "volumoso";
    return "pallet";
  };

  const dominantPack = (packs: Map<string, number>) => {
    return Array.from(packs.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  };

  const durationValue = (value?: string) => {
    const match = String(value ?? "").replace(",", ".").match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : null;
  };

  const formatHours = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return "-";
    return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h`;
  };

  const averageDuration = (values: Array<{ stagedDuration?: string }>) => {
    const durations = values.map((value) => durationValue(value.stagedDuration)).filter((value): value is number => value !== null);
    if (!durations.length) return null;
    return durations.reduce((sum, value) => sum + value, 0) / durations.length;
  };

  const maxDuration = (values: Array<{ stagedDuration?: string }>) => {
    const durations = values.map((value) => durationValue(value.stagedDuration)).filter((value): value is number => value !== null);
    return durations.length ? Math.max(...durations) : null;
  };

  const formatSpp = (pacotes: number, tos: number) => {
    if (!tos) return "-";
    return (pacotes / tos).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  };

  return (
    <div className="street-map-shell">
      <div className="street-map-top">
        <div className="street-title">
          <span className="street-main-icon">#</span>
          <div>
            <small>Mapa</small>
            <strong>Mapa de streets (ruas)</strong>
          </div>
        </div>
        <div className="street-toolbar" aria-label="Legenda do mapa">
          <span className="legend-chip"><PackIcon kind="pallet" />Pallet</span>
          <span className="legend-chip"><PackIcon kind="saca" />Saca</span>
          <span className="legend-chip"><PackIcon kind="scuttle" />Scuttle</span>
          <span className="legend-chip"><PackIcon kind="volumoso" />Volumoso</span>
          <span className="time-chip neutral">0-3h</span>
          <span className="time-chip neutral">3-12h</span>
          <span className="time-chip blue">12-24h</span>
          <span className="time-chip orange">24-48h</span>
          <span className="time-chip red">48-72h</span>
          <span className="time-chip critical">&gt;72h critico</span>
        </div>
      </div>

      <div className="street-line-card">
        <div className="street-line-head">
          <div>
            <small>Linha 1</small>
            <strong>{ruaRange}</strong>
          </div>
          <span>{grouped.length} ruas</span>
        </div>

        <div className="street-board">
          {grouped.map((item) => {
            const slots = [...item.itens]
              .sort((a, b) => (durationValue(b.stagedDuration) ?? -1) - (durationValue(a.stagedDuration) ?? -1) || b.pacotes - a.pacotes)
              .slice(0, 80);
            const pack = dominantPack(item.packs);
            const area = Array.from(item.areas).join(" | ") || Array.from(item.stations).slice(0, 2).join(" | ") || "-";
            const spp = formatSpp(item.pacotes, item.tos);
            const media = formatHours(averageDuration(item.itens));
            const maximo = formatHours(maxDuration(item.itens));
            const ruaLabel = [
              `Rua: ${item.rua}`,
              `Area: ${area}`,
              `TOs: ${item.tos}`,
              `Pacotes: ${item.pacotes}`,
              `SPP: ${spp}`,
              `Media: ${media}`,
              `Maximo: ${maximo}`,
              "Pack name:",
              ...Array.from(item.packs.entries()).map(
                ([packName, qtd]) => `${packName}: ${qtd} TOs | ${numberFormat(item.packPacotes.get(packName) ?? 0)} pacotes`
              )
            ].join("\n");
            return (
              <div
                aria-label={ruaLabel}
                className={`street-column ${selectedRua === item.rua ? "selected" : ""}`}
                key={item.rua}
                onClick={() => onSelectRua(item.rua)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") onSelectRua(item.rua);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="street-column-head">
                  <strong>{item.rua}</strong>
                  <small>{area}</small>
                  <b>{numberFormat(item.tos)} TOs | {numberFormat(item.pacotes)} pacotes | SPP {spp}</b>
                </div>
                <div className="street-stack">
                  {slots.map((slot, index) => (
                    <button
                      aria-label={[
                        `TO: ${slot.toNumber || "-"}`,
                        `Rua: ${item.rua}`,
                        `Pacotes: ${slot.pacotes}`,
                        `Pack: ${slot.packName}`,
                        `Cage: ${slot.cage || "-"}`,
                        `Staged Duration: ${slot.stagedDuration || "-"}`,
                        `Transbordo: ${slot.transbordo || "Nao"}`
                      ].join("\n")}
                      className={`street-slot ${packIcon(slot.packName)}`}
                      key={`${slot.station}-${slot.packName}-${index}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectRua(item.rua);
                      }}
                      type="button"
                    >
                      <PackIcon kind={packIcon(slot.packName)} />
                      <span>{numberFormat(slot.pacotes || slot.tos)}</span>
                    </button>
                  ))}
                  {!slots.length && <div className="street-empty-slot">-</div>}
                </div>
                <div className="street-column-base" />
              </div>
            );
          })}

          {selectedItem && (
            <div className="street-detail-card">
              <button className="street-close" onClick={() => onSelectRua(selectedItem.rua)} type="button">x</button>
              <div className="street-detail-top">
                <PackIcon kind={packIcon(dominantPack(selectedItem.packs))} />
                <div>
                  <small>TO selecionada</small>
                  <strong>{selectedItem.rua}</strong>
                </div>
              </div>
              <div className="street-detail-grid">
                <span><small>Pacotes</small><b>{numberFormat(selectedItem.pacotes)}</b></span>
                <span><small>TOs</small><b>{numberFormat(selectedItem.tos)}</b></span>
                <span><small>SPP</small><b>{formatSpp(selectedItem.pacotes, selectedItem.tos)}</b></span>
                <span><small>Media</small><b>{formatHours(averageDuration(selectedItem.itens))}</b></span>
                <span><small>Maximo</small><b>{formatHours(maxDuration(selectedItem.itens))}</b></span>
                <span><small>Stations</small><b>{selectedItem.stations.size}</b></span>
              </div>
              <div className="street-detail-area">
                <small>Area</small>
                <strong>{Array.from(selectedItem.areas).join(" | ") || Array.from(selectedItem.stations).slice(0, 4).join(" | ") || "-"}</strong>
              </div>
              <div className="street-detail-packs">
                {Array.from(selectedItem.packs.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([packName, qtd]) => (
                  <div className="pack-line" key={packName}>
                    <small>{packName}</small>
                    <b>{numberFormat(qtd)} TOs | {numberFormat(selectedItem.packPacotes.get(packName) ?? 0)} pct</b>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!grouped.length && <div className="empty-ok">Nenhuma rua encontrada para os filtros aplicados.</div>}
        </div>
      </div>
    </div>
  );
}

function OcupacaoList({ rows }: { rows: Array<{ station: string; tos: number; percentual: number; nivel: string; packs?: Array<{ nome: string; qtd: number }> }> }) {
  return (
    <div className="list">
      {rows.map((item) => (
        <div
          className="item"
          key={item.station}
          tabIndex={0}
          title={`${item.station} | TOs: ${numberFormat(item.tos)} | Ocupacao: ${numberFormat(item.percentual)}%`}
        >
          <div className="item-title">{item.station}</div>
          <div className="item-meta">{numberFormat(item.tos)} TO Number - {item.packs?.length ?? 0} Pack_Name</div>
          <div className="bar-track" style={{ marginTop: 10 }}>
            <div className={`bar-fill ${item.nivel === "critico" ? "red-fill" : item.nivel === "alerta" ? "green-fill" : ""}`} style={{ width: `${Math.min(item.percentual, 100)}%` }} />
          </div>
          {item.packs?.slice(0, 4).map((pack) => (
            <div className="pack-line compact" key={pack.nome}>
              <small>{pack.nome}</small>
              <b>{numberFormat(pack.qtd)}</b>
            </div>
          ))}
          <div className="hist-chart-tooltip" role="tooltip">
            <div><span>Station</span><b>{item.station}</b></div>
            <div><span>TOs</span><b>{numberFormat(item.tos)}</b></div>
            <div><span>Ocupacao</span><b>{numberFormat(item.percentual)}%</b></div>
          </div>
        </div>
      ))}
    </div>
  );
}
