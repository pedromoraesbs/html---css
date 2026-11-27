import { FormEditarUsuario, FormNovoUsuario } from "@/components/FormsConta";
import { exigirUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { PAPEIS } from "@/lib/constantes";
import { data } from "@/lib/format";
import { listarUsuarios } from "@/lib/usuarios";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const eu = await exigirUsuario("admin");
  const usuarios = listarUsuarios();

  // quantas OS abertas cada técnico tem
  const carga = new Map(
    db
      .all<{ id: number; n: number }>(
        `SELECT u.id, COUNT(o.id) AS n FROM usuarios u
           LEFT JOIN ordens o ON o.status <> 'entregue' AND (o.campo_id = u.id OR o.bancada_id = u.id)
          GROUP BY u.id`
      )
      .map((r) => [r.id, r.n])
  );

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div>
        <h1>Usuários</h1>
        <p className="sub">Cadastre a equipe e defina o perfil de cada pessoa.</p>
      </div>

      <div className="fila" style={{ marginBottom: 0 }}>
        {(["campo", "bancada", "admin"] as const).map((p) => (
          <div key={p} className="card">
            <span className="papel" style={{ color: PAPEIS[p].cor, background: PAPEIS[p].fundo }}>{PAPEIS[p].label}</span>
            <p className="muted" style={{ margin: "8px 0 0", fontSize: 15 }}>{PAPEIS[p].desc}.</p>
          </div>
        ))}
      </div>

      <FormNovoUsuario />

      <div className="card">
        <h2>Equipe ({usuarios.length})</h2>
        {usuarios.map((u) => (
          <details key={u.id} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
            <summary style={{ cursor: "pointer", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <b style={{ minWidth: 160, opacity: u.ativo ? 1 : 0.5 }}>{u.nome}{u.id === eu.id && " (você)"}</b>
              <span className="muted" style={{ minWidth: 120 }}>{u.usuario}</span>
              <span className="papel" style={{ color: PAPEIS[u.papel].cor, background: PAPEIS[u.papel].fundo }}>
                {PAPEIS[u.papel].label}
              </span>
              {!u.ativo && <span className="papel" style={{ color: "#b91c1c", background: "#fee2e2" }}>Desativado</span>}
              <span className="muted" style={{ marginLeft: "auto", fontSize: 15 }}>
                {carga.get(u.id) ?? 0} OS em aberto · desde {data(u.criadoEm)}
              </span>
              <span style={{ color: "var(--brand)", fontSize: 15, fontWeight: 600 }}>✎ Editar</span>
            </summary>
            <FormEditarUsuario id={u.id} nome={u.nome} usuario={u.usuario} papel={u.papel} ativo={!!u.ativo} />
          </details>
        ))}
      </div>
    </section>
  );
}
