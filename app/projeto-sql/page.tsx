import SqlProjectView from "@/components/sql-project-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PROJETO SQL | Rastreabilidade & Engenharia Analítica",
  description:
    "Modelagem analítica em SQL de alta performance: CTE com Regex para normalização de operadores, poda de partições (Partition Pruning), controle de timezone e correlação com telemetria horária de esteiras logísticas.",
};

export default function ProjetoSqlPage() {
  return <SqlProjectView />;
}
