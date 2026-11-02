"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.");
}

export default function LoginPage() {
  useEffect(() => {
    if (isLocalHost(window.location.hostname)) {
      window.location.replace("/");
    }
  }, []);

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">S</div>
        <p>SHOPEE</p>
        <h1>MG4</h1>
        <span>Acesso restrito ao dominio @shopee.com</span>

        <button type="button" onClick={() => signIn("google", { callbackUrl: "/" })}>
          Entrar com Google
        </button>
      </section>
    </main>
  );
}
