"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type AppHeaderProps = {
  title: string;
};

export default function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  // Sanitize title: GEROT KPIs Performance -> GEROT, and remove MG4
  const displayTitle = title
    .replace(/GEROT KPIs Performance/i, "GEROT")
    .replace(" MG4", "")
    .replace("MG4", "LOGÍSTICA");

  return (
    <header className="header">
      <div className="brand" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-start" }}>
        <button
          onClick={handleBack}
          type="button"
          title="Voltar à página anterior"
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "5px 12px",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12.5px",
            fontWeight: 700,
            color: "#1e3048",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)",
            transition: "all 0.15s ease",
            lineHeight: 1.2
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.borderColor = "#94a3b8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 800 }}>←</span>
          <span>Voltar</span>
        </button>

        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "var(--primary-strong, #1e3048)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontWeight: 600,
            fontSize: "12.5px",
            letterSpacing: "0.2px",
            padding: "5px 10px",
            borderRadius: "6px",
            background: "rgba(255, 255, 255, 0.85)",
            border: "1px solid #e2e8f0",
            lineHeight: 1.2
          }}
          title="Ir para a Capa / Início"
        >
          <span style={{ fontSize: "14px" }}>🏠</span>
          <span>Início</span>
        </Link>
      </div>

      <h1 className="title">{displayTitle}</h1>

      <div className="actions" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
        <Link
          href="/bio"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "12.5px",
            fontWeight: 600,
            color: "#ffffff",
            background: "#3e6389",
            border: "1px solid #5b8ec4",
            textDecoration: "none",
            boxShadow: "0 2px 6px rgba(30, 48, 72, 0.15)",
            transition: "all 0.2s ease"
          }}
        >
          🛠️ Skills &amp; Bastidores
        </Link>
      </div>
    </header>
  );
}
