import Link from "next/link";
import Barra from "@/components/Barra";
import StatusPill from "@/components/StatusPill";
import BotaoPronto from "@/components/BotaoPronto";
import { STATUS, TIPOS, TIPO_CORES } from "@/lib/constantes";
import { brl, dataHora, dataIso, diasDesde, osNum } from "@/lib/format";
import { descEquip, estaAberta, estaAtrasada, listarOrdens, ultimasNaoLidas, type Ordem } from "@/lib/ordens";
import { exigirUsuario } from "@/lib/auth";
import { PAPEIS } from "@/lib/constantes";
import type { Usuario } from "@/lib/usuarios";

export const dynamic = "force-dynamic";

type Fila = { titulo: string; dica: string; itens: Ordem[]; link: string; botaoPronto?: boolean };

/** O que cada perfil precisa fazer agora. */
function filas(u: Usuario, ordens: Ordem[]): Fila[] {
  const abertas = ordens.filter(estaAberta);
  if (u.papel === "campo") {
    const minhas = abertas.filter((o) => o.campoId === u.id);
    return [
      { titulo: "Levar orçamento ao cliente", dica: "Aguardando a resposta do cliente", itens: minhas.filter((o) => o.status === "aprovacao"), link: "/ordens?status=aprovacao" },
      { titulo: "Prontos para devolver", dica: "Agende a entrega no cliente", itens: minhas.filter((o) => o.status === "pronto" || o.status === "semconserto"), link: "/ordens?status=pronto" },
      { titulo: "Na bancada", dica: "Em diagnóstico ou conserto", itens: minhas.filter((o) => !["aprovacao", "pronto", "semconserto"].includes(o.status)), link: "/ordens" },
    ];
  }
  if (u.papel === "bancada") {
    const minhas = abertas.filter((o) => o.bancadaId === u.id);
    return [
      { titulo: "Meus consertos", dica: "Terminou? Toque em ✅ Pronto", itens: minhas.filter((o) => ["recebido", "diagnostico", "peca", "reparo"].includes(o.status)), link: "/ordens", botaoPronto: true },
      { titulo: "Sem técnico de bancada", dica: "Assuma para começar", itens: abertas.filter((o) => o.bancadaId === null && !["pronto", "semconserto"].includes(o.status)), link: "/ordens?status=sembancada&minhas=0" },
      { titulo: "Esperando o cliente", dica: "Orçamento com o técnico de campo", itens: minhas.filter((o) => o.status === "aprovacao"), link: "/ordens?status=aprovacao" },
    ];
  }
  return [
    { titulo: "Sem técnico de bancada", dica: "Defina um responsável", itens: abertas.filter((o) => o.bancadaId === null && !["pronto", "semconserto"].includes(o.status)), link: "/ordens?status=sembancada&minhas=0" },
    { titulo: "Aguardando o cliente", dica: "Orçamento enviado", itens: abertas.filter((o) => o.status === "aprovacao"), link: "/ordens?status=aprovacao&minhas=0" },
    { titulo: "Prontos para devolver", dica: "Com o técnico de campo", itens: abertas.filter((o) => o.status === "pronto" || o.status === "semconserto"), link: "/ordens?status=pronto&minhas=0" },
  ];
}

export default async function Painel({ searchParams }: { searchParams: Promise<{ "sem-permissao"?: string }> }) {
  const u = await exigirUsuario();
  const semPermissao = (await searchParams)["sem-permissao"];
  const ordens = listarOrdens();
  const minhasFilas = filas(u, ordens);
  const msgs = ultimasNaoLidas(u.id, u.papel);
  const abertas = ordens.filter(estaAberta);
  const prontos = ordens.filter((o) => o.status === "pronto" || o.status === "semconserto");
  const atrasadas = ordens.filter(estaAtrasada);

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
  const entradasMes = ordens.filter((o) => o.criadoEm >= inicioMes).length;
  const saidasMes = ordens.filter((o) => o.saidaEm && o.saidaEm >= inicioMes);
  const faturado = saidasMes.reduce((s, o) => s + (o.saidaValor ?? 0), 0);

  const kpis = [
    { l: "Em manutenção", n: abertas.length, c: "" },
    { l: "Prontos p/ retirada", n: prontos.length, c: "good" },
    { l: "Atrasados", n: atrasadas.length, c: atrasadas.length ? "alert" : "" },
    { l: "Entradas no mês", n: entradasMes, c: "" },
    { l: "Saídas no mês", n: saidasMes.length, c: "" },
    { l: "Faturado no mês", n: brl(faturado), c: "" },
  ];

  const porStatus = STATUS.map((s) => ({ ...s, n: ordens.filter((o) => o.status === s.key).length }));
  const maxStatus = Math.max(...porStatus.map((s) => s.n));

  const porTipo = TIPOS.map((t, i) => ({ t, cor: TIPO_CORES[i], n: abertas.filter((o) => o.tipo === t).length })).filter(
    (x) => x.n
  );
  const maxTipo = Math.max(1, ...porTipo.map((x) => x.n));

  // Itens que precisam de atenção
  const parados = abertas.filter(
    (o) => !estaAtrasada(o) && o.status !== "pronto" && o.status !== "semconserto" && diasDesde(o.atualizadoEm) > 7
  );
  const esperando = prontos.filter((o) => diasDesde(o.atualizadoEm) > 5);
  const atencao: { o: Ordem; m: string }[] = [
    ...atrasadas.map((o) => ({ o, m: `Previsão vencida em ${dataIso(o.previsao)}` })),
    ...parados.map((o) => ({ o, m: `Sem atualização há ${diasDesde(o.atualizadoEm)} dias` })),
    ...esperando.map((o) => ({ o, m: `Aguardando retirada há ${diasDesde(o.atualizadoEm)} dias` })),
  ].slice(0, 8);

  // Movimentações recentes (entradas e saídas)
  const movs = ordens
    .flatMap((o) => [
      { tipo: "in" as const, em: o.criadoEm, o },
      ...(o.saidaEm ? [{ tipo: "out" as const, em: o.saidaEm, o }] : []),
    ])
    .sort((a, b) => b.em.localeCompare(a.em))
    .slice(0, 8);

  return (
    <section>
      <h1>Olá, {u.nome.split(" ")[0]}</h1>
      <p className="sub">
        {PAPEIS[u.papel].label} · {PAPEIS[u.papel].desc}.
      </p>
      {semPermissao && <div className="msg erro" style={{ marginBottom: 16 }}>Seu perfil não tem acesso àquela página.</div>}

      <div className="fila">
        {minhasFilas.map((f) => (
          <div key={f.titulo} className="card">
            <h2>
              <Link href={f.link} style={{ color: "inherit", textDecoration: "none" }}>{f.titulo}</Link>
              <span className="n">{f.itens.length}</span>
            </h2>
            <p className="muted" style={{ margin: "-8px 0 8px", fontSize: 14 }}>{f.dica}</p>
            {f.itens.length === 0 && <div className="empty" style={{ padding: 12 }}>Nada por aqui.</div>}
            {f.itens.slice(0, f.botaoPronto ? 6 : 4).map((o) => {
              const item = (
                <Link href={`/ordens/${o.id}`} className="mv" style={{ color: "inherit", textDecoration: "none" }}>
                  <div className="t">
                    <b>{osNum(o.id)} · {descEquip(o)}</b>
                    <span>{o.clienteNome}{o.prioridade === "alta" ? " · URGENTE" : ""}</span>
                  </div>
                  <StatusPill status={o.status} />
                </Link>
              );
              return f.botaoPronto ? (
                <div key={o.id} className="fila-item">
                  {item}
                  <BotaoPronto id={o.id} origem="painel" compacto />
                </div>
              ) : (
                <div key={o.id}>{item}</div>
              );
            })}
            {f.itens.length > (f.botaoPronto ? 6 : 4) && <Link href={f.link} style={{ fontSize: 15 }}>Ver todas ({f.itens.length}) →</Link>}
          </div>
        ))}
        <div className="card destaque">
          <h2>Mensagens não lidas <span className="n">{msgs.length}</span></h2>
          {msgs.length === 0 && <div className="empty" style={{ padding: 12 }}>Nenhuma mensagem nova.</div>}
          {msgs.map((m, i) => (
            <Link key={i} href={`/ordens/${m.ordemId}`} className="mv" style={{ color: "inherit", textDecoration: "none" }}>
              <div className="ic" style={{ background: PAPEIS[m.papel].fundo, color: PAPEIS[m.papel].cor }}>💬</div>
              <div className="t">
                <b>{m.autor} · OS {osNum(m.ordemId)}</b>
                <span>{m.texto.length > 70 ? m.texto.slice(0, 70) + "…" : m.texto}</span>
                <span style={{ display: "block", fontSize: 12 }}>{dataHora(m.em)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <h2 style={{ fontSize: 18, margin: "8px 0 12px" }}>Visão geral da oficina</h2>

      <div className="kpis">
        {kpis.map((k) => (
          <div key={k.l} className={`kpi ${k.c}`}>
            <div className="l">{k.l}</div>
            <div className="n">{k.n}</div>
          </div>
        ))}
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Equipamentos por status</h2>
          {ordens.length ? (
            porStatus.map((s) => <Barra key={s.key} label={s.label} valor={s.n} max={maxStatus} cor={s.cor} />)
          ) : (
            <div className="empty">Nenhuma ordem registrada ainda.</div>
          )}
        </div>

        <div className="card">
          <h2>Em manutenção por tipo</h2>
          {porTipo.length ? (
            porTipo.map((x) => <Barra key={x.t} label={x.t} valor={x.n} max={maxTipo} cor={x.cor} />)
          ) : (
            <div className="empty">Nenhum equipamento na loja no momento.</div>
          )}
        </div>

        <div className="card">
          <h2>Precisam de atenção</h2>
          {atencao.length ? (
            atencao.map(({ o, m }) => (
              <Link key={o.id + m} href={`/ordens/${o.id}`} className="mv" style={{ color: "inherit", textDecoration: "none" }}>
                <div className="ic" style={{ background: "#fee2e2", color: "#b91c1c" }}>!</div>
                <div className="t">
                  <b>{osNum(o.id)} · {descEquip(o)}</b>
                  <span>{o.clienteNome} — {m}</span>
                </div>
                <StatusPill status={o.status} />
              </Link>
            ))
          ) : (
            <div className="empty">Tudo em dia. 👍</div>
          )}
        </div>

        <div className="card">
          <h2>Últimas entradas e saídas</h2>
          {movs.length ? (
            movs.map((m) => (
              <Link key={m.tipo + m.o.id} href={`/ordens/${m.o.id}`} className="mv" style={{ color: "inherit", textDecoration: "none" }}>
                <div className={`ic ${m.tipo}`}>{m.tipo === "in" ? "↓" : "↑"}</div>
                <div className="t">
                  <b>{m.tipo === "in" ? "Entrada" : "Saída"} {osNum(m.o.id)} · {descEquip(m.o)}</b>
                  <span>{m.o.clienteNome}</span>
                </div>
                <span className="when">{dataHora(m.em)}</span>
              </Link>
            ))
          ) : (
            <div className="empty">
              Sem movimentações. <Link href="/ordens/nova">Registre a primeira entrada</Link>.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
