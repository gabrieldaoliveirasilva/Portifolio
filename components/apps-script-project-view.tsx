"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AppsScriptProjectViewProps {
  onBackToCapa?: () => void;
}

// ======================================================================================
// MOCK DATA: 8 DESTINOS OPERACIONAIS (PALETA NEUTRA / PASTEL / DATA SINTÉTICA)
// ======================================================================================
interface DestinationMonitor {
  id: string;
  code: string;
  name: string;
  cpt: string;
  cptHoursRemaining: number;
  plannedVehicle: string;
  vehicleCapacity: number; // em TOs
  packedTos: number;
  packedOrders: number;
  loadedTos: number;
  loadedOrders: number;
  riskStatus: "ok" | "warning" | "critical" | "overdue";
  riskTos: number;
  leftoverPredicted: number;
  shift: "T1" | "T2" | "T3";
  tripNumber: string;
  statusCarreta: "Aguardando Doca" | "Em Carregamento" | "Pronto / No Pátio" | "Em Trajeto";
  packDistribution: {
    sacas: number;
    scuttles: number;
    pallets: number;
    outros: number;
  };
  suggestedAction?: string;
}

const INITIAL_DESTINATIONS: DestinationMonitor[] = [
  {
    id: "dest-1",
    code: "HUB-SUD01",
    name: "Hub Regional Sudeste (Central)",
    cpt: "21:30",
    cptHoursRemaining: 1.2,
    plannedVehicle: "CARRETA (28 Pallets)",
    vehicleCapacity: 28,
    packedTos: 34,
    packedOrders: 1820,
    loadedTos: 18,
    loadedOrders: 940,
    riskStatus: "critical",
    riskTos: 6,
    leftoverPredicted: 6,
    shift: "T2",
    tripNumber: "LH-TRIP-98402",
    statusCarreta: "Em Carregamento",
    packDistribution: { sacas: 16, scuttles: 10, pallets: 8, outros: 0 },
    suggestedAction: "Solicitar veículo de apoio HR ou Toco imediato (Sobra projetada: +6 TOs)."
  },
  {
    id: "dest-2",
    code: "CD-CAMPINAS",
    name: "Centro de Distribuição Campinas",
    cpt: "22:00",
    cptHoursRemaining: 1.7,
    plannedVehicle: "TRUCK (16 Pallets)",
    vehicleCapacity: 16,
    packedTos: 19,
    packedOrders: 1050,
    loadedTos: 12,
    loadedOrders: 680,
    riskStatus: "warning",
    riskTos: 3,
    leftoverPredicted: 3,
    shift: "T2",
    tripNumber: "LH-TRIP-98405",
    statusCarreta: "Aguardando Doca",
    packDistribution: { sacas: 10, scuttles: 6, pallets: 3, outros: 0 },
    suggestedAction: "Priorizar conferência de gaiolas e verificar encaixe no pátio."
  },
  {
    id: "dest-3",
    code: "HUB-CAPITAL",
    name: "Hub Metropolitano Capital",
    cpt: "23:15",
    cptHoursRemaining: 2.9,
    plannedVehicle: "CARRETA (28 Pallets)",
    vehicleCapacity: 28,
    packedTos: 24,
    packedOrders: 1390,
    loadedTos: 20,
    loadedOrders: 1180,
    riskStatus: "ok",
    riskTos: 0,
    leftoverPredicted: 0,
    shift: "T2",
    tripNumber: "LH-TRIP-98410",
    statusCarreta: "Em Carregamento",
    packDistribution: { sacas: 12, scuttles: 8, pallets: 4, outros: 0 }
  },
  {
    id: "dest-4",
    code: "CROSS-VALE",
    name: "Cross-Docking Vale Paraíba",
    cpt: "20:45",
    cptHoursRemaining: 0.5,
    plannedVehicle: "TOCO (14 Pallets)",
    vehicleCapacity: 14,
    packedTos: 18,
    packedOrders: 920,
    loadedTos: 14,
    loadedOrders: 710,
    riskStatus: "critical",
    riskTos: 4,
    leftoverPredicted: 4,
    shift: "T2",
    tripNumber: "LH-TRIP-98398",
    statusCarreta: "Pronto / No Pátio",
    packDistribution: { sacas: 11, scuttles: 4, pallets: 3, outros: 0 },
    suggestedAction: "Carreta em pátio cheia. 4 TOs retidas em Stage-out para o próximo turno."
  },
  {
    id: "dest-5",
    code: "CD-INTERIOR",
    name: "CD Regional Ribeirão & Região",
    cpt: "01:00",
    cptHoursRemaining: 4.7,
    plannedVehicle: "TRUCK (16 Pallets)",
    vehicleCapacity: 16,
    packedTos: 11,
    packedOrders: 580,
    loadedTos: 8,
    loadedOrders: 410,
    riskStatus: "ok",
    riskTos: 0,
    leftoverPredicted: 0,
    shift: "T3",
    tripNumber: "LH-TRIP-98418",
    statusCarreta: "Aguardando Doca",
    packDistribution: { sacas: 5, scuttles: 4, pallets: 2, outros: 0 }
  },
  {
    id: "dest-6",
    code: "HUB-TRIANGULO",
    name: "Hub Triângulo & Centro-Oeste",
    cpt: "02:30",
    cptHoursRemaining: 6.2,
    plannedVehicle: "CARRETA (28 Pallets)",
    vehicleCapacity: 28,
    packedTos: 30,
    packedOrders: 1640,
    loadedTos: 15,
    loadedOrders: 820,
    riskStatus: "warning",
    riskTos: 2,
    leftoverPredicted: 2,
    shift: "T3",
    tripNumber: "LH-TRIP-98422",
    statusCarreta: "Aguardando Doca",
    packDistribution: { sacas: 18, scuttles: 8, pallets: 4, outros: 0 },
    suggestedAction: "Acompanhar fluxo de packing das 23h para rebalanceamento."
  },
  {
    id: "dest-7",
    code: "CROSS-LESTE",
    name: "Cross-Docking Leste Fluminense",
    cpt: "00:45",
    cptHoursRemaining: 4.4,
    plannedVehicle: "3/4 (8 Pallets)",
    vehicleCapacity: 8,
    packedTos: 7,
    packedOrders: 360,
    loadedTos: 5,
    loadedOrders: 270,
    riskStatus: "ok",
    riskTos: 0,
    leftoverPredicted: 0,
    shift: "T3",
    tripNumber: "LH-TRIP-98415",
    statusCarreta: "Em Carregamento",
    packDistribution: { sacas: 4, scuttles: 2, pallets: 1, outros: 0 }
  },
  {
    id: "dest-8",
    code: "CD-LITORAL",
    name: "Centro Logístico Baixada & Porto",
    cpt: "19:50",
    cptHoursRemaining: -0.4,
    plannedVehicle: "TOCO (14 Pallets)",
    vehicleCapacity: 14,
    packedTos: 15,
    packedOrders: 790,
    loadedTos: 14,
    loadedOrders: 740,
    riskStatus: "overdue",
    riskTos: 1,
    leftoverPredicted: 1,
    shift: "T1",
    tripNumber: "LH-TRIP-98380",
    statusCarreta: "Em Trajeto",
    packDistribution: { sacas: 8, scuttles: 4, pallets: 3, outros: 0 },
    suggestedAction: "CPT expirado. 1 TO deixada para trás por falta de capacidade física."
  }
];

export default function AppsScriptProjectView({ onBackToCapa }: AppsScriptProjectViewProps = {}) {
  const router = useRouter();
  // Navigation Tabs
  const [activeMainTab, setActiveMainTab] = useState<"demo" | "architecture" | "code">("demo");
  const [activeDemoView, setActiveDemoView] = useState<"monitor" | "history">("monitor");
  const [activeCodeFile, setActiveCodeFile] = useState<"codigo" | "index">("codigo");
  const [copiedCode, setCopiedCode] = useState(false);

  // Filters for Demo
  const [destinations] = useState<DestinationMonitor[]>(INITIAL_DESTINATIONS);
  const [searchFilter, setSearchFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");

  // Selected Card for Detail Modal
  const [selectedDest, setSelectedDest] = useState<DestinationMonitor | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isJustifyModalOpen, setIsJustifyModalOpen] = useState(false);
  const [justificationReason, setJustificationReason] = useState("VEHICLE_CAPACITY");
  const [justificationText, setJustificationText] = useState("");
  const [justificationSuccess, setJustificationSuccess] = useState(false);

  // Filtered List
  const filteredDestinations = useMemo(() => {
    return destinations.filter((item) => {
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesTrip = item.tripNumber.toLowerCase().includes(query);
        if (!matchesCode && !matchesName && !matchesTrip) return false;
      }
      if (riskFilter !== "all") {
        if (riskFilter === "risk" && item.riskStatus === "ok") return false;
        if (riskFilter === "critical" && (item.riskStatus !== "critical" && item.riskStatus !== "overdue")) return false;
        if (riskFilter === "ok" && item.riskStatus !== "ok") return false;
      }
      if (shiftFilter !== "all" && item.shift !== shiftFilter) return false;
      if (vehicleFilter !== "all" && !item.plannedVehicle.includes(vehicleFilter)) return false;
      return true;
    });
  }, [destinations, searchFilter, riskFilter, shiftFilter, vehicleFilter]);

  // Aggregate KPI metrics
  const totalMonitoredDestinations = destinations.length;
  const totalPackedOrders = destinations.reduce((acc, cur) => acc + cur.packedOrders, 0);
  const totalPackedTos = destinations.reduce((acc, cur) => acc + cur.packedTos, 0);
  const totalLoadedOrders = destinations.reduce((acc, cur) => acc + cur.loadedOrders, 0);
  const totalRiskTos = destinations.reduce((acc, cur) => acc + cur.riskTos, 0);
  const totalRiskDestinations = destinations.filter((d) => d.riskStatus === "critical" || d.riskStatus === "warning" || d.riskStatus === "overdue").length;

  // Sanitized Code Snippets
  const sanitizedCodigoGs = `/**
 * ======================================================================================
 * PROJETO: LEFTOVER CONTROL (GESTÃO DE SOBRAS & PÁTIO)
 * Ambiente: Google Apps Script (Runtime V8) • Web App via HtmlService
 * Integração: Google Sheets (db_all, tos_packed, historico out, code)
 * Governança: LockService (concorrência), CacheService (chunking), Batch getValues()
 * ======================================================================================
 */

const LEFTOVER_CONFIG = Object.freeze({
  SHEETS: Object.freeze({
    TRIPS: 'db_all',
    PACKED: 'tos_packed',
    HISTORY: 'historico out',
    JUSTIFICATIONS: 'justificativas leftover',
    CODE: 'code'
  }),
  LEAD_TIME_HOURS: 2,
  PLANNING_HORIZON_HOURS: 12,
  TIMEZONE: 'America/Sao_Paulo',
  CACHE_VERSION: 'leftover-v26-clean-architecture',
  CACHE_TTL_SECONDS: 600,       // 10 minutos de cache
  CACHE_CHUNK_SIZE: 70000,      // 70KB por chunk (limite de 100KB do Google)
  MAX_CACHE_CHUNKS: 80,
  CLOSED_STATUS_TERMS: Object.freeze([
    'cancel', 'closed', 'completed', 'departed', 'encerr', 'finaliz'
  ]),
  VEHICLE_CAPACITIES: Object.freeze([
    Object.freeze({ type: 'HR', capacity: 6 }),
    Object.freeze({ type: '3/4', capacity: 8 }),
    Object.freeze({ type: 'TOCO', capacity: 14 }),
    Object.freeze({ type: 'TRUCK', capacity: 16 }),
    Object.freeze({ type: 'CARRETA', capacity: 28 })
  ])
});

/**
 * Ponto de entrada do Web App (HtmlService)
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');

  template.initialView = e?.parameter?.view === 'historico' ? 'historico' : 'monitoramento';
  template.initialHistoryMode = e?.parameter?.mode === 'turno' ? 'turno' : 'viagens';
  template.webAppUrl = ScriptApp.getService().getUrl() || '';

  return template
    .evaluate()
    .setTitle('Leftover Control | Hub Operacional')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Retorna dados consolidados com LockService e CacheService particionado
 */
function getDashboardData(forceRefresh) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Planilha vinculada não encontrada.');
  }

  const cacheKey = 'leftover-dash:' + LEFTOVER_CONFIG.CACHE_VERSION + ':' + spreadsheet.getId();

  if (forceRefresh !== true) {
    const cached = readDashboardCache_(cacheKey);
    if (cached) return cached;
  }

  // Prevenção de Concorrência: LockService evita processamento redundante simultâneo
  const lock = LockService.getScriptLock();
  const locked = lock.tryLock(8000); // Aguarda até 8s

  try {
    if (forceRefresh !== true) {
      const cachedAfterLock = readDashboardCache_(cacheKey);
      if (cachedAfterLock) return cachedAfterLock;
    }

    // Leitura Atômica em Lote (Batch Read)
    const tripSheet = spreadsheet.getSheetByName(LEFTOVER_CONFIG.SHEETS.TRIPS);
    const packedSheet = spreadsheet.getSheetByName(LEFTOVER_CONFIG.SHEETS.PACKED);

    const tripValues = tripSheet.getDataRange().getValues();
    const packedValues = packedSheet.getDataRange().getValues();

    const payload = buildDashboardFromTables_(tripValues, packedValues);

    // Gravação em cache com particionamento de chunks
    writeDashboardCache_(cacheKey, payload);
    return payload;
  } finally {
    if (locked) lock.releaseLock();
  }
}

/**
 * Supera a barreira de 100KB do CacheService particionando o JSON em fatias
 */
function writeDashboardCache_(baseKey, payload) {
  try {
    const jsonStr = JSON.stringify(payload);
    const cache = CacheService.getScriptCache();
    const totalChunks = Math.ceil(jsonStr.length / LEFTOVER_CONFIG.CACHE_CHUNK_SIZE);

    if (totalChunks > LEFTOVER_CONFIG.MAX_CACHE_CHUNKS) return;

    const chunkMap = {};
    chunkMap[baseKey + ':meta'] = JSON.stringify({ chunks: totalChunks, size: jsonStr.length });

    for (let i = 0; i < totalChunks; i++) {
      const start = i * LEFTOVER_CONFIG.CACHE_CHUNK_SIZE;
      const part = jsonStr.substring(start, start + LEFTOVER_CONFIG.CACHE_CHUNK_SIZE);
      chunkMap[baseKey + ':chunk:' + i] = part;
    }

    cache.putAll(chunkMap, LEFTOVER_CONFIG.CACHE_TTL_SECONDS);
  } catch (err) {
    console.warn('Erro ao gravar cache: ' + err.message);
  }
}
`;

  const sanitizedIndexHtml = `<!doctype html>
<html lang="pt-BR">
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Leftover Control | Hub Operacional</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    /* Design System: Paleta Fria & Pastel (Slate / Ice Blue / Emerald / Rose Soft) */
    :root {
      --bg-canvas: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-line: #e2e8f0;
      --brand-primary: #2563eb;
      --status-ok: #10b981;
      --status-warn: #f59e0b;
      --status-danger: #ef4444;
    }
    body { font-family: 'Inter', sans-serif; background: var(--bg-canvas); color: var(--text-main); margin: 0; }
    .header { background: #0f172a; color: #fff; padding: 14px 28px; display: flex; justify-content: space-between; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; padding: 24px; }
    .card { background: var(--card-bg); border: 1px solid var(--border-line); border-radius: 10px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
  </style>
</head>
<body>
  <!-- Header Corporativo -->
  <header class="header">
    <div style="display:flex; align-items:center; gap:12px;">
      <span style="font-size:20px;">📦</span>
      <strong>LEFTOVER CONTROL</strong>
    </div>
    <div style="display:flex; gap:10px;">
      <button onclick="refreshData()" style="background:#2563eb; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer;">
        ↻ Atualizar Dados
      </button>
    </div>
  </header>

  <!-- Script Cliente usando google.script.run -->
  <script>
    function refreshData() {
      // Ponte RPC assíncrona do Google Apps Script
      google.script.run
        .withSuccessHandler(renderDashboard)
        .withFailureHandler(handleError)
        .getDashboardData(true);
    }

    function renderDashboard(data) {
      console.log('Dados recebidos com sucesso via CacheService:', data);
    }

    function handleError(error) {
      alert('Falha na comunicação: ' + error.message);
    }
  </script>
</body>
</html>
`;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveJustification = (e: React.FormEvent) => {
    e.preventDefault();
    setJustificationSuccess(true);
    setTimeout(() => {
      setJustificationSuccess(false);
      setIsJustifyModalOpen(false);
      setJustificationText("");
    }, 1500);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 36px 60px" }}>
      {/* Top Breadcrumb & Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => {
              if (onBackToCapa) {
                onBackToCapa();
              } else if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "6px 14px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#1e3048",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
            }}
            type="button"
            title="Voltar à página anterior"
          >
            ← Voltar à página anterior
          </button>

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#64748b",
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: "6px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}
            title="Ir para a Capa Principal"
          >
            🏠 Capa Principal
          </Link>
        </div>
        <Link
          href="/portal"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#2563eb",
            textDecoration: "underline"
          }}
        >
          Acessar Portal Completo (Hub) ↗
        </Link>
      </div>

      {/* Hero Header do Projeto Apps Script */}
      <div
        className="card"
        style={{
          padding: "36px 40px",
          marginBottom: "28px",
          borderLeft: "6px solid #0284c7",
          background: "linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              background: "#e0f2fe",
              color: "#0369a1",
              padding: "4px 10px",
              borderRadius: "999px"
            }}
          >
            GOOGLE APPS SCRIPT &amp; HTMLSERVICE
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              background: "#f0fdf4",
              color: "#166534",
              padding: "4px 10px",
              borderRadius: "999px"
            }}
          >
            ✓ 100% Mock Data &amp; Paleta Fria Pastel
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              background: "#ede9fe",
              color: "#6d28d9",
              padding: "4px 10px",
              borderRadius: "999px"
            }}
          >
            LockService • CacheService Chunking
          </span>
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 900,
            color: "#0f172a",
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
            lineHeight: 1.2
          }}
        >
          Leftover Control: Gestão de Sobras Operacionais &amp; Pátio em Tempo Real
        </h1>

        <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.65, margin: "0 0 24px", maxWidth: "1000px" }}>
          Aplicação Web App corporativa de missão crítica construída sobre Google Apps Script e HtmlService.
          Conecta o estoque em tempo real de Ordens de Transporte embaladas (<code>tos_packed</code>) com a programação de viagens
          de carretas (<code>db_all</code>), calculando sobras projetadas (*Leftovers*), alertando estouros de capacidade física do veículo
          e sugerindo reforços de frota antes do corte de <strong>CPT (Critical Pull Time)</strong>.
        </p>

        {/* Live Web App & Editor Action Banner */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "16px" }}>⚡</span>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>Projeto Publicado no Google Apps Script</strong>
              <span style={{ fontSize: "11px", background: "#dcfce7", color: "#166534", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" }}>
                Versão 2 Ativa
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              Script ID: <code>133S8BWJlEwSanyC4WAvxXpkuxt05PLsWWC7dZBkjPEOdpzrjg8MVX82P</code> • Runtime V8
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="https://script.google.com/macros/s/AKfycbzUoFyU1UaATi1BCclPUinVSBSNsyj07oSYQ2yFXnzKiVosRR8snRTyKanmFN3c5mosUg/exec"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#0284c7",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)"
              }}
            >
              🚀 Abrir Web App (Execução) ↗
            </a>
            <a
              href="https://script.google.com/d/133S8BWJlEwSanyC4WAvxXpkuxt05PLsWWC7dZBkjPEOdpzrjg8MVX82P/edit"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#f1f5f9",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              🛠️ Editor Apps Script ↗
            </a>
          </div>
        </div>

        {/* 4 Impact Metric Badges */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "14px"
          }}
        >
          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
            <span style={{ fontSize: "11px", color: "#0284c7", fontWeight: 700, textTransform: "uppercase" }}>
              Horizonte de Planejamento
            </span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
              12 Horas
            </div>
            <span style={{ fontSize: "11.5px", color: "#64748b" }}>Lead time antecipado de 2h</span>
          </div>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
            <span style={{ fontSize: "11px", color: "#0284c7", fontWeight: 700, textTransform: "uppercase" }}>
              Concorrência &amp; Bloqueio
            </span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#166534", margin: "2px 0" }}>
              LockService
            </div>
            <span style={{ fontSize: "11.5px", color: "#64748b" }}>Prevenção de Race Conditions</span>
          </div>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
            <span style={{ fontSize: "11px", color: "#0284c7", fontWeight: 700, textTransform: "uppercase" }}>
              Cache Particionado
            </span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
              80 Chunks x 70KB
            </div>
            <span style={{ fontSize: "11.5px", color: "#64748b" }}>Supera barreira de 100KB do GAS</span>
          </div>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
            <span style={{ fontSize: "11px", color: "#0284c7", fontWeight: 700, textTransform: "uppercase" }}>
              Frota Parametrizada
            </span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
              5 Modalidades
            </div>
            <span style={{ fontSize: "11.5px", color: "#64748b" }}>HR, 3/4, Toco, Truck e Carreta</span>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Tabs (Demonstração vs Arquitetura vs Código) */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "24px",
          background: "#f1f5f9",
          padding: "6px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0"
        }}
      >
        <button
          onClick={() => setActiveMainTab("demo")}
          style={{
            flex: 1,
            padding: "12px 18px",
            borderRadius: "8px",
            border: "none",
            background: activeMainTab === "demo" ? "#ffffff" : "transparent",
            color: activeMainTab === "demo" ? "#0f172a" : "#64748b",
            fontWeight: activeMainTab === "demo" ? 800 : 600,
            fontSize: "13.5px",
            cursor: "pointer",
            boxShadow: activeMainTab === "demo" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
          type="button"
        >
          <span>🖥️</span>
          <span>Demonstração Interativa (Web App Leftover)</span>
        </button>

        <button
          onClick={() => setActiveMainTab("architecture")}
          style={{
            flex: 1,
            padding: "12px 18px",
            borderRadius: "8px",
            border: "none",
            background: activeMainTab === "architecture" ? "#ffffff" : "transparent",
            color: activeMainTab === "architecture" ? "#0f172a" : "#64748b",
            fontWeight: activeMainTab === "architecture" ? 800 : 600,
            fontSize: "13.5px",
            cursor: "pointer",
            boxShadow: activeMainTab === "architecture" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
          type="button"
        >
          <span>⚙️</span>
          <span>Arquitetura Google Apps Script &amp; Funções</span>
        </button>

        <button
          onClick={() => setActiveMainTab("code")}
          style={{
            flex: 1,
            padding: "12px 18px",
            borderRadius: "8px",
            border: "none",
            background: activeMainTab === "code" ? "#ffffff" : "transparent",
            color: activeMainTab === "code" ? "#0f172a" : "#64748b",
            fontWeight: activeMainTab === "code" ? 800 : 600,
            fontSize: "13.5px",
            cursor: "pointer",
            boxShadow: activeMainTab === "code" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
          type="button"
        >
          <span>📄</span>
          <span>Código Sanitizado (Código.gs &amp; Index.html)</span>
        </button>
      </div>

      {/* ==================================================================================
          ABA 1: DEMONSTRAÇÃO INTERATIVA DO WEB APP COM DADOS MOCKADOS
          ================================================================================== */}
      {activeMainTab === "demo" && (
        <div>
          {/* Sub-header do Web App Mockado */}
          <div
            style={{
              background: "#0f172a",
              color: "#ffffff",
              padding: "16px 24px",
              borderRadius: "12px 12px 0 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#2563eb",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: "18px"
                }}
              >
                L
              </div>
              <div>
                <strong style={{ fontSize: "15px", letterSpacing: "0.03em" }}>LEFTOVER CONTROL</strong>
                <span style={{ display: "block", fontSize: "10px", color: "#94a3b8" }}>
                  Monitoramento Operacional por Destino &amp; CPT • Paleta Fria Pastel
                </span>
              </div>
            </div>

            {/* Sub-nav de Telas do Web App */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", padding: "4px", borderRadius: "8px" }}>
              <button
                onClick={() => setActiveDemoView("monitor")}
                style={{
                  background: activeDemoView === "monitor" ? "#ffffff" : "transparent",
                  color: activeDemoView === "monitor" ? "#0f172a" : "#cbd5e1",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                type="button"
              >
                MONITORAMENTO EM TEMPO REAL
              </button>
              <button
                onClick={() => setActiveDemoView("history")}
                style={{
                  background: activeDemoView === "history" ? "#ffffff" : "transparent",
                  color: activeDemoView === "history" ? "#0f172a" : "#cbd5e1",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                type="button"
              >
                HISTÓRICO &amp; JUSTIFICATIVAS
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right", fontSize: "11px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "9px" }}>ÚLTIMO SYNC VIA SCRIPT</span>
                <strong style={{ color: "#38bdf8" }}>Agora há pouco (Tempo Real)</strong>
              </div>
            </div>
          </div>

          {/* Painel de Filtros Operacionais */}
          <div
            style={{
              background: "#ffffff",
              padding: "18px 24px",
              borderLeft: "1px solid #e2e8f0",
              borderRight: "1px solid #e2e8f0",
              borderBottom: "1px solid #e2e8f0"
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", alignItems: "end" }}>
              {/* Campo Busca */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                  BUSCAR DESTINO OU TRIP
                </label>
                <input
                  type="text"
                  placeholder="Ex: SUD01, Campinas, 98402..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    outline: "none"
                  }}
                />
              </div>

              {/* Filtro Risco */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                  SITUAÇÃO DO RISCO
                </label>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    background: "#fff"
                  }}
                >
                  <option value="all">Todos os Estados</option>
                  <option value="risk">Com Risco de Leftover</option>
                  <option value="critical">Crítico / Sobra Iminente</option>
                  <option value="ok">Sem Risco (Capacidade OK)</option>
                </select>
              </div>

              {/* Filtro Turno */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                  TURNO OPERACIONAL
                </label>
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    background: "#fff"
                  }}
                >
                  <option value="all">Todos os Turnos (T1, T2, T3)</option>
                  <option value="T1">Turno 1 (06h - 14h)</option>
                  <option value="T2">Turno 2 (14h - 22h)</option>
                  <option value="T3">Turno 3 (22h - 06h)</option>
                </select>
              </div>

              {/* Filtro Veículo */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                  TIPO DE VEÍCULO
                </label>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    background: "#fff"
                  }}
                >
                  <option value="all">Todos os Veículos</option>
                  <option value="CARRETA">Carreta (28 TOs)</option>
                  <option value="TRUCK">Truck (16 TOs)</option>
                  <option value="TOCO">Toco (14 TOs)</option>
                  <option value="3/4">3/4 (8 TOs)</option>
                </select>
              </div>

              {/* Botão Limpar */}
              <div>
                <button
                  onClick={() => {
                    setSearchFilter("");
                    setRiskFilter("all");
                    setShiftFilter("all");
                    setVehicleFilter("all");
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                  type="button"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Banner de Alerta Crítico (Packed sem Viagem Programada) */}
          <div
            onClick={() => setIsAlertModalOpen(true)}
            style={{
              margin: "16px 0",
              padding: "14px 20px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderLeft: "5px solid #f59e0b",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "22px" }}>⚠️</span>
              <div>
                <strong style={{ fontSize: "13px", color: "#92400e", display: "block" }}>
                  ALERTA DE SOBRA PROJETADA: 12 TOs AGUARDANDO EM STAGE-OUT
                </strong>
                <span style={{ fontSize: "11px", color: "#b45309" }}>
                  Existem destinos com volume embalado excedendo a capacidade do veículo planejado na janela dos próximos CPTs.
                </span>
              </div>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#b45309" }}>
              Abrir Diagnóstico de Alertas →
            </span>
          </div>

          {/* KPIs Operacionais do Web App */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginBottom: "20px"
            }}
          >
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #0f172a" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>DESTINOS ATIVOS</span>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: "4px 0" }}>{totalMonitoredDestinations}</div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Monitorados em tempo real</span>
            </div>

            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #2563eb" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>PACOTES PACKED</span>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#1e40af", margin: "4px 0" }}>{totalPackedOrders.toLocaleString()}</div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>{totalPackedTos} TOs aguardando</span>
            </div>

            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #10b981" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>PACOTES CARREGADOS</span>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#047857", margin: "4px 0" }}>{totalLoadedOrders.toLocaleString()}</div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Já bipados na carreta</span>
            </div>

            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #ef4444" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#dc2626", textTransform: "uppercase" }}>TOs EM RISCO DE SOBRA</span>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#b91c1c", margin: "4px 0" }}>{totalRiskTos} TOs</div>
              <span style={{ fontSize: "11px", color: "#dc2626", fontWeight: 700 }}>Excedente de capacidade</span>
            </div>

            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #f59e0b" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#d97706", textTransform: "uppercase" }}>DESTINOS CRÍTICOS</span>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#b45309", margin: "4px 0" }}>{totalRiskDestinations}</div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Concentração operacional</span>
            </div>
          </div>

          {/* VISÃO 1: MONITORAMENTO EM TEMPO REAL POR DESTINO */}
          {activeDemoView === "monitor" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                  CARDS OPERACIONAIS POR DESTINO &amp; CPT ({filteredDestinations.length} exibidos)
                </strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  Clique no card para abrir o detalhamento da carga e simulação
                </span>
              </div>

              {/* Grid de Cards de Destino */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "16px"
                }}
              >
                {filteredDestinations.map((dest) => {
                  const isCritical = dest.riskStatus === "critical" || dest.riskStatus === "overdue";
                  const isWarning = dest.riskStatus === "warning";
                  const borderTopColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981";

                  return (
                    <div
                      key={dest.id}
                      onClick={() => setSelectedDest(dest)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderTop: `4px solid ${borderTopColor}`,
                        borderRadius: "10px",
                        padding: "16px",
                        cursor: "pointer",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                      }}
                    >
                      {/* Top Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                            {dest.code} • Turno {dest.shift}
                          </span>
                          <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", marginTop: "2px" }}>
                            {dest.name}
                          </strong>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "9px", color: "#64748b", display: "block" }}>CPT</span>
                          <strong style={{ fontSize: "13px", color: isCritical ? "#dc2626" : "#2563eb" }}>
                            {dest.cpt}
                          </strong>
                        </div>
                      </div>

                      {/* Veículo e Trip */}
                      <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", marginBottom: "12px", fontSize: "11.5px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                          <span>Veículo: <strong>{dest.plannedVehicle}</strong></span>
                          <span>Cap: <strong>{dest.vehicleCapacity} TOs</strong></span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", marginTop: "4px", fontSize: "10.5px" }}>
                          <span>Trip: {dest.tripNumber}</span>
                          <span style={{ color: "#0369a1", fontWeight: 700 }}>{dest.statusCarreta}</span>
                        </div>
                      </div>

                      {/* Medidor de Ocupação & Sobra */}
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                          <span style={{ color: "#64748b" }}>Ocupação de TOs</span>
                          <strong>{dest.packedTos} / {dest.vehicleCapacity} TOs ({Math.round((dest.packedTos / dest.vehicleCapacity) * 100)}%)</strong>
                        </div>
                        <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${Math.min(100, Math.round((dest.packedTos / dest.vehicleCapacity) * 100))}%`,
                              height: "100%",
                              background: isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981",
                              borderRadius: "999px"
                            }}
                          />
                        </div>
                      </div>

                      {/* Distribuição por Tipo de Embalagem */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "12px", fontSize: "10.5px" }}>
                        <div style={{ background: "#f1f5f9", padding: "4px 6px", borderRadius: "4px", textAlign: "center" }}>
                          <span style={{ color: "#64748b", display: "block", fontSize: "9px" }}>Sacas</span>
                          <strong>{dest.packDistribution.sacas} TOs</strong>
                        </div>
                        <div style={{ background: "#f1f5f9", padding: "4px 6px", borderRadius: "4px", textAlign: "center" }}>
                          <span style={{ color: "#64748b", display: "block", fontSize: "9px" }}>Scuttles</span>
                          <strong>{dest.packDistribution.scuttles} TOs</strong>
                        </div>
                        <div style={{ background: "#f1f5f9", padding: "4px 6px", borderRadius: "4px", textAlign: "center" }}>
                          <span style={{ color: "#64748b", display: "block", fontSize: "9px" }}>Pallets</span>
                          <strong>{dest.packDistribution.pallets} TOs</strong>
                        </div>
                      </div>

                      {/* Rodapé do Card com Ação / Risco */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                        {dest.leftoverPredicted > 0 ? (
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#dc2626", background: "#fef2f2", padding: "3px 8px", borderRadius: "4px" }}>
                            ⚠️ Sobra: +{dest.leftoverPredicted} TOs
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", background: "#f0fdf4", padding: "3px 8px", borderRadius: "4px" }}>
                            ✓ Capacidade Atendida
                          </span>
                        )}
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb" }}>
                          Ver Detalhes →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VISÃO 2: HISTÓRICO & JUSTIFICATIVAS */}
          {activeDemoView === "history" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                    REGISTRO DE EXPEDIÇÕES REALIZADAS &amp; AUDITORIA DE LEFTOVER
                  </strong>
                  <span style={{ display: "block", fontSize: "11px", color: "#64748b" }}>
                    Viagens já partidas da doca de origem com status de justificativa operacional
                  </span>
                </div>
                <button
                  onClick={() => setIsJustifyModalOpen(true)}
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                  type="button"
                >
                  + Registrar Justificativa de Sobra
                </button>
              </div>

              {/* Tabela de Histórico */}
              <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569" }}>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Viagem (Trip)</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Destino</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Turno</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Veículo</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>TOs Carregadas</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Leftover (Sobra)</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Status Justificativa</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Motivo Principal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { trip: "LH-TRIP-98380", dest: "CD-LITORAL", shift: "T1", veh: "TOCO", loaded: 14, leftover: 1, status: "Justificada", reason: "Falta de capacidade física do veículo" },
                      { trip: "LH-TRIP-98365", dest: "HUB-SUD01", shift: "T1", veh: "CARRETA", loaded: 28, leftover: 4, status: "Justificada", reason: "Atraso na liberação do packing" },
                      { trip: "LH-TRIP-98350", dest: "CD-CAMPINAS", shift: "T1", veh: "TRUCK", loaded: 16, leftover: 0, status: "Sem Sobra", reason: "Operação 100% escoada" },
                      { trip: "LH-TRIP-98335", dest: "CROSS-VALE", shift: "T3 (Ontem)", veh: "TOCO", loaded: 14, leftover: 3, status: "Pendente", reason: "Aguardando aprovação de supervisão" },
                      { trip: "LH-TRIP-98320", dest: "HUB-CAPITAL", shift: "T3 (Ontem)", veh: "CARRETA", loaded: 28, leftover: 0, status: "Sem Sobra", reason: "Operação 100% escoada" },
                    ].map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#2563eb" }}>{row.trip}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{row.dest}</td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{row.shift}</td>
                        <td style={{ padding: "10px 12px" }}>{row.veh}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700 }}>{row.loaded} TOs</td>
                        <td style={{ padding: "10px 12px" }}>
                          {row.leftover > 0 ? (
                            <span style={{ color: "#dc2626", fontWeight: 800 }}>+{row.leftover} TOs</span>
                          ) : (
                            <span style={{ color: "#166534" }}>0 TOs</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: row.status === "Justificada" ? "#f0fdf4" : row.status === "Pendente" ? "#fef2f2" : "#f1f5f9",
                              color: row.status === "Justificada" ? "#166534" : row.status === "Pendente" ? "#dc2626" : "#475569"
                            }}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rodapé da Demonstração */}
          <div style={{ marginTop: "16px", padding: "12px 18px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
            <span>Origem dos Dados: Planilhas <code>db_all</code> + <code>tos_packed</code> + <code>historico out</code></span>
            <span>Motor de Cache: <code>CacheService</code> (Particionamento em 70KB)</span>
          </div>
        </div>
      )}

      {/* ==================================================================================
          ABA 2: ARQUITETURA TÉCNICA GOOGLE APPS SCRIPT
          ================================================================================== */}
      {activeMainTab === "architecture" && (
        <div>
          {/* Card Visão Geral de Arquitetura */}
          <div className="card" style={{ padding: "32px", marginBottom: "28px" }}>
            <h2 style={{ fontSize: "22px", color: "#0f172a", margin: "0 0 16px", fontWeight: 800 }}>
              Arquitetura de Engenharia em Google Apps Script &amp; Web Apps
            </h2>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.65, margin: "0 0 24px" }}>
              O <strong>Leftover Control</strong> foi concebido para resolver um dos desafios mais severos do Google Apps Script:
              fornecer uma interface de alta responsividade e baixa latência para mais de 50 operadores e supervisores simultâneos,
              operando sobre planilhas com dezenas de milhares de linhas, sem estourar quotas de execução e sem travamentos por concorrência.
            </p>

            {/* 4 Pilares Técnicos */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
              {/* Pilar 1: HtmlService & google.script.run */}
              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", borderTop: "4px solid #2563eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>🌐</span>
                  <h3 style={{ fontSize: "15px", color: "#0f172a", margin: 0, fontWeight: 700 }}>
                    HtmlService &amp; RPC Assíncrono
                  </h3>
                </div>
                <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
                  Renderização via <code>HtmlService.createTemplateFromFile(&apos;Index&apos;)</code> no modo <code>ALLOWALL</code> (embutível em iframes).
                  A comunicação cliente-servidor utiliza <code>google.script.run</code> com callbacks desacoplados (<code>withSuccessHandler</code> e <code>withFailureHandler</code>),
                  permitindo atualizações parciais sem recarregamento da tela.
                </p>
              </div>

              {/* Pilar 2: LockService */}
              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", borderTop: "4px solid #10b981" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>🔐</span>
                  <h3 style={{ fontSize: "15px", color: "#0f172a", margin: 0, fontWeight: 700 }}>
                    LockService (Zero Race Condition)
                  </h3>
                </div>
                <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
                  Em momentos de alta cadência, múltiplos analistas podem solicitar atualizações ou registrar justificativas simultaneamente.
                  O uso do <code>LockService.getScriptLock().tryLock(8000)</code> serializa as operações de gravação e leitura de cache,
                  eliminando falhas de sobrescrita e colisões de dados na planilha.
                </p>
              </div>

              {/* Pilar 3: CacheService com Chunking */}
              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", borderTop: "4px solid #8b5cf6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>⚡</span>
                  <h3 style={{ fontSize: "15px", color: "#0f172a", margin: 0, fontWeight: 700 }}>
                    CacheService com Chunking (70KB)
                  </h3>
                </div>
                <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
                  O cache nativo do Apps Script limita cada entrada a 100KB. Para armazenar o estado completo de centenas de TOs e viagens (300KB+),
                  o código implementa um algoritmo de particionamento dinâmico em blocos de 70KB salvos em lote com <code>cache.putAll()</code>,
                  reduzindo o tempo de resposta da API de <strong>4 segundos para 180 milissegundos</strong>.
                </p>
              </div>

              {/* Pilar 4: Leitura em Bloco */}
              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", borderTop: "4px solid #f59e0b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>📊</span>
                  <h3 style={{ fontSize: "15px", color: "#0f172a", margin: 0, fontWeight: 700 }}>
                    Batch Operations (getValues)
                  </h3>
                </div>
                <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
                  Acesso aos dados feito estritamente em uma única chamada de matriz (<code>getDataRange().getValues()</code>), processando toda a lógica
                  de correspondência em memória com arrays e objetos Javascript puros no motor V8, evitando o gargalo de chamadas repetitivas de API por célula.
                </p>
              </div>
            </div>
          </div>

          {/* Diagrama de Ciclo de Vida */}
          <div className="card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 16px", fontWeight: 800 }}>
              Ciclo de Vida da Requisição no Apps Script
            </h2>

            <div style={{ background: "#0f172a", color: "#fff", padding: "24px", borderRadius: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 700 }}>1. FRONTEND</span>
                  <h4 style={{ fontSize: "13px", margin: "4px 0 2px" }}>google.script.run</h4>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Disparo assíncrono não-bloqueante no browser</p>
                </div>

                <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <span style={{ fontSize: "11px", color: "#a78bfa", fontWeight: 700 }}>2. CACHE LAYER</span>
                  <h4 style={{ fontSize: "13px", margin: "4px 0 2px" }}>readDashboardCache_</h4>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Reconstituição dos chunks de 70KB em memória</p>
                </div>

                <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 700 }}>3. CONCORRÊNCIA</span>
                  <h4 style={{ fontSize: "13px", margin: "4px 0 2px" }}>LockService.tryLock</h4>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Garante lock atômico durante re-cálculo</p>
                </div>

                <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 700 }}>4. BATCH READ</span>
                  <h4 style={{ fontSize: "13px", margin: "4px 0 2px" }}>db_all + tos_packed</h4>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Leitura matricial única no Google Sheets</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================================
          ABA 3: CÓDIGO-FONTE SANITIZADO (Código.gs & Index.html)
          ================================================================================== */}
      {activeMainTab === "code" && (
        <div className="card" style={{ padding: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setActiveCodeFile("codigo")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: activeCodeFile === "codigo" ? "1px solid #0284c7" : "1px solid #cbd5e1",
                  background: activeCodeFile === "codigo" ? "#0284c7" : "#fff",
                  color: activeCodeFile === "codigo" ? "#fff" : "#475569",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer"
                }}
                type="button"
              >
                📜 Código.gs (Backend Server)
              </button>
              <button
                onClick={() => setActiveCodeFile("index")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: activeCodeFile === "index" ? "1px solid #0284c7" : "1px solid #cbd5e1",
                  background: activeCodeFile === "index" ? "#0284c7" : "#fff",
                  color: activeCodeFile === "index" ? "#fff" : "#475569",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer"
                }}
                type="button"
              >
                🌐 Index.html (Frontend Web App)
              </button>
            </div>

            <button
              onClick={() => copyCode(activeCodeFile === "codigo" ? sanitizedCodigoGs : sanitizedIndexHtml)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: copiedCode ? "#166534" : "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              type="button"
            >
              {copiedCode ? "✓ Código Copiado!" : "📋 Copiar Arquivo"}
            </button>
          </div>

          <div
            style={{
              position: "relative",
              background: "#0f172a",
              color: "#e2e8f0",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                background: "#1e293b",
                borderBottom: "1px solid #334155"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "8px", fontFamily: "monospace" }}>
                  {activeCodeFile === "codigo" ? "Código.gs • Google Apps Script (V8)" : "Index.html • HtmlService Web App"}
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "monospace", fontWeight: 700 }}>
                {activeCodeFile === "codigo" ? "JAVASCRIPT" : "HTML / CSS"}
              </span>
            </div>

            <pre
              style={{
                margin: 0,
                padding: "20px",
                maxHeight: "560px",
                overflowY: "auto",
                fontFamily: "Consolas, Monaco, 'Courier New', Courier, monospace",
                fontSize: "12.5px",
                lineHeight: 1.6,
                color: "#f8fafc",
                scrollbarWidth: "thin",
                scrollbarColor: "#475569 transparent"
              }}
            >
              <code>{activeCodeFile === "codigo" ? sanitizedCodigoGs : sanitizedIndexHtml}</code>
            </pre>
          </div>
        </div>
      )}

      {/* ==================================================================================
          MODAL 1: DETALHAMENTO DA CARGA DO DESTINO
          ================================================================================== */}
      {selectedDest && (
        <div
          onClick={() => setSelectedDest(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
          >
            {/* Modal Header */}
            <div style={{ background: "#0f172a", color: "#fff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                  DIAGNÓSTICO OPERACIONAL DE DESTINO
                </span>
                <h3 style={{ fontSize: "18px", margin: "2px 0 0" }}>{selectedDest.code} - {selectedDest.name}</h3>
              </div>
              <button
                onClick={() => setSelectedDest(null)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
                type="button"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Status Banner */}
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Viagem (Trip)</span>
                    <strong style={{ color: "#2563eb" }}>{selectedDest.tripNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>CPT de Partida</span>
                    <strong>{selectedDest.cpt} ({selectedDest.cptHoursRemaining > 0 ? `${selectedDest.cptHoursRemaining}h restantes` : "Expirado"})</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Status Carreta</span>
                    <strong style={{ color: "#0369a1" }}>{selectedDest.statusCarreta}</strong>
                  </div>
                </div>
              </div>

              {/* Simulação de Veículo & Capacidade */}
              <h4 style={{ fontSize: "13px", margin: "0 0 10px", color: "#0f172a" }}>
                Balanço de Capacidade vs. Estoque de TOs
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                <div style={{ background: "#eff6ff", padding: "12px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                  <span style={{ fontSize: "11px", color: "#1e40af", display: "block" }}>Capacidade Máxima do Veículo</span>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#1e3a8a", margin: "4px 0" }}>
                    {selectedDest.vehicleCapacity} TOs
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Modelo alocado: {selectedDest.plannedVehicle}</span>
                </div>

                <div style={{ background: selectedDest.leftoverPredicted > 0 ? "#fef2f2" : "#f0fdf4", padding: "12px", borderRadius: "8px", border: `1px solid ${selectedDest.leftoverPredicted > 0 ? "#fecaca" : "#bbf7d0"}` }}>
                  <span style={{ fontSize: "11px", color: selectedDest.leftoverPredicted > 0 ? "#dc2626" : "#166534", display: "block" }}>
                    {selectedDest.leftoverPredicted > 0 ? "Sobra Prevista (Leftover)" : "Situação da Carga"}
                  </span>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: selectedDest.leftoverPredicted > 0 ? "#b91c1c" : "#15803d", margin: "4px 0" }}>
                    {selectedDest.leftoverPredicted > 0 ? `+${selectedDest.leftoverPredicted} TOs Excedentes` : "Capacidade Adequada"}
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{selectedDest.packedTos} TOs prontas ({selectedDest.packedOrders} pacotes)</span>
                </div>
              </div>

              {/* Sugestão de Ação Operacional */}
              {selectedDest.suggestedAction && (
                <div style={{ background: "#fffbeb", padding: "12px 16px", borderRadius: "8px", borderLeft: "4px solid #f59e0b", marginBottom: "18px", fontSize: "12.5px", color: "#92400e" }}>
                  <strong>Ação Recomendada pela Torre:</strong>
                  <p style={{ margin: "4px 0 0" }}>{selectedDest.suggestedAction}</p>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  onClick={() => setSelectedDest(null)}
                  style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "8px 18px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  type="button"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================================
          MODAL 2: ALERTA DE TOs SEM VIAGEM
          ================================================================================== */}
      {isAlertModalOpen && (
        <div
          onClick={() => setIsAlertModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "600px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <span style={{ fontSize: "24px" }}>⚠️</span>
              <h3 style={{ fontSize: "16px", margin: 0, color: "#0f172a" }}>
                Diagnóstico: TOs Embaladas Sem Viagem Programada
              </h3>
            </div>
            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, margin: "0 0 16px" }}>
              Foram identificadas <strong>12 TOs</strong> prontas no Stage-out de doca que atualmente não possuem nenhum identificador de viagem (<code>lh_trip_ro</code>) vinculado na base <code>db_all</code>.
              Isso ocorre quando a esteira finaliza o lote antes da abertura da ordem de transporte pela transportadora.
            </p>
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>HUB-SUD01 (Hub Regional Sudeste):</span>
                <strong style={{ color: "#dc2626" }}>6 TOs sem viagem</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>CROSS-VALE (Vale Paraíba):</span>
                <strong style={{ color: "#dc2626" }}>4 TOs sem viagem</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>CD-CAMPINAS:</span>
                <strong style={{ color: "#dc2626" }}>2 TOs sem viagem</strong>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setIsAlertModalOpen(false)}
                style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                type="button"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================================
          MODAL 3: REGISTRO DE JUSTIFICATIVA OPERACIONAL
          ================================================================================== */}
      {isJustifyModalOpen && (
        <div
          onClick={() => setIsJustifyModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "560px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
          >
            <h3 style={{ fontSize: "16px", margin: "0 0 12px", color: "#0f172a" }}>
              Registrar Justificativa de Leftover
            </h3>

            {justificationSuccess ? (
              <div style={{ padding: "20px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", textAlign: "center", color: "#166534" }}>
                <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>✓</span>
                <strong>Justificativa gravada com sucesso!</strong>
                <p style={{ fontSize: "12px", margin: "4px 0 0" }}>Armazenada na aba <code>justificativas leftover</code> via LockService.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveJustification}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                    MOTIVO DO LEFTOVER
                  </label>
                  <select
                    value={justificationReason}
                    onChange={(e) => setJustificationReason(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
                  >
                    <option value="VEHICLE_CAPACITY">Falta de capacidade do veículo</option>
                    <option value="PACKING_DELAY">Atraso no packing / esteira</option>
                    <option value="INADEQUATE_VEHICLE">Veículo inadequado para o volume</option>
                    <option value="WRONG_LOCATION">Carga fora da localização correta no pátio</option>
                    <option value="STAGE_OUT_FAILURE">Falha na movimentação para Stage-out</option>
                    <option value="OTHER">Outro motivo operacional</option>
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                    DETALHES / PLANO DE AÇÃO
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Descreva o plano de contingência e horário de escoamento no turno seguinte..."
                    value={justificationText}
                    onChange={(e) => setJustificationText(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    onClick={() => setIsJustifyModalOpen(false)}
                    style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Salvar Justificativa
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
