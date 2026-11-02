import type { Metadata } from "next";
import AppsScriptHub, { type AppsScriptHubItem } from "@/components/apps-script-hub";

export const metadata: Metadata = {
  title: "Ferramentas De Qualidade e Processos | ORACULO MG4"
};

const items = [
  {
    description: "Registro estruturado e acompanhamento de anomalias.",
    id: "registro-anomalia",
    title: "Registro de anomalia",
    url: "https://script.google.com/a/macros/shopee.com/s/AKfycbxh9ILfPwSkli7DfxdbVP8_AgA4OH50Y2azQ651R9CQQ3ETeYW1n0KCm7X-svb24GQHJw/exec"
  },
  {
    description: "Acesso a ferramenta ASP de qualidade e processos.",
    id: "asp",
    title: "ASP",
    url: "https://script.google.com/a/macros/shopee.com/s/AKfycbzNuR-XexZcvDoUHuHBtTPHDwrXBQEULRlrypHtt2Vu_V363AVh6GmAgCpT6GDy6KNB/exec"
  },
  {
    description: "Acompanhamento e controle operacional de estoque.",
    id: "controle-estoque",
    title: "Controle de estoque",
    url: "https://script.google.com/a/macros/shopee.com/s/AKfycbyGb4AxL88zYzflz48BqbbuymwIRg9OklVw-QRBxkXyhqlOlE6KvQD7pHhrQxHrkaJ2pg/exec"
  },
  {
    description: "Gestao de acessos e equipamentos operacionais.",
    id: "controle-acessos-equipamentos",
    title: "Controle de acessos e equipamentos",
    url: "https://script.google.com/a/macros/shopee.com/s/AKfycbxlMCSpIC2-bOAo0lozR5s9NsoRD-99HyQ1YIV6Q2Vj3P0fyO8A0xOlZOW_iWQlcxnx/exec"
  }
] as const satisfies readonly AppsScriptHubItem[];

export default function FerramentasQualidadeProcessosPage() {
  return (
    <AppsScriptHub
      eyebrow="Qualidade e processos"
      items={items}
      title="Ferramentas De Qualidade e Processos"
    />
  );
}
