/**
 * ======================================================================================
 * PROJETO: PERFORMANCE MONITOR - DASHBOARD OPERACIONAL & TELEMETRIA
 * Ambiente: Google Apps Script (Runtime V8) • Web App via HtmlService
 * Padrão: Shopee Dash Framework & GAS Best Practices
 * Resiliência: 100% Mock Safe • Mapeamento Dinâmico de Cabeçalhos • CacheService Chunking
 * ======================================================================================
 */

const CONFIG = Object.freeze({
  APP_TITLE: 'Performance Monitor | Telemetria & Produtividade',
  CACHE_VERSION: 'perf-monitor-v1.0',
  CACHE_TTL_SECONDS: 600, // 10 minutos
  CACHE_CHUNK_SIZE: 75000,
  TIMEZONE: 'America/Sao_Paulo',
  SHEET_NAMES: Object.freeze({
    KPIS: 'kpis_resumo',
    TRAFFIC: 'hourly_traffic',
    THROUGHPUT: 'zone_throughput',
    PERFORMERS: 'top_performers'
  })
});

/**
 * Ponto de entrada padrão para Web App no Google Apps Script
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(CONFIG.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Função remota chamada pelo frontend (via google.script.run)
 * Retorna os dados completos do painel (lidos da planilha ou gerados pelo motor de mock)
 */
function getPerformanceData() {
  const cacheKey = CONFIG.CACHE_VERSION + ':data';
  const cached = getChunkedCache_(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {
      console.warn('Erro ao restaurar cache:', err);
    }
  }

  let data = null;
  let isFromSpreadsheet = false;
  let activeSpreadsheet = null;

  try {
    activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    activeSpreadsheet = null;
  }

  if (activeSpreadsheet) {
    data = readDataFromSpreadsheet_(activeSpreadsheet);
    if (data && data.kpis && data.kpis.totalActions > 0) {
      isFromSpreadsheet = true;
    }
  }

  if (!isFromSpreadsheet || !data) {
    data = getMockPerformanceData_();
  }

  data.meta = {
    updatedAt: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm:ss'),
    isMock: !isFromSpreadsheet,
    version: CONFIG.CACHE_VERSION
  };

  putChunkedCache_(cacheKey, JSON.stringify(data), CONFIG.CACHE_TTL_SECONDS);
  return data;
}

/**
 * Lê os dados da planilha de forma resiliente (Dynamic Column Mapping + Batch Read)
 */
function readDataFromSpreadsheet_(ss) {
  try {
    const kpiSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.KPIS);
    const trafficSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TRAFFIC);
    const throughputSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.THROUGHPUT);
    const performersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMERS);

    if (!kpiSheet || !trafficSheet || !performersSheet) {
      return null;
    }

    // Leitura dos KPIs
    const kpiRows = readAllRowsWithHeaders_(kpiSheet);
    const kpiMap = {};
    kpiRows.forEach(r => {
      const metric = String(r.metrica || r.indicador || '').toLowerCase().trim();
      kpiMap[metric] = r.valor || r.value;
    });

    // Leitura do Hourly Traffic
    const trafficRows = readAllRowsWithHeaders_(trafficSheet);
    const trafficData = trafficRows.map(r => ({
      hour: r.hora || r.intervalo || r.time || '',
      derociless: Number(r.derociless || r.volume_primario || r.bar) || 0,
      gestStotices: Number(r.gest4abestotices || r.volume_secundario || r.line) || 0,
      peakLabel: r.peaklabel || r.pico || null
    }));

    // Leitura do Throughput por Zona
    const tpRows = readAllRowsWithHeaders_(throughputSheet);
    const throughputData = tpRows.map(r => ({
      name: r.nome || r.zona || r.zone || '',
      percentage: Number(r.percentual || r.percentage || r.taxa) || 0,
      secondaryTag: r.tag_secundaria || r.sub || '',
      gradient: r.gradiente || r.cor || 'default'
    }));

    // Leitura dos Top Performers
    const perfRows = readAllRowsWithHeaders_(performersSheet);
    const performersByZone = {
      'Zone A-1': [],
      'Zone B-2': [],
      'Zone C-3': []
    };

    perfRows.forEach(r => {
      const zone = r.zona || r.zone || 'Zone A-1';
      const item = {
        rank: Number(r.posicao || r.rank) || 1,
        name: r.nome || r.operador || 'Operador',
        role: r.cargo || r.setor || r.subtexto || '',
        score: Number(r.score || r.pontuacao || r.total) || 0,
        delta: r.delta || r.variacao || '+0%',
        avatarUrl: r.avatar || ''
      };
      if (performersByZone[zone]) {
        performersByZone[zone].push(item);
      } else {
        performersByZone[zone] = [item];
      }
    });

    return {
      kpis: {
        totalActions: Number(kpiMap['total actions'] || kpiMap['acoes']) || 4210895,
        totalActionsSub: '• Innoiantive change (days)',
        efficiencyIndex: Number(kpiMap['efficiency index'] || kpiMap['eficiencia']) || 94.2,
        activeSessions: Number(kpiMap['active sessions'] || kpiMap['sessoes']) || 12840,
        activeSessionsSub: 'Prosesxed chamge (Dape)',
        syncRate: Number(kpiMap['sync rate'] || kpiMap['sincronizacao']) || 98.7,
        syncRateSub: 'Yoss sant calage (D5%)',
        serverNodes: Number(kpiMap['server nodes'] || kpiMap['servidores']) || 1024,
        serverNodesSub: '• Excrpttive (Hpids)',
        bandwidth: kpiMap['bandwidth'] || kpiMap['largura_banda'] || '8.4 GB/s',
        bandwidthSub: 'Desa frecttive (xxpo)'
      },
      traffic: trafficData,
      throughput: throughputData,
      performers: performersByZone
    };
  } catch (err) {
    console.error('Falha ao processar dados da planilha:', err);
    return null;
  }
}

/**
 * Lê todas as linhas de uma aba mapeando dinamicamente as colunas por nome normalizado
 */
function readAllRowsWithHeaders_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const raw = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = raw[0].map(h => normalizeHeaderKey_(h));
  const rows = [];

  for (let i = 1; i < raw.length; i++) {
    const rowObj = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (key) rowObj[key] = raw[i][c];
    }
    rows.push(rowObj);
  }
  return rows;
}

function normalizeHeaderKey_(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Dados 100% Mockados e Sintéticos fiéis à imagem de referência
 */
function getMockPerformanceData_() {
  return {
    userProfile: {
      name: 'Bert Performe...',
      location: 'Donavig, 14',
      avatarInitial: 'BP'
    },
    kpis: {
      totalActions: 4210895,
      totalActionsSub: '• Innoiantive change (days)',
      efficiencyIndex: 94.2,
      activeSessions: 12840,
      activeSessionsSub: 'Prosesxed chamge (Dape)',
      syncRate: 98.7,
      syncRateSub: 'Yoss sant calage (D5%)',
      serverNodes: 1024,
      serverNodesSub: '• Excrpttive (Hpids)',
      bandwidth: '8.4 GB/s',
      bandwidthSub: 'Desa frecttive (xxpo)'
    },
    traffic: [
      { hour: 'Nov 11', derociless: 42, gestStotices: 58, peakLabel: null },
      { hour: '02h', derociless: 68, gestStotices: 64, peakLabel: '471.6K' },
      { hour: 'Jan', derociless: 48, gestStotices: 88, peakLabel: null },
      { hour: '06h', derociless: 60, gestStotices: 72, peakLabel: null },
      { hour: 'Mar', derociless: 95, gestStotices: 98, peakLabel: '172.48K' },
      { hour: '10h', derociless: 55, gestStotices: 52, peakLabel: null },
      { hour: 'Jun', derociless: 40, gestStotices: 45, peakLabel: null },
      { hour: '14h', derociless: 90, gestStotices: 92, peakLabel: '62.82K' },
      { hour: 'Apr', derociless: 35, gestStotices: 40, peakLabel: null },
      { hour: '18h', derociless: 78, gestStotices: 82, peakLabel: null }
    ],
    throughput: [
      {
        name: 'Inverted',
        percentage: 1.51,
        secondaryTag: '29ers',
        gradient: 'linear-gradient(90deg, #8b5cf6 0%, #06b6d4 50%, #10b981 100%)'
      },
      {
        name: 'Querited',
        percentage: 96,
        secondaryTag: '96%',
        gradient: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)'
      },
      {
        name: 'Venoo mcactipection',
        percentage: 110,
        secondaryTag: '88%',
        gradient: 'linear-gradient(90deg, #f97316 0%, #06b6d4 100%)'
      },
      {
        name: 'Oonrative',
        percentage: 443,
        secondaryTag: '44%',
        gradient: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)'
      },
      {
        name: 'Charge roode',
        percentage: 1.21,
        secondaryTag: '22%',
        gradient: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
      },
      {
        name: 'Apni sode',
        percentage: -10,
        secondaryTag: '-10%',
        gradient: 'linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%)'
      }
    ],
    performers: {
      'Zone A-1': [
        {
          rank: 1,
          name: 'Alex Morgan',
          role: 'Piec &Abrgin',
          score: 1283,
          delta: '+210.198% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '🥇'
        },
        {
          rank: 2,
          name: 'Elena Rostova',
          role: 'Dlena Rostoo',
          score: 1000,
          delta: '+2,876.127% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '2'
        },
        {
          rank: 3,
          name: 'Eatom Maroca',
          role: 'Takas Mamika',
          score: 189,
          delta: '+232.833% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '3'
        },
        {
          rank: 4,
          name: 'Aalia Malik',
          role: 'Farso Rora',
          score: 1171,
          delta: '+2.8.473% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '4'
        }
      ],
      'Zone B-2': [
        {
          rank: 1,
          name: 'Elena Rostova',
          role: 'Elena Rostova',
          score: 2583,
          delta: '-1213 1.08% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '🥈'
        },
        {
          rank: 2,
          name: 'Liora Choo',
          role: 'Zheo Choo',
          score: 1264,
          delta: '+2.11 198% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '2'
        },
        {
          rank: 3,
          name: 'Zofia Al-Mansour',
          role: 'Boraa Chouua',
          score: 481,
          delta: '+2.3.332% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '3'
        },
        {
          rank: 4,
          name: 'Yaliti Tanaka',
          role: 'Banla Caniaka',
          score: 2325,
          delta: '+2.63.32% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '4'
        }
      ],
      'Zone C-3': [
        {
          rank: 1,
          name: 'Alex Morgan',
          role: 'Mush Exborga',
          score: 1872,
          delta: '+2.130.181% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '1'
        },
        {
          rank: 2,
          name: 'Elena Rostova',
          role: 'Liant Sirun',
          score: 1111,
          delta: '+27/6.8.67% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '2'
        },
        {
          rank: 3,
          name: 'Zofia Al-Mansour',
          role: 'Valina Sllna',
          score: 637,
          delta: '+2.31.337% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '3'
        },
        {
          rank: 4,
          name: 'Molee Sllnn',
          role: 'Motvo Sllnn',
          score: 972,
          delta: '+35.122% ↑',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80',
          badge: '4'
        }
      ]
    }
  };
}

/**
 * Utilitário para popular a planilha ativa com a estrutura e dados mockados
 * Permite que o usuário crie as abas automaticamente se desejar testar a leitura de planilha
 */
function setupMockSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abra uma planilha do Google antes de executar o setup.');

  const mock = getMockPerformanceData_();

  // 1. Aba kpis_resumo
  let kpiSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.KPIS) || ss.insertSheet(CONFIG.SHEET_NAMES.KPIS);
  kpiSheet.clear();
  kpiSheet.appendRow(['metrica', 'valor', 'descricao']);
  kpiSheet.appendRow(['total actions', mock.kpis.totalActions, 'Total de ações de telemetria']);
  kpiSheet.appendRow(['efficiency index', mock.kpis.efficiencyIndex, 'Índice de eficiência global (%)']);
  kpiSheet.appendRow(['active sessions', mock.kpis.activeSessions, 'Sessões simultâneas ativas']);
  kpiSheet.appendRow(['sync rate', mock.kpis.syncRate, 'Taxa de sincronização de dados (%)']);
  kpiSheet.appendRow(['server nodes', mock.kpis.serverNodes, 'Nós de servidor online']);
  kpiSheet.appendRow(['bandwidth', mock.kpis.bandwidth, 'Largura de banda consumida']);

  // 2. Aba hourly_traffic
  let trSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TRAFFIC) || ss.insertSheet(CONFIG.SHEET_NAMES.TRAFFIC);
  trSheet.clear();
  trSheet.appendRow(['intervalo', 'derociless', 'gest4abestotices', 'peaklabel']);
  mock.traffic.forEach(t => trSheet.appendRow([t.hour, t.derociless, t.gestStotices, t.peakLabel || '']));

  // 3. Aba zone_throughput
  let tpSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.THROUGHPUT) || ss.insertSheet(CONFIG.SHEET_NAMES.THROUGHPUT);
  tpSheet.clear();
  tpSheet.appendRow(['zona', 'taxa', 'tag_secundaria']);
  mock.throughput.forEach(tp => tpSheet.appendRow([tp.name, tp.percentage, tp.secondaryTag]));

  // 4. Aba top_performers
  let pfSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERFORMERS) || ss.insertSheet(CONFIG.SHEET_NAMES.PERFORMERS);
  pfSheet.clear();
  pfSheet.appendRow(['zona', 'posicao', 'nome', 'cargo', 'score', 'delta', 'avatar']);
  Object.keys(mock.performers).forEach(zone => {
    mock.performers[zone].forEach(p => {
      pfSheet.appendRow([zone, p.rank, p.name, p.role, p.score, p.delta, p.avatarUrl]);
    });
  });

  return { success: true, message: 'Estrutura de tabelas e dados mockados criados com sucesso!' };
}

/**
 * CacheService com fatiamento transparente para contornar o limite de 100KB do Google
 */
function putChunkedCache_(key, dataString, ttlSeconds) {
  try {
    const cache = CacheService.getScriptCache();
    const chunkSize = CONFIG.CACHE_CHUNK_SIZE;
    const totalChunks = Math.ceil(dataString.length / chunkSize);

    cache.put(key + '_chunks', String(totalChunks), ttlSeconds);

    for (let i = 0; i < totalChunks; i++) {
      const slice = dataString.substr(i * chunkSize, chunkSize);
      cache.put(key + '_part_' + i, slice, ttlSeconds);
    }
  } catch (err) {
    console.warn('Falha no CacheService:', err);
  }
}

function getChunkedCache_(key) {
  try {
    const cache = CacheService.getScriptCache();
    const chunkCountStr = cache.get(key + '_chunks');
    if (!chunkCountStr) return null;

    const count = parseInt(chunkCountStr, 10);
    let full = '';
    for (let i = 0; i < count; i++) {
      const part = cache.get(key + '_part_' + i);
      if (!part) return null;
      full += part;
    }
    return full;
  } catch (err) {
    return null;
  }
}

