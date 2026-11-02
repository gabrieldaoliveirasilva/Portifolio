import type { Metadata } from "next";
import AppsScriptHub, { type AppsScriptHubItem } from "@/components/apps-script-hub";

export const metadata: Metadata = {
  title: "HSE | ORÁCULO MG4"
};

const items = [
  {
    description: "Painel integrado de monitoramento e indicadores operacionais de Saúde, Segurança e Meio Ambiente (HSE).",
    id: "dash-hse",
    title: "Dash HSE",
    url: "https://script.google.com/a/macros/shopee.com/s/AKfycbwLSdnaeS7A1Ea90zzaETxKzUw_HBlo7rXsWzBj2tV9Q-qxuo5W7AtTQqal8qTSI4Y5/exec"
  }
] as const satisfies readonly AppsScriptHubItem[];

export default function HSEPage() {
  return (
    <AppsScriptHub
      eyebrow="Saúde, Segurança e Meio Ambiente"
      items={items}
      title="HSE"
    />
  );
}
