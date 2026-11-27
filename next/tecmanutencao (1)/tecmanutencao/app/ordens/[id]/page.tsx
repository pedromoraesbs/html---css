import Link from "next/link";
import { notFound } from "next/navigation";
import StatusPill from "@/components/StatusPill";
import BotaoPronto from "@/components/BotaoPronto";
import {
  AutoAtualizar,
  BotaoExcluir,
  FormAndamento,
  FormAtribuir,
  FormDadosRat,
  FormDiagnostico,
  FormMensagem,
  FormRespostaOrcamento,
  FormSaida,
  RolarParaFim,
} from "@/components/FormsOrdem";
import { acaoAssumir } from "@/app/actions";
import { exigirUsuario } from "@/lib/auth";
import { PAPEIS, STATUS_MAP } from "@/lib/constantes";
import { brl, dataHora, dataIso, osNum } from "@/lib/format";
import {
  descEquip,
  estaAtrasada,
  listarMensagens,
  marcarLida,
  nomeBancada,
  obterHistorico,
  obterOrdem,
} from "@/lib/ordens";
import { pode } from "@/lib/permissoes";
import { EMPRESA } from "@/lib/empresa";
import { listarAtivosPorPapel } from "@/lib/usuarios";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ nova?: string; aviso?: string }> };

const AVISOS: Record<string, string> = {
  aprovado: "Aprovação do cliente registrada. A bancada já pode seguir com o conserto.",
  recusado: "Recusa registrada. A bancada vai preparar o equipamento para devolução.",
  pronto: "Pronto! O técnico de campo foi avisado pela conversa para agendar a devolução.",
  devolvido: "Devolução registrada. Imprima o RAT para o cliente assinar a entrega do equipamento.",
};

export default async function DetalheOrdem({ params, searchParams }: Props) {
  const u = await exigirUsuario();
  const { id } = await params;
  const { nova, aviso } = await searchParams;
  const o = obterOrdem(Number(id));
  if (!o) notFound();

  const historico = obterHistorico(o.id);
  const mensagens = listarMensagens(o.id);
  marcarLida(o.id, u.id);

  const fechada = o.status === "entregue";
  const daMinhaBancada = u.papel === "admin" || o.bancadaId === null || o.bancadaId === u.id;
  const podeConsertar = !fechada && pode(u.papel, "andamento") && daMinhaBancada;
  // botão rápido “✅ Pronto” (bancada responsável ou admin, conserto em andamento)
  const podeMarcarPronto = podeConsertar && ["recebido", "diagnostico", "peca", "reparo"].includes(o.status);
  const podeResponder = !fechada && pode(u.papel, "respostaOrcamento") && o.status === "aprovacao";
  const liberada = o.status === "pronto" || o.status === "semconserto";
  const retirada = {
    modelo: [o.marca, o.modelo].filter(Boolean).join(" "),
    patrimonio: o.patrimonio ?? "",
    serie: o.serie ?? "",
    etiqueta: o.etiquetaCliente ?? "",
  };
  const podeDevolver = !fechada && pode(u.papel, "registrarSaida") && (liberada || u.papel === "admin");

  return (
    <section className="detail">
      <AutoAtualizar segundos={20} />
      <div>
        <Link href="/ordens" className="back">← Voltar para as ordens</Link>
        <div className="head">
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
              OS {osNum(o.id)} <StatusPill status={o.status} />
            </h1>
            {o.chamado && <p className="chamado-tag">Chamado <b>{o.chamado}</b></p>}
          </div>
          <div className="actions" style={{ alignItems: "center" }}>
            {podeMarcarPronto && <BotaoPronto id={o.id} origem="os" />}
            <Link className="btn sm ghost" href={`/ordens/${o.id}/rat`}>🖨 RAT para o cliente</Link>
          </div>
        </div>
        {aviso && AVISOS[aviso] && <div className="msg ok">{AVISOS[aviso]}</div>}
        {nova && <div className="msg ok">Entrada registrada — chamado <b>{o.chamado}</b>. Imprima o RAT para o cliente assinar a retirada do equipamento.</div>}
      </div>

      {/* Responsáveis */}
      <div className="panel">
        <h3>Responsáveis</h3>
        <div className="resp">
          <div className="who">
            <small style={{ color: PAPEIS.campo.cor }}>Técnico de campo</small>
            <b>{o.campoNome ?? "—"}</b>
          </div>
          <div className="who">
            <small style={{ color: PAPEIS.bancada.cor }}>Técnico de bancada</small>
            <b>{nomeBancada(o) ?? "Sem responsável"}</b>
          </div>
          {pode(u.papel, "assumir") && o.bancadaId === null && !fechada && (
            <form action={acaoAssumir}>
              <input type="hidden" name="id" value={o.id} />
              <button className="btn sm">Assumir este conserto</button>
            </form>
          )}
        </div>
        {pode(u.papel, "atribuir") && (
          <FormAtribuir
            id={o.id}
            campoId={o.campoId}
            bancadaId={o.bancadaId}
            campos={listarAtivosPorPapel("campo").map(({ id, nome }) => ({ id, nome }))}
            bancadas={listarAtivosPorPapel("bancada").map(({ id, nome }) => ({ id, nome }))}
          />
        )}
      </div>

      <div className="info">
        <div className="box">
          <h3>Cliente</h3>
          <p><b>{o.clienteNome}</b></p>
          <p>{o.clienteTel}</p>
          {o.clienteEmail && <p>{o.clienteEmail}</p>}
          {o.clienteDoc && <p className="muted">Doc: {o.clienteDoc}</p>}
          {o.clienteResponsavel && <p className="muted">Responsável: {o.clienteResponsavel}{o.clienteCargo && ` (${o.clienteCargo})`}</p>}
          {o.endereco && <p className="muted">📍 {o.endereco}</p>}
        </div>
        <div className="box">
          <h3>Equipamento</h3>
          <p><b>{descEquip(o)}</b></p>
          {o.serie && <p>S/N: {o.serie}</p>}
          {o.patrimonio && <p>Patrimônio: {o.patrimonio}</p>}
          <p className="muted">Acessórios: {o.acessorios || "nenhum"}</p>
          {o.estado && <p className="muted">Estado: {o.estado}</p>}
        </div>
        <div className="box">
          <h3>Prazos</h3>
          <p>Entrada: <b>{dataHora(o.criadoEm)}</b></p>
          <p className={estaAtrasada(o) ? "late" : ""}>Previsão: {dataIso(o.previsao)}</p>
          <p>Devolução: {o.saidaEm ? <b>{dataHora(o.saidaEm)}</b> : "—"}</p>
          <p className="muted">
            Prioridade:{" "}
            {o.prioridade === "alta" ? <span className="prio-alta">Alta</span> : o.prioridade === "baixa" ? "Baixa" : "Normal"}
          </p>
        </div>
      </div>

      <div className="box" style={{ background: "#fff" }}>
        <h3>Defeito relatado pelo cliente</h3>
        <p>{o.defeito}</p>
        {o.obs && <p className="muted">Obs.: {o.obs}</p>}
      </div>

      {/* Conversa entre campo e bancada */}
      <div className="panel">
        <h3>Conversa da equipe ({mensagens.length})</h3>
        <div className="chat" id="chat">
          {mensagens.length === 0 && (
            <div className="empty" style={{ padding: 14 }}>
              Nenhuma mensagem. Use este espaço para combinar detalhes entre o técnico de campo e o de bancada.
            </div>
          )}
          {mensagens.map((m) => (
            <div key={m.id} className={`bolha ${m.usuarioId === u.id ? "eu" : ""}`}>
              <div className="meta">
                <b style={{ color: "var(--ink)" }}>{m.usuarioId === u.id ? "Você" : m.autor}</b>
                <span className="papel" style={{ color: PAPEIS[m.papel].cor, background: PAPEIS[m.papel].fundo, fontSize: 11, padding: "1px 7px" }}>
                  {PAPEIS[m.papel].label}
                </span>
                <span>{dataHora(m.em)}</span>
              </div>
              {m.texto}
            </div>
          ))}
        </div>
        <RolarParaFim alvo="chat" dep={mensagens.length} />
        <FormMensagem id={o.id} />
      </div>

      {pode(u.papel, "registrarEntrada") && (
        <FormDadosRat
          id={o.id}
          entrega={
            fechada
              ? {
                  modelo: o.entregaModelo ?? retirada.modelo,
                  patrimonio: o.entregaPatrimonio ?? "",
                  serie: o.entregaSerie ?? "",
                  etiqueta: o.entregaEtiqueta ?? "",
                }
              : null
          }
          atual={{
            chamado: o.chamado ?? "",
            empresaParceira: o.empresaParceira ?? "",
            horaInicio: o.horaInicio ?? "",
            horaFim: o.horaFim ?? "",
            clienteResponsavel: o.clienteResponsavel ?? "",
            clienteCargo: o.clienteCargo ?? "",
            patrimonio: o.patrimonio ?? "",
            etiquetaCliente: o.etiquetaCliente ?? "",
            backupPerfil: o.backupPerfil ?? "",
            servicoLab: !!o.servicoLab,
            servicoReparo: !!o.servicoReparo,
            servicoUpgrade: !!o.servicoUpgrade,
            backupFeito: !!o.backupFeito,
          }}
        />
      )}

      {podeResponder && <FormRespostaOrcamento id={o.id} orcamento={brl(o.orcamento)} />}

      {podeConsertar && <FormAndamento id={o.id} status={o.status} />}

      {podeConsertar ? (
        <FormDiagnostico id={o.id} diagnostico={o.diagnostico} orcamento={o.orcamento} previsao={o.previsao} />
      ) : (
        <div className="panel leitura">
          <h3>Diagnóstico e orçamento</h3>
          <p>{o.diagnostico || <span className="vazio">Ainda sem diagnóstico.</span>}</p>
          <p>Orçamento: <b>{brl(o.orcamento)}</b></p>
          {!fechada && pode(u.papel, "andamento") && !daMinhaBancada && (
            <p className="muted" style={{ fontSize: 15 }}>Esta OS está com {o.bancadaNome}. Só o responsável ou o administrador pode alterá-la.</p>
          )}
        </div>
      )}

      {fechada ? (
        <div className="panel" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <h3>Equipamento devolvido ao cliente</h3>
          <p>
            Recebido por <b>{o.saidaPor}</b>
            {o.saidaDoc && ` (doc. ${o.saidaDoc})`} em {dataHora(o.saidaEm)}
          </p>
          <p>Valor cobrado: <b>{brl(o.saidaValor)}</b>{o.saidaPgto && ` · ${o.saidaPgto}`}</p>
          <p className="muted">
            Resultado: {o.saidaResultado === "semconserto" ? "Devolvido sem conserto" : "Reparado"}
            {o.saidaGarantia ? ` · Garantia: ${o.saidaGarantia} dias` : ""}
          </p>
        </div>
      ) : podeDevolver ? (
        <FormSaida
          id={o.id}
          cliente={o.clienteResponsavel ?? o.clienteNome}
          orcamento={o.orcamento}
          semConserto={o.status === "semconserto"}
          garantiaPadrao={EMPRESA.garantiaPadraoDias}
          retirada={retirada}
        />
      ) : (
        pode(u.papel, "registrarSaida") && (
          <div className="panel leitura">
            <h3>Devolução ao cliente</h3>
            <p className="vazio">
              Disponível quando a bancada marcar o equipamento como “Pronto p/ retirada” ou “Sem conserto”.
            </p>
          </div>
        )
      )}

      <div className="panel">
        <h3>Histórico</h3>
        <ul className="tl">
          {historico.map((h) => {
            const s = STATUS_MAP[h.status] ?? STATUS_MAP.recebido;
            return (
              <li key={h.id} style={{ ["--dot" as string]: s.cor }}>
                <div>
                  <b>{s.label}</b>
                  {h.nota && ` — ${h.nota}`}
                </div>
                <div className="d">
                  {dataHora(h.em)}
                  {h.autor && ` · por ${h.autor}`}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {pode(u.papel, "excluir") && (
        <div>
          <BotaoExcluir id={o.id} numero={osNum(o.id)} />
        </div>
      )}
    </section>
  );
}
