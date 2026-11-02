import type { Metadata } from "next";
import AppsScriptHub, { type AppsScriptHubItem } from "@/components/apps-script-hub";

export const metadata: Metadata = {
  title: "EHA | ORÁCULO MG4"
};

const items = [
  {
    description: "Painel integrado para tratativas e gestão de pacotes em exceção.",
    id: "dash-eha",
    title: "DASH EHA",
    url: "https://script.google.com/a/macros/shopee.com/s/AKfycbxDQSJ-FHtqL5VhajXrOZnuOF7uE6bY28X4Fp4Yan1HFxGyId_0jYVUYVPtpPjZFbICEQ/exec"
  }
] as const satisfies readonly AppsScriptHubItem[];

export default function EHAPage() {
  return (
    <AppsScriptHub
      eyebrow="Tratativas e Exceções"
      items={items}
      title="EHA"
    />
  );
}
