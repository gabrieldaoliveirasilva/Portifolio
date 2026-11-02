export default function Loading() {
  return (
    <main className="route-loading-page">
      <section className="card route-loading-card">
        <div className="route-loading-mark" aria-hidden="true" />
        <div>
          <strong>Carregando painel...</strong>
          <span>Buscando dados atualizados.</span>
        </div>
      </section>
    </main>
  );
}
