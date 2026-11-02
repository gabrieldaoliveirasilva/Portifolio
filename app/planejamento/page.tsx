import type { Metadata } from "next";
import AppsScriptHub, { type AppsScriptHubItem } from "@/components/apps-script-hub";

export const metadata: Metadata = {
  title: "Planejamento | ORÁCULO MG4"
};

const items = [
  {
    description: "Acompanhamento e controle de ativos operacionais e desvios.",
    id: "controle-ativos-desvios",
    title: "Controle de Ativos e Desvios",
    url: "https://script.google.com/a/macros/shopee.com/s/AKfycbw0JAQcgJoG0F4yeS7yzXysmrBfNA7zA_qLs7fXb2U9wXYcXIyE3DUpNXqV13QPmcUjbQ/exec"
  },
  {
    description: "Ferramenta IOP para alinhamento e planejamento de produção.",
    id: "iop",
    title: "IOP",
    url: "https://script.google.com/a/macros/shopee.com/s/AKfycbwpGv8icZlWljpzzwlqKy464LcZnr3NyKQeDGHRrHhxcguJcqv2wuvWtUEZJ9-LBXdbCA/exec"
  }
] as const satisfies readonly AppsScriptHubItem[];

export default function PlanejamentoPage() {
  return (
    <AppsScriptHub
      eyebrow="Planejamento e Alinhamento"
      items={items}
      title="Planejamento"
    />
  );
}
