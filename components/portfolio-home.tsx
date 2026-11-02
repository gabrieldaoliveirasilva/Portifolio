"use client";

import { useState } from "react";
import Link from "next/link";
import { profileData } from "@/lib/profile-data";
import PythonProjectView from "@/components/python-project-view";
import SqlProjectView from "@/components/sql-project-view";
import AppsScriptProjectView from "@/components/apps-script-project-view";

export default function PortfolioHome() {
  const [activeTab, setActiveTab] = useState<"capa" | "bio" | "projetos" | "python" | "sql" | "apps-script">("capa");
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const handleBioClick = () => {
    setActiveTab("capa");
    setIsSidebarOpen(false);
    setTimeout(() => {
      const el = document.getElementById("biografia");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  return (
    <div className="portfolio-container">
      {/* Mobile Bar */}
      <div className="portfolio-mobile-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="portfolio-brand-badge" style={{ width: "36px", height: "36px" }}>
            <span style={{ fontSize: "11px" }}>GSO</span>
          </div>
          <strong style={{ fontSize: "14px" }}>{profileData.name}</strong>
        </div>
        <button
          className="portfolio-mobile-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          type="button"
        >
          {isSidebarOpen ? "✕ Fechar" : "☰ Menu"}
        </button>
      </div>

      {/* ===================================================================
          SIDEBAR LATERAL COM MENU: CAPA, BIO, PROJETOS
          =================================================================== */}
      <aside className={`portfolio-sidebar ${isSidebarOpen ? "open" : ""}`}>
        {/* Top brand & Author header */}
        <div className="portfolio-sidebar-top">
          <div className="portfolio-brand-badge">
            <span>GSO</span>
            <small>DATA</small>
          </div>
          <div className="portfolio-author-block">
            <h2 className="portfolio-author-name">{profileData.name}</h2>
            <p className="portfolio-author-title">Analista de Dados Pleno | BI &amp; Supply Chain</p>
          </div>
        </div>

        {/* Menu Principal: Capa, Bio, Projetos */}
        <nav className="portfolio-nav-scroll" aria-label="Navegação do Portfólio">
          {/* 1. Capa */}
          <div className="portfolio-nav-group">
            <button
              className={`portfolio-nav-item ${activeTab === "capa" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("capa");
                setIsSidebarOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              type="button"
            >
              <span>
                <span className="portfolio-item-icon">📄</span>
                Capa
              </span>
              <span className="portfolio-item-arrow">→</span>
            </button>
          </div>

          {/* 2. Biografia (Na Página Inicial) */}
          <div className="portfolio-nav-group">
            <button
              className="portfolio-nav-item"
              onClick={handleBioClick}
              type="button"
            >
              <span>
                <span className="portfolio-item-icon">👤</span>
                Biografia
              </span>
              <span className="portfolio-item-arrow">↓</span>
            </button>
          </div>

          {/* 3. Skills & Bastidores */}
          <div className="portfolio-nav-group">
            <button
              className={`portfolio-nav-item ${activeTab === "bio" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("bio");
                setIsSidebarOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              type="button"
            >
              <span>
                <span className="portfolio-item-icon">🛠️</span>
                Skills &amp; Bastidores
              </span>
              <span className="portfolio-item-arrow">→</span>
            </button>
          </div>

            {/* 3. Projetos */}
            <div className="portfolio-nav-group">
              <button
                className={`portfolio-nav-item ${activeTab === "projetos" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("projetos");
                  setIsProjectsExpanded(!isProjectsExpanded);
                }}
                type="button"
              >
                <span>
                  <span className="portfolio-item-icon">📊</span>
                  Projetos
                </span>
                <span className={`portfolio-accordion-arrow ${isProjectsExpanded ? "open" : ""}`}>
                  ▶
                </span>
              </button>

              {/* Ramificação de Projetos: apenas Portal Completo (Hub) */}
              {isProjectsExpanded && (
                <div className="portfolio-submenu">
                  <Link
                    className="portfolio-subitem"
                    href="/portal"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      <span className="portfolio-subitem-dot" />
                      Portal Completo (Hub)
                    </span>
                    <span style={{ fontSize: "10px", color: "#64748b" }}>→</span>
                  </Link>
                </div>
              )}
            </div>

          {/* 4. Projeto Python */}
          <div className="portfolio-nav-group">
            <button
              className={`portfolio-nav-item ${activeTab === "python" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("python");
                setIsSidebarOpen(false);
              }}
              type="button"
            >
              <span>
                <span className="portfolio-item-icon">🐍</span>
                Projeto Python
              </span>
              <span className="portfolio-item-arrow">→</span>
            </button>
          </div>

          {/* 5. Projeto SQL */}
          <div className="portfolio-nav-group">
            <button
              className={`portfolio-nav-item ${activeTab === "sql" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("sql");
                setIsSidebarOpen(false);
              }}
              type="button"
            >
              <span>
                <span className="portfolio-item-icon">🗄️</span>
                Projeto SQL
              </span>
              <span className="portfolio-item-arrow">→</span>
            </button>
          </div>

          {/* 6. Projeto Apps Script */}
          <div className="portfolio-nav-group">
            <button
              className={`portfolio-nav-item ${activeTab === "apps-script" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("apps-script");
                setIsSidebarOpen(false);
              }}
              type="button"
            >
              <span>
                <span className="portfolio-item-icon">⚡</span>
                Projeto Apps Script
              </span>
              <span className="portfolio-item-arrow">→</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="portfolio-sidebar-bottom">
          <button
            aria-label="Informações sobre o projeto e compliance"
            className="portfolio-info-btn"
            onClick={() => setIsInfoModalOpen(true)}
            title="Informações sobre este portfólio"
            type="button"
          >
            ℹ
          </button>
          <span className="portfolio-bottom-status">Case • 100% Mock Safe</span>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="portfolio-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ===================================================================
          MAIN CONTENT AREA: CAPA | BIO | PROJETOS (SUMÁRIO)
          =================================================================== */}
      <main className="portfolio-main">
        {/* VIEW 1: CAPA (COVER) */}
        {activeTab === "capa" && (
          <div className="portfolio-capa-view">
            {/* Header / Hero */}
            <header className="portfolio-capa-header">
              <span className="portfolio-capa-eyebrow">
                Engenharia de Dados & Inteligência Operacional
              </span>
              <h1 className="portfolio-capa-author">{profileData.name}</h1>
              <p className="portfolio-capa-desc">
                Plataforma de alta performance para monitoramento de malha logística, controle de SLA
                em tempo real e governança de indicadores operacionais de alto volume.
              </p>
            </header>

            {/* Central Hero AI & Data Pipeline Image Stage */}
            <div className="portfolio-hero-image-stage">
              <div className="portfolio-hero-image-card">
                <img
                  src="/hero-ai-network.jpg"
                  alt="Inteligência Operacional e Redes de Dados"
                  className="portfolio-hero-image"
                />
                <div className="portfolio-hero-image-overlay" />
                <div className="portfolio-hero-badge">
                  <span>Inteligência Operacional • Redes de Alta Escala</span>
                </div>
              </div>
            </div>

            {/* Quick Action Launchpad Cards */}
            <div className="portfolio-capa-launchpad">
              <Link className="portfolio-launch-card" href="/portal">
                <div>
                  <div className="portfolio-launch-top">
                    <span className="portfolio-launch-badge">Portal de Indicadores</span>
                    <span style={{ fontSize: "18px" }}>🏛️</span>
                  </div>
                  <h3>Portal Completo (Hub)</h3>
                  <p>
                    Acesse o hub central de indicadores com todos os dashboards operacionais em tempo real,
                    esteiras, pátio e matriz de KPIs GEROT.
                  </p>
                </div>
                <span className="portfolio-launch-action">Acessar Portal Completo (Hub) →</span>
              </Link>

              <button
                className="portfolio-launch-card"
                onClick={() => setActiveTab("bio")}
                style={{ textAlign: "left", cursor: "pointer" }}
                type="button"
              >
                <div>
                  <div className="portfolio-launch-top">
                    <span className="portfolio-launch-badge">Stack &amp; Engenharia</span>
                    <span style={{ fontSize: "18px" }}>🛠️</span>
                  </div>
                  <h3>Skills &amp; Bastidores Técnicos</h3>
                  <p>
                    Matriz de competências técnicas em dados e logística, e o detalhamento aprofundado da arquitetura deste dashboard.
                  </p>
                </div>
                <span className="portfolio-launch-action">Ver Skills &amp; Bastidores Técnicos →</span>
              </button>

              <button
                className="portfolio-launch-card"
                onClick={() => setActiveTab("python")}
                style={{ textAlign: "left", cursor: "pointer" }}
                type="button"
              >
                <div>
                  <div className="portfolio-launch-top">
                    <span className="portfolio-launch-badge" style={{ background: "#fef3c7", color: "#92400e" }}>
                      Automação & RPA
                    </span>
                    <span style={{ fontSize: "18px" }}>🐍</span>
                  </div>
                  <h3>Projeto Python (Robô TOs)</h3>
                  <p>
                    Pipeline em Python com Requests (SSO/CSRF), Pandas e Google Sheets API v4 para coleta e ingestão autônoma.
                  </p>
                </div>
                <span className="portfolio-launch-action">Ver Documentação & Código →</span>
              </button>

              <button
                className="portfolio-launch-card"
                onClick={() => setActiveTab("sql")}
                style={{ textAlign: "left", cursor: "pointer" }}
                type="button"
              >
                <div>
                  <div className="portfolio-launch-top">
                    <span className="portfolio-launch-badge" style={{ background: "#ede9fe", color: "#6d28d9" }}>
                      Analytics Engineering
                    </span>
                    <span style={{ fontSize: "18px" }}>🗄️</span>
                  </div>
                  <h3>Projeto SQL (Data Analytics)</h3>
                  <p>
                    Query analítica avançada com CTE, Regex para desduplicação de operadores, Partition Pruning e correlação com esteiras.
                  </p>
                </div>
                <span className="portfolio-launch-action">Ver Análise & Consulta SQL →</span>
              </button>

              <button
                className="portfolio-launch-card"
                onClick={() => setActiveTab("apps-script")}
                style={{ textAlign: "left", cursor: "pointer" }}
                type="button"
              >
                <div>
                  <div className="portfolio-launch-top">
                    <span className="portfolio-launch-badge" style={{ background: "#ecfdf5", color: "#065f46" }}>
                      Google Cloud & Apps Script
                    </span>
                    <span style={{ fontSize: "18px" }}>⚡</span>
                  </div>
                  <h3>Projeto Apps Script (Leftover Control)</h3>
                  <p>
                    Web App operacional de sobras e pátio: HtmlService templating, LockService de concorrência e chunking de CacheService.
                  </p>
                </div>
                <span className="portfolio-launch-action">Ver Web App & Arquitetura GAS →</span>
              </button>
            </div>

            {/* ===================================================================
                SEÇÃO: BIOGRAFIA & TRAJETÓRIA PROFISSIONAL (APENAS NA PÁGINA INICIAL)
                =================================================================== */}
            <section
              id="biografia"
              style={{
                padding: "0 48px 60px",
                maxWidth: "1280px"
              }}
            >
              {/* Header da Seção de Biografia */}
              <div style={{ marginBottom: "28px", borderTop: "1px solid #e2e8f0", paddingTop: "36px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#eff6ff", padding: "4px 12px", borderRadius: "999px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "14px" }}>👤</span>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Resumo Biográfico &amp; Trajetória
                  </span>
                </div>
                <h2 style={{ fontSize: "30px", color: "#0f172a", margin: "0 0 8px", fontWeight: 800 }}>
                  Biografia Profissional
                </h2>
                <p style={{ fontSize: "15px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                  Trajetória técnica, competências de negócio em supply chain e histórico de impacto em operações logísticas de grande escala.
                </p>
              </div>

              {/* Card de Apresentação & Resumo Biográfico */}
              <div className="card" style={{ padding: "36px", marginBottom: "28px", borderLeft: "5px solid #2563eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", color: "#2563eb", textTransform: "uppercase" }}>
                      Perfil Profissional
                    </span>
                    <h3 style={{ fontSize: "32px", margin: "6px 0 8px", color: "#0f172a", fontWeight: 800 }}>{profileData.name}</h3>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#334155", margin: 0 }}>{profileData.headline}</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        setActiveTab("bio");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                      type="button"
                    >
                      🛠️ Ver Skills &amp; Bastidores →
                    </button>
                    <a
                      href={profileData.social.linkedin}
                      rel="noreferrer"
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        background: "#0a66c2",
                        color: "#ffffff",
                        fontSize: "13px",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                      target="_blank"
                    >
                      LinkedIn ↗
                    </a>
                  </div>
                </div>

                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#475569", margin: "0 0 20px" }}>
                  {profileData.subheadline}
                </p>

                <div style={{
                  fontSize: "14px",
                  lineHeight: 1.8,
                  color: "#334155",
                  whiteSpace: "pre-line",
                  background: "#f8fafc",
                  padding: "24px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0"
                }}>
                  {profileData.bio}
                </div>
              </div>

              {/* Trajetória Profissional */}
              <div className="card" style={{ padding: "36px", marginBottom: "28px" }}>
                <h3 style={{ fontSize: "22px", color: "#0f172a", margin: "0 0 20px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>💼</span> Trajetória Profissional
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {profileData.experiences.map((exp, idx) => (
                    <div key={idx} style={{ borderBottom: idx < profileData.experiences.length - 1 ? "1px solid #e2e8f0" : "none", paddingBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                        <strong style={{ fontSize: "17px", color: "#0f172a" }}>{exp.role}</strong>
                        <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 700 }}>{exp.period}</span>
                      </div>
                      <div style={{ fontSize: "14px", color: "#2563eb", fontWeight: 700, margin: "2px 0 10px" }}>{exp.companyContext}</div>
                      <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, margin: "0 0 12px" }}>{exp.description}</p>
                      <ul style={{ margin: "0 0 14px 20px", padding: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.6 }}>
                        {exp.achievements.map((ach, aidx) => (
                          <li key={aidx} style={{ marginBottom: "5px" }}>{ach}</li>
                        ))}
                      </ul>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {exp.skillsUsed.map((sk, sidx) => (
                          <span key={sidx} style={{
                            fontSize: "11px",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "#f1f5f9",
                            color: "#475569",
                            fontWeight: 600,
                            border: "1px solid #e2e8f0"
                          }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formação Acadêmica & Licenças/Certificados */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                {/* Formação Acadêmica */}
                <div className="card" style={{ padding: "32px" }}>
                  <h3 style={{ fontSize: "20px", margin: "0 0 16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px", fontWeight: 800 }}>
                    🎓 Formação Acadêmica
                  </h3>
                  {profileData.education.map((edu, idx) => (
                    <div key={idx} style={{ background: "#f8fafc", padding: "18px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{edu.degree}</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#2563eb", marginTop: "4px" }}>{edu.institution}</div>
                      <div style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 8px" }}>{edu.period}</div>
                      {edu.details && <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.6 }}>{edu.details}</p>}
                    </div>
                  ))}
                </div>

                {/* Licenças & Certificados */}
                <div className="card" style={{ padding: "32px" }}>
                  <h3 style={{ fontSize: "20px", margin: "0 0 16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px", fontWeight: 800 }}>
                    📜 Licenças &amp; Certificados
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {profileData.certifications.map((cert, idx) => (
                      <div key={idx} style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e3048" }}>{cert.title}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{cert.issuer}</div>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: "4px" }}>
                          {cert.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: SKILLS & BASTIDORES TÉCNICOS */}
        {activeTab === "bio" && (
          <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <button
                onClick={() => setActiveTab("capa")}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  color: "#1e3048",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                }}
                type="button"
                title="Voltar à Capa Principal"
              >
                ← Voltar para a Capa
              </button>
              <Link
                href="/bio"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#64748b",
                  textDecoration: "underline"
                }}
              >
                Abrir em Página Dedicada ↗
              </Link>
            </div>

            {/* Cabeçalho da Seção */}
            <header style={{ marginBottom: "28px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#eff6ff", padding: "4px 12px", borderRadius: "999px", marginBottom: "10px" }}>
                <span style={{ fontSize: "14px" }}>🛠️</span>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Stack &amp; Arquitetura
                </span>
              </div>
              <h2 style={{ fontSize: "28px", color: "#0f172a", margin: "0 0 8px", fontWeight: 800 }}>
                Skills &amp; Bastidores Técnicos Deste Dashboard
              </h2>
              <p style={{ fontSize: "15px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                Matriz de competências técnicas em engenharia analítica e logística, complementada pelo detalhamento aprofundado da arquitetura, governança e performance desta plataforma.
              </p>
            </header>

            {/* 1. Competências Técnicas */}
            <div className="card" style={{ padding: "32px", marginBottom: "28px" }}>
              <h3 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📊</span> Competências Técnicas
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                {profileData.skills.map((cat, idx) => (
                  <div key={idx} style={{ background: "#f8fafc", padding: "18px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#1e293b" }}>{cat.title}</h4>
                    <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#64748b" }}>{cat.description}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {cat.skills.map((s, sidx) => (
                        <div key={sidx}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                            <span style={{ fontWeight: s.highlight ? 700 : 500, color: "#1e293b" }}>{s.name}</span>
                            <span style={{ color: "#2563eb", fontWeight: 700 }}>{s.level}%</span>
                          </div>
                          <div style={{ width: "100%", height: "5px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${s.level}%`, height: "100%", background: "#2563eb", borderRadius: "3px" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Os Bastidores Técnicos Deste Dashboard (Detalhados) */}
            <div className="card" style={{ padding: "36px", borderLeft: "5px solid #2563eb" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    color: "#2563eb",
                    background: "#eff6ff",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    letterSpacing: "0.06em"
                  }}>
                    Deep Dive de Engenharia
                  </span>
                  <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 600 }}>
                    Arquitetura, Pipeline &amp; Decisões de Projeto
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "#166534", background: "#f0fdf4", padding: "4px 10px", borderRadius: "4px", fontWeight: 700 }}>
                  ✓ Padrão Corporativo &amp; Zero Dependências Pesadas
                </span>
              </div>

              <h2 style={{ fontSize: "24px", margin: "0 0 12px", color: "#0f172a", fontWeight: 800 }}>
                Os Bastidores Técnicos Deste Dashboard
              </h2>
              <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.7, margin: "0 0 28px" }}>
                Este projeto foi concebido como uma plataforma de inteligência operacional de ponta a ponta, construída para superar as limitações de escalabilidade, concorrência e latência de dados em galpões logísticos de alta escala (ex: Shopee, Mercado Livre). Abaixo estão detalhados os pilares que sustentam a solução:
              </p>

              {/* Grid dos 4 Pilares Técnicos */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "32px" }}>
                {/* 1. Desafio Logístico & Problema */}
                <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "22px" }}>📦</span>
                    <h3 style={{ fontSize: "17px", margin: 0, color: "#1e293b", fontWeight: 700 }}>1. O Problema &amp; Desafio Logístico</h3>
                  </div>
                  <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, margin: "0 0 12px" }}>
                    <strong>O Cenário:</strong> Centros de triagem (Hubs/Cross-docking) movimentam centenas de milhares de pacotes diários sob prazos rígidos de corte (CPT - Critical Pull Time), onde qualquer atraso na identificação de gargalos gera penalidades contratuais e estouro de SLA.
                  </p>
                  <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, margin: "0 0 12px" }}>
                    <strong>O Gargalo Real:</strong> Planilhas compartilhadas pesadas (&gt;50MB) frequentemente congelam, sofrem sobrescrita concorrente, demoram minutos para atualizar e não oferecem visualização intuitiva por esteira e doca.
                  </p>
                  <div style={{ background: "#eff6ff", padding: "10px 14px", borderRadius: "6px", fontSize: "12.5px", color: "#1e40af" }}>
                    <strong>Solução:</strong> Painel em tempo real responsivo com telemetria visual das esteiras, volume hora a hora e alertas automáticos de desbalanceamento.
                  </div>
                </div>

                {/* 2. Arquitetura Frontend & Micro-SVGs */}
                <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "22px" }}>⚡</span>
                    <h3 style={{ fontSize: "17px", margin: 0, color: "#1e293b", fontWeight: 700 }}>2. Arquitetura Frontend &amp; Micro-SVGs</h3>
                  </div>
                  <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, margin: "0 0 12px" }}>
                    <strong>Stack Tecnológica:</strong> Desenvolvido com <strong>Next.js 14 App Router</strong>, <strong>React 18</strong> e <strong>TypeScript em modo Strict</strong>, assegurando zero erros de tipagem e manutenibilidade contínua.
                  </p>
                  <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, margin: "0 0 12px" }}>
                    <strong>Micro-SVGs Matemáticos:</strong> Em vez de carregar bibliotecas gráficas pesadas de terceiros (como Chart.js ou Recharts, que inflam o bundle em centenas de KB), todos os gráficos foram programados em <strong>SVGs nativos puros</strong> (&lt;5KB por componente), gerando renderização vetorial cristalina com latência zero.
                  </p>
                  <div style={{ background: "#eff6ff", padding: "10px 14px", borderRadius: "6px", fontSize: "12.5px", color: "#1e40af" }}>
                    <strong>Performance:</strong> First Contentful Paint (FCP) de &lt;150ms, operando fluidamente mesmo em conexões Wi-Fi instáveis de galpão e coletores móveis.
                  </div>
                </div>

                {/* 3. Pipeline de Dados, Cache & Backend Apps Script */}
                <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "22px" }}>🗄️</span>
                    <h3 style={{ fontSize: "17px", margin: 0, color: "#1e293b", fontWeight: 700 }}>3. Pipeline de Dados &amp; Estratégia de Cache</h3>
                  </div>
                  <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, margin: "0 0 12px" }}>
                    <strong>Cache Multicamada SWR:</strong> Utiliza o padrão <em>Stale-While-Revalidate</em>. O frontend renderiza instantaneamente os dados em cache e faz revalidações assíncronas em segundo plano, garantindo zero spinners intrusivos.
                  </p>
                  <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, margin: "0 0 12px" }}>
                    <strong>Engenharia Apps Script V2:</strong> Implementação de <code>LockService.getScriptLock()</code> para gravação atômica sem race conditions; particionamento de <code>CacheService</code> em chunks (para contornar a cota de 100KB); e leitura atômica em bloco com <code>batchGet</code>.
                  </p>
                  <div style={{ background: "#eff6ff", padding: "10px 14px", borderRadius: "6px", fontSize: "12.5px", color: "#1e40af" }}>
                    <strong>Automação Python:</strong> Pipeline autônomo com autenticação SSO/CSRF, desduplicação vetorial em Pandas e ingestão em lote nas APIs do Google Cloud.
                  </div>
                </div>

                {/* 4. Governança, Blindagem de Compliance & Segurança */}
                <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "22px" }}>🛡️</span>
                    <h3 style={{ fontSize: "17px", margin: 0, color: "#1e293b", fontWeight: 700 }}>4. Governança &amp; Blindagem de Compliance</h3>
                  </div>
                  <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, margin: "0 0 12px" }}>
                    <strong>100% Mock-Safe &amp; LGPD:</strong> Nenhum dado real de remetentes, destinatários, placas de veículos, chaves de acesso ou dados pessoais de colaboradores foi exposto. Todos os volumes e identificadores são gerados por um mock engine algorítmico determinístico.
                  </p>
                  <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, margin: "0 0 12px" }}>
                    <strong>Arquitetura Sanitizada:</strong> Código desvinculado de credenciais proprietárias. As regras de negócio foram abstraídas em contratos de interfaces e DTOs, permitindo validação pública do portfólio sem risco de exposição corporativa.
                  </p>
                  <div style={{ background: "#eff6ff", padding: "10px 14px", borderRadius: "6px", fontSize: "12.5px", color: "#1e40af" }}>
                    <strong>Conformidade:</strong> O projeto replica 100% dos fluxos operacionais reais sem quebrar termos de confidencialidade (NDA) de empregadores ou parceiros.
                  </div>
                </div>
              </div>

              {/* Métricas Técnicas de Engenharia */}
              <div style={{
                background: "#0f172a",
                color: "#f8fafc",
                padding: "24px 28px",
                borderRadius: "10px",
                marginBottom: "28px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px"
              }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tempo de Resposta UI</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#38bdf8", marginTop: "4px" }}>&lt; 150ms</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Micro-SVGs &amp; CSS puro</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Qualidade de Código</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#4ade80", marginTop: "4px" }}>100%</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>TypeScript Strict (0 errors)</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Redução de Scan SQL</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#a78bfa", marginTop: "4px" }}>-95%</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Partition Pruning &amp; Regex CTE</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Blindagem de Dados</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#facc15", marginTop: "4px" }}>Zero PII</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Total conformidade LGPD &amp; NDA</div>
                </div>
              </div>

              {/* Atalhos Rápidos para os Módulos Práticos */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                  Explore os módulos e provas técnicas construídas nesta plataforma:
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <Link
                    href="/portal"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                  >
                    Acessar Portal Completo →
                  </Link>
                  <button
                    onClick={() => setActiveTab("python")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#0f172a",
                      fontSize: "13px",
                      fontWeight: 700,
                      border: "1px solid #cbd5e1",
                      cursor: "pointer"
                    }}
                    type="button"
                  >
                    Projeto Python ↗
                  </button>
                  <button
                    onClick={() => setActiveTab("sql")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#0f172a",
                      fontSize: "13px",
                      fontWeight: 700,
                      border: "1px solid #cbd5e1",
                      cursor: "pointer"
                    }}
                    type="button"
                  >
                    Projeto SQL ↗
                  </button>
                  <button
                    onClick={() => setActiveTab("apps-script")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#0f172a",
                      fontSize: "13px",
                      fontWeight: 700,
                      border: "1px solid #cbd5e1",
                      cursor: "pointer"
                    }}
                    type="button"
                  >
                    Projeto Apps Script ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: PROJETOS */}
        {activeTab === "projetos" && (
          <div className="portfolio-sumario-view">
            <header className="portfolio-sumario-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="portfolio-section-badge">Projetos</span>
                <button
                  onClick={() => setActiveTab("capa")}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    color: "#1e3048",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                  }}
                  type="button"
                  title="Voltar à Capa Principal"
                >
                  ← Voltar para a Capa
                </button>
              </div>
              <h2>Projetos & Soluções</h2>
              <p>
                Acesse o ambiente analítico unificado contendo todos os indicadores operacionais,
                painéis em tempo real e matrizes de governança.
              </p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginTop: "12px" }}>
              <Link
                className="portfolio-project-card"
                href="/portal"
                style={{
                  padding: "32px",
                  borderLeft: "5px solid #2563eb",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", background: "#eff6ff", padding: "4px 10px", borderRadius: "999px" }}>
                      Hub Central
                    </span>
                    <span style={{ fontSize: "24px" }}>🏛️</span>
                  </div>
                  <h3 style={{ fontSize: "22px", margin: "0 0 10px", color: "#0f172a" }}>Portal Completo (Hub)</h3>
                  <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
                    Plataforma completa agregando todos os módulos de inteligência: Operação em Tempo Real (Esteiras, HC, Inbound, Packing, Outbound), Matriz Executiva GEROT & KPIs Performance (Cost, Quality, Speed), People Track e One Pages Operacionais.
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534", background: "#f0fdf4", padding: "4px 8px", borderRadius: "4px" }}>
                    ✓ Todos os Indicadores Integrados
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#2563eb", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    Abrir Portal Completo (Hub) →
                  </span>
                </div>
              </Link>

              {/* Card Projeto Python */}
              <button
                className="portfolio-launch-card"
                onClick={() => setActiveTab("python")}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  padding: "32px",
                  borderLeft: "5px solid #10b981",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
                type="button"
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#065f46", textTransform: "uppercase", background: "#d1fae5", padding: "4px 10px", borderRadius: "999px" }}>
                      Pipeline & Automação
                    </span>
                    <span style={{ fontSize: "24px" }}>🐍</span>
                  </div>
                  <h3 style={{ fontSize: "22px", margin: "0 0 10px", color: "#0f172a" }}>Projeto Python (Robô de TOs)</h3>
                  <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
                    Pipeline autônomo em Python para extração de dezenas de milhares de Ordens de Transporte (TOs), autenticação segura SSO/CSRF, deduplicação em memória com Pandas e ingestão em lote no Google Sheets API v4.
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534", background: "#f0fdf4", padding: "4px 8px", borderRadius: "4px" }}>
                    ✓ Código Sanitizado & Arquitetura
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#10b981", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    Explorar Projeto Python →
                  </span>
                </div>
              </button>

              {/* Card Projeto SQL */}
              <button
                className="portfolio-launch-card"
                onClick={() => setActiveTab("sql")}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  padding: "32px",
                  borderLeft: "5px solid #8b5cf6",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
                type="button"
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#6d28d9", textTransform: "uppercase", background: "#ede9fe", padding: "4px 10px", borderRadius: "999px" }}>
                      Modelagem &amp; Otimização
                    </span>
                    <span style={{ fontSize: "24px" }}>🗄️</span>
                  </div>
                  <h3 style={{ fontSize: "22px", margin: "0 0 10px", color: "#0f172a" }}>Projeto SQL (Produtividade em Esteiras)</h3>
                  <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
                    Engenharia analítica de alto desempenho: CTE com Regex para normalização de chaves de operadores, poda de partições com -95% de varredura no Data Lake e cruzamento resiliente com telemetria horária de postos físicos.
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#6d28d9", background: "#f5f3ff", padding: "4px 8px", borderRadius: "4px" }}>
                    ✓ Destrinchamento Completo &amp; Cláusulas
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#8b5cf6", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    Explorar Projeto SQL →
                  </span>
                </div>
              </button>

              {/* Card Projeto Apps Script */}
              <button
                className="portfolio-launch-card"
                onClick={() => setActiveTab("apps-script")}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  padding: "32px",
                  borderLeft: "5px solid #10b981",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
                type="button"
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#065f46", textTransform: "uppercase", background: "#ecfdf5", padding: "4px 10px", borderRadius: "999px" }}>
                      Apps Script &amp; Web App
                    </span>
                    <span style={{ fontSize: "24px" }}>⚡</span>
                  </div>
                  <h3 style={{ fontSize: "22px", margin: "0 0 10px", color: "#0f172a" }}>Projeto Apps Script (Leftover Control &amp; Pátio)</h3>
                  <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
                    Aplicação web operacional completa: HtmlService com micro-componentes, LockService contra race conditions, particionamento de CacheService (70KB) e leitura atômica em lote no Google Sheets.
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#065f46", background: "#d1fae5", padding: "4px 8px", borderRadius: "4px" }}>
                    ✓ Web App Interativo &amp; Código Completo
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#059669", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    Explorar Projeto Apps Script →
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: PROJETO PYTHON */}
        {activeTab === "python" && (
          <PythonProjectView onBackToCapa={() => setActiveTab("capa")} />
        )}

        {/* VIEW 5: PROJETO SQL */}
        {activeTab === "sql" && (
          <SqlProjectView onBackToCapa={() => setActiveTab("capa")} />
        )}

        {/* VIEW 6: PROJETO APPS SCRIPT */}
        {activeTab === "apps-script" && (
          <AppsScriptProjectView onBackToCapa={() => setActiveTab("capa")} />
        )}
      </main>

      {/* ===================================================================
          MODAL INFORMATIVO (i)
          =================================================================== */}
      {isInfoModalOpen && (
        <div
          className="portfolio-modal-overlay"
          onClick={() => setIsInfoModalOpen(false)}
        >
          <div
            className="portfolio-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="portfolio-modal-head">
              <strong>Sobre este Portfólio de Engenharia & Dados</strong>
              <button
                className="portfolio-modal-close"
                onClick={() => setIsInfoModalOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="portfolio-modal-body">
              <span className="portfolio-modal-badge">
                ✓ Blindagem de Compliance & Dados 100% Sintéticos
              </span>

              <p>
                Este projeto foi concebido como um <strong>case técnico de negócio e portfólio profissional</strong> para
                demonstrar habilidades em Engenharia de Software Fullstack, Engenharia de Dados e Inteligência Operacional
                em logística de alta escala.
              </p>

              <div>
                <strong style={{ display: "block", marginBottom: "4px", color: "#0f172a" }}>
                  Premissas de Governança:
                </strong>
                <ul style={{ margin: "0 0 0 20px", padding: 0, fontSize: "13px", color: "#475569" }}>
                  <li>Nenhum dado real, confidencial ou pessoal de clientes e parceiros foi utilizado.</li>
                  <li>Todas as métricas, volumes e nomes são gerados algoritmicamente via mock engine.</li>
                  <li>Identidades visuais e marcas proprietárias foram totalmente descaracterizadas.</li>
                </ul>
              </div>

              <div>
                <strong style={{ display: "block", marginBottom: "4px", color: "#0f172a" }}>
                  Stack Tecnológica:
                </strong>
                <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
                  Next.js 14 (App Router), React 18, TypeScript Estrito, Micro-SVGs Nativos, Python RPA e Google
                  Apps Script Architecture.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <a
                  href={profileData.social.linkedin}
                  rel="noreferrer"
                  style={{
                    padding: "8px 16px",
                    background: "#0a66c2",
                    color: "#ffffff",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textDecoration: "none"
                  }}
                  target="_blank"
                >
                  Ver Perfil no LinkedIn ↗
                </a>
                <a
                  href={profileData.social.github}
                  rel="noreferrer"
                  style={{
                    padding: "8px 16px",
                    background: "#1e293b",
                    color: "#ffffff",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textDecoration: "none"
                  }}
                  target="_blank"
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
