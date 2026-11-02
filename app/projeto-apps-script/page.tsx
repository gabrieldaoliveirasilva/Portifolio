import AppsScriptProjectView from "@/components/apps-script-project-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PROJETO APPS SCRIPT | Leftover Control & Pátio Web App",
  description:
    "Case técnico de aplicação Web App corporativa em Google Apps Script, HtmlService, LockService de concorrência e chunking de CacheService para monitoramento de sobras logísticas e ocupação de pátio."
};

export default function ProjetoAppsScriptPage() {
  return <AppsScriptProjectView />;
}
