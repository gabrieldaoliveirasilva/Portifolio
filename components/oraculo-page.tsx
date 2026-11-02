import Link from "next/link";
import AppHeader from "@/components/app-header";
import UserManualButton from "@/components/user-manual-button";

const options = [
  {
    href: "/bio",
    eyebrow: "Autor & Engenharia",
    title: "Biografia & Skills",
    description: "Conheça o autor deste projeto: trajetória profissional, competências em Fullstack e Dados, e os bastidores técnicos deste case."
  },
  {
    href: "/live-prod-esteiras",
    eyebrow: "Operação",
    title: "Gerencial",
    description: "Acesse as visões em tempo real e os fechamentos históricos de produtividade para Inbound, Packing e Outbound."
  },
  {
    href: "/gerot-geral-gerot",
    eyebrow: "Indicadores",
    title: "GEROT",
    description: "Consulte a matriz executiva de controle de metas, sinalização de farol e os pilares estratégicos de Cost, Quality e Speed."
  },
  {
    href: "/people",
    eyebrow: "Pessoas",
    title: "People",
    description: "Hub integrado de Gestão de Pessoas (People Track), controle de presença, absenteísmo e feedbacks."
  },
  {
    href: "/one-pages-operacionais",
    eyebrow: "Operação",
    title: "One Pages Operacionais",
    description: "Painéis condensados em uma única página para alinhamento rápido e passagens de turno."
  },
  {
    href: "/planejamento",
    eyebrow: "Estratégia",
    title: "Planejamento",
    description: "Acesse as ferramentas de Controle de Ativos, IOP e gestão de desvios operacionais."
  },
  {
    href: "/ferramentas-qualidade-processos",
    eyebrow: "Qualidade e Processos",
    title: "Ferramentas Diversas",
    description: "Apoio tático, registros estruturados de anomalias operacionais, ASP e controles do hub."
  }
] as const;

export default function OraculoPage() {
  return (
    <main className="oraculo-page">
      <AppHeader title="PORTAL DE INDICADORES" />
      <UserManualButton />

      <section className="oraculo-options" aria-label="Areas do dashboard">
        {options.map((option) => (
          <Link className="oraculo-option card" href={option.href} key={option.href}>
            <span className="oraculo-option-eyebrow">{option.eyebrow}</span>
            <h2>{option.title}</h2>
            <p>{option.description}</p>
            <span className="oraculo-option-action">Abrir area <span aria-hidden="true">-&gt;</span></span>
          </Link>
        ))}
      </section>
    </main>
  );
}
