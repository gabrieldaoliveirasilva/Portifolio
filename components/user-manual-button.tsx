"use client";

import { useState, useRef, useEffect } from "react";

export default function UserManualButton() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="button dark"
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "2rem",
          zIndex: 50,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
        MANUAL DO USUÁRIO
      </button>

      <dialog 
        ref={dialogRef} 
        onClose={() => setIsOpen(false)}
        style={{
          padding: "0",
          border: "none",
          borderRadius: "8px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "85vh",
          background: "#fff",
          color: "#333",
          fontFamily: "inherit"
        }}
      >
        <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", position: "sticky", top: 0, background: "#fff" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#111" }}>Manual de Uso - ORÁCULO MG4</h2>
          <button 
            onClick={() => setIsOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              lineHeight: 1,
              padding: "4px 8px",
              color: "#666"
            }}
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>
        
        <div style={{ padding: "24px", overflowY: "auto", lineHeight: "1.6", fontSize: "0.95rem" }}>
          
          <h3 style={{ marginTop: 0, color: "#0052CC" }}>Sumário de Navegação</h3>
          <p>A página inicial do ORÁCULO funciona como um grande portal dividido em frentes operacionais e de gestão. A partir dela, você tem acesso às seguintes áreas:</p>

          <h4 style={{ color: "#333", borderBottom: "1px solid #eee", paddingBottom: "8px", marginTop: "24px" }}>1. Operação Gerencial</h4>
          <p>O coração da operação do hub, dividido nos três macrossetores logísticos:</p>
          <ul style={{ paddingLeft: "20px" }}>
            <li style={{ marginBottom: "8px" }}><strong>📦 INBOUND (Recebimento)</strong>
              <ul style={{ marginTop: "4px" }}>
                <li><em>Inbound Live:</em> Acompanhamento em tempo real. Mostra a quantidade de carros em fila (arrived), veículos em doca (unseal), tempos médios de fila e de doca, além de clusterização de carga.</li>
                <li><em>Histórico LH Inbound:</em> Visão completa do passado do recebimento, com aberturas por hora, turno, destino e cluster.</li>
              </ul>
            </li>
            <li style={{ marginBottom: "8px" }}><strong>⚙️ PACKING (Triagem / Esteiras)</strong>
              <ul style={{ marginTop: "4px" }}>
                <li><em>Live Prod Esteiras:</em> Visão em tempo real da produtividade geral do hub (SoC) e o atingimento de meta individualizado por cada esteira.</li>
                <li><em>Histórico Prod Esteiras:</em> Resumo de fechamento com todo o histórico de produção das esteiras (por hora, turno, cluster, etc).</li>
              </ul>
            </li>
            <li style={{ marginBottom: "8px" }}><strong>🚚 OUTBOUND (Expedição)</strong>
              <ul style={{ marginTop: "4px" }}>
                <li><em>Histórico LH Outbound:</em> Visão completa e histórica de tudo o que foi expedido, com visões detalhadas por hora, turno, destino e cluster de veículos.</li>
              </ul>
            </li>
          </ul>

          <h4 style={{ color: "#333", borderBottom: "1px solid #eee", paddingBottom: "8px", marginTop: "24px" }}>2. GEROT</h4>
          <p>Painel executivo focado nas metas e na governança do hub:</p>
          <ul style={{ paddingLeft: "20px" }}>
            <li>Consolida os indicadores-chave da operação (Farol de Metas).</li>
            <li>Dá acesso direto a sub-dashboards e ferramentas analíticas específicas de cada indicador de performance.</li>
          </ul>

          <h4 style={{ color: "#333", borderBottom: "1px solid #eee", paddingBottom: "8px", marginTop: "24px" }}>3. Gestão de Pessoas (People)</h4>
          <p>O módulo focado no controle operacional da equipe:</p>
          <ul style={{ paddingLeft: "20px" }}>
            <li><strong>Ferramentas Gerenciais:</strong> Monitoramento de Absenteísmo (faltas) e SPAN Operacional (relação líder x liderado).</li>
            <li><strong>People Track:</strong> Ferramenta oficial para registro de medidas disciplinares (advertências, suspensões) e histórico de Feedbacks.</li>
          </ul>

          <h4 style={{ color: "#333", borderBottom: "1px solid #eee", paddingBottom: "8px", marginTop: "24px" }}>4. One Pages Operacionais</h4>
          <p>Perfeito para passagens de turno e reuniões de alinhamento rápido. Reúne em uma única tela os principais números em tempo real de cada setor:</p>
          <ul style={{ paddingLeft: "20px" }}>
            <li><strong>Inbound:</strong> Mapa de Stage In e carros em fila...</li>
            <li><strong>Esteiras:</strong> Resumo rápido de produtividade e acompanhamento de esteiras.</li>
            <li><strong>Outbound:</strong> Mapa de saídas, veículos aguardando e programação do dia.</li>
          </ul>

          <h4 style={{ color: "#333", borderBottom: "1px solid #eee", paddingBottom: "8px", marginTop: "24px" }}>5. Ferramentas Diversas</h4>
          <p>Apoio tático para auditores e liderança no dia a dia do hub:</p>
          <ul style={{ paddingLeft: "20px" }}>
            <li>Registro de anomalias operacionais.</li>
            <li>Ferramentas para Análise e Solução de Problemas (ASP).</li>
            <li>Controle de equipamentos (coletores, rádios, etc).</li>
          </ul>

        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          dialog::backdrop {
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(2px);
          }
        `}} />
      </dialog>
    </>
  );
}
