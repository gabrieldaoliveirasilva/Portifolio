import PortfolioHome from "@/components/portfolio-home";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PORTFÓLIO | Engenharia de Dados & Inteligência Operacional",
  description: "Portfólio técnico de inteligência operacional, dashboards em tempo real e matriz de governança de indicadores."
};

export default function Home() {
  return <PortfolioHome />;
}
