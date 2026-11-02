export default function GerotPlaceholder({ title, section }: { title: string; section?: string }) {
  return (
    <section className="gerot-placeholder card">
      <span className="gerot-placeholder-kicker">{section ?? "GEROT"}</span>
      <h1>{title}</h1>
      <p>Em construção</p>
    </section>
  );
}
