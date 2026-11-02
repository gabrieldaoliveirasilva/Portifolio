"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppHeader from "@/components/app-header";

const LOAD_TIMEOUT_MS = 25000;

export type AppsScriptHubItem = {
  description: string;
  id: string;
  title: string;
  url: string;
};

type AppsScriptHubProps = {
  eyebrow: string;
  items: readonly AppsScriptHubItem[];
  title: string;
};

export default function AppsScriptHub({ eyebrow, items, title }: AppsScriptHubProps) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const activeItem = items.find((item) => item.id === activeItemId) ?? null;

  useEffect(() => {
    if (!activeItem || status !== "loading") return;

    const timeout = window.setTimeout(() => setStatus("error"), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [activeItem, iframeKey, status]);

  const openItem = (itemId: string) => {
    setStatus("loading");
    setActiveItemId(itemId);
    setIframeKey((current) => current + 1);
  };

  const closeItem = () => {
    setActiveItemId(null);
    setStatus("loading");
  };

  const retry = () => {
    setStatus("loading");
    setIframeKey((current) => current + 1);
  };

  if (activeItem) {
    return (
      <main className="apps-script-hub embedded">
        <section className="apps-script-hub-embed" aria-label={activeItem.title}>
          <button
            className="apps-script-hub-back"
            onClick={closeItem}
            type="button"
          >
            <span aria-hidden="true">&larr;</span>
            Voltar
          </button>

          {status === "loading" && (
            <div className="apps-script-hub-state" aria-live="polite">
              <span className="packet-productivity-spinner" aria-hidden="true" />
              <strong>Carregando {activeItem.title}...</strong>
            </div>
          )}

          {status === "error" && (
            <div className="apps-script-hub-state error" role="alert">
              <strong>Nao foi possivel abrir {activeItem.title}.</strong>
              <p>Verifique sua conexao ou abra o painel em uma nova aba.</p>
              <div className="apps-script-hub-state-actions">
                <button onClick={retry} type="button">Tentar novamente</button>
                <a href={activeItem.url} rel="noreferrer" target="_blank">Abrir em nova aba</a>
              </div>
            </div>
          )}

          <iframe
            allow="clipboard-read; clipboard-write; fullscreen"
            allowFullScreen
            className={status === "ready" ? "ready" : ""}
            key={iframeKey}
            onError={() => setStatus("error")}
            onLoad={() => setStatus("ready")}
            src={activeItem.url}
            title={activeItem.title}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="oraculo-page apps-script-hub apps-script-hub-overview">
      <AppHeader title={title} />

      <div className="apps-script-hub-overview-actions">
        <Link className="apps-script-hub-home-back" href="/">
          <span aria-hidden="true">&larr;</span>
          Voltar
        </Link>
      </div>

      <section className="oraculo-options apps-script-hub-cards" aria-label={`Paineis de ${title}`}>
        {items.map((item) => (
          <button
            className="oraculo-option apps-script-launch-card card"
            key={item.id}
            onClick={() => openItem(item.id)}
            type="button"
          >
            <span className="oraculo-option-eyebrow">{eyebrow}</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <span className="oraculo-option-action">
              Abrir painel <span aria-hidden="true">-&gt;</span>
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}
