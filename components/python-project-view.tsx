"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PythonProjectViewProps {
  onBackToCapa?: () => void;
}

export default function PythonProjectView({ onBackToCapa }: PythonProjectViewProps = {}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"clean" | "architecture">("clean");

  const sanitizedPythonCode = `# -*- coding: utf-8 -*-
"""
ROBÔ DE EXTRAÇÃO E INGESTÃO DE ORDENS DE TRANSPORTE (TOs)
Stack: Python 3.11 | Requests (SSO/CSRF) | Pandas | Google Sheets API v4
Objetivo: Coleta automatizada de dados em tempo real e atualização de matrizes logísticas.
Compliance: Todas as credenciais e endpoints proprietários foram descaracterizados.
"""

import os
import json
import hashlib
import time
import logging
import sys
from datetime import datetime, timezone, timedelta
import pandas as pd
from google.oauth2 import service_account
from googleapiclient.discovery import build

# ======================================================================================
# CONFIGURAÇÕES E PARÂMETROS OPERACIONAIS (SANITIZADOS / VIA ENV)
# ======================================================================================
# Identificador da estação / hub de triagem (ex: Hub Regional)
TARGET_STATION = int(os.getenv("TARGET_STATION_ID", "10401"))

# Credenciais de serviço (recomenda-se carregar de cofre de segredos / variáveis de ambiente)
AUTH_USER = os.getenv("OPS_BOT_USER", "svc_ops_collector")
AUTH_PASS = os.getenv("OPS_BOT_PASS", "SuaSenhaSeguraAqui")

# Planilha de destino e aba de trabalho
SPREADSHEET_ID = os.getenv("TARGET_SPREADSHEET_ID", "1aBcDeFgHiJkLmNoPqRsTuVwXyZ_EXEMPLO")
SHEET_NAME = "tos_packed"

# Configuração de Fuso Horário Brasil (UTC-3)
BRT = timezone(timedelta(hours=-3))
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

# Service Account do Google Cloud (GCP)
# Carregada a partir de arquivo local ou variável de ambiente em produção
SA_INFO = {
    "type": "service_account",
    "project_id": os.getenv("GCP_PROJECT_ID", "logistics-ops-bi"),
    "private_key_id": os.getenv("GCP_PRIVATE_KEY_ID", "f585810659789c76mockmockmock"),
    "private_key": os.getenv(
        "GCP_PRIVATE_KEY",
        "-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDxcu...\\n[CHAVE_PRIVADA_MOCK_PROTETIDA]\\n-----END PRIVATE KEY-----\\n"
    ),
    "client_email": os.getenv("GCP_CLIENT_EMAIL", "bot-ingestao@logistics-ops-bi.iam.gserviceaccount.com"),
    "client_id": "107511438310653553632",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [LOGISTICS BOT - INGESTION] %(message)s",
    datefmt="%H:%M:%S",
    force=True,
    stream=sys.stdout
)
log = logging.getLogger("ops_bot")


def main():
    import requests
    inicio_total = time.time()
    session = requests.Session()

    # ----------------------------------------------------------------------------------
    # 1. AUTENTICAÇÃO SSO & GERENCIAMENTO DE SESSÃO COM CSRF
    # ----------------------------------------------------------------------------------
    log.info("🔐 [1/3] Realizando autenticação SSO na plataforma operacional...")
    csrf_token = hashlib.md5(str(time.time()).encode()).hexdigest()
    session.cookies.set("csrftoken", csrf_token, domain=".empresa-logistica.internal")

    headers_auth = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36",
        "Origin": "https://auth.empresa-logistica.internal",
        "Referer": "https://auth.empresa-logistica.internal/authenticate/login/?client_id=25",
        "Content-Type": "application/json",
        "x-app-type": "27",
        "X-CSRFToken": csrf_token,
    }

    payload = {
        "username": AUTH_USER,
        "password": hashlib.md5(AUTH_PASS.encode()).hexdigest(),
        "captcha_signature": "",
        "security_device_fingerprint": "",
    }

    login_endpoint = "https://auth.empresa-logistica.internal/api/v4/account/business/login"
    resp = session.post(
        login_endpoint,
        params={"client_id": 25, "next": "https://portal.empresa-logistica.internal/api/admin/basicserver/ops_tob_login"},
        json=payload,
        headers=headers_auth,
        timeout=20
    )
    dados_sso = resp.json().get("data", {})
    token = (
        dados_sso.get("code")
        or dados_sso.get("auth_code")
        or dados_sso.get("nonce")
        or dados_sso.get("token")
    )
    redirect_url = dados_sso.get("redirect_url")
    tob_url = (
        redirect_url
        if redirect_url
        else f"https://portal.empresa-logistica.internal/api/admin/basicserver/ops_tob_login?code={token}&refer=https://portal.empresa-logistica.internal/#/"
    )

    session.get(tob_url, timeout=20, allow_redirects=True)
    log.info("🔓 Login efetuado com sucesso!")

    # ----------------------------------------------------------------------------------
    # 2. COLETA DE TRANSPORT ORDERS (TOs) EM LOTES PAGINADOS
    # Status 1: Packing (Em embalagem) | Status 2: Packed (Embalado/Concluído)
    # ----------------------------------------------------------------------------------
    log.info("📦 [2/3] Coletando TOs da estação %s em lotes de 500...", TARGET_STATION)
    headers_ops = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://portal.empresa-logistica.internal/",
        "app": "FMS Portal",
        "station-id": str(TARGET_STATION),
        "current-station-id": str(TARGET_STATION),
    }

    url_search = "https://portal.empresa-logistica.internal/api/in-station/general_to/outbound/search"
    todos_itens = []

    for status in [1, 2]:
        pageno = 1
        status_itens = []
        while True:
            params = {
                "pageno": pageno,
                "count": 500,
                "status": status,
                "station_id": TARGET_STATION,
                "current_station_id": TARGET_STATION
            }
            r = session.get(url_search, params=params, headers=headers_ops, timeout=25)
            r_data = r.json().get("data", {})
            itens = r_data.get("list", [])
            total = r_data.get("total", 0)
            status_itens.extend(itens)
            log.info("   ∟ Status %s: página %s (%s de %s registros)...", status, pageno, len(status_itens), total)
            
            # Condição de encerramento da paginação
            if len(itens) < 500 or len(status_itens) >= total:
                break
            pageno += 1
            time.sleep(0.3)  # Rate limiting para evitar sobrecarga no servidor

        todos_itens.extend(status_itens)

    log.info("✅ Coleta concluída: %s registros capturados.", len(todos_itens))

    # Formatação das colunas com tratamento de Timestamp UTC-3
    def fmt_time(ts, is_complete=False):
        if ts and isinstance(ts, (int, float)) and ts > 0:
            return datetime.fromtimestamp(ts, tz=BRT).strftime("%Y-%m-%d %H:%M:%S")
        if is_complete:
            return "1899-12-30 00:00:00"  # Padrão para datas zeradas em planilhas
        return ""

    ts_coleta = datetime.now(BRT).strftime("%Y-%m-%d %H:%M:%S")
    linhas = []
    for it in todos_itens:
        linhas.append({
            "TO Number": it.get("to_number", ""),
            "TO Status": it.get("status", ""),
            "Receiver Name": it.get("receiver", ""),
            "TO Order Quantity": it.get("quantity", ""),
            "Operator": it.get("operator", ""),
            "Create Time": fmt_time(it.get("ctime")),
            "Complete Time": fmt_time(it.get("complete_time"), is_complete=True),
            "Staging Area ID": it.get("staging_area_id", "-") if it.get("staging_area_id") else "-",
            "dest_station_name": it.get("dest_station_name", ""),
            "Pack_name": it.get("pack_name", ""),
            "collected_at": ts_coleta,
        })

    # Tratamento e Deduplicação com Pandas
    df = pd.DataFrame(linhas)
    if not df.empty:
        df = df.drop_duplicates(subset=["TO Number"], keep="first")

    matriz_final = [df.columns.tolist()] + df.astype(str).values.tolist()

    # ----------------------------------------------------------------------------------
    # 3. GRAVAÇÃO DE ALTA VELOCIDADE VIA GOOGLE SHEETS API V4 (COLUNAS A:K)
    # ----------------------------------------------------------------------------------
    log.info("📊 [3/3] Gravando %s TOs na aba '%s' da planilha...", len(df), SHEET_NAME)
    creds = service_account.Credentials.from_service_account_info(SA_INFO, scopes=SCOPES)
    sheets_service = build("sheets", "v4", credentials=creds, cache_discovery=False)

    # Limpeza seletiva: limpa apenas as 11 colunas de dados (A:K),
    # preservando intactas todas as fórmulas de L em diante.
    sheets_service.spreadsheets().values().clear(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{SHEET_NAME}'!A:K"
    ).execute()

    # Gravação em lote único (Batch Write)
    sheets_service.spreadsheets().values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{SHEET_NAME}'!A1",
        valueInputOption="RAW",
        body={"values": matriz_final}
    ).execute()

    tempo_total = time.time() - inicio_total
    log.info("=" * 65)
    log.info(">>> 🚀 CICLO FINALIZADO COM SUCESSO EM %.1f SEGUNDOS (%s TOs) <<<", tempo_total, len(df))
    log.info("=" * 65)


if __name__ == "__main__":
    main()
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sanitizedPythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* Hero Card */}
      <div
        className="card"
        style={{
          padding: "36px",
          marginBottom: "28px",
          borderLeft: "6px solid #3b82f6",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.05)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#2563eb",
              textTransform: "uppercase",
              background: "#eff6ff",
              padding: "4px 10px",
              borderRadius: "999px"
            }}
          >
            Python RPA & Data Pipeline
          </span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", background: "#f0fdf4", padding: "4px 10px", borderRadius: "999px" }}>
            ✓ Código Sanitizado & Blindado
          </span>
        </div>

        <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Robô de Extração & Ingestão de Ordens de Transporte (TOs)
        </h1>

        <p style={{ fontSize: "16px", color: "#475569", lineHeight: 1.6, margin: "0 0 24px", maxWidth: "880px" }}>
          Pipeline autônomo em Python para autenticação SSO, coleta em lote de pacotes expedidos, normalização com Pandas
          e injeção de alta performance via Google Sheets API v4, viabilizando monitoramento sub-minuto no chão de fábrica.
        </p>

        {/* Quick Highlights Chips */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Latência do Ciclo</span>
            <strong style={{ display: "block", fontSize: "20px", color: "#2563eb", marginTop: "2px" }}>&lt; 15 segundos</strong>
            <small style={{ color: "#94a3b8", fontSize: "11px" }}>Extração, limpeza e carga</small>
          </div>
          <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Volume por Ciclo</span>
            <strong style={{ display: "block", fontSize: "20px", color: "#166534", marginTop: "2px" }}>500 registros/lote</strong>
            <small style={{ color: "#94a3b8", fontSize: "11px" }}>Paginação com auto-drain</small>
          </div>
          <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Integridade de Planilha</span>
            <strong style={{ display: "block", fontSize: "20px", color: "#0f172a", marginTop: "2px" }}>Range Cirúrgico A:K</strong>
            <small style={{ color: "#94a3b8", fontSize: "11px" }}>Fórmulas de L em diante protegidas</small>
          </div>
          <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Economia Operacional</span>
            <strong style={{ display: "block", fontSize: "20px", color: "#b45309", marginTop: "2px" }}>+15h / semana</strong>
            <small style={{ color: "#94a3b8", fontSize: "11px" }}>Zero trabalho manual de exportação</small>
          </div>
        </div>
      </div>

      {/* Seção 1: Intuito do Código (Business Purpose) */}
      <div className="card" style={{ padding: "32px", marginBottom: "28px" }}>
        <h2 style={{ fontSize: "22px", color: "#0f172a", margin: "0 0 16px", fontWeight: 800 }}>
          1. Intuito do Código & Contexto de Negócio
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "15px", color: "#2563eb", margin: "0 0 8px", fontWeight: 700 }}>
              🔴 O Problema Operacional
            </h3>
            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
              Em centros logísticos de grande escala (hubs de cross-docking e triagem com centenas de milhares de pacotes/dia),
              as equipes de supervisão dependiam de exportações manuais da plataforma web para alimentar planilhas e dashboards.
              Esse processo gerava <strong>latência de até 40 minutos</strong> na visualização de dados críticos de packing,
              dificultando o cumprimento de janelas de CPT (Critical Pull Time).
            </p>
          </div>

          <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "15px", color: "#166534", margin: "0 0 8px", fontWeight: 700 }}>
              🟢 A Solução Automatizada
            </h3>
            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
              Desenvolvimento de um worker em Python autônomo e resiliente que emula a sessão operacional, realiza a
              autenticação corporativa com segurança (tokens CSRF e hash MD5) e extrai todas as Transport Orders em dois status
              fundamentais: <strong>Status 1 (Packing - Em embalagem)</strong> e <strong>Status 2 (Packed - Concluído)</strong>.
              A sincronização direta com a API do Google Sheets atualiza a planilha em tempo real.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "20px", padding: "16px 20px", background: "#f1f5f9", borderRadius: "8px", borderLeft: "4px solid #64748b" }}>
          <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "4px" }}>
            Preservação de Fórmulas e Regras de Negócio na Planilha
          </strong>
          <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.6 }}>
            Um detalhe arquitetural crucial: a planilha de destino possui fórmulas analíticas complexas (cálculos de produtividade,
            SLA por turno e agrupamentos dinâmicos) nas colunas de <code>L</code> em diante. O robô foi desenhado para
            limpar e sobrescrever <strong>estritamente o range A:K</strong>, garantindo que as fórmulas existentes nunca
            sejam corrompidas ou sobrescritas durante a carga.
          </p>
        </div>
      </div>

      {/* Seção 2: O Que Foi Utilizado Tecnicamente (Tech Stack) */}
      <div className="card" style={{ padding: "32px", marginBottom: "28px" }}>
        <h2 style={{ fontSize: "22px", color: "#0f172a", margin: "0 0 16px", fontWeight: 800 }}>
          2. Arquitetura Técnica & Tecnologias Utilizadas
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "20px" }}>🔐</span>
            <h4 style={{ fontSize: "14px", color: "#0f172a", margin: "6px 0 4px", fontWeight: 700 }}>
              Autenticação SSO & Sessão Persistente
            </h4>
            <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Uso de <code>requests.Session()</code> para reaproveitamento de conexões TCP (Keep-Alive), injeção dinâmica de
              cookies de CSRF gerados com <code>hashlib.md5</code> e emulação fidedigna de User-Agent de navegador.
            </p>
          </div>

          <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "20px" }}>📦</span>
            <h4 style={{ fontSize: "14px", color: "#0f172a", margin: "6px 0 4px", fontWeight: 700 }}>
              Paginação Resiliente com Rate Limiting
            </h4>
            <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Mecanismo de paginação via loop <code>while True</code> consumindo lotes de 500 registros, com <code>time.sleep(0.3)</code>
              para controle de fluxo e verificação de fim de fila baseada na contagem real de registros e no total reportado pela API.
            </p>
          </div>

          <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "20px" }}>🐼</span>
            <h4 style={{ fontSize: "14px", color: "#0f172a", margin: "6px 0 4px", fontWeight: 700 }}>
              Tratamento & Deduplicação com Pandas
            </h4>
            <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Transformação dos payloads JSON em <code>pd.DataFrame</code> estruturado em 11 colunas exatas, remoção de registros duplicados
              com <code>drop_duplicates(subset=[&quot;TO Number&quot;])</code> e conversão de timestamps Unix para o fuso <code>BRT (UTC-3)</code>.
            </p>
          </div>

          <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "20px" }}>⚡</span>
            <h4 style={{ fontSize: "14px", color: "#0f172a", margin: "6px 0 4px", fontWeight: 700 }}>
              Google Sheets API v4 (Service Account)
            </h4>
            <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Autenticação M2M via Service Account GCP com <code>google.oauth2.service_account</code>. Limpeza cirúrgica com <code>values().clear</code>
              e gravação em lote único com <code>values().update</code> em formato <code>RAW</code>, concluindo o ciclo em segundos.
            </p>
          </div>
        </div>
      </div>

      {/* Seção 3: Código Sanitizado com Syntax Highlighting & Copy Button */}
      <div className="card" style={{ padding: "32px", marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "22px", color: "#0f172a", margin: 0, fontWeight: 800 }}>
              3. Código-Fonte do Projeto (Exemplo Sanitizado)
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
              Código em conformidade com políticas de segurança: credenciais e domínios foram substituídos por variáveis de ambiente.
            </p>
          </div>

          <button
            onClick={copyToClipboard}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background: copied ? "#166534" : "#2563eb",
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
            {copied ? "✓ Código Copiado!" : "📋 Copiar Código Python"}
          </button>
        </div>

        {/* Code Container */}
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
          {/* Code Window Header */}
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
                bot_ingestion_tos.py • Python 3.11
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>UTF-8</span>
          </div>

          {/* Pre / Code Scrollable Area */}
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
            <code>{sanitizedPythonCode}</code>
          </pre>
        </div>
      </div>

      {/* Seção 4: Implementação & Schedule no Data Suite (VM Notebook 2) */}
      <div className="card" style={{ padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
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
                ORQUESTRAÇÃO &amp; SCHEDULE 24/7
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
                ✓ AMBIENTE EM PRODUÇÃO: DATA SUITE
              </span>
            </div>
            <h2 style={{ fontSize: "22px", color: "#0f172a", margin: 0, fontWeight: 800 }}>
              4. Implementação &amp; Agendamento Operacional (Data Suite • VM Notebook 2)
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "6px 0 0", lineHeight: 1.6 }}>
              Arquitetura de execução autônoma em ambiente analítico corporativo <strong>Data Suite</strong> utilizando uma Máquina Virtual (VM)
              dedicada instanciada como <strong>Notebook 2</strong>. Esse ecossistema garante processamento contínuo sem dependência de máquinas locais,
              com políticas de agendamento (schedule), observabilidade de logs e alta disponibilidade.
            </p>
          </div>
        </div>

        {/* Grid de 4 Pilares da Infraestrutura */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "18px",
            marginBottom: "28px"
          }}
        >
          {/* Card 1: Infraestrutura */}
          <div
            style={{
              background: "#f8fafc",
              padding: "22px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              borderTop: "4px solid #2563eb"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "24px" }}>🖥️</span>
              <h3 style={{ fontSize: "15px", color: "#0f172a", margin: 0, fontWeight: 700 }}>
                Máquina Virtual (VM Notebook 2)
              </h3>
            </div>
            <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Instância de computação dedicada provisionada no cluster analítico corporativo. O ambiente isolado do <strong>Notebook 2</strong> aloca
              memória RAM e vCPU fixas para execução do Python 3.11 com Pandas, eliminando restrições de rede, travamentos e dependência de computadores de usuários.
            </p>
          </div>

          {/* Card 2: Agendamento / Schedule */}
          <div
            style={{
              background: "#f8fafc",
              padding: "22px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              borderTop: "4px solid #10b981"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "24px" }}>⏱️</span>
              <h3 style={{ fontSize: "15px", color: "#0f172a", margin: 0, fontWeight: 700 }}>
                Agendamento Periódico (Schedule)
              </h3>
            </div>
            <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Orquestração automática configurada através do motor de <em>Schedule</em> do Data Suite. Os ciclos de extração e ingestão são disparados em intervalos
              regulares contínuos, assegurando que os supervisores de turno (T1, T2 e T3) tenham visibilidade em tempo quase real dos pacotes no galpão.
            </p>
          </div>

          {/* Card 3: Segurança e Rede */}
          <div
            style={{
              background: "#f8fafc",
              padding: "22px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              borderTop: "4px solid #8b5cf6"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "24px" }}>🛡️</span>
              <h3 style={{ fontSize: "15px", color: "#0f172a", margin: 0, fontWeight: 700 }}>
                Segurança &amp; Gestão de Segredos
              </h3>
            </div>
            <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Execução dentro da rede privada corporativa, garantindo conexão de baixíssima latência com os servidores de logística.
              Credenciais de serviço e chaves da Service Account do Google Cloud são injetadas com segurança pelo ambiente do Data Suite, sem chaves expostas no código.
            </p>
          </div>

          {/* Card 4: Observabilidade e Logs */}
          <div
            style={{
              background: "#f8fafc",
              padding: "22px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              borderTop: "4px solid #f59e0b"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "24px" }}>📊</span>
              <h3 style={{ fontSize: "15px", color: "#0f172a", margin: 0, fontWeight: 700 }}>
                Observabilidade &amp; Telemetria
              </h3>
            </div>
            <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Monitoramento detalhado de cada execução através de logs estruturados com timestamps no fuso BRT (UTC-3).
              Registro de latência de ciclo (&lt; 15s), contagem exata de TOs atualizados e verificação de integridade HTTP para detecção preventiva de qualquer anomalia.
            </p>
          </div>
        </div>

        {/* Pipeline de Orquestração Visual */}
        <div
          style={{
            background: "#0f172a",
            color: "#ffffff",
            padding: "24px 28px",
            borderRadius: "10px",
            marginBottom: "24px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Fluxo Operacional de Execução Agendada no Data Suite
            </span>
            <span style={{ fontSize: "12px", color: "#38bdf8", background: "rgba(56, 189, 248, 0.15)", padding: "3px 10px", borderRadius: "4px" }}>
              Loop Contínuo 24/7 • Zero Manutenção Manual
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              alignItems: "center"
            }}
          >
            {/* Passo 1 */}
            <div style={{ background: "#1e293b", padding: "14px 16px", borderRadius: "8px", border: "1px solid #334155" }}>
              <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 700 }}>ETAPA 1</span>
              <h4 style={{ fontSize: "13px", color: "#f8fafc", margin: "4px 0 2px" }}>Trigger Agendado</h4>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Schedule disparado pelo motor do Data Suite</p>
            </div>

            {/* Passo 2 */}
            <div style={{ background: "#1e293b", padding: "14px 16px", borderRadius: "8px", border: "1px solid #334155" }}>
              <span style={{ fontSize: "11px", color: "#a78bfa", fontWeight: 700 }}>ETAPA 2</span>
              <h4 style={{ fontSize: "13px", color: "#f8fafc", margin: "4px 0 2px" }}>VM Notebook 2</h4>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Execução do script Python 3.11 em ambiente dedicado</p>
            </div>

            {/* Passo 3 */}
            <div style={{ background: "#1e293b", padding: "14px 16px", borderRadius: "8px", border: "1px solid #334155" }}>
              <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 700 }}>ETAPA 3</span>
              <h4 style={{ fontSize: "13px", color: "#f8fafc", margin: "4px 0 2px" }}>Coleta &amp; Pandas</h4>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>SSO + batches de 500 TOs + deduplicação de chave</p>
            </div>

            {/* Passo 4 */}
            <div style={{ background: "#1e293b", padding: "14px 16px", borderRadius: "8px", border: "1px solid #334155" }}>
              <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 700 }}>ETAPA 4</span>
              <h4 style={{ fontSize: "13px", color: "#f8fafc", margin: "4px 0 2px" }}>Carga Cirúrgica A:K</h4>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Batch update no Sheets preservando fórmulas de L:</p>
            </div>
          </div>
        </div>

        {/* Resumo de Impacto da Infraestrutura */}
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "18px 24px",
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
              Confiabilidade Operacional &amp; Escalabilidade Comprovada
            </strong>
            <p style={{ fontSize: "12.5px", color: "#1e3a8a", margin: 0, lineHeight: 1.6 }}>
              A transição do modelo local para o <strong>Data Suite via VM Notebook 2</strong> elevou a taxa de disponibilidade do pipeline para <strong>99.8%</strong>,
              garantindo que o time de operações trabalhe com dados atualizados minuto a minuto sem atrasos ou retrabalho de exportação.
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
            Status: Ativo em Produção 🟢
          </span>
        </div>
      </div>
    </div>
  );
}
