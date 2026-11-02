// AI maintenance map: shared contracts between data mappers and UI components.
// A field change must update its producer and every consumer together.
export type TripStatus = string;

export type ProgramacaoRow = {
  lh: string;
  status: TripStatus;
  ontime: string;
  vehicle: string;
  data: string;
  stdData: string;
  turno: string;
  staRaw: string;
  stdRaw: string;
  sta: string;
  std: string;
  ata: string;
  etd: string;
  dock: string;
  destino: string;
  station: string;
  driver: string;
  operator: string;
  agency: string;
  classif: string;
};

export type StageRow = {
  toNumber?: string;
  status: string;
  ilha: string;
  rua: string;
  station: string;
  area?: string;
  packName: string;
  cage?: string;
  stagedDuration?: string;
  transbordo?: string;
  minimoAdo?: string;
  spp?: number;
  tos: number;
  pacotes: number;
  packed: number;
  packing: number;
};

export type Doca = {
  numero: number;
  nome: string;
  status: "LIVRE" | "CARREGANDO" | "ESPERA";
  trip: string;
  destino: string;
  std: string;
  vehicle: string;
  toPacked: number;
  toLoaded: number;
};

export type ContagemDestino = {
  nome: string;
  station: string;
  capacidade: number;
  paletes: number;
  tos: number;
  pacotes: number;
  sacas: number;
  hora: string;
  ultimoTo: string;
  ocupacao: number;
  nivel: "critico" | "alerta" | "normal";
};

export type Insight = {
  id: string;
  tipo: string;
  prioridade: "Alta" | "Media" | "Baixa";
  titulo: string;
  insight: string;
  acao: string;
  impacto: string;
  destino: "programacao" | "stage" | "contagem" | "geral";
  lh?: string;
  station?: string;
  rua?: string;
  metrica?: string;
  valor?: string;
  peso: number;
};

export type InboundVehicle = {
  lt: string;
  origem: string;
  placa: string;
  turno: string;
  operador: string;
  driver: string;
  doca: string;
  status: string;
  processo: "Em Fila" | "Em Doca";
  tipoCarga: "Comum" | "Mista" | "Transbordo";
  pendingInboundToPackType: string;
  toTotal: string;
  pendingInboundTo: string;
  mixCounts: {
    sacasNaoTransbordo: number;
    scuttleOuPalletNaoTransbordo: number;
    sacasTransbordo: number;
    scuttleOuPalletTransbordo: number;
  };
  inboundMetrics: {
    contagemIdsSacasTransbordo: number;
    contagemIdsSacasNaoTransbordo: number;
    toScuttle: number;
    toPallet: number;
    toOthers: number;
    ordersScuttle: number;
    ordersPallet: number;
    ordersOthers: number;
    toSaca: number;
    contagemIdGNaoTransbordo: number;
    contagemIdsPOrPpNaoTransbordo: number;
    contagemIdMNaoTransbordo: number;
    contagemIdBulkyOrUltrabulkyNaoTransbordo: number;
  };
  tsQueue: number | null;
  tsUpdate: number | null;
  metaFilaMs: number;
  metaFilaFmt: string;
  metaDocaMs: number;
  metaDocaFmt: string;
  metaAwtMs: number;
  metaAwtFmt: string;
  isTransbordo: boolean;
};

export type InboundDashboard = {
  serverNowMs: number;
  veiculos: InboundVehicle[];
  resumo: {
    turno: string;
    descarregados: number;
    emFila: number;
    emDoca: number;
    transbordo: {
      desc: number;
      fila: number;
      doca: number;
    };
    fila: {
      real: number;
      meta: number;
      tReal: number;
    };
    doca: {
      real: number;
      meta: number;
      tReal: number;
    };
    total: {
      real: number;
      meta: number;
      tReal: number;
    };
  };
};

export type ProductivityRawRow = {
  opsId: string;
  nome: string;
  estacao: string;
  atividade: string;
  horasTrabalhadas: number;
  hin: string;
  hout: string;
  cutoffData: string;
  hora: string;
  esteira: string;
  shipments: number;
  turno: string;
  metaHora: number;
  key: string;
};

export type ProductivityHour = {
  hora: string;
  real: number;
  meta: number;
  gap: number;
  eficiencia: number;
};

export type ProductivityBelt = {
  esteira: string;
  real: number;
  metaAtual: number;
  metaTurno: number;
  eficiencia: number;
  horas: ProductivityHour[];
  atividades: Array<{ nome: string; qtd: number }>;
  operadores: Array<{ nome: string; qtd: number }>;
  estacoes: Array<{ nome: string; qtd: number }>;
};

export type ProductivityDashboard = {
  atualizadoEm: string;
  linhas: ProductivityRawRow[];
  filtros: {
    datas: string[];
    horas: string[];
      turnos: string[];
      esteiras: string[];
      atividades: string[];
      operadores: string[];
      estacoes: string[];
    };
    resumo: {
      real: number;
      metaAtual: number;
      metaTurno: number;
      eficiencia: number;
      esteiras: number;
    };
  horas: ProductivityHour[];
  esteiras: ProductivityBelt[];
};
