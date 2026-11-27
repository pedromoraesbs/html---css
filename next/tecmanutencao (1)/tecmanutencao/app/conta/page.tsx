import { FormMinhaSenha } from "@/components/FormsConta";
import { exigirUsuario } from "@/lib/auth";
import { PAPEIS } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Conta() {
  const u = await exigirUsuario();
  const p = PAPEIS[u.papel];
  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div>
        <h1>Minha conta</h1>
        <p className="sub">Seus dados de acesso.</p>
      </div>
      <div className="card" style={{ maxWidth: 480 }}>
        <p style={{ margin: "0 0 6px" }}><b>{u.nome}</b></p>
        <p className="muted" style={{ margin: "0 0 10px" }}>Login: {u.usuario}</p>
        <span className="papel" style={{ color: p.cor, background: p.fundo }}>{p.label}</span>
        <p className="muted" style={{ margin: "10px 0 0", fontSize: 15 }}>{p.desc}.</p>
      </div>
      <FormMinhaSenha />
    </section>
  );
}
