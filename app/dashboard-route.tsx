// AI maintenance map: this is the server-side dispatcher for Gerencial routes.
// Add UI in dashboard-shell; add calculations in the matching lib module.
// See AI_EDITING_GUIDE.md before changing a tab/data-loading branch.
import DashboardShell from "@/components/dashboard-shell";
import type { DashboardTab } from "@/components/dashboard-shell";
import {
  getContagem,
  getContagemReal,
  getDocas,
  getDocasReal,
  getInbound,
  getInboundReal,
  getStageInReal,
  getInteligencia,
  getInteligenciaReal,
  getPainel,
  getPainelReal,
  getProgramacao,
  getProgramacaoReal,
  getStageOut,
  getStageOutReal
} from "@/lib/dashboard";
import { emptyHistoricoOutboundData, getHistoricoOutboundData } from "@/lib/historico-outbound";
import { emptyHistoricoInboundData, getHistoricoInboundData } from "@/lib/historico-inbound";
import { emptyHistoricoPackingData, getHistoricoPackingData } from "@/lib/historico-packing";
import { getProductivityReal } from "@/lib/productivity";
import { getTesteData } from "@/lib/teste";
import type { TesteData } from "@/lib/teste";
import { clearSheetCacheWarnings, getSheetCacheWarnings } from "@/lib/data-source";
import type { ProductivityDashboard } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 60;

function emptyProductivity(): ProductivityDashboard {
  return {
    atualizadoEm: "",
    linhas: [],
    filtros: {
      datas: [],
      horas: [],
      turnos: [],
      esteiras: [],
      atividades: [],
      operadores: [],
      estacoes: []
    },
    resumo: {
      real: 0,
      metaAtual: 0,
      metaTurno: 0,
      eficiencia: 0,
      esteiras: 0
    },
    horas: [],
    esteiras: []
  };
}

function emptyTeste(): TesteData {
  return {
    titulo: "Teste",
    descricao: "Acompanhamento GEROT - MG4",
    atualizadoEm: "",
    periodos: [],
    filtros: {
      clusters: [],
      frentes: [],
      pilares: [],
      kpis: [],
      aberturas: [],
      periodos: []
    },
    linhas: []
  };
}

export type DashboardSearchParams = Record<string, string | string[] | undefined>;

export function isForceRefresh(searchParams?: DashboardSearchParams) {
  return Boolean(searchParams?.refresh);
}

export async function DashboardRoute({ tab, forceRefresh = false }: { tab: DashboardTab; forceRefresh?: boolean }) {
  clearSheetCacheWarnings();
  let painel = getPainel();
  let programacao = getProgramacao();
  let stage = getStageOut();
  let docas = getDocas();
  let contagem = getContagem();
  let inteligencia = getInteligencia();
  let inbound = getInbound();
  let productivity = emptyProductivity();
  let historicoOutbound = emptyHistoricoOutboundData();
  let historicoInbound = emptyHistoricoInboundData();
  let historicoPacking = emptyHistoricoPackingData();
  let teste = emptyTeste();
  const readOptions = { forceRefresh };

  if (tab === "stageIn") {
    inbound = await getStageInReal(readOptions);
  }

  if (tab === "inbound") {
    inbound = await getInboundReal(readOptions);
  }

  if (tab === "nova" || tab === "produtividade") {
    productivity = await getProductivityReal(readOptions);
  }

  if (tab === "programacao") {
    [programacao, stage] = await Promise.all([getProgramacaoReal(readOptions), getStageOutReal(readOptions)]);
  }

  if (tab === "geral") {
    [painel, programacao] = await Promise.all([getPainelReal(readOptions), getProgramacaoReal(readOptions)]);
  }

  if (tab === "docas") {
    docas = await getDocasReal(readOptions);
  }

  if (tab === "contagem") {
    contagem = await getContagemReal(readOptions);
  }

  if (tab === "stage") {
    stage = await getStageOutReal(readOptions);
  }

  if (tab === "inteligencia") {
    inteligencia = await getInteligenciaReal(readOptions);
  }

  if (tab === "historicoOutbound") {
    historicoOutbound = await getHistoricoOutboundData(readOptions);
  }

  if (tab === "historicoInbound") {
    historicoInbound = await getHistoricoInboundData(readOptions);
  }

  if (tab === "historico") {
    historicoPacking = await getHistoricoPackingData({}, readOptions);
  }

  if (tab === "teste") {
    teste = await getTesteData(readOptions);
  }

  return (
    <DashboardShell
      contagem={contagem}
      docas={docas}
      historicoInbound={historicoInbound}
      historicoOutbound={historicoOutbound}
      historicoPacking={historicoPacking}
      inbound={inbound}
      inteligencia={inteligencia}
      painel={painel}
      productivity={productivity}
      programacao={programacao}
      stage={stage}
      teste={teste}
      initialTab={tab}
      cacheWarnings={getSheetCacheWarnings()}
    />
  );
}
