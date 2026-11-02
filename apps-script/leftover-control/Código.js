/**
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
 * Mock data para execução independente / demonstração sem planilha vinculada
 */
const MOCK_DESTINATIONS = [
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

const MOCK_HISTORY = [
  { trip: "LH-TRIP-98380", dest: "CD-LITORAL", shift: "T1", veh: "TOCO", loaded: 14, leftover: 1, status: "Justificada", reason: "Falta de capacidade física do veículo" },
  { trip: "LH-TRIP-98365", dest: "HUB-SUD01", shift: "T1", veh: "CARRETA", loaded: 28, leftover: 4, status: "Justificada", reason: "Atraso na liberação do packing" },
  { trip: "LH-TRIP-98350", dest: "CD-CAMPINAS", shift: "T1", veh: "TRUCK", loaded: 16, leftover: 0, status: "Sem Sobra", reason: "Operação 100% escoada" },
  { trip: "LH-TRIP-98335", dest: "CROSS-VALE", shift: "T3 (Ontem)", veh: "TOCO", loaded: 14, leftover: 3, status: "Pendente", reason: "Aguardando aprovação de supervisão" },
  { trip: "LH-TRIP-98320", dest: "HUB-CAPITAL", shift: "T3 (Ontem)", veh: "CARRETA", loaded: 28, leftover: 0, status: "Sem Sobra", reason: "Operação 100% escoada" }
];

/**
 * Ponto de entrada do Web App (HtmlService)
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  template.initialView = e?.parameter?.view === 'historico' ? 'historico' : 'monitoramento';
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
  let spreadsheet = null;
  try {
    spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    // Standalone script
  }

  const cacheKey = 'leftover-dash:' + LEFTOVER_CONFIG.CACHE_VERSION + ':' + (spreadsheet ? spreadsheet.getId() : 'standalone');

  if (forceRefresh !== true) {
    const cached = readDashboardCache_(cacheKey);
    if (cached) return cached;
  }

  // Prevenção de Concorrência via LockService
  const lock = LockService.getScriptLock();
  const locked = lock.tryLock(8000);

  try {
    if (forceRefresh !== true) {
      const cachedAfterLock = readDashboardCache_(cacheKey);
      if (cachedAfterLock) return cachedAfterLock;
    }

    let payload = null;

    if (spreadsheet) {
      try {
        const tripSheet = spreadsheet.getSheetByName(LEFTOVER_CONFIG.SHEETS.TRIPS);
        const packedSheet = spreadsheet.getSheetByName(LEFTOVER_CONFIG.SHEETS.PACKED);

        if (tripSheet && packedSheet) {
          const tripValues = tripSheet.getDataRange().getValues();
          const packedValues = packedSheet.getDataRange().getValues();
          payload = buildDashboardFromTables_(tripValues, packedValues);
        }
      } catch (err) {
        console.warn('Erro ao processar dados da planilha: ' + err.message);
      }
    }

    if (!payload) {
      payload = {
        destinations: MOCK_DESTINATIONS,
        history: MOCK_HISTORY,
        updatedAt: Utilities.formatDate(new Date(), LEFTOVER_CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm:ss"),
        isMock: !spreadsheet
      };
    }

    // Gravação em cache com particionamento de chunks de 70KB
    writeDashboardCache_(cacheKey, payload);
    return payload;
  } finally {
    if (locked) lock.releaseLock();
  }
}

/**
 * Gravação de justificativa com LockService
 */
function saveJustification(payload) {
  const lock = LockService.getScriptLock();
  const locked = lock.tryLock(10000);
  if (!locked) {
    throw new Error('Servidor ocupado por outra transação. Tente novamente em instantes.');
  }

  try {
    let recorded = false;
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (spreadsheet) {
        let sheet = spreadsheet.getSheetByName(LEFTOVER_CONFIG.SHEETS.JUSTIFICATIONS);
        if (!sheet) {
          sheet = spreadsheet.insertSheet(LEFTOVER_CONFIG.SHEETS.JUSTIFICATIONS);
          sheet.appendRow(['Data/Hora', 'Usuário', 'Destino/Trip', 'Motivo', 'Plano de Ação']);
        }
        sheet.appendRow([
          new Date(),
          Session.getActiveUser().getEmail() || 'Operador',
          payload.destination || 'N/A',
          payload.reason || '',
          payload.text || ''
        ]);
        SpreadsheetApp.flush();
        recorded = true;
      }
    } catch (e) {
      console.warn('Erro ao salvar na planilha: ' + e.message);
    }

    // Limpa cache para refletir no painel
    const cacheKey = 'leftover-dash:' + LEFTOVER_CONFIG.CACHE_VERSION + ':*';
    try {
      CacheService.getScriptCache().remove(cacheKey);
    } catch (ignore) {}

    return {
      success: true,
      recordedInSheet: recorded,
      timestamp: Utilities.formatDate(new Date(), LEFTOVER_CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm:ss")
    };
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

/**
 * Lê e reconstitui o payload do CacheService particionado
 */
function readDashboardCache_(baseKey) {
  try {
    const cache = CacheService.getScriptCache();
    const metaStr = cache.get(baseKey + ':meta');
    if (!metaStr) return null;

    const meta = JSON.parse(metaStr);
    const keys = [];
    for (let i = 0; i < meta.chunks; i++) {
      keys.push(baseKey + ':chunk:' + i);
    }

    const chunkMap = cache.getAll(keys);
    let fullJson = '';
    for (let i = 0; i < meta.chunks; i++) {
      const chunk = chunkMap[baseKey + ':chunk:' + i];
      if (!chunk) return null;
      fullJson += chunk;
    }

    return JSON.parse(fullJson);
  } catch (err) {
    console.warn('Erro ao ler cache: ' + err.message);
    return null;
  }
}

