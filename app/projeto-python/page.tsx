import PythonProjectView from "@/components/python-project-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PROJETO PYTHON | Robô de Extração & Ingestão de TOs",
  description:
    "Automação de engenharia de dados em Python: autenticação SSO/CSRF, paginação resiliente, pipelines com Pandas e ingestão em tempo real no Google Sheets API v4.",
};

export default function ProjetoPythonPage() {
  return <PythonProjectView />;
}
