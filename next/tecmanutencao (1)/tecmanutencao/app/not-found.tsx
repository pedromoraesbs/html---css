import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <section className="card" style={{ textAlign: "center", padding: 40 }}>
      <h1>Ordem de serviço não encontrada</h1>
      <p className="sub">Ela pode ter sido excluída ou o número está incorreto.</p>
      <Link href="/ordens" className="btn">Ver ordens de serviço</Link>
    </section>
  );
}
