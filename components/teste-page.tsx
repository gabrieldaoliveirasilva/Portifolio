"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageActions from "@/components/page-actions";
import type { TesteData } from "@/lib/teste";

function includes(value: string, query: string) {
  return value.toUpperCase().includes(query.trim().toUpperCase());
}

function FilterField({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `teste-${label.replace(/\W+/g, "-")}-${options.length}`;
  return (
    <label className="filter-field">
      <span>{label}</span>
      <input list={id} onChange={(event) => onChange(event.target.value)} placeholder="TODOS" value={value} />
      <datalist id={id}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

export default function TestePage({ data }: { data: TesteData }) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    busca: "",
    cluster: "",
    frente: "",
    pilar: "",
    kpi: "",
    abertura: "",
    periodo: ""
  });

  const periodosVisiveis = useMemo(
    () => (filters.periodo ? data.periodos.filter((periodo) => periodo === filters.periodo) : data.periodos.slice(0, 12)),
    [data.periodos, filters.periodo]
  );

  const linhas = useMemo(() => {
    return data.linhas.filter((row) => {
      const buscaOk =
        !filters.busca ||
        [row.cluster, row.frente, row.pilar, row.kpi, row.abertura, row.target].some((field) => includes(field, filters.busca));
      return (
        buscaOk &&
        (!filters.cluster || row.cluster === filters.cluster) &&
        (!filters.frente || row.frente === filters.frente) &&
        (!filters.pilar || row.pilar === filters.pilar) &&
        (!filters.kpi || row.kpi === filters.kpi) &&
        (!filters.abertura || row.abertura === filters.abertura)
      );
    });
  }, [data.linhas, filters]);

  const limparFiltros = () =>
    setFilters({
      busca: "",
      cluster: "",
      frente: "",
      pilar: "",
      kpi: "",
      abertura: "",
      periodo: ""
    });

  return (
    <>
      <section className="card filter-card">
        <label className="filter-field">
          <span>Busca</span>
          <input onChange={(event) => setFilters({ ...filters, busca: event.target.value })} placeholder="KPI, cluster, frente..." value={filters.busca} />
        </label>
        <FilterField label="Cluster" onChange={(value) => setFilters({ ...filters, cluster: value })} options={data.filtros.clusters} value={filters.cluster} />
        <FilterField label="Frente" onChange={(value) => setFilters({ ...filters, frente: value })} options={data.filtros.frentes} value={filters.frente} />
        <FilterField label="Pilar" onChange={(value) => setFilters({ ...filters, pilar: value })} options={data.filtros.pilares} value={filters.pilar} />
        <FilterField label="KPI" onChange={(value) => setFilters({ ...filters, kpi: value })} options={data.filtros.kpis} value={filters.kpi} />
        <FilterField label="Abertura" onChange={(value) => setFilters({ ...filters, abertura: value })} options={data.filtros.aberturas} value={filters.abertura} />
        <FilterField label="Periodo" onChange={(value) => setFilters({ ...filters, periodo: value })} options={data.filtros.periodos} value={filters.periodo} />
        <PageActions onClear={limparFiltros} onRefresh={() => router.refresh()} />
      </section>

      <section className="grid kpis">
        <div className="card kpi">
          <div className="label">KPIs</div>
          <div className="value">{linhas.length}</div>
        </div>
        <div className="card kpi blue">
          <div className="label">Clusters</div>
          <div className="value">{data.filtros.clusters.length}</div>
        </div>
        <div className="card kpi green">
          <div className="label">Periodos</div>
          <div className="value">{data.periodos.length}</div>
        </div>
        <div className="card kpi orange">
          <div className="label">Atualizado</div>
          <div className="value" style={{ fontSize: 18 }}>{data.atualizadoEm || "-"}</div>
        </div>
      </section>

      <section className="card panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">{data.titulo}</div>
            <div className="item-meta">{data.descricao}</div>
          </div>
          <span className="count-pill">{linhas.length} linhas</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cluster</th>
                <th>Frente</th>
                <th>Pilar</th>
                <th>KPI</th>
                <th>Abertura</th>
                <th>Target</th>
                {periodosVisiveis.map((periodo) => (
                  <th key={periodo}>{periodo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((row) => (
                <tr key={row.id}>
                  <td>{row.cluster}</td>
                  <td>{row.frente}</td>
                  <td>{row.pilar}</td>
                  <td><strong>{row.kpi}</strong></td>
                  <td>{row.abertura}</td>
                  <td>{row.target}</td>
                  {periodosVisiveis.map((periodo) => (
                    <td key={periodo}>{row.valores[periodo] || "-"}</td>
                  ))}
                </tr>
              ))}
              {!linhas.length && (
                <tr>
                  <td colSpan={6 + periodosVisiveis.length}>Sem dados encontrados na aba Acompanhamento.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
