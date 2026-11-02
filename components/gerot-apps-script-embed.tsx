"use client";

import { useEffect, useState } from "react";

const LOAD_TIMEOUT_MS = 25000;

type GerotAppsScriptEmbedProps = {
  title: string;
  url: string;
};

export default function GerotAppsScriptEmbed({ title, url }: GerotAppsScriptEmbedProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (status !== "loading") return;

    const timeout = window.setTimeout(() => setStatus("error"), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [iframeKey, status]);

  const retry = () => {
    setStatus("loading");
    setIframeKey((current) => current + 1);
  };

  return (
    <section className="packet-productivity-embed" aria-label={title}>
      {status === "loading" && (
        <div className="packet-productivity-state" aria-live="polite">
          <span className="packet-productivity-spinner" aria-hidden="true" />
          <strong>Carregando {title}...</strong>
        </div>
      )}

      {status === "error" && (
        <div className="packet-productivity-state error" role="alert">
          <strong>Nao foi possivel abrir o painel {title}.</strong>
          <p>Verifique sua conexao e tente carregar o painel novamente.</p>
          <div>
            <button onClick={retry} type="button">Tentar novamente</button>
            <a href={url} rel="noreferrer" target="_blank">Abrir em nova aba</a>
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
        src={url}
        title={title}
      />

    </section>
  );
}
