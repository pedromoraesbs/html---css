import Link from "next/link";
import { notFound } from "next/navigation";
import BotaoImprimir from "@/components/BotaoImprimir";
import AjusteRat from "@/components/AjusteRat";
import { exigirUsuario } from "@/lib/auth";
import { EMPRESA } from "@/lib/empresa";
import { data, osNum } from "@/lib/format";
import { obterOrdem, type Ordem } from "@/lib/ordens";
import "./rat.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/* ---------- pedaços do formulário ---------- */

const Caixa = ({ marcado }: { marcado?: boolean }) => <span className={`cx ${marcado ? "on" : ""}`}>{marcado ? "✕" : ""}</span>;

function Linha({ rotulo, valor, className = "" }: { rotulo: string; valor?: string | null; className?: string }) {
  return (
    <div className={`ln ${className}`}>
      <b>{rotulo}</b>
      <span className="val">{valor || ""}</span>
    </div>
  );
}

/** Área com linhas pontilhadas onde o texto é escrito por cima (cresce se o texto for longo). */
function Pautado({ texto, linhas }: { texto: string; linhas: number }) {
  const estimadas = texto
    .split("\n")
    .reduce((n, par) => n + Math.max(1, Math.ceil(par.length / 92)), 0);
  const total = Math.max(linhas, texto ? estimadas : 0);
  return (
    <div className="pautado">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="pauta" />
      ))}
      <div className="pautado-txt">{texto}</div>
    </div>
  );
}

function tipoEquip(o: Ordem) {
  const t = o.tipo;
  return {
    notebook: t === "Notebook",
    desktop: t === "Computador" || t === "Servidor",
    impressora: t === "Impressora",
    monitor: t === "Monitor",
    outros: ["Notebook", "Computador", "Servidor", "Impressora", "Monitor"].includes(t) ? "" : t,
  };
}

const hoje = (iso: string) => data(iso).split("/");

export default async function Rat({ params }: Props) {
  await exigirUsuario();
  const { id } = await params;
  const o = obterOrdem(Number(id));
  if (!o) notFound();

  const tipo = tipoEquip(o);
  const [dd, mm, aa] = hoje(o.criadoEm);
  const entregue = o.status === "entregue" && !!o.saidaEm;
  const [sd, sm, sa] = entregue ? hoje(o.saidaEm!) : ["", "", ""];
  const modeloRetirada = [o.marca, o.modelo].filter(Boolean).join(" ");

  // acessórios: até duas linhas no formulário
  const acess = (o.acessorios ?? "")
    .split(/[,;]/)
    .map((x) => x.trim())
    .filter((x) => x && !/^nenhum$/i.test(x));
  const acessLinhas = [acess.slice(0, Math.ceil(acess.length / 2)).join(", "), acess.slice(Math.ceil(acess.length / 2)).join(", ")];

  const fechamento = [
    o.diagnostico,
    entregue
      ? o.saidaResultado === "semconserto"
        ? "Equipamento devolvido sem conserto."
        : "Equipamento reparado e testado."
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const garantia = entregue && o.saidaResultado === "reparado" && o.saidaGarantia ? `${o.saidaGarantia} dias` : "";

  return (
    <section className="rat-pagina">
      <AjusteRat />
      <div className="no-print rat-barra">
        <Link href={`/ordens/${o.id}`} className="back">← Voltar para a OS {osNum(o.id)}</Link>
        <span className="muted" style={{ fontSize: 13 }}>
          Papel A5 · na janela de impressão escolha “Salvar como PDF” para enviar por e-mail
        </span>
        <BotaoImprimir />
      </div>

      <article className="rat">
        <div className="rat-topo">
          <h1>RAT (RELATÓRIO ATENDIMENTO TÉCNICO)</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EMPRESA.logo} alt={EMPRESA.nome} className="rat-logo" />
        </div>

        <div className="rat-cab">
          <div className="par" style={{ flex: 1.15 }}>
            <span className="tag">NOME DO TÉCNICO:</span>
            <span className="rat-box">{o.campoNome ?? ""}</span>
          </div>
          <div className="par" style={{ flex: 1 }}>
            <span className="tag">EMPRESA PARCEIRA</span>
            <span className="rat-box">{o.empresaParceira ?? ""}</span>
          </div>
        </div>
        <div className="rat-cab">
          <div className="par" style={{ flex: 0.8 }}>
            <span className="tag">CHAMADO:</span>
            <span className="rat-box">{o.chamado ?? ""}</span>
          </div>
          <div className="par" style={{ flex: 1.05 }}>
            <span className="tag">DATA DO ATENDIMENTO:</span>
            <span className="rat-box data">{dd} / {mm} / {aa}</span>
          </div>
          <div className="par" style={{ flex: 1.1 }}>
            <span className="tag">HORÁRIO:</span>
            <span className="rat-box hora">
              <span>INÍCIO: <i>{o.horaInicio ?? ""}</i></span>
              <span>FIM: <i>{o.horaFim ?? ""}</i></span>
            </span>
          </div>
        </div>

        <div className="barra">DADOS DO CLIENTE</div>
        <div className="bloco">
          <Linha rotulo="RAZÃO SOCIAL / NOME FANTASIA:" valor={o.clienteNome + (o.clienteDoc ? ` — ${o.clienteDoc}` : "")} />
          <Linha rotulo="NOME DO RESPONSÁVEL:" valor={o.clienteResponsavel} />
          <div className="dupla">
            <Linha rotulo="TELEFONE:" valor={o.clienteTel} />
            <Linha rotulo="E-MAIL:" valor={o.clienteEmail} />
          </div>
          <Linha rotulo="CARGO:" valor={o.clienteCargo} />
        </div>

        <div className="sep" />
        <div className="checks-rat servico">
          <span>RETIRADO PARA LABORATÓRIO S/N: <Caixa marcado={!!o.servicoLab} /></span>
          <span>SUBSTITUIÇÃO OU REPARO: <Caixa marcado={!!o.servicoReparo} /></span>
          <span>UPGRADE (ATUALIZAÇÃO SSD, MEMÓRIA): <Caixa marcado={!!o.servicoUpgrade} /></span>
        </div>
        <div className="checks-rat tipos">
          <span>NOTEBOOK: <Caixa marcado={tipo.notebook} /></span>
          <span>DESKTOP: <Caixa marcado={tipo.desktop} /></span>
          <span>IMPRESSORA: <Caixa marcado={tipo.impressora} /></span>
          <span>MONITOR <Caixa marcado={tipo.monitor} /></span>
          <span className="outros">OUTROS: <span className="val">{tipo.outros}</span></span>
        </div>

        <div className="barra">DADOS DO EQUIPAMENTO</div>
        <div className="colunas">
          <div className="barra sub">DADOS DE RETIRADA:</div>
          <div className="barra sub">DADOS DE ENTREGA:</div>
        </div>
        <div className="colunas equip">
          <div>
            <Linha rotulo="MODELO:" valor={modeloRetirada} />
            <Linha rotulo="Nº PATRIMÔNIO DO EQUIPAMENTO:" valor={o.patrimonio} />
            <Linha rotulo="Nº SÉRIE:" valor={o.serie} />
            <Linha rotulo="Nº ETIQUETA E SÉRIE CLIENTE:" valor={o.etiquetaCliente} />
          </div>
          <div>
            <Linha rotulo="MODELO:" valor={entregue ? o.entregaModelo ?? modeloRetirada : ""} />
            <Linha rotulo="Nº PATRIMÔNIO DO EQUIPAMENTO:" valor={entregue ? o.entregaPatrimonio : ""} />
            <Linha rotulo="Nº SÉRIE:" valor={entregue ? o.entregaSerie : ""} />
            <Linha rotulo="Nº ETIQUETA E SÉRIE CLIENTE:" valor={entregue ? o.entregaEtiqueta : ""} />
          </div>
        </div>

        <div className="colunas" style={{ marginTop: "2.4mm" }}>
          <div className="barra">BACKUP</div>
          <div className="barra">ACESSÓRIOS OU PERIFÉRICOS</div>
        </div>
        <div className="colunas equip">
          <div>
            <div className="ln chk">
              <b>BACKUP REALIZADO:</b>
              <span className="val">{o.backupFeito ? "Sim" : ""}</span>
              <Caixa marcado={!!o.backupFeito} />
            </div>
            <div className="ln chk">
              <b>NOME PERFIL USUARIO:</b>
              <span className="val">{o.backupPerfil ?? ""}</span>
              <Caixa marcado={!!o.backupPerfil} />
            </div>
          </div>
          <div>
            {acessLinhas.map((a, i) => (
              <div key={i} className="ln chk">
                <b>DETALHAR / PATRIMÔNIO:</b>
                <span className="val">{a}</span>
                <Caixa marcado={!!a} />
              </div>
            ))}
          </div>
        </div>

        <div className="barra">SINTOMA DO PROBLEMA RELATADO</div>
        <div className="bloco">
          <Pautado texto={o.defeito} linhas={3} />
        </div>

        <div className="barra">RELATÓRIO TÉCNICO - FECHAMENTO</div>
        <div className="bloco">
          <Pautado texto={fechamento} linhas={4} />
        </div>

        <div className="barra">TERMO DE GARANTIA DO SERVIÇO</div>
        <div className="garantia">
          <p>
            A {EMPRESA.nome} garante o serviço prestado por <span className="val curto">{garantia}</span> conforme as
            condições descritas neste documento.
          </p>
          <p>
            Para ter direito à garantia, o cliente deverá apresentar este documento no momento da solicitação do
            atendimento. A apresentação do documento é obrigatória e indispensável para a abertura do chamado de garantia,
            seja digital, seja física.
          </p>
        </div>

        <div className="assinaturas">
          <div>
            <b>ASSINATURA DO CLIENTE / RESPONSÁVEL</b>
            <span className="linha-ass" />
            <small>CIENTE DA RETIRADA DO EQUIPAMENTO</small>
          </div>
          <div className="data-ass">
            <span className="tag">DATA:</span>
            <span className="rat-box data">{sd} / {sm} / {sa}</span>
          </div>
          <div>
            <b>ASSINATURA DO CLIENTE / RESPONSÁVEL</b>
            <span className="linha-ass" />
            <small>CIENTE DA ENTREGA DO EQUIPAMENTO</small>
          </div>
        </div>

        <div className="lgpd">
          ATENDIMENTO À LGPD: AO INSERIR SEUS DADOS ACIMA, VOCÊ ESTARÁ DE ACORDO COM A UTILIZAÇÃO DE SUAS INFORMAÇÕES ÚNICA E
          EXCLUSIVAMENTE PARA O PROCESSO DE ATENDIMENTO TÉCNICO DA {EMPRESA.nome.toUpperCase()}. SEUS DADOS NÃO SERÃO
          PROCESSADOS E NEM DIVULGADOS PARA NENHUM OUTRO MEIO FORA DO ESCLARECIDO ACIMA.
          <span className="os-ref">OS {osNum(o.id)}</span>
        </div>
      </article>
    </section>
  );
}
