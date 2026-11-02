"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { profileData } from "@/lib/profile-data";

export default function SiteHeader() {
  const pathname = usePathname();
  const isCase = pathname.startsWith("/cases");

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      backdropFilter: "blur(12px)",
      backgroundColor: "rgba(9, 13, 22, 0.85)",
      borderBottom: "1px solid var(--border-subtle)",
    }} className="no-print">
      <div className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "70px",
      }}>
        {/* Logo / Brand */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #2563eb, #06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: "1.1rem",
            boxShadow: "0 2px 10px rgba(6, 182, 212, 0.3)"
          }}>
            GO
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}>
              {profileData.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Inteligência Operacional & Fullstack
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link 
            href="/#sobre" 
            style={{ 
              fontSize: "0.88rem", 
              fontWeight: 500, 
              color: pathname === "/" ? "var(--text-primary)" : "var(--text-secondary)",
              transition: "color 0.2s ease"
            }}
          >
            Sobre
          </Link>
          <Link 
            href="/#trajetoria" 
            style={{ 
              fontSize: "0.88rem", 
              fontWeight: 500, 
              color: "var(--text-secondary)",
              transition: "color 0.2s ease"
            }}
          >
            Trajetória
          </Link>
          <Link 
            href="/#skills" 
            style={{ 
              fontSize: "0.88rem", 
              fontWeight: 500, 
              color: "var(--text-secondary)",
              transition: "color 0.2s ease"
            }}
          >
            Skills
          </Link>
          <Link 
            href="/#cases" 
            style={{ 
              fontSize: "0.88rem", 
              fontWeight: 500, 
              color: "var(--text-secondary)",
              transition: "color 0.2s ease"
            }}
          >
            Cases
          </Link>
          <Link 
            href="/live-prod-esteiras" 
            style={{ 
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.84rem",
              fontWeight: 600,
              backgroundColor: isCase ? "rgba(6, 182, 212, 0.15)" : "var(--bg-elevated)",
              color: isCase ? "#38bdf8" : "var(--text-primary)",
              border: isCase ? "1px solid rgba(6, 182, 212, 0.4)" : "1px solid var(--border-subtle)",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#10b981"
            }} />
            Painel Operacional (Live)
          </Link>
        </nav>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button 
            onClick={handlePrint}
            title="Exportar versão resumida para impressão ou PDF"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 600,
              backgroundColor: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <path d="M6 14h12v8H6z" />
            </svg>
            PDF One-Pager
          </button>
        </div>
      </div>
    </header>
  );
}
