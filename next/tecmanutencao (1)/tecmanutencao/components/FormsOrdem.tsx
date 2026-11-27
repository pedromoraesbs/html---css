"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  acaoAndamento,
  acaoAtribuir,
  acaoDadosRat,
  acaoDiagnostico,
  acaoExcluir,
  acaoMensagem,
  acaoRespostaOrcamento,
  acaoSaida,
  type Resultado,
} from "@/app/actions";
import { PAGAMENTOS, STATUS, type StatusKey } from "@/lib/constantes";
import { Mensagem } from "./FormsConta";

const valorBR = (n: number | null) => (n === null ? "" : n.toFixed(2).replace(".", ","));

/* ---------- Atualizar andamento (bancada) ---------- */
export function FormAndamento({ id, status }: { id: number; status: StatusKey }) {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoAndamento, {});
  const v = (k: string) => r.valores?.[k];
  return (
    <form action={acao} className="panel" key={r.t}>
      <h3>Atualizar andamento do conserto</h3>
      <input type="hidden" name="id" value={id} />
      <div className="fg">
        <div className="f">
          <label>Novo status</label>
          <select name="status" defaultValue={v("status") ?? status}>
            {STATUS.filter((s) => s.key !== "entregue").map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="f" style={{ gridColumn: "span 2" }}>
          <label>Anotação (opcional)</label>
          <input name="nota" defaultValue={v("nota")} placeholder="Ex.: Aguardando chegada da placa-mãe" />
        </div>
      </div>
      <p className="muted" style={{ fontSize: 14, margin: "8px 0 0" }}>
        Ao mudar para “Aguardando aprovação”, o técnico de campo é quem leva o orçamento ao cliente.
      </p>
      <Mensagem r={r} />
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn sm" disabled={enviando}>{enviando ? "Salvando…" : "Salvar andamento"}</button>
      </div>
    </form>
  );
}

/* ---------- Resposta do cliente ao orçamento (campo) ---------- */
export function FormRespostaOrcamento({ id, orcamento }: { id: number; orcamento: string }) {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoRespostaOrcamento, {});
  const resposta = useRef<HTMLInputElement>(null);
  const marcar = (v: string) => () => {
    if (resposta.current) resposta.current.value = v;
  };
  return (
    <form action={acao} className="panel destaque" key={r.t}>
      <h3>Resposta do cliente ao orçamento de {orcamento}</h3>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="resposta" ref={resposta} />
      <div className="fg">
        <div className="f full">
          <label>Observação (opcional)</label>
          <input name="nota" defaultValue={r.valores?.nota} placeholder="Ex.: Aprovou por telefone, pediu urgência" />
        </div>
      </div>
      <Mensagem r={r} />
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn sm danger" onClick={marcar("recusado")} disabled={enviando}>Cliente recusou</button>
        <button className="btn sm ok" onClick={marcar("aprovado")} disabled={enviando}>Cliente aprovou</button>
      </div>
    </form>
  );
}

/* ---------- Diagnóstico e orçamento (bancada) ---------- */
export function FormDiagnostico(props: {
  id: number;
  diagnostico: string | null;
  orcamento: number | null;
  previsao: string | null;
}) {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoDiagnostico, {});
  const v = (k: string) => r.valores?.[k];
  return (
    <form action={acao} className="panel" key={r.t}>
      <h3>Diagnóstico e orçamento</h3>
      <input type="hidden" name="id" value={props.id} />
      <div className="fg">
        <div className="f full">
          <label>Diagnóstico técnico / serviço a executar</label>
          <textarea name="diagnostico" defaultValue={v("diagnostico") ?? props.diagnostico ?? ""} />
        </div>
        <div className="f">
          <label>Orçamento (R$)</label>
          <input name="orcamento" inputMode="decimal" placeholder="0,00" defaultValue={v("orcamento") ?? valorBR(props.orcamento)} />
        </div>
        <div className="f">
          <label>Previsão de entrega</label>
          <input name="previsao" type="date" defaultValue={v("previsao") ?? props.previsao ?? ""} />
        </div>
      </div>
      <Mensagem r={r} />
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn sm ghost" disabled={enviando}>{enviando ? "Salvando…" : "Salvar diagnóstico"}</button>
      </div>
    </form>
  );
}

/* ---------- Devolução ao cliente (campo) ---------- */
type Retirada = { modelo: string; patrimonio: string; serie: string; etiqueta: string };

export function FormSaida(props: {
  id: number;
  cliente: string;
  orcamento: number | null;
  semConserto: boolean;
  garantiaPadrao: number;
  retirada: Retirada;
}) {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoSaida, {});
  const v = (k: string) => r.valores?.[k];
  const [resultado, setResultado] = useState(v("resultado") ?? (props.semConserto ? "semconserto" : "reparado"));
  return (
    <form action={acao} className="panel" style={{ borderColor: "#bbf7d0" }} key={r.t}>
      <h3>Registrar devolução ao cliente</h3>
      <input type="hidden" name="id" value={props.id} />
      <div className="fg">
        <div className="f">
          <label className="req">Recebido por (no cliente)</label>
          <input name="por" required defaultValue={v("por") ?? props.cliente} />
        </div>
        <div className="f">
          <label>Documento de quem recebeu</label>
          <input name="doc" defaultValue={v("doc")} />
        </div>
        <div className="f">
          <label>Resultado</label>
          <select name="resultado" value={resultado} onChange={(e) => setResultado(e.target.value)}>
            <option value="reparado">Reparado</option>
            <option value="semconserto">Devolvido sem conserto</option>
          </select>
        </div>
        <div className="f">
          <label>Valor cobrado (R$)</label>
          <input name="valor" inputMode="decimal" placeholder="0,00"
            defaultValue={v("valor") ?? (props.semConserto ? "" : valorBR(props.orcamento))} />
        </div>
        <div className="f">
          <label>Forma de pagamento</label>
          <select name="pgto" defaultValue={v("pgto") ?? PAGAMENTOS[0]}>
            {PAGAMENTOS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        {resultado === "reparado" && (
          <div className="f">
            <label>Garantia (dias)</label>
            <input name="garantia" inputMode="numeric" defaultValue={v("garantia") ?? String(props.garantiaPadrao)} />
          </div>
        )}
      </div>
      <h3 style={{ margin: "16px 0 4px", fontSize: 15 }}>Dados do equipamento entregue</h3>
      <p className="muted" style={{ fontSize: 14, margin: "0 0 8px" }}>
        Já vêm iguais aos da retirada. Altere só se o equipamento foi substituído.
      </p>
      <CamposEntrega v={v} padrao={props.retirada} />
      <Mensagem r={r} />
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn sm ok" disabled={enviando}>{enviando ? "Registrando…" : "Confirmar devolução"}</button>
      </div>
    </form>
  );
}

function CamposEntrega({ v, padrao }: { v: (k: string) => string | undefined; padrao: Retirada }) {
  return (
    <div className="fg">
      <div className="f"><label>Modelo</label><input name="entregaModelo" defaultValue={v("entregaModelo") ?? padrao.modelo} /></div>
      <div className="f"><label>Nº patrimônio</label><input name="entregaPatrimonio" defaultValue={v("entregaPatrimonio") ?? padrao.patrimonio} /></div>
      <div className="f"><label>Nº série</label><input name="entregaSerie" defaultValue={v("entregaSerie") ?? padrao.serie} /></div>
      <div className="f"><label>Nº etiqueta e série cliente</label><input name="entregaEtiqueta" defaultValue={v("entregaEtiqueta") ?? padrao.etiqueta} /></div>
    </div>
  );
}

/* ---------- Dados do RAT (campo / admin) ---------- */
export type ValoresRat = {
  chamado: string; empresaParceira: string; horaInicio: string; horaFim: string;
  clienteResponsavel: string; clienteCargo: string; patrimonio: string; etiquetaCliente: string; backupPerfil: string;
  servicoLab: boolean; servicoReparo: boolean; servicoUpgrade: boolean; backupFeito: boolean;
};

export function FormDadosRat({ id, atual, entrega }: { id: number; atual: ValoresRat; entrega: Retirada | null }) {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoDadosRat, {});
  const v = (k: string) => r.valores?.[k] ?? (atual as unknown as Record<string, string>)[k];
  const chk = (k: keyof ValoresRat) => (r.valores ? r.valores[k] === "on" : !!atual[k]);
  return (
    <details className="panel" open={!!r.t}>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>Dados do atendimento (RAT) ✎</summary>
      <form action={acao} key={r.t} style={{ marginTop: 12 }}>
        <input type="hidden" name="id" value={id} />
        <div className="fg">
          <div className="f">
            <label>Nº do chamado</label>
            <div className="chamado-auto">{atual.chamado || "—"}<small>automático</small></div>
          </div>
          <div className="f"><label>Empresa parceira</label><input name="empresaParceira" defaultValue={v("empresaParceira")} /></div>
          <div className="f"><label>Horário de início</label><input name="horaInicio" type="time" defaultValue={v("horaInicio")} /></div>
          <div className="f"><label>Horário de fim</label><input name="horaFim" type="time" defaultValue={v("horaFim")} /></div>
          <div className="f"><label>Nome do responsável</label><input name="clienteResponsavel" defaultValue={v("clienteResponsavel")} /></div>
          <div className="f"><label>Cargo</label><input name="clienteCargo" defaultValue={v("clienteCargo")} /></div>
          <div className="f"><label>Nº patrimônio (retirada)</label><input name="patrimonio" defaultValue={v("patrimonio")} /></div>
          <div className="f"><label>Nº etiqueta e série cliente (retirada)</label><input name="etiquetaCliente" defaultValue={v("etiquetaCliente")} /></div>
          <div className="f full">
            <div className="checks">
              <label><input type="checkbox" name="servicoLab" defaultChecked={chk("servicoLab")} /> Retirado para laboratório</label>
              <label><input type="checkbox" name="servicoReparo" defaultChecked={chk("servicoReparo")} /> Substituição ou reparo</label>
              <label><input type="checkbox" name="servicoUpgrade" defaultChecked={chk("servicoUpgrade")} /> Upgrade (SSD, memória)</label>
              <label><input type="checkbox" name="backupFeito" defaultChecked={chk("backupFeito")} /> Backup realizado</label>
            </div>
          </div>
          <div className="f"><label>Nome do perfil de usuário</label><input name="backupPerfil" defaultValue={v("backupPerfil")} /></div>
        </div>
        {entrega && (
          <>
            <h3 style={{ margin: "16px 0 8px", fontSize: 15 }}>Dados de entrega</h3>
            <CamposEntrega v={(k) => r.valores?.[k]} padrao={entrega} />
          </>
        )}
        <Mensagem r={r} />
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn sm ghost" disabled={enviando}>{enviando ? "Salvando…" : "Salvar dados do RAT"}</button>
        </div>
      </form>
    </details>
  );
}

/* ---------- Trocar responsáveis (admin) ---------- */
type Opcao = { id: number; nome: string };
export function FormAtribuir(props: {
  id: number;
  campoId: number | null;
  bancadaId: number | null;
  campos: Opcao[];
  bancadas: Opcao[];
}) {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoAtribuir, {});
  return (
    <form action={acao} key={r.t} className="atribuir" style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginTop: 12 }}>
      <input type="hidden" name="id" value={props.id} />
      <div className="f" style={{ minWidth: 200 }}>
        <label>Técnico de campo</label>
        <select name="campoId" defaultValue={props.campoId ?? ""}>
          <option value="">— ninguém —</option>
          {props.campos.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
      </div>
      <div className="f" style={{ minWidth: 200 }}>
        <label>Técnico de bancada</label>
        <select name="bancadaId" defaultValue={props.bancadaId ?? ""}>
          <option value="">— ninguém —</option>
          {props.bancadas.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
      </div>
      <button className="btn sm ghost" disabled={enviando}>Trocar responsáveis</button>
      <div style={{ width: "100%" }}><Mensagem r={r} /></div>
    </form>
  );
}

/* ---------- Conversa ---------- */
export function FormMensagem({ id }: { id: number }) {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoMensagem, {});
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form action={acao} ref={ref} key={r.t}>
      <input type="hidden" name="id" value={id} />
      <div className="chat-form">
        <textarea
          name="texto"
          defaultValue={r.erro ? r.valores?.texto : ""}
          placeholder="Escreva para a equipe… (Enter envia, Shift+Enter quebra linha)"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (e.currentTarget.value.trim()) ref.current?.requestSubmit();
            }
          }}
        />
        <button className="btn" disabled={enviando}>{enviando ? "…" : "Enviar"}</button>
      </div>
      {r.erro && <Mensagem r={r} />}
    </form>
  );
}

/** Rola a conversa para a última mensagem. */
export function RolarParaFim({ alvo, dep }: { alvo: string; dep: number }) {
  useEffect(() => {
    const el = document.getElementById(alvo);
    if (el) el.scrollTop = el.scrollHeight;
  }, [alvo, dep]);
  return null;
}

/** Recarrega os dados da página de tempos em tempos (novas mensagens e status). */
export function AutoAtualizar({ segundos = 20 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      // não atrapalha quem está digitando
      const ativo = document.activeElement;
      if (ativo && ["INPUT", "TEXTAREA", "SELECT"].includes(ativo.tagName) && (ativo as HTMLInputElement).value) return;
      router.refresh();
    }, segundos * 1000);
    return () => clearInterval(t);
  }, [router, segundos]);
  return null;
}

/* ---------- Excluir (admin) ---------- */
export function BotaoExcluir({ id, numero }: { id: number; numero: string }) {
  const [confirmar, setConfirmar] = useState(false);
  if (!confirmar)
    return (
      <button type="button" className="btn sm danger" onClick={() => setConfirmar(true)}>
        Excluir OS
      </button>
    );
  return (
    <form action={acaoExcluir} className="confirm show">
      <input type="hidden" name="id" value={id} />
      <span>Excluir a OS {numero} definitivamente? Esta ação não pode ser desfeita.</span>
      <button type="button" className="btn sm ghost" onClick={() => setConfirmar(false)}>Cancelar</button>
      <button className="btn sm danger">Excluir</button>
    </form>
  );
}
