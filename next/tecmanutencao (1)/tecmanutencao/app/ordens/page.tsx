import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import FiltrosOrdens from "@/components/FiltrosOrdens";
import { dataIso, data, osNum } from "@/lib/format";
import { buscarOrdens, descEquip, estaAtrasada, naoLidasPorOrdem, nomeBancada } from "@/lib/ordens";
import { exigirUsuario } from "@/lib/auth";
import { pode } from "@/lib/permissoes";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; status?: string; tipo?: string; minhas?: string }> };

export default async function Ordens({ searchParams }: Props) {
  const u = await exigirUsuario();
  const sp = await searchParams;
  // técnicos começam vendo só as OS deles; o admin começa vendo todas
  const minhas = sp.minhas !== undefined ? sp.minhas === "1" : u.papel !== "admin";
  const { q = "", status = "abertas", tipo = "" } = sp;
  const ordens = buscarOrdens({ q: q.trim(), status, tipo, minhas, usuarioId: u.id });
  const naoLidas = naoLidasPorOrdem(u.id, u.papel);

  return (
    <section>
      <div className="head">
        <div>
          <h1>Ordens de serviço</h1>
          <p className="sub">Clique em uma ordem para atualizar o andamento ou registrar a saída.</p>
        </div>
        {pode(u.papel, "registrarEntrada") && <Link href="/ordens/nova" className="btn">+ Nova entrada</Link>}
      </div>

      <FiltrosOrdens q={q} status={status} tipo={tipo} minhas={minhas} />

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>OS</th><th className="td-ent">Entrada</th><th>Cliente</th><th>Equipamento</th>
              <th>Defeito</th><th>Campo / Bancada</th><th>Previsão</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ordens.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">Nenhuma ordem encontrada com esses filtros.</td>
              </tr>
            )}
            {ordens.map((o) => {
              const href = `/ordens/${o.id}`;
              return (
                <tr key={o.id}>
                  <td className="td-os os">
                    <Link className="rowlink" href={href} style={{ whiteSpace: "nowrap" }}>
                      {osNum(o.id)}
                      {naoLidas.get(o.id) ? <span className="badge" title="Mensagens não lidas">💬 {naoLidas.get(o.id)}</span> : null}
                      {o.chamado && <span className="chamado-lista">{o.chamado}</span>}
                    </Link>
                  </td>
                  <td className="td-ent"><Link className="rowlink" href={href}>{data(o.criadoEm)}</Link></td>
                  <td className="td-cli">
                    <Link className="rowlink" href={href}>
                      <b>{o.clienteNome}</b><br /><span className="muted">{o.clienteTel}</span>
                    </Link>
                  </td>
                  <td className="td-eq">
                    <Link className="rowlink" href={href}>
                      {descEquip(o)}
                      {o.serie && (<><br /><span className="muted">S/N {o.serie}</span></>)}
                    </Link>
                  </td>
                  <td className="td-def"><Link className="rowlink" href={href}><div className="trunc" title={o.defeito}>{o.defeito}</div></Link></td>
                  <td className="td-resp">
                    <Link className="rowlink" href={href}>
                      {o.campoNome ?? <span className="muted">—</span>}
                      <br />
                      {nomeBancada(o) ?? <span className="late" style={{ fontWeight: 500 }}>sem bancada</span>}
                    </Link>
                  </td>
                  <td className={"td-prev " + (estaAtrasada(o) ? "late" : "")}>
                    <Link className="rowlink" href={href}>
                      {o.status === "entregue" ? <span className="muted">Saiu {data(o.saidaEm)}</span> : dataIso(o.previsao)}
                      {o.prioridade === "alta" && (<><br /><span className="prio-alta">Urgente</span></>)}
                    </Link>
                  </td>
                  <td className="td-st"><Link className="rowlink" href={href}><StatusPill status={o.status} /></Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>{ordens.length} ordem(ns) listada(s)</p>
    </section>
  );
}
