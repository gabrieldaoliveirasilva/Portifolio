import type { Doca, ProgramacaoRow, StageRow } from "./types";

export const programacao: ProgramacaoRow[] = [
  {
    lh: "TRK-BR-8912",
    status: "Loading",
    ontime: "Chegada Adiantada",
    vehicle: "TRUCK",
    data: "29/06/2026",
    stdData: "29/06/2026",
    turno: "T3",
    staRaw: "2026-06-29 00:00:00",
    stdRaw: "2026-06-29 01:00:00",
    sta: "00:00",
    std: "01:00",
    ata: "15:49",
    etd: "23:35",
    dock: "EXTERNA73",
    destino: "HUB_SP_Cumbica_01",
    station: "HUB-SP01",
    driver: "CARLOS MENDES",
    operator: "RODRIGO LIMA",
    agency: "ATLAS CARGO",
    classif: "LH_PLANNING"
  },
  {
    lh: "TRK-BR-9041",
    status: "Arrived",
    ontime: "No Prazo",
    vehicle: "CARRETA",
    data: "29/06/2026",
    stdData: "29/06/2026",
    turno: "T2",
    staRaw: "2026-06-29 21:05:00",
    stdRaw: "2026-06-29 21:30:00",
    sta: "21:05",
    std: "21:30",
    ata: "20:55",
    etd: "-",
    dock: "EXTERNA98",
    destino: "HUB_MG_Contagem_01",
    station: "HUB-MG02",
    driver: "MARCOS ANTUNES",
    operator: "ALEXANDRE SILVA",
    agency: "VANGUARD LOG",
    classif: "LH_FIELD"
  },
  {
    lh: "TRK-BR-7819",
    status: "In Queue",
    ontime: "Chegada no Prazo",
    vehicle: "CARRETA",
    data: "29/06/2026",
    stdData: "29/06/2026",
    turno: "T2",
    staRaw: "2026-06-29 21:10:00",
    stdRaw: "2026-06-29 22:00:00",
    sta: "21:10",
    std: "22:00",
    ata: "21:03",
    etd: "-",
    dock: "EXTERNA96",
    destino: "HUB_GO_Goiania_02",
    station: "HUB-GO01",
    driver: "LUCAS BARRETO",
    operator: "PENDENTE",
    agency: "LOGIPRIME",
    classif: "LH_FIELD"
  },
  {
    lh: "TRK-BR-6294",
    status: "Packed",
    ontime: "No Prazo",
    vehicle: "TRUCK",
    data: "29/06/2026",
    stdData: "29/06/2026",
    turno: "T3",
    staRaw: "2026-06-29 22:00:00",
    stdRaw: "2026-06-29 22:30:00",
    sta: "22:00",
    std: "22:30",
    ata: "-",
    etd: "-",
    dock: "-",
    destino: "HUB_PE_Recife_01",
    station: "HUB-PE01",
    driver: "FERNANDO SOUZA",
    operator: "PENDENTE",
    agency: "TRANSGLOBAL",
    classif: "LH_PLANNING"
  }
];

export const stageRows: StageRow[] = [
  { toNumber: "TO20260601", status: "Packed", ilha: "ALOCADO", rua: "A-01", station: "HUB-PE01", area: "Azul e Branco", packName: "Saca", cage: "-", stagedDuration: "42,8h", transbordo: "Nao", spp: 16.4, tos: 249, pacotes: 4077, packed: 249, packing: 0 },
  { toNumber: "TO20260602", status: "Packed", ilha: "ALOCADO", rua: "A-01", station: "HUB-PE01", area: "Azul e Branco", packName: "Scuttle", cage: "-", stagedDuration: "40,1h", transbordo: "Nao", spp: 23.4, tos: 77, pacotes: 1800, packed: 77, packing: 0 },
  { toNumber: "TO20260603", status: "Packing", ilha: "ALOCADO", rua: "B-03", station: "HUB-GO01", area: "Verde e Branco", packName: "Scuttle", cage: "-", stagedDuration: "18,5h", transbordo: "Nao", spp: 22.8, tos: 42, pacotes: 956, packed: 0, packing: 42 },
  { toNumber: "TO20260604", status: "Packed", ilha: "ALOCADO", rua: "B-03", station: "HUB-BA01", area: "Verde e Branco", packName: "Saca", cage: "-", stagedDuration: "12,3h", transbordo: "Nao", spp: 19, tos: 63, pacotes: 1200, packed: 63, packing: 0 },
  { toNumber: "TO20260605", status: "Packed", ilha: "PENDENTE", rua: "C-07", station: "HUB-MG02", area: "Amarelo", packName: "Volumoso", cage: "-", stagedDuration: "60,7h", transbordo: "Nao", spp: 18.2, tos: 17, pacotes: 310, packed: 17, packing: 0 }
];

export const docas: Doca[] = Array.from({ length: 30 }, (_, index) => {
  const numero = index + 70;
  const viagem = programacao.find((row) => row.dock === `EXTERNA${numero}`);
  const status = viagem?.status === "Loading" ? "CARREGANDO" : viagem ? "ESPERA" : "LIVRE";

  return {
    numero,
    nome: `EXTERNA${numero}`,
    status,
    trip: viagem?.lh ?? "",
    destino: viagem?.destino ?? "",
    std: viagem?.std ?? "-",
    vehicle: viagem?.vehicle ?? "",
    toPacked: viagem ? 32 : 0,
    toLoaded: viagem?.status === "Loading" ? 17 : 0
  };
});
