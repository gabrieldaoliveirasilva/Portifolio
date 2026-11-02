"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SqlProjectViewProps {
  onBackToCapa?: () => void;
}

export default function SqlProjectView({ onBackToCapa }: SqlProjectViewProps = {}) {
  const router = useRouter();
  const [activeQuery, setActiveQuery] = useState<"query1" | "query2">("query1");
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);
  const [activeAnalysisTab1, setActiveAnalysisTab1] = useState<"all" | "cte" | "join" | "performance">("all");
  const [activeAnalysisTab2, setActiveAnalysisTab2] = useState<"all" | "volumetry" | "yard" | "analytics">("all");

  // ====================================================================================
  // QUERY 1: RASTREABILIDADE & PRODUTIVIDADE EM ESTEIRAS
  // ====================================================================================
  const sanitizedSqlQuery1 = `-- ======================================================================================
-- QUERY 1: Rastreabilidade Operacional & Produtividade Homem-Hora em Postos de Embalagem
-- Dialeto: Trino / Presto / BigQuery (ANSI SQL compatível com Data Lakes Corporativos)
-- Objetivo: Normalização de operador via Regex, cruzamento de telemetria horária de esteiras
--           e extração de volumetria de packing com otimização de custo por particionamento.
-- Compliance: Nomes de tabelas, identificadores de hub e domínios de negócio 100% sanitizados.
-- ======================================================================================

WITH op_mapping AS (
  -- CTE de Mapeamento: Normaliza o identificador do operador através de Regex
  -- e garante cardinalidade estrita 1:1 via agregação, evitando duplicação no JOIN
  SELECT
    LOWER(REGEXP_EXTRACT(operator, '\\[([A-Za-z0-9]+)\\]', 1)) AS operator_id_clean,
    MAX(operator) AS operator
  FROM logistics_dw.fct_order_tracking_events
  WHERE station_id = 10401 -- Identificador numérico do Hub Regional
    -- Otimização Crítica (Partition Pruning): limita varredura aos últimos 20 dias,
    -- eliminando o Full Table Scan sobre terabytes de histórico do Data Lake
    AND DATE(dt_partition) >= CURRENT_DATE - INTERVAL '20' DAY
    AND operator IS NOT NULL
    AND operator <> ''
    AND REGEXP_LIKE(operator, '\\[([A-Za-z0-9]+)\\]')
  GROUP BY 1
)

SELECT
  q1.date,
  q1.station_name,
  q1.workstation_id,
  q1.workstation_id_corp,
  q1.workstation_name,
  q1.ws_process,
  q1.ws_subprocess,
  q1.ws_local,
  q1._hour,
  EXTRACT(HOUR FROM q1._hour) AS apenas_hora, -- Engenharia de features: hora inteira (0-23) para curvas intradiárias
  q1.operator_id,
  op.operator,                                -- Nome canônico do operador enriquecido via CTE
  q1.operator_email,
  q1.packing                                  -- Throughput de pacotes embalados na hora
FROM analytics_ops.fct_workstation_adherence_hourly q1
LEFT JOIN op_mapping op
  ON LOWER(q1.operator_id) = op.operator_id_clean
WHERE q1.station_name = 'HUB_REGIONAL_SUDESTE'
  -- Janela Temporal Dinâmica com Timezone fixo (America/Sao_Paulo / UTC-3):
  -- D-15 até antes da meia-noite de hoje, protegendo contra divergências de fuso da nuvem
  AND q1._hour >= DATE(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '15' DAY
  AND q1._hour < DATE(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
  AND q1.packing > 0               -- Elimina postos inativos ou horas ociosas sem produção
  AND q1.ws_local LIKE '%esteira%' -- Filtro de escopo estrito nas esteiras físicas de embalagem
ORDER BY
  q1._hour DESC;
`;

  // ====================================================================================
  // QUERY 2: LINEHAUL TRIP OPERATIONS, VOLUMETRIA & SLAS DE PÁTIO
  // ====================================================================================
  const sanitizedSqlQuery2 = `-- ======================================================================================
-- QUERY 2: Gestão de Malha de Transferência (Linehaul), Volumetria, Clusters & SLA P95
-- Dialeto: Trino / Presto / BigQuery (ANSI SQL compatível com Data Lakes Corporativos)
-- Objetivo: Pipeline analítico com 8 CTEs encadeadas para volumetria por tipo de embalagem
--           (Sacas, Scuttles, Pallets), clusterização de densidade de pacotes, rastreamento
--           de ciclo de vida de carretas no pátio e cálculo de percentil 95 de tempo de descarga.
-- Compliance: Tabelas 'orders_shipments_linehaul', 'lh_trip_rt', hubs e SLAs 100% sanitizados.
-- ======================================================================================

-- CTE 1: Base de envios e pacotes associados a manifestos de transferência
WITH shipment_base AS (
  SELECT
    lh_trip_ro,
    to_number,
    shipment_id,
    pack_name,
    COALESCE(TRY_CAST(is_planned_transshipment_next AS INTEGER), 0) AS is_planned_transshipment_next
  FROM logistics_dw.fct_shipment_linehaul_manifest
  WHERE lh_trip_ro IS NOT NULL
)

-- CTE 2: Agrupamento no grão Viagem x Ordem de Transporte (TO) com contagem de pacotes
, to_volume AS (
  SELECT
    lh_trip_ro,
    to_number,
    MAX(is_planned_transshipment_next) AS is_planned_transshipment_next,
    COUNT(shipment_id) AS pacote_qtd
  FROM shipment_base
  WHERE to_number IS NOT NULL
  GROUP BY lh_trip_ro, to_number
)

-- CTE 3: Pivotagem condicional por tipo de embalagem (Saca, Scuttle, Pallet, Vazias) e transbordo
, order_counts AS (
  SELECT
    lh_trip_ro,
    -- Contagens de TOs e IDs por tipo de embalagem física
    COUNT(DISTINCT CASE WHEN pack_name IN ('Saca', 'Saca Sorter') THEN to_number END) AS contagem_tos_sacas,
    COUNT(DISTINCT CASE WHEN pack_name IN ('Scuttle', 'Pallet') THEN to_number END) AS contagem_tos_scuttle_or_pallet,
    COUNT(DISTINCT CASE WHEN pack_name IS NULL OR pack_name = '' THEN to_number END) AS contagem_tos_vazias,
    COUNT(CASE WHEN pack_name IN ('Saca', 'Saca Sorter') THEN shipment_id END) AS contagem_ids_sacas,
    COUNT(CASE WHEN pack_name IN ('Scuttle', 'Pallet') THEN shipment_id END) AS contagem_ids_scuttle_or_pallets,
    COUNT(CASE WHEN pack_name IS NULL OR pack_name = '' THEN shipment_id END) AS contagem_ids_vazias,
    -- Segmentação: Cargas Diretas (Sem Transbordo = 0)
    COUNT(DISTINCT CASE WHEN pack_name IN ('Saca', 'Saca Sorter') AND is_planned_transshipment_next = 0 THEN to_number END) AS contagem_tos_sacas_nao_transbordo,
    COUNT(DISTINCT CASE WHEN pack_name IN ('Scuttle', 'Pallet') AND is_planned_transshipment_next = 0 THEN to_number END) AS contagem_tos_scuttle_or_pallet_nao_transbordo,
    COUNT(DISTINCT CASE WHEN (pack_name IS NULL OR pack_name = '') AND is_planned_transshipment_next = 0 THEN to_number END) AS contagem_tos_vazias_nao_transbordo,
    COUNT(CASE WHEN pack_name IN ('Saca', 'Saca Sorter') AND is_planned_transshipment_next = 0 THEN shipment_id END) AS contagem_ids_sacas_nao_transbordo,
    COUNT(CASE WHEN pack_name IN ('Scuttle', 'Pallet') AND is_planned_transshipment_next = 0 THEN shipment_id END) AS contagem_ids_scuttle_or_pallets_nao_transbordo,
    COUNT(CASE WHEN (pack_name IS NULL OR pack_name = '') AND is_planned_transshipment_next = 0 THEN shipment_id END) AS contagem_ids_vazias_nao_transbordo,
    -- Segmentação: Cargas com Transbordo Planejado (= 1)
    COUNT(DISTINCT CASE WHEN pack_name IN ('Saca', 'Saca Sorter') AND is_planned_transshipment_next = 1 THEN to_number END) AS contagem_tos_sacas_transbordo,
    COUNT(DISTINCT CASE WHEN pack_name IN ('Scuttle', 'Pallet') AND is_planned_transshipment_next = 1 THEN to_number END) AS contagem_tos_scuttle_or_pallet_transbordo,
    COUNT(DISTINCT CASE WHEN (pack_name IS NULL OR pack_name = '') AND is_planned_transshipment_next = 1 THEN to_number END) AS contagem_tos_vazias_transbordo,
    COUNT(CASE WHEN pack_name IN ('Saca', 'Saca Sorter') AND is_planned_transshipment_next = 1 THEN shipment_id END) AS contagem_ids_sacas_transbordo,
    COUNT(CASE WHEN pack_name IN ('Scuttle', 'Pallet') AND is_planned_transshipment_next = 1 THEN shipment_id END) AS contagem_ids_scuttle_or_pallets_transbordo,
    COUNT(CASE WHEN (pack_name IS NULL OR pack_name = '') AND is_planned_transshipment_next = 1 THEN shipment_id END) AS contagem_ids_vazias_transbordo
  FROM shipment_base
  GROUP BY lh_trip_ro
)

-- CTE 4: Clusterização matricial de densidade (0-30, 31-50, 51-100, 101-200, 200+ pacotes por TO)
, to_volume_counts AS (
  SELECT
    lh_trip_ro,
    -- Cluster 0 a 30 pacotes por TO
    COUNT(CASE WHEN pacote_qtd <= 30 AND is_planned_transshipment_next = 0 THEN to_number END) AS spp_cluster_0_30_tos_nao_transbordo,
    COUNT(CASE WHEN pacote_qtd <= 30 AND is_planned_transshipment_next = 1 THEN to_number END) AS spp_cluster_0_30_tos_transbordo,
    SUM(CASE WHEN pacote_qtd <= 30 AND is_planned_transshipment_next = 0 THEN pacote_qtd ELSE 0 END) AS spp_cluster_0_30_pacotes_nao_transbordo,
    SUM(CASE WHEN pacote_qtd <= 30 AND is_planned_transshipment_next = 1 THEN pacote_qtd ELSE 0 END) AS spp_cluster_0_30_pacotes_transbordo,

    -- Cluster 31 a 50 pacotes por TO
    COUNT(CASE WHEN pacote_qtd > 30 AND pacote_qtd <= 50 AND is_planned_transshipment_next = 0 THEN to_number END) AS spp_cluster_31_50_tos_nao_transbordo,
    COUNT(CASE WHEN pacote_qtd > 30 AND pacote_qtd <= 50 AND is_planned_transshipment_next = 1 THEN to_number END) AS spp_cluster_31_50_tos_transbordo,
    SUM(CASE WHEN pacote_qtd > 30 AND pacote_qtd <= 50 AND is_planned_transshipment_next = 0 THEN pacote_qtd ELSE 0 END) AS spp_cluster_31_50_pacotes_nao_transbordo,
    SUM(CASE WHEN pacote_qtd > 30 AND pacote_qtd <= 50 AND is_planned_transshipment_next = 1 THEN pacote_qtd ELSE 0 END) AS spp_cluster_31_50_pacotes_transbordo,

    -- Cluster 51 a 100 pacotes por TO
    COUNT(CASE WHEN pacote_qtd > 50 AND pacote_qtd <= 100 AND is_planned_transshipment_next = 0 THEN to_number END) AS spp_cluster_51_100_tos_nao_transbordo,
    COUNT(CASE WHEN pacote_qtd > 50 AND pacote_qtd <= 100 AND is_planned_transshipment_next = 1 THEN to_number END) AS spp_cluster_51_100_tos_transbordo,
    SUM(CASE WHEN pacote_qtd > 50 AND pacote_qtd <= 100 AND is_planned_transshipment_next = 0 THEN pacote_qtd ELSE 0 END) AS spp_cluster_51_100_pacotes_nao_transbordo,
    SUM(CASE WHEN pacote_qtd > 50 AND pacote_qtd <= 100 AND is_planned_transshipment_next = 1 THEN pacote_qtd ELSE 0 END) AS spp_cluster_51_100_pacotes_transbordo,

    -- Cluster 101 a 200 pacotes por TO
    COUNT(CASE WHEN pacote_qtd > 100 AND pacote_qtd <= 200 AND is_planned_transshipment_next = 0 THEN to_number END) AS spp_cluster_101_200_tos_nao_transbordo,
    COUNT(CASE WHEN pacote_qtd > 100 AND pacote_qtd <= 200 AND is_planned_transshipment_next = 1 THEN to_number END) AS spp_cluster_101_200_tos_transbordo,
    SUM(CASE WHEN pacote_qtd > 100 AND pacote_qtd <= 200 AND is_planned_transshipment_next = 0 THEN pacote_qtd ELSE 0 END) AS spp_cluster_101_200_pacotes_nao_transbordo,
    SUM(CASE WHEN pacote_qtd > 100 AND pacote_qtd <= 200 AND is_planned_transshipment_next = 1 THEN pacote_qtd ELSE 0 END) AS spp_cluster_101_200_pacotes_transbordo,

    -- Cluster 200+ pacotes por TO
    COUNT(CASE WHEN pacote_qtd > 200 AND is_planned_transshipment_next = 0 THEN to_number END) AS spp_cluster_200_plus_tos_nao_transbordo,
    COUNT(CASE WHEN pacote_qtd > 200 AND is_planned_transshipment_next = 1 THEN to_number END) AS spp_cluster_200_plus_tos_transbordo,
    SUM(CASE WHEN pacote_qtd > 200 AND is_planned_transshipment_next = 0 THEN pacote_qtd ELSE 0 END) AS spp_cluster_200_plus_pacotes_nao_transbordo,
    SUM(CASE WHEN pacote_qtd > 200 AND is_planned_transshipment_next = 1 THEN pacote_qtd ELSE 0 END) AS spp_cluster_200_plus_pacotes_transbordo
  FROM to_volume
  GROUP BY lh_trip_ro
)

-- CTE 5: Deduplicação de carimbo de rompimento de lacre (Unseal) via ROW_NUMBER()
, unseal_data AS (
  SELECT
    trip_number,
    unseal_datestamp
  FROM (
    SELECT
      trip_number,
      unseal_datestamp,
      ROW_NUMBER() OVER(PARTITION BY trip_number ORDER BY unseal_datestamp DESC) AS rn
    FROM logistics_dw.fct_trip_station_events
    WHERE station_id = 10401 -- Hub Regional
  )
  WHERE rn = 1
)

-- CTE 6: Fato da viagem com parsing de volumetria em JSON, timestamps de trajeto e status de SLA
, t AS (
  SELECT
    TRY(DATE(t_base.orig_sta)) AS sta_origin_date
    ,CASE WHEN t_base.trip_status_group = 'Completed' THEN 'FECHADA' ELSE 'ABERTA' END AS status_agrupado
    ,t_base.solicitation_by
    ,t_base.trip_mode
    ,t_base.trip_number
    ,t_base.driver_id
    ,t_base.planned_agency
    ,t_base.used_agency AS used_agency_name
    ,t_base.orig_station_code AS origin_station_code
    ,t_base.dest_station_code AS destination_station_code
    ,t_base.vehicle_number
    ,t_base.planned_vehicle
    ,t_base.used_vehicle
    ,t_base.loaded_orders AS total_orders
    -- Extração cirúrgica de métricas de cubagem a partir de colunas JSON semiestruturadas
    ,CAST(TRY_CAST(json_extract_scalar(t_base.volumetry_details, '$.loaded_orders_saca')    AS DOUBLE) AS BIGINT) AS orders_saca
    ,CAST(TRY_CAST(json_extract_scalar(t_base.volumetry_details, '$.loaded_orders_scuttle') AS DOUBLE) AS BIGINT) AS orders_scuttle
    ,CAST(TRY_CAST(json_extract_scalar(t_base.volumetry_details, '$.loaded_orders_pallet')  AS DOUBLE) AS BIGINT) AS orders_pallet
    ,CAST(TRY_CAST(json_extract_scalar(t_base.volumetry_details, '$.loaded_orders_others')  AS DOUBLE) AS BIGINT) AS orders_others
    ,CAST(TRY_CAST(json_extract_scalar(t_base.volumetry_details, '$.loaded_to_saca')        AS DOUBLE) AS BIGINT) AS to_saca
    ,CAST(TRY_CAST(json_extract_scalar(t_base.volumetry_details, '$.loaded_to_scuttle')     AS DOUBLE) AS BIGINT) AS to_scuttle
    ,CAST(TRY_CAST(json_extract_scalar(t_base.volumetry_details, '$.loaded_to_pallet')      AS DOUBLE) AS BIGINT) AS to_pallet
    ,CAST(TRY_CAST(json_extract_scalar(t_base.volumetry_details, '$.loaded_to_others')      AS DOUBLE) AS BIGINT) AS to_others
    ,t_base.loaded_to AS to_total
    ,TRY_CAST(t_base.orig_sta AS TIMESTAMP) AS chegada_planejada_origem
    ,TRY_CAST(t_base.orig_std AS TIMESTAMP) AS partida_planejada_origem
    ,TRY_CAST(t_base.dest_unloaded_time AS TIMESTAMP) AS unloaded_datetime
    ,t_base.orig_status_std AS status_cpt
    ,t_base.dest_status_sta AS status_eta_destino
    ,t_base.cancel_reason
    ,CAST(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' AS TIMESTAMP) AS latest_update
    -- Resolução de datas de pátio via COALESCE entre telemetria em tempo real e log transacional
    ,COALESCE(TRY_CAST(s.unseal_datestamp AS TIMESTAMP), TRY_CAST(t_base.dest_unseal_time AS TIMESTAMP)) AS unseal_datetime
    ,COALESCE(TRY_CAST(d.start_station_atd_datestamp AS TIMESTAMP), TRY_CAST(t_base.orig_atd AS TIMESTAMP)) AS partida_realizada_origem
    ,COALESCE(TRY_CAST(d.start_station_ata_datestamp AS TIMESTAMP), TRY_CAST(t_base.orig_ata AS TIMESTAMP)) AS chegada_realizada_origem
    ,COALESCE(TRY_CAST(d.end_station_sta_datestamp AS TIMESTAMP), TRY_CAST(COALESCE(t_base.dest_sta_edited, t_base.dest_sta) AS TIMESTAMP)) AS chegada_planejada_destino
    ,COALESCE(TRY_CAST(d.end_station_ata_datestamp AS TIMESTAMP), TRY_CAST(t_base.dest_ata AS TIMESTAMP)) AS chegada_realizada_destino
    ,COALESCE(TRY_CAST(FROM_UNIXTIME(d.trip_completed_time - 39600) AS TIMESTAMP), TRY_CAST(t_base.dest_unloaded_time AS TIMESTAMP)) AS horario_de_descarga
  FROM logistics_dw.vw_linehaul_trip_realtime t_base
  LEFT JOIN logistics_dw.fct_linehaul_trips d ON t_base.trip_number = d.trip_number
  LEFT JOIN unseal_data s ON t_base.trip_number = s.trip_number
  WHERE
    TRY(DATE(t_base.orig_sta)) BETWEEN CAST(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' AS DATE) - INTERVAL '200' DAY
                                   AND CAST(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' AS DATE) + INTERVAL '7' DAY
    AND t_base.dest_station_code = 'HUB-SUD01'
    AND COALESCE(t_base.used_agency, '') NOT IN ('LH - Transferência interna')
    AND COALESCE(t_base.planned_agency, '') NOT IN ('LH - Transferência interna')
    AND NULLIF(TRIM(t_base.used_agency), '') IS NOT NULL
    AND COALESCE(t_base.trip_status_group, '') NOT IN ('Cancelled', 'Auto Cancel', 'Deleted', 'No show', 'Fruitless')
    AND (COALESCE(CAST(t_base.driver_id AS VARCHAR), '') NOT IN ('0', '') OR TRY(DATE(t_base.orig_sta)) > CAST(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' AS DATE))
)

-- CTE 7: Integração de métricas de descarga, classificação do status no pátio e ajuste de turno (corte 6h)
, final AS (
  SELECT
    t.*
    ,oc.contagem_tos_sacas
    ,oc.contagem_tos_scuttle_or_pallet
    ,oc.contagem_tos_vazias
    ,oc.contagem_ids_sacas
    ,oc.contagem_ids_scuttle_or_pallets
    ,oc.contagem_ids_vazias
    ,oc.contagem_tos_sacas_nao_transbordo
    ,oc.contagem_tos_scuttle_or_pallet_nao_transbordo
    ,oc.contagem_tos_vazias_nao_transbordo
    ,oc.contagem_ids_sacas_nao_transbordo
    ,oc.contagem_ids_scuttle_or_pallets_nao_transbordo
    ,oc.contagem_ids_vazias_nao_transbordo
    ,oc.contagem_tos_sacas_transbordo
    ,oc.contagem_tos_scuttle_or_pallet_transbordo
    ,oc.contagem_tos_vazias_transbordo
    ,oc.contagem_ids_sacas_transbordo
    ,oc.contagem_ids_scuttle_or_pallets_transbordo
    ,oc.contagem_ids_vazias_transbordo
    ,tvc.spp_cluster_0_30_tos_nao_transbordo
    ,tvc.spp_cluster_0_30_tos_transbordo
    ,tvc.spp_cluster_0_30_pacotes_nao_transbordo
    ,tvc.spp_cluster_0_30_pacotes_transbordo
    ,tvc.spp_cluster_31_50_tos_nao_transbordo
    ,tvc.spp_cluster_31_50_tos_transbordo
    ,tvc.spp_cluster_31_50_pacotes_nao_transbordo
    ,tvc.spp_cluster_31_50_pacotes_transbordo
    ,tvc.spp_cluster_51_100_tos_nao_transbordo
    ,tvc.spp_cluster_51_100_tos_transbordo
    ,tvc.spp_cluster_51_100_pacotes_nao_transbordo
    ,tvc.spp_cluster_51_100_pacotes_transbordo
    ,tvc.spp_cluster_101_200_tos_nao_transbordo
    ,tvc.spp_cluster_101_200_tos_transbordo
    ,tvc.spp_cluster_101_200_pacotes_nao_transbordo
    ,tvc.spp_cluster_101_200_pacotes_transbordo
    ,tvc.spp_cluster_200_plus_tos_nao_transbordo
    ,tvc.spp_cluster_200_plus_tos_transbordo
    ,tvc.spp_cluster_200_plus_pacotes_nao_transbordo
    ,tvc.spp_cluster_200_plus_pacotes_transbordo
    -- Tempo de descarga em horas a partir da chegada no destino
    ,CASE
      WHEN chegada_realizada_destino IS NULL THEN NULL
      WHEN (CASE
        WHEN sta_origin_date IS NULL THEN NULL
        WHEN status_agrupado = 'ABERTA' AND chegada_realizada_destino IS NOT NULL AND unseal_datetime IS NULL AND horario_de_descarga IS NULL THEN 'FILA'
        WHEN status_agrupado = 'ABERTA' AND chegada_realizada_destino IS NULL AND unseal_datetime IS NULL THEN 'TRAJETO'
        ELSE 'INICIOU DESC'
      END) = 'INICIOU DESC' AND horario_de_descarga IS NULL THEN NULL
      ELSE DATE_DIFF('minute', chegada_realizada_destino, COALESCE(horario_de_descarga, CAST(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' AS TIMESTAMP))) / 60.00
    END AS tempo_descarga_horas
    -- Ajuste Operacional de 6h (O dia logístico inicia às 06:00; eventos anteriores pertencem à data D-1)
    ,CASE WHEN HOUR(CAST(chegada_realizada_destino AS TIMESTAMP)) < 6 THEN DATE(chegada_realizada_destino) - INTERVAL '1' DAY
          ELSE DATE(chegada_realizada_destino) END AS data_chegada_ajustada_6_horas
    ,CASE WHEN HOUR(CAST(chegada_planejada_destino AS TIMESTAMP)) < 6 THEN DATE(chegada_planejada_destino) - INTERVAL '1' DAY
          ELSE DATE(chegada_planejada_destino) END AS data_planejada_ajustada_6_horas
    ,DATE(chegada_realizada_destino) AS data_chegada_dia
    ,DATE(chegada_planejada_destino) AS data_planejada_dia
    ,DATE(horario_de_descarga) AS data_descarga_dia
    ,SUBSTRING(destination_station_code, 1, 3) AS destino_3_letras
    ,SUBSTRING(origin_station_code, 1, 3) AS origem_3_letras
    ,CASE WHEN SUBSTRING(destination_station_code, 1, 3) IN ('HUB', 'XPT') THEN SUBSTRING(destination_station_code, 1, 10) END AS destino_10_letras_hub_xpt
    ,lm_regional
    ,DATE_TRUNC('week', CASE WHEN HOUR(CAST(chegada_realizada_destino AS TIMESTAMP)) < 6 THEN DATE(chegada_realizada_destino) - INTERVAL '1' DAY
                             ELSE DATE(chegada_realizada_destino) END) AS semana_data_chegada_ajustada_6_horas
    ,DATE_TRUNC('week', DATE(chegada_realizada_destino)) AS semana_data_chegada_dia
    -- Classificação do Estado da Carreta no Pátio: TRAJETO, FILA ou INICIOU DESC
    ,CASE
      WHEN sta_origin_date IS NULL THEN NULL
      WHEN status_agrupado = 'ABERTA' AND chegada_realizada_destino IS NOT NULL AND unseal_datetime IS NULL AND horario_de_descarga IS NULL THEN 'FILA'
      WHEN status_agrupado = 'ABERTA' AND chegada_realizada_destino IS NULL AND unseal_datetime IS NULL THEN 'TRAJETO'
      ELSE 'INICIOU DESC'
    END AS classificacao_status_viagem
    ,DATE_TRUNC('week', DATE(horario_de_descarga)) AS semana_data_descarga
    ,DATE_TRUNC('week', CASE WHEN HOUR(CAST(horario_de_descarga AS TIMESTAMP)) < 6 THEN DATE(horario_de_descarga) - INTERVAL '1' DAY
                             ELSE DATE(horario_de_descarga) END) AS semana_data_descarga_ajustada_6_horas
    ,DATE_TRUNC('day', CASE WHEN HOUR(CAST(horario_de_descarga AS TIMESTAMP)) < 6 THEN DATE(horario_de_descarga) - INTERVAL '1' DAY
                            ELSE DATE(horario_de_descarga) END) AS data_descarga_ajustada_6_horas
  FROM t
  LEFT JOIN analytics_ops.dim_station_regional reg ON t.destination_station_code = reg.station_code
  LEFT JOIN order_counts oc ON t.trip_number = oc.lh_trip_ro
  LEFT JOIN to_volume_counts tvc ON t.trip_number = tvc.lh_trip_ro
)

-- CTE 8: Cálculo Analítico Estatístico de Percentil 95 (P95) e Limite Superior de SLA de Pátio
, percentile AS (
  SELECT
    t1.*
    ,COALESCE(
      TRY_CAST(percentil_95 AS DOUBLE),
      APPROX_PERCENTILE(CASE WHEN tempo_descarga_horas > 0 THEN tempo_descarga_horas END, 0.95)
        OVER (PARTITION BY COALESCE(destino_10_letras_hub_xpt, t1.destination_station_code))
    ) AS limite_superior_percentil_95
    ,CASE
      WHEN tempo_descarga_horas = 0 OR tempo_descarga_horas >= COALESCE(
        TRY_CAST(percentil_95 AS DOUBLE),
        APPROX_PERCENTILE(CASE WHEN tempo_descarga_horas > 0 THEN tempo_descarga_horas END, 0.95)
          OVER (PARTITION BY COALESCE(destino_10_letras_hub_xpt, t1.destination_station_code))
      ) THEN 'N' ELSE 'S' END AS dentro_do_limite
  FROM final t1
  LEFT JOIN analytics_ops.dim_station_p95_unloading_sla t2
    ON t1.destination_station_code = t2.destination_station_code
    AND t2.ingestion_timestamp IS NOT NULL
  WHERE tempo_descarga_horas IS NULL OR tempo_descarga_horas >= 0
)

-- SELECT Final: Formatação de Timestamps, Lógica Híbrida (Planejado vs. Realizado) e Filtro D-62
SELECT
  sta_origin_date
  ,status_agrupado
  ,solicitation_by
  ,trip_mode
  ,trip_number
  ,driver_id
  ,planned_agency
  ,used_agency_name
  ,origin_station_code
  ,destination_station_code
  ,vehicle_number
  ,planned_vehicle
  ,used_vehicle
  ,total_orders
  ,orders_saca
  ,orders_scuttle
  ,orders_pallet
  ,orders_others
  ,to_saca
  ,to_scuttle
  ,to_pallet
  ,to_others
  ,to_total
  ,DATE_FORMAT(chegada_planejada_origem, '%Y-%m-%d %H:%i') AS chegada_planejada_origem
  ,DATE_FORMAT(partida_planejada_origem, '%Y-%m-%d %H:%i') AS partida_planejada_origem
  ,DATE_FORMAT(partida_realizada_origem, '%Y-%m-%d %H:%i') AS partida_realizada_origem
  ,DATE_FORMAT(chegada_realizada_origem, '%Y-%m-%d %H:%i') AS chegada_realizada_origem
  ,DATE_FORMAT(chegada_planejada_destino, '%Y-%m-%d %H:%i') AS chegada_planejada_destino
  ,DATE_FORMAT(chegada_realizada_destino, '%Y-%m-%d %H:%i') AS chegada_realizada_destino
  ,DATE_FORMAT(horario_de_descarga, '%Y-%m-%d %H:%i') AS horario_de_descarga
  ,DATE_FORMAT(unloaded_datetime, '%Y-%m-%d %H:%i') AS unloaded_datetime
  ,status_cpt
  ,status_eta_destino
  ,cancel_reason
  ,DATE_FORMAT(latest_update, '%Y-%m-%d %H:%i') AS latest_update
  ,DATE_FORMAT(unseal_datetime, '%Y-%m-%d %H:%i') AS unseal_datetime
  ,tempo_descarga_horas
  ,data_chegada_ajustada_6_horas
  ,data_planejada_ajustada_6_horas
  ,data_descarga_ajustada_6_horas
  ,data_chegada_dia
  ,data_planejada_dia
  ,data_descarga_dia
  ,classificacao_status_viagem
  ,CASE
    WHEN chegada_realizada_destino IS NULL THEN NULL
    WHEN (CASE
      WHEN sta_origin_date IS NULL THEN NULL
      WHEN status_agrupado = 'ABERTA' AND chegada_realizada_destino IS NOT NULL AND unseal_datetime IS NULL AND horario_de_descarga IS NULL THEN 'FILA'
      WHEN status_agrupado = 'ABERTA' AND chegada_realizada_destino IS NULL AND unseal_datetime IS NULL THEN 'TRAJETO'
      ELSE 'INICIOU DESC'
    END) = 'INICIOU DESC' AND horario_de_descarga IS NULL THEN NULL
    ELSE GREATEST(DATE_DIFF('minute', GREATEST(chegada_realizada_destino, chegada_planejada_destino), COALESCE(horario_de_descarga, CAST(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' AS TIMESTAMP))), 0) / 660.00
  END AS tempo_descarga_ajustado_horas

  -- LÓGICA HÍBRIDA OPERACIONAL:
  -- Se o caminhão NÃO partiu da origem (NULL), projeta os números planejados.
  -- Se JÁ partiu, trava nos números reais do manifesto físico.
  ,CASE WHEN partida_realizada_origem IS NULL THEN to_saca ELSE COALESCE(contagem_tos_sacas, 0) END AS contagem_tos_sacas
  ,CASE WHEN partida_realizada_origem IS NULL THEN COALESCE(to_scuttle, 0) + COALESCE(to_pallet, 0) ELSE COALESCE(contagem_tos_scuttle_or_pallet, 0) END AS contagem_tos_scuttle_or_pallet
  ,CASE WHEN partida_realizada_origem IS NULL THEN to_others ELSE COALESCE(contagem_tos_vazias, 0) END AS contagem_tos_vazias
  ,CASE WHEN partida_realizada_origem IS NULL THEN orders_saca ELSE COALESCE(contagem_ids_sacas, 0) END AS contagem_ids_sacas
  ,CASE WHEN partida_realizada_origem IS NULL THEN COALESCE(orders_scuttle, 0) + COALESCE(orders_pallet, 0) ELSE COALESCE(contagem_ids_scuttle_or_pallets, 0) END AS contagem_ids_scuttle_or_pallets
  ,CASE WHEN partida_realizada_origem IS NULL THEN orders_others ELSE COALESCE(contagem_ids_vazias, 0) END AS contagem_ids_vazias

  -- Métricas de Cargas Diretas vs. Transbordo
  ,contagem_tos_sacas_nao_transbordo
  ,contagem_tos_scuttle_or_pallet_nao_transbordo
  ,contagem_tos_vazias_nao_transbordo
  ,contagem_ids_sacas_nao_transbordo
  ,contagem_ids_scuttle_or_pallets_nao_transbordo
  ,contagem_ids_vazias_nao_transbordo
  ,contagem_tos_sacas_transbordo
  ,contagem_tos_scuttle_or_pallet_transbordo
  ,contagem_tos_vazias_transbordo
  ,contagem_ids_sacas_transbordo
  ,contagem_ids_scuttle_or_pallets_transbordo
  ,contagem_ids_vazias_transbordo

  -- Clusters de Densidade de Pacotes por TO (0-30, 31-50, 51-100, 101-200, 200+)
  ,spp_cluster_0_30_tos_nao_transbordo
  ,spp_cluster_0_30_tos_transbordo
  ,spp_cluster_0_30_pacotes_nao_transbordo
  ,spp_cluster_0_30_pacotes_transbordo
  ,spp_cluster_31_50_tos_nao_transbordo
  ,spp_cluster_31_50_tos_transbordo
  ,spp_cluster_31_50_pacotes_nao_transbordo
  ,spp_cluster_31_50_pacotes_transbordo
  ,spp_cluster_51_100_tos_nao_transbordo
  ,spp_cluster_51_100_tos_transbordo
  ,spp_cluster_51_100_pacotes_nao_transbordo
  ,spp_cluster_51_100_pacotes_transbordo
  ,spp_cluster_101_200_tos_nao_transbordo
  ,spp_cluster_101_200_tos_transbordo
  ,spp_cluster_101_200_pacotes_nao_transbordo
  ,spp_cluster_101_200_pacotes_transbordo
  ,spp_cluster_200_plus_tos_nao_transbordo
  ,spp_cluster_200_plus_tos_transbordo
  ,spp_cluster_200_plus_pacotes_nao_transbordo
  ,spp_cluster_200_plus_pacotes_transbordo
FROM percentile
WHERE  
    data_chegada_ajustada_6_horas >= CAST(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' AS DATE) - INTERVAL '62' DAY  
    OR data_planejada_ajustada_6_horas >= CAST(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' AS DATE) - INTERVAL '62' DAY  
    OR data_descarga_ajustada_6_horas >= CAST(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' AS DATE) - INTERVAL '62' DAY  
    OR DATE(sta_origin_date) >= CAST(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' AS DATE) - INTERVAL '62' DAY  
ORDER BY
  sta_origin_date;
`;

  const copyToClipboard1 = () => {
    navigator.clipboard.writeText(sanitizedSqlQuery1);
    setCopied1(true);
    setTimeout(() => setCopied1(false), 2000);
  };

  const copyToClipboard2 = () => {
    navigator.clipboard.writeText(sanitizedSqlQuery2);
    setCopied2(true);
    setTimeout(() => setCopied2(false), 2000);
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

      {/* Query Selector Tabs Bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          background: "#f1f5f9",
          padding: "6px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0"
        }}
      >
        <button
          onClick={() => setActiveQuery("query1")}
          style={{
            flex: 1,
            padding: "12px 18px",
            borderRadius: "8px",
            border: "none",
            background: activeQuery === "query1" ? "#ffffff" : "transparent",
            color: activeQuery === "query1" ? "#0f172a" : "#64748b",
            fontWeight: activeQuery === "query1" ? 800 : 600,
            fontSize: "13.5px",
            cursor: "pointer",
            boxShadow: activeQuery === "query1" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease"
          }}
          type="button"
        >
          <span>📐</span>
          <span>Consulta 1: Rastreabilidade &amp; Produtividade em Esteiras</span>
        </button>

        <button
          onClick={() => setActiveQuery("query2")}
          style={{
            flex: 1,
            padding: "12px 18px",
            borderRadius: "8px",
            border: "none",
            background: activeQuery === "query2" ? "#ffffff" : "transparent",
            color: activeQuery === "query2" ? "#0f172a" : "#64748b",
            fontWeight: activeQuery === "query2" ? 800 : 600,
            fontSize: "13.5px",
            cursor: "pointer",
            boxShadow: activeQuery === "query2" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease"
          }}
          type="button"
        >
          <span>🚚</span>
          <span>Consulta 2: Linehaul, Volumetria, Clusters &amp; SLAs P95 de Pátio</span>
        </button>
      </div>

      {/* ==================================================================================
          VIEW CONSULTA 1: RASTREABILIDADE & PRODUTIVIDADE EM ESTEIRAS
          ================================================================================== */}
      {activeQuery === "query1" && (
        <div>
          {/* Hero Header Consulta 1 */}
          <div
            className="card"
            style={{
              padding: "36px 40px",
              marginBottom: "28px",
              borderLeft: "6px solid #8b5cf6",
              background: "linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  background: "#ede9fe",
                  color: "#6d28d9",
                  padding: "4px 10px",
                  borderRadius: "999px"
                }}
              >
                SQL &amp; DATA WAREHOUSING
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
                ✓ Tabelas &amp; Negócio Sanitizados
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  background: "#f1f5f9",
                  color: "#475569",
                  padding: "4px 10px",
                  borderRadius: "999px"
                }}
              >
                Dialeto: Trino / Presto / BigQuery
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
              Query 1: Rastreabilidade Operacional &amp; Produtividade Homem-Hora
            </h1>

            <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.65, margin: "0 0 24px", maxWidth: "1000px" }}>
              Modelagem analítica em SQL de alta performance projetada para correlacionar telemetria horária de postos físicos de trabalho
              (esteiras de embalagem) com dados cadastrais de operadores, aplicando normalização com expressões regulares (Regex),
              poda cirúrgica de partições e tratamento temporal estrito para inteligência de chão de fábrica.
            </p>

            {/* Impact Metric Badges */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "14px"
              }}
            >
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e9d5ff" }}>
                <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 700, textTransform: "uppercase" }}>
                  Partition Pruning
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                  -95% Scan
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>Elimina Full Table Scan com D-20</span>
              </div>

              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e9d5ff" }}>
                <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 700, textTransform: "uppercase" }}>
                  Integridade do Join
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#166534", margin: "2px 0" }}>
                  1:1 Estrito
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>MAX + Group By evita cartesiano</span>
              </div>

              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e9d5ff" }}>
                <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 700, textTransform: "uppercase" }}>
                  Higienização de Chaves
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                  Regex + Lower
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>Extração cirúrgica de ID limpo</span>
              </div>

              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e9d5ff" }}>
                <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 700, textTransform: "uppercase" }}>
                  Janela Temporal
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                  D-15 (UTC-3)
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>Fuso de São Paulo garantido</span>
              </div>
            </div>
          </div>

          {/* Seção 1: Objetivo Final & Contexto de Negócio */}
          <div className="card" style={{ padding: "32px", marginBottom: "28px" }}>
            <h2 style={{ fontSize: "22px", color: "#0f172a", margin: "0 0 16px", fontWeight: 800 }}>
              1. Objetivo Final &amp; Contexto de Negócio
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "15px", color: "#dc2626", margin: "0 0 8px", fontWeight: 700 }}>
                  🔴 O Desafio de Dados &amp; Inconsistência de IDs
                </h3>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
                  Em centros de triagem e galpões de alta cadência, as bancadas e esteiras de embalagem produzem telemetria horária
                  de pacotes expedidos (tabela de fato <code>fct_workstation_adherence_hourly</code>), indexada pelo <code>operator_id</code>.
                  Entretanto, na tabela corporativa de rastreamento de ordens (<code>fct_order_tracking_events</code>), o campo de operador
                  é armazenado em formato bruto concatenado — por exemplo: <code>&quot;[OPS485020] João da Silva Santos&quot;</code> ou
                  <code>&quot;[OP1234] Maria Souza&quot;</code>. Um <code>JOIN</code> direto causava perda massiva de correspondência ou
                  duplicações por variações de caixa alta/baixa.
                </p>
              </div>

              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "15px", color: "#166534", margin: "0 0 8px", fontWeight: 700 }}>
                  🟢 A Solução da Query Analítica
                </h3>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
                  A consulta atua como camada de engenharia analítica que:
                  <strong> (1)</strong> isola e extrai o identificador limpo do operador via expressão regular;
                  <strong> (2)</strong> unifica o cadastro com agregação 1:1 eliminando registros fantasmas;
                  <strong> (3)</strong> enriquece os fatos de produção horária com o nome canônico e e-mail corporativo; e
                  <strong> (4)</strong> isola exclusivamente as bancadas físicas de <strong>esteira</strong> ativas (<code>packing &gt; 0</code>),
                  gerando a base exata para o painel de <em>Headcount vs. Produtividade</em> dos turnos T1, T2 e T3.
                </p>
              </div>
            </div>
          </div>

          {/* Seção 2: Código SQL Sanitizado Consulta 1 */}
          <div className="card" style={{ padding: "32px", marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "22px", color: "#0f172a", margin: 0, fontWeight: 800 }}>
                  2. Consulta SQL 1 Sanitizada (Exemplo de Produção)
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
                  Nomes de esquemas, tabelas e estações foram completamente descaracterizados para conformidade corporativa.
                </p>
              </div>

              <button
                onClick={copyToClipboard1}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background: copied1 ? "#166534" : "#7c3aed",
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
                {copied1 ? "✓ Consulta Copiada!" : "📋 Copiar Código SQL"}
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
                    workstation_productivity_adherence.sql • Dialeto Trino / Presto
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#a78bfa", fontFamily: "monospace", fontWeight: 700 }}>ANSI SQL</span>
              </div>

              <pre
                style={{
                  margin: 0,
                  padding: "20px",
                  maxHeight: "500px",
                  overflowY: "auto",
                  fontFamily: "Consolas, Monaco, 'Courier New', Courier, monospace",
                  fontSize: "12.5px",
                  lineHeight: 1.6,
                  color: "#f8fafc",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#475569 transparent"
                }}
              >
                <code>{sanitizedSqlQuery1}</code>
              </pre>
            </div>
          </div>

          {/* Seção 3: Destrinchamento Técnico Consulta 1 */}
          <div className="card" style={{ padding: "32px", marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "22px", color: "#0f172a", margin: 0, fontWeight: 800 }}>
                  3. Destrinchamento Técnico Cláusula por Cláusula
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
                  Análise técnica detalhada da mecânica interna, expressões regulares, técnicas de otimização de custo e lógica relacional.
                </p>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { id: "all", label: "Todas as Cláusulas" },
                  { id: "cte", label: "CTE & Regex" },
                  { id: "join", label: "Join & Features" },
                  { id: "performance", label: "Performance & Timezone" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAnalysisTab1(tab.id as any)}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      borderRadius: "6px",
                      border: activeAnalysisTab1 === tab.id ? "1px solid #7c3aed" : "1px solid #e2e8f0",
                      background: activeAnalysisTab1 === tab.id ? "#7c3aed" : "#ffffff",
                      color: activeAnalysisTab1 === tab.id ? "#ffffff" : "#475569",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* CTE */}
              {(activeAnalysisTab1 === "all" || activeAnalysisTab1 === "cte") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>WITH op_mapping AS (...)</code>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "2px 8px", borderRadius: "4px" }}>
                      CTE (Common Table Expression)
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: "0 0 10px" }}>
                      Materializa em memória uma visão intermediária leve que isola a lógica de normalização cadastral, tornando o código modular e permitindo ao otimizador paralelizar a execução sem subqueries aninhadas lentas no <code>FROM</code>.
                    </p>
                  </div>
                </div>
              )}

              {/* REGEX */}
              {(activeAnalysisTab1 === "all" || activeAnalysisTab1 === "cte") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>
                      LOWER(REGEXP_EXTRACT(operator, &apos;\[([A-Za-z0-9]+)\]&apos;, 1)) AS operator_id_clean
                    </code>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#e0f2fe", padding: "2px 8px", borderRadius: "4px" }}>
                      Regex Parsing &amp; Sanitização
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: "0 0 10px" }}>
                      Captura cirúrgica do identificador interno contido entre colchetes <code>\[...\]</code> e padronização em minúsculas (<code>LOWER</code>), neutralizando divergências de caixa na chave de junção.
                    </p>
                  </div>
                </div>
              )}

              {/* PARTITION PRUNING */}
              {(activeAnalysisTab1 === "all" || activeAnalysisTab1 === "performance") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>
                      WHERE DATE(dt_partition) &gt;= CURRENT_DATE - INTERVAL &apos;20&apos; DAY
                    </code>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#ea580c", background: "#ffedd5", padding: "2px 8px", borderRadius: "4px" }}>
                      Partition Pruning (-95% Custo/Scan)
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: "0 0 10px" }}>
                      Elimina o <em>Full Table Scan</em> de anos de histórico, instruindo a engine (Trino/Presto) a varrer exclusivamente as últimas 20 partições físicas do Data Lake.
                    </p>
                  </div>
                </div>
              )}

              {/* LEFT JOIN */}
              {(activeAnalysisTab1 === "all" || activeAnalysisTab1 === "join") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>
                      LEFT JOIN op_mapping op ON LOWER(q1.operator_id) = op.operator_id_clean
                    </code>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#8b5cf6", background: "#f5f3ff", padding: "2px 8px", borderRadius: "4px" }}>
                      Junção à Esquerda Resiliente
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: 0 }}>
                      Garante que nenhum registro de produção horária seja eliminado caso o operador seja novo ou não esteja cadastrado na dimensão auxiliar, mantendo a integridade total do volume reportado.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================================
          VIEW CONSULTA 2: LINEHAUL TRIP OPERATIONS, VOLUMETRIA & SLAS DE PÁTIO
          ================================================================================== */}
      {activeQuery === "query2" && (
        <div>
          {/* Hero Header Consulta 2 */}
          <div
            className="card"
            style={{
              padding: "36px 40px",
              marginBottom: "28px",
              borderLeft: "6px solid #2563eb",
              background: "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  padding: "4px 10px",
                  borderRadius: "999px"
                }}
              >
                LINEHAUL &amp; YARD ANALYTICS
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
                ✓ Pipeline com 8 CTEs Encadeadas
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  background: "#fef3c7",
                  color: "#92400e",
                  padding: "4px 10px",
                  borderRadius: "999px"
                }}
              >
                SLA P95 &amp; Gestão de Pátio
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
              Query 2: Malha de Transferência (Linehaul), Volumetria &amp; SLAs de Pátio
            </h1>

            <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.65, margin: "0 0 24px", maxWidth: "1000px" }}>
              Pipeline analítico de alta complexidade projetado para orquestração da malha de transferência rodoviária (Linehaul).
              Consolida volumetria agregada por tipo de embalagem (Sacas vs. Scuttles vs. Pallets), segmentação de transbordo,
              clusterização de densidade de pacotes por TO, controle de ciclo de vida da carreta (Trajeto, Fila e Descarga)
              e cálculo estatístico analítico do <strong>Percentil 95 (P95)</strong> para conformidade de SLA de descarregamento.
            </p>

            {/* Impact Metric Badges Query 2 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "14px"
              }}
            >
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 700, textTransform: "uppercase" }}>
                  Métricas Estatísticas
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                  P95 Analítico
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>APPROX_PERCENTILE Over Partition</span>
              </div>

              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 700, textTransform: "uppercase" }}>
                  Clusterização de Carga
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#166534", margin: "2px 0" }}>
                  5 Faixas Cubagem
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>0-30, 31-50, 51-100, 101-200, 200+</span>
              </div>

              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 700, textTransform: "uppercase" }}>
                  Gestão de Pátio
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                  3 Estados
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>TRAJETO ➔ FILA ➔ INICIOU DESC</span>
              </div>

              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 700, textTransform: "uppercase" }}>
                  Corte Operacional
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                  Turno 06h
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>Ajuste de data logística D-1</span>
              </div>
            </div>
          </div>

          {/* Seção 1: Contexto de Negócio Consulta 2 */}
          <div className="card" style={{ padding: "32px", marginBottom: "28px" }}>
            <h2 style={{ fontSize: "22px", color: "#0f172a", margin: "0 0 16px", fontWeight: 800 }}>
              1. Objetivo de Negócio &amp; Desafios da Malha Linehaul
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "15px", color: "#dc2626", margin: "0 0 8px", fontWeight: 700 }}>
                  🔴 O Desafio de Operações em Carretas &amp; Pátio
                </h3>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
                  Em hubs de grande escala, centenas de carretas de transferência interestadual chegam diariamente. A equipe de doca precisa
                  saber com antecedência não apenas a quantidade de carretas, mas a <strong>composição exata de cubagem</strong> (se a carga é fracionada em sacas,
                  gaiolas scuttle ou pallets) e se haverá necessidade de transbordo imediato para outros veículos. Além disso, a falta de padronização
                  nos horários de lacre (unseal) e tempos de espera gerava disputas contratuais sobre cobranças de sobre-estadia (*demurrage*) de transportadoras.
                </p>
              </div>

              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "15px", color: "#166534", margin: "0 0 8px", fontWeight: 700 }}>
                  🟢 A Solução da Query de Malha
                </h3>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
                  Esta consulta consolida o ciclo de vida completo da viagem rodoviária:
                  <strong> (1)</strong> calcula volumetrias de sacas e pallets cruzadas com o plano de transbordo;
                  <strong> (2)</strong> classifica a carga em 5 clusters de densidade para alocação preditiva de equipe na doca;
                  <strong> (3)</strong> desduplica eventos de rompimento de lacre com window functions;
                  <strong> (4)</strong> implementa lógica híbrida (se o caminhão não partiu da origem, usa números planejados; se partiu, trava no realizado); e
                  <strong> (5)</strong> calcula o tempo real de descarga confrontando contra o <strong>Percentil 95</strong> histórico da estação.
                </p>
              </div>
            </div>

            <div style={{ marginTop: "20px", padding: "16px 20px", background: "#eff6ff", borderRadius: "8px", borderLeft: "4px solid #2563eb" }}>
              <strong style={{ fontSize: "13px", color: "#1e40af", display: "block", marginBottom: "4px" }}>
                Regra Operacional de Virada de Dia às 06:00
              </strong>
              <p style={{ fontSize: "13px", color: "#1e3a8a", margin: 0, lineHeight: 1.6 }}>
                Na logística de cross-docking, o dia operacional não vira à meia-noite, mas às 06h00 da manhã (fim do turno T3).
                A query implementa a regra <code>CASE WHEN HOUR(chegada) &lt; 6 THEN DATE - 1 DAY</code>, garantindo que carretas descarregadas
                na madrugada sejam contabilizadas no dia operacional correto.
              </p>
            </div>
          </div>

          {/* Seção 2: Código SQL Sanitizado Consulta 2 */}
          <div className="card" style={{ padding: "32px", marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "22px", color: "#0f172a", margin: 0, fontWeight: 800 }}>
                  2. Consulta SQL 2 Sanitizada (Pipeline de Linehaul &amp; Pátio)
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
                  Código em conformidade de segurança: nomes de tabelas operacionais, esquemas e IDs de hubs totalmente sanitizados.
                </p>
              </div>

              <button
                onClick={copyToClipboard2}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background: copied2 ? "#166534" : "#2563eb",
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
                {copied2 ? "✓ Consulta Copiada!" : "📋 Copiar Código SQL"}
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
                    linehaul_trip_volumetry_yard_sla.sql • Dialeto Trino / Presto
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#60a5fa", fontFamily: "monospace", fontWeight: 700 }}>ANSI SQL • 8 CTEs</span>
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
                <code>{sanitizedSqlQuery2}</code>
              </pre>
            </div>
          </div>

          {/* Seção 3: Destrinchamento Técnico Consulta 2 */}
          <div className="card" style={{ padding: "32px", marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "22px", color: "#0f172a", margin: 0, fontWeight: 800 }}>
                  3. Destrinchamento Técnico das 8 CTEs &amp; Cláusulas
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
                  Detalhamento da cadeia de transformação, funções de janela analítica, parsing semiestruturado e regras de pátio.
                </p>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { id: "all", label: "Todas as Cláusulas" },
                  { id: "volumetry", label: "Volumetria & Clusters" },
                  { id: "yard", label: "Pátio & JSON" },
                  { id: "analytics", label: "Percentil 95 & Regras" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAnalysisTab2(tab.id as any)}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      borderRadius: "6px",
                      border: activeAnalysisTab2 === tab.id ? "1px solid #2563eb" : "1px solid #e2e8f0",
                      background: activeAnalysisTab2 === tab.id ? "#2563eb" : "#ffffff",
                      color: activeAnalysisTab2 === tab.id ? "#ffffff" : "#475569",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* CTE 1 & 2 */}
              {(activeAnalysisTab2 === "all" || activeAnalysisTab2 === "volumetry") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>
                      CTE 1 &amp; 2: shipment_base &amp; to_volume
                    </code>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#e0f2fe", padding: "2px 8px", borderRadius: "4px" }}>
                      Normalização de Grão Relacional
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: "0 0 10px" }}>
                      Isolam o grão elementar de pacotes (<code>shipment_id</code>) e agrupam no nível de Ordem de Transporte (<code>to_number</code>).
                      A função <code>COALESCE(TRY_CAST(is_planned_transshipment_next AS INTEGER), 0)</code> garante imunidade contra registros com valores nulos ou strings corrompidas, convertendo com segurança o indicador booleano de transbordo.
                    </p>
                  </div>
                </div>
              )}

              {/* CTE 3: order_counts */}
              {(activeAnalysisTab2 === "all" || activeAnalysisTab2 === "volumetry") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>
                      CTE 3: order_counts (Pivotagem Condicional de Embalagens)
                    </code>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", background: "#f0fdf4", padding: "2px 8px", borderRadius: "4px" }}>
                      Conditional Aggregations
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: "0 0 10px" }}>
                      Emprega <code>COUNT(DISTINCT CASE WHEN ...)</code> e <code>COUNT(CASE WHEN ...)</code> para pivotar em uma única passagem de tabela
                      as contagens de Sacas, Scuttles e Pallets, subdivididas entre cargas diretas e transbordos. Evita múltiplos scans e otimiza o uso de memória no cluster.
                    </p>
                  </div>
                </div>
              )}

              {/* CTE 4: to_volume_counts */}
              {(activeAnalysisTab2 === "all" || activeAnalysisTab2 === "volumetry") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>
                      CTE 4: to_volume_counts (Clusterização de Densidade de Carga)
                    </code>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "2px 8px", borderRadius: "4px" }}>
                      Density Binning &amp; Cubagem
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: "0 0 10px" }}>
                      Segmenta as carretas em 5 clusters matemáticos baseados no volume de itens por TO: <strong>0-30</strong>, <strong>31-50</strong>, <strong>51-100</strong>, <strong>101-200</strong> e <strong>200+ pacotes</strong>.
                      Permite à torre de controle saber se a carreta requer mão de obra intensiva para descarregar sacas miúdas ou se pode ser descarregada rapidamente via empilhadeira.
                    </p>
                  </div>
                </div>
              )}

              {/* CTE 5: unseal_data com ROW_NUMBER */}
              {(activeAnalysisTab2 === "all" || activeAnalysisTab2 === "yard") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>
                      ROW_NUMBER() OVER(PARTITION BY trip_number ORDER BY unseal_datestamp DESC) AS rn
                    </code>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#ea580c", background: "#ffedd5", padding: "2px 8px", borderRadius: "4px" }}>
                      Window Function Deduplication
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: "0 0 10px" }}>
                      Durante inspeções de pátio, uma carreta pode ter múltiplos registros de lacre (tentativas canceladas ou reinspeções).
                      A função analítica particiona por <code>trip_number</code> e ordena de forma decrescente pelo timestamp, elegendo estritamente a linha <code>rn = 1</code> para evitar duplicações no <code>LEFT JOIN</code> posterior.
                    </p>
                  </div>
                </div>
              )}

              {/* CTE 6: Parsing JSON */}
              {(activeAnalysisTab2 === "all" || activeAnalysisTab2 === "yard") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>
                      json_extract_scalar(t_base.volumetry_details, &apos;$.loaded_orders_saca&apos;)
                    </code>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "2px 8px", borderRadius: "4px" }}>
                      Semi-Structured Data Parsing
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: "0 0 10px" }}>
                      Extrai dados aninhados em colunas JSON em tempo de execução sem necessidade de tabelas intermediárias de staging.
                      A combinação <code>CAST(TRY_CAST(...) AS DOUBLE) AS BIGINT)</code> previne quebras caso o valor venha como string vazia ou número com ponto flutuante.
                    </p>
                  </div>
                </div>
              )}

              {/* CTE 8: APPROX_PERCENTILE P95 */}
              {(activeAnalysisTab2 === "all" || activeAnalysisTab2 === "analytics") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>
                      APPROX_PERCENTILE(tempo_descarga_horas, 0.95) OVER (PARTITION BY destination_station_code)
                    </code>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: "4px" }}>
                      Janela Analítica de SLA P95
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: "0 0 10px" }}>
                      Calcula dinamicamente o limiar de <strong>Percentil 95 (P95)</strong> do tempo de descarga para cada estação de destino.
                      A condição <code>CASE WHEN tempo_descarga_horas &gt;= limite THEN &apos;N&apos; ELSE &apos;S&apos; END</code> rotula automaticamente
                      viagens que estouraram o tempo aceitável de descarga, gerando alertas instantâneos de descumprimento de SLA.
                    </p>
                  </div>
                </div>
              )}

              {/* LÓGICA HÍBRIDA */}
              {(activeAnalysisTab2 === "all" || activeAnalysisTab2 === "analytics") && (
                <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>
                      CASE WHEN partida_realizada_origem IS NULL THEN to_saca ELSE contagem_tos_sacas END
                    </code>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "4px" }}>
                      Lógica Híbrida (Planejado vs. Realizado)
                    </span>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, margin: 0 }}>
                      Regra de ouro de supply chain: se o veículo ainda não partiu do hub de origem (<code>partida_realizada_origem IS NULL</code>), o painel exibe a projeção do volume planejado.
                      Assim que o caminhão inicia o trajeto, a métrica é travada no número físico real bipado no manifesto, eliminando inconsistências na recepção.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Seção Final: Governança & Padrões do Case */}
      <div className="card" style={{ padding: "32px" }}>
        <h2 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 16px", fontWeight: 800 }}>
          Governança de Dados, Performance &amp; Resiliência
        </h2>

        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "20px 24px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px"
          }}
        >
          <div>
            <strong style={{ fontSize: "13px", color: "#1e40af", display: "block", marginBottom: "4px" }}>
              Qualidade de Código em Ambientes de Alta Escala
            </strong>
            <p style={{ fontSize: "12.5px", color: "#1e3a8a", margin: 0, lineHeight: 1.6 }}>
              Ambas as consultas utilizam padrões industriais de engenharia de dados: <em>Partition Pruning</em>, <em>Window Functions</em> para deduplicação,
              funções de agregação analítica aproximada (P95), proteção com <code>TRY_CAST</code> e alinhamento de fuso com <code>America/Sao_Paulo</code>,
              viabilizando relatórios confiáveis para o chão de fábrica e a liderança executiva.
            </p>
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#1e40af",
              background: "#dbeafe",
              padding: "6px 14px",
              borderRadius: "6px",
              whiteSpace: "nowrap"
            }}
          >
            Padrão Enterprise Homologado 🚀
          </span>
        </div>
      </div>
    </div>
  );
}
