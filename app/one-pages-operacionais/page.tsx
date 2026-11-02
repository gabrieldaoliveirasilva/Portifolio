import type { Metadata } from "next";
import AppsScriptHub, { type AppsScriptHubItem } from "@/components/apps-script-hub";

export const metadata: Metadata = {
  title: "One Pages Operacionais | ORACULO MG4"
};

const items = [
  {
    description: "Visao operacional consolidada do fluxo Inbound.",
    id: "inbound",
    title: "Inbound",
    url: "https://script.google.com/a/macros/shopee.com/s/AKfycbzvXaBlh8sEJc3C_UTtKFs0ML7YO05QscziZO8XUNVrU4gAtxl8mWHJzImITulv63k57g/exec"
  },
  {
    description: "Acompanhamento operacional da produtividade das esteiras.",
    id: "produtividade-esteiras",
    title: "Produtividade Esteiras",
    url: "https://script.google.com/a/macros/shopee.com/s/AKfycbwBzwQMesLvWQN9mtEcB9dM6oc5mF7kd2cuMY4V-LTBwKzQv5-34BjKP8N1ViqlgroCSw/exec"
  },
  {
    description: "Visao operacional consolidada do fluxo Outbound.",
    id: "outbound",
    title: "Outbound",
    url: "https://script.google.com/a/macros/shopee.com/s/AKfycbzcQip2TKdh8lcOhMfvAYDN39oMnOqJY_iEzPO8cvrxLiGYAliDf4CxlYGsXW5FctJq/exec"
  }
] as const satisfies readonly AppsScriptHubItem[];

export default function OnePagesOperacionaisPage() {
  return (
    <AppsScriptHub
      eyebrow="Operacao"
      items={items}
      title="One Pages Operacionais"
    />
  );
}
