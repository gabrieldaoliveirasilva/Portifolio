import Link from "next/link";
import AppHeader from "@/components/app-header";
import { profileData } from "@/lib/profile-data";

export default function BioPage() {
  return (
    <main className="page" style={{ maxWidth: "1180px", margin: "0 auto", padding: "16px 20px 40px" }}>
      <AppHeader title="SKILLS & BASTIDORES TÉCNICOS" />

      {/* Voltar */}
      <div style={{ marginBottom: "20px" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            color: "var(--blue, #2563eb)",
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          ← Voltar à Capa Principal
        </Link>
      </div>

      {/* Cabeçalho da Página */}
      <div className="card" style={{ padding: "28px", marginBottom: "24px", borderLeft: "5px solid #2563eb" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#eff6ff", padding: "4px 12px", borderRadius: "999px", marginBottom: "10px" }}>
          <span style={{ fontSize: "14px" }}>🛠️</span>
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Stack &amp; Arquitetura Operacional
          </span>
        </div>
        <h1 style={{ fontSize: "28px", margin: "0 0 8px", color: "#0f172a", fontWeight: 800 }}>
          Skills &amp; Bastidores Técnicos Deste Dashboard
        </h1>
        <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
          Matriz de competências técnicas em engenharia analítica e inteligência de supply chain, acompanhada do detalhamento profundo da arquitetura, governança e estratégias de performance desta plataforma.
        </p>
      </div>

      {/* 1. COMPETÊNCIAS TÉCNICAS */}
      <div className="card" style={{ padding: "28px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", margin: "0 0 16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📊</span> Competências Técnicas
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          {profileData.skills.map((cat, idx) => (
            <div key={idx} style={{
              background: "#f8fafc",
              padding: "18px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0"
            }}>
              <h3 style={{ fontSize: "15px", color: "#1e293b", margin: "0 0 4px" }}>
                {cat.title}
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 14px" }}>
                {cat.description}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {cat.skills.map((s, sidx) => (
                  <div key={sidx}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "2px" }}>
                      <span style={{ fontWeight: s.highlight ? 600 : 400, color: "#1e293b" }}>{s.name}</span>
                      <span style={{ color: "#2563eb", fontWeight: 600 }}>{s.level}%</span>
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

      {/* 2. OS BASTIDORES TÉCNICOS DESTE DASHBOARD (DETALHADO) */}
      <div className="card" style={{ padding: "32px", borderLeft: "5px solid #2563eb" }}>
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
            <Link
              href="/projeto-python"
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                background: "#f1f5f9",
                color: "#0f172a",
                fontSize: "13px",
                fontWeight: 700,
                border: "1px solid #cbd5e1",
                textDecoration: "none"
              }}
            >
              Projeto Python ↗
            </Link>
            <Link
              href="/projeto-sql"
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                background: "#f1f5f9",
                color: "#0f172a",
                fontSize: "13px",
                fontWeight: 700,
                border: "1px solid #cbd5e1",
                textDecoration: "none"
              }}
            >
              Projeto SQL ↗
            </Link>
            <Link
              href="/performance-monitor"
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                background: "#0284c7",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              Performance Monitor (GAS) ↗
            </Link>
            <Link
              href="/projeto-apps-script"
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                background: "#f1f5f9",
                color: "#0f172a",
                fontSize: "13px",
                fontWeight: 700,
                border: "1px solid #cbd5e1",
                textDecoration: "none"
              }}
            >
              Projeto Apps Script ↗
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
