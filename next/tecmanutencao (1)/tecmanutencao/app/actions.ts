"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { encerrarSessao, iniciarSessao, tokenAtualHash, usuarioAtual } from "@/lib/auth";
import { PAGAMENTOS, PAPEIS, papelValido, statusValido, TIPOS, type Papel } from "@/lib/constantes";
import { brl, parseValor } from "@/lib/format";
import {
  assumirOrdem,
  atribuirTecnicos,
  atualizarAndamento,
  criarOrdem,
  enviarMensagem,
  excluirOrdem,
  obterOrdem,
  registrarSaida,
  salvarDadosRat,
  salvarDiagnostico,
  type Ordem,
} from "@/lib/ordens";
import { pode, type Acao } from "@/lib/permissoes";
import {
  adminsAtivos,
  atualizarUsuario,
  autenticar,
  conferirSenha,
  contarUsuarios,
  criarUsuario,
  loginEmUso,
  obterUsuario,
  senhaFraca,
  trocarSenha,
  type Usuario,
} from "@/lib/usuarios";
import { db } from "@/lib/db";

export type Resultado = { erro?: string; ok?: string; t?: number; valores?: Record<string, string> };

const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const opt = (f: FormData, k: string) => txt(f, k) || null;
const ok = (msg: string): Resultado => ({ ok: msg, t: Date.now() });

/** Em caso de erro, devolve o que foi digitado (menos senhas) para o formulário não ficar em branco */
const falhou = (f: FormData, erro: string): Resultado => ({
  erro,
  t: Date.now(),
  valores: Object.fromEntries(
    [...f.entries()]
      .filter(([k]) => !k.startsWith("$") && !k.toLowerCase().includes("senha"))
      .map(([k, v]) => [k, String(v)])
  ),
});

const atualizarTelas = (id?: number) => {
  revalidatePath("/");
  revalidatePath("/ordens");
  if (id) revalidatePath(`/ordens/${id}`);
};

const marcado = (f: FormData, k: string) => (f.get(k) === "on" ? 1 : 0);
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Campos do RAT preenchidos pelo técnico de campo (entrada e edição). */
function lerDadosRat(f: FormData) {
  const d = {
    empresaParceira: opt(f, "empresaParceira"),
    horaInicio: opt(f, "horaInicio"),
    horaFim: opt(f, "horaFim"),
    clienteResponsavel: opt(f, "clienteResponsavel"),
    clienteCargo: opt(f, "clienteCargo"),
    servicoLab: marcado(f, "servicoLab"),
    servicoReparo: marcado(f, "servicoReparo"),
    servicoUpgrade: marcado(f, "servicoUpgrade"),
    patrimonio: opt(f, "patrimonio"),
    etiquetaCliente: opt(f, "etiquetaCliente"),
    backupFeito: marcado(f, "backupFeito"),
    backupPerfil: opt(f, "backupPerfil"),
  };
  const erro =
    (d.horaInicio && !HORA.test(d.horaInicio)) || (d.horaFim && !HORA.test(d.horaFim))
      ? "Horário inválido. Use o formato 00:00."
      : null;
  return { d, erro };
}

/** Dados do equipamento entregue; em branco = mesmo equipamento que foi retirado. */
function lerDadosEntrega(f: FormData, o: Ordem) {
  return {
    entregaModelo: opt(f, "entregaModelo") ?? ([o.marca, o.modelo].filter(Boolean).join(" ") || null),
    entregaPatrimonio: opt(f, "entregaPatrimonio") ?? o.patrimonio,
    entregaSerie: opt(f, "entregaSerie") ?? o.serie,
    entregaEtiqueta: opt(f, "entregaEtiqueta") ?? o.etiquetaCliente,
  };
}

/** Usuário logado; sem sessão válida volta para o login. */
async function logado(): Promise<Usuario> {
  const u = await usuarioAtual();
  if (!u) redirect("/login");
  return u;
}

const SEM_PERMISSAO = "Seu perfil não tem permissão para esta ação.";

/** O técnico de bancada só mexe na OS que é dele (ou que ainda não tem responsável). */
function bancadaPodeMexer(u: Usuario, o: Ordem) {
  return u.papel === "admin" || o.bancadaId === null || o.bancadaId === u.id;
}

/** Valida um id de usuário vindo de um <select>: precisa existir, estar ativo e ter o perfil certo. */
function tecnicoValido(valor: string, papel: Papel): Usuario | null | "invalido" {
  if (!valor) return null;
  const t = obterUsuario(Number(valor));
  return t && t.ativo && t.papel === papel ? t : "invalido";
}

/* ======================= Login ======================= */

export async function acaoLogin(_: Resultado, f: FormData): Promise<Resultado> {
  const u = autenticar(txt(f, "usuario"), String(f.get("senha") ?? ""));
  if (!u) {
    await new Promise((r) => setTimeout(r, 600)); // dificulta tentativas em massa
    return falhou(f, "Usuário ou senha incorretos.");
  }
  await iniciarSessao(u.id);
  redirect("/");
}

export async function acaoLogout() {
  await encerrarSessao();
  redirect("/login");
}

/** Só funciona enquanto o banco não tem nenhum usuário: cria o primeiro administrador. */
export async function acaoPrimeiroAcesso(_: Resultado, f: FormData): Promise<Resultado> {
  if (contarUsuarios() > 0) return falhou(f, "O sistema já tem usuários. Entre com seu login.");
  const nome = txt(f, "nome");
  const usuario = txt(f, "usuario").toLowerCase();
  const senha = String(f.get("senha") ?? "");
  if (!nome || !usuario) return falhou(f, "Preencha nome e usuário.");
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) return falhou(f, "Usuário: 3 a 30 letras minúsculas, números, ponto, hífen ou _.");
  const fraca = senhaFraca(senha);
  if (fraca) return falhou(f, fraca);
  if (senha !== String(f.get("senha2") ?? "")) return falhou(f, "As senhas não conferem.");
  const id = criarUsuario({ nome, usuario, senha, papel: "admin" });
  await iniciarSessao(id);
  redirect("/usuarios");
}

/* ======================= Ordens ======================= */

export async function acaoCriarOrdem(_: Resultado, f: FormData): Promise<Resultado> {
  const u = await logado();
  if (!pode(u.papel, "registrarEntrada")) return falhou(f, SEM_PERMISSAO);

  const falha = (erro: string) => falhou(f, erro);

  // técnico de campo: quem registra (o admin pode escolher)
  let campo: Usuario | null = u.papel === "campo" ? u : null;
  if (u.papel === "admin") {
    const c = tecnicoValido(txt(f, "campoId"), "campo");
    if (c === "invalido") return falha("Técnico de campo inválido.");
    campo = c;
  }
  const bancada = tecnicoValido(txt(f, "bancadaId"), "bancada");
  if (bancada === "invalido") return falha("Técnico de bancada inválido.");

  const dados = {
    clienteNome: txt(f, "clienteNome"),
    clienteTel: txt(f, "clienteTel"),
    clienteEmail: txt(f, "clienteEmail") || undefined,
    clienteDoc: txt(f, "clienteDoc") || undefined,
    endereco: txt(f, "endereco") || undefined,
    tipo: txt(f, "tipo"),
    marca: txt(f, "marca"),
    modelo: txt(f, "modelo") || undefined,
    serie: txt(f, "serie") || undefined,
    acessorios: txt(f, "acessorios") || undefined,
    estado: txt(f, "estado") || undefined,
    defeito: txt(f, "defeito"),
    prioridade: ["normal", "alta", "baixa"].includes(txt(f, "prioridade")) ? txt(f, "prioridade") : "normal",
    campoId: campo?.id ?? null,
    bancadaId: bancada?.id ?? null,
    previsao: txt(f, "previsao") || undefined,
    obs: txt(f, "obs") || undefined,
  };
  const rat = lerDadosRat(f);
  if (rat.erro) return falha(rat.erro);

  if (!dados.clienteNome || !dados.clienteTel) return falha("Informe o nome e o telefone do cliente.");
  if (!(TIPOS as readonly string[]).includes(dados.tipo)) return falha("Selecione o tipo do equipamento.");
  if (!dados.marca) return falha("Informe a marca do equipamento.");
  if (!dados.defeito) return falha("Descreva o defeito relatado pelo cliente.");

  // null -> undefined (campos opcionais da nova OS)
  const extras = Object.fromEntries(Object.entries(rat.d).map(([k, v]) => [k, v ?? undefined])) as {
    [K in keyof typeof rat.d]: Exclude<(typeof rat.d)[K], null> | undefined;
  };
  const { id } = criarOrdem(
    {
      ...dados,
      ...extras,
      servicoLab: rat.d.servicoLab,
      servicoReparo: rat.d.servicoReparo,
      servicoUpgrade: rat.d.servicoUpgrade,
      backupFeito: rat.d.backupFeito,
    },
    u.id
  );
  const recado = txt(f, "recado");
  if (recado) enviarMensagem(id, u.id, recado.slice(0, 2000));
  atualizarTelas();
  redirect(`/ordens/${id}?nova=1`);
}

/** Carrega a OS e confere perfil/estado comuns a quase todas as ações. */
async function preparar(
  f: FormData,
  acao: Acao,
  abertaObrigatoria = true
): Promise<{ erro: Resultado } | { u: Usuario; o: Ordem }> {
  const u = await logado();
  const o = obterOrdem(Number(f.get("id")));
  if (!o) return { erro: falhou(f, "Ordem não encontrada.") };
  if (!pode(u.papel, acao)) return { erro: falhou(f, SEM_PERMISSAO) };
  if (abertaObrigatoria && o.status === "entregue")
    return { erro: falhou(f, "Esta ordem já foi encerrada (equipamento devolvido).") };
  return { u, o };
}

export async function acaoAndamento(_: Resultado, f: FormData): Promise<Resultado> {
  const p = await preparar(f, "andamento");
  if ("erro" in p) return p.erro;
  const { u, o } = p;
  if (!bancadaPodeMexer(u, o)) return falhou(f, `Esta OS está com ${o.bancadaNome}.`);

  const status = txt(f, "status");
  const nota = opt(f, "nota");
  if (!statusValido(status) || status === "entregue")
    return falhou(f, "Status inválido. A devolução é registrada pelo técnico de campo.");
  if (status === o.status && !nota) return falhou(f, "Escolha outro status ou escreva uma anotação.");
  if (status === "aprovacao" && o.orcamento === null)
    return falhou(f, "Salve o orçamento antes de pedir a aprovação do cliente.");

  // técnico de bancada que mexe numa OS sem responsável passa a ser o responsável
  if (u.papel === "bancada" && o.bancadaId === null) assumirOrdem(o.id, u.id, u.nome);
  atualizarAndamento(o.id, status, nota, u.id);
  atualizarTelas(o.id);
  return ok("Andamento atualizado.");
}

/** Status a partir dos quais o técnico de bancada pode marcar “Pronto” com um toque. */
const PODE_FICAR_PRONTO = ["recebido", "diagnostico", "peca", "reparo"];

/**
 * Botão rápido “✅ Pronto”: marca a OS como pronta para retirada e avisa o
 * técnico de campo pela conversa da OS (aparece como mensagem não lida para ele).
 */
export async function acaoMarcarPronto(_: Resultado, f: FormData): Promise<Resultado> {
  const p = await preparar(f, "andamento");
  if ("erro" in p) return p.erro;
  const { u, o } = p;
  if (!bancadaPodeMexer(u, o)) return falhou(f, `Esta OS está com ${o.bancadaNome}.`);
  if (o.status === "aprovacao") return falhou(f, "Aguardando o cliente aprovar o orçamento.");
  if (!PODE_FICAR_PRONTO.includes(o.status)) return falhou(f, "Esta OS já foi liberada.");

  if (u.papel === "bancada" && o.bancadaId === null) assumirOrdem(o.id, u.id, u.nome);
  const obs = opt(f, "nota");
  atualizarAndamento(o.id, "pronto", obs ?? "Marcado como pronto.", u.id);
  enviarMensagem(
    o.id,
    u.id,
    `✅ Equipamento pronto! ${o.campoNome ? o.campoNome.split(" ")[0] + ", pode" : "Pode"} agendar a devolução ao cliente.` +
      (obs ? `\n${obs}` : "")
  );
  atualizarTelas(o.id);
  if (txt(f, "origem") === "os") redirect(`/ordens/${o.id}?aviso=pronto`);
  return ok(`OS ${String(o.id).padStart(4, "0")} marcada como pronta. O técnico de campo foi avisado.`);
}

export async function acaoRespostaOrcamento(_: Resultado, f: FormData): Promise<Resultado> {
  const p = await preparar(f, "respostaOrcamento");
  if ("erro" in p) return p.erro;
  const { u, o } = p;
  if (o.status !== "aprovacao") return falhou(f, "Esta OS não está aguardando aprovação do orçamento.");

  const resposta = txt(f, "resposta");
  const obs = opt(f, "nota");
  if (resposta !== "aprovado" && resposta !== "recusado") return falhou(f, "Escolha se o cliente aprovou ou recusou.");
  const nota =
    (resposta === "aprovado"
      ? `Cliente APROVOU o orçamento de ${brl(o.orcamento)}.`
      : `Cliente RECUSOU o orçamento de ${brl(o.orcamento)}. Devolver sem conserto.`) + (obs ? ` ${obs}` : "");

  atualizarAndamento(o.id, resposta === "aprovado" ? "reparo" : "semconserto", nota, u.id);
  atualizarTelas(o.id);
  // o formulário some depois da resposta, então o aviso vai pela URL
  redirect(`/ordens/${o.id}?aviso=${resposta}`);
}

export async function acaoDiagnostico(_: Resultado, f: FormData): Promise<Resultado> {
  const p = await preparar(f, "diagnostico");
  if ("erro" in p) return p.erro;
  const { u, o } = p;
  if (!bancadaPodeMexer(u, o)) return falhou(f, `Esta OS está com ${o.bancadaNome}.`);

  const orcamento = parseValor(f.get("orcamento"));
  if (Number.isNaN(orcamento)) return falhou(f, "Orçamento inválido. Ex.: 250,00");

  if (u.papel === "bancada" && o.bancadaId === null) assumirOrdem(o.id, u.id, u.nome);
  salvarDiagnostico(o.id, { diagnostico: opt(f, "diagnostico"), orcamento, previsao: opt(f, "previsao") });
  atualizarTelas(o.id);
  return ok("Diagnóstico salvo.");
}

export async function acaoAssumir(f: FormData) {
  const u = await logado();
  const o = obterOrdem(Number(f.get("id")));
  if (o && pode(u.papel, "assumir") && o.bancadaId === null && o.status !== "entregue") {
    assumirOrdem(o.id, u.id, u.nome);
    atualizarTelas(o.id);
  }
}

export async function acaoAtribuir(_: Resultado, f: FormData): Promise<Resultado> {
  const p = await preparar(f, "atribuir", false);
  if ("erro" in p) return p.erro;
  const { u, o } = p;
  const campo = tecnicoValido(txt(f, "campoId"), "campo");
  const bancada = tecnicoValido(txt(f, "bancadaId"), "bancada");
  if (campo === "invalido" || bancada === "invalido") return falhou(f, "Técnico inválido ou desativado.");
  if ((campo?.id ?? null) === o.campoId && (bancada?.id ?? null) === o.bancadaId) return falhou(f, "Nada mudou.");
  atribuirTecnicos(
    o.id,
    { id: campo?.id ?? null, nome: campo?.nome ?? null },
    { id: bancada?.id ?? null, nome: bancada?.nome ?? null },
    u.id
  );
  atualizarTelas(o.id);
  return ok("Responsáveis atualizados.");
}

export async function acaoSaida(_: Resultado, f: FormData): Promise<Resultado> {
  const p = await preparar(f, "registrarSaida");
  if ("erro" in p) return p.erro;
  const { u, o } = p;
  if (u.papel !== "admin" && o.status !== "pronto" && o.status !== "semconserto")
    return falhou(f, "A bancada ainda não liberou este equipamento (status precisa ser “Pronto” ou “Sem conserto”).");

  const por = txt(f, "por");
  if (!por) return falhou(f, "Informe quem recebeu o equipamento no cliente.");
  const valor = parseValor(f.get("valor"));
  if (Number.isNaN(valor)) return falhou(f, "Valor inválido. Ex.: 250,00");
  const resultado = txt(f, "resultado") === "semconserto" ? "semconserto" : "reparado";
  const pgto = PAGAMENTOS.includes(txt(f, "pgto")) ? txt(f, "pgto") : PAGAMENTOS[0];
  const gar = parseInt(txt(f, "garantia"), 10);

  registrarSaida(
    o.id,
    {
      por,
      doc: opt(f, "doc"),
      valor,
      pgto,
      resultado,
      garantia: resultado === "reparado" && Number.isFinite(gar) ? gar : null,
      ...lerDadosEntrega(f, o),
    },
    u.id
  );
  atualizarTelas(o.id);
  redirect(`/ordens/${o.id}?aviso=devolvido`);
}

/** Edita os dados do atendimento que saem no RAT (campo e admin; vale também depois da devolução). */
export async function acaoDadosRat(_: Resultado, f: FormData): Promise<Resultado> {
  const p = await preparar(f, "registrarEntrada", false);
  if ("erro" in p) return p.erro;
  const { o } = p;
  const rat = lerDadosRat(f);
  if (rat.erro) return falhou(f, rat.erro);
  salvarDadosRat(o.id, { ...rat.d, ...(o.status === "entregue" ? lerDadosEntrega(f, o) : {}) });
  atualizarTelas(o.id);
  return ok("Dados do RAT salvos.");
}

export async function acaoMensagem(_: Resultado, f: FormData): Promise<Resultado> {
  const u = await logado();
  const o = obterOrdem(Number(f.get("id")));
  if (!o) return falhou(f, "Ordem não encontrada.");
  const texto = txt(f, "texto");
  if (!texto) return falhou(f, "Escreva a mensagem.");
  if (texto.length > 2000) return falhou(f, "Mensagem muito longa (máx. 2000 caracteres).");
  enviarMensagem(o.id, u.id, texto);
  atualizarTelas(o.id);
  return ok("");
}

export async function acaoExcluir(f: FormData) {
  const u = await logado();
  if (!pode(u.papel, "excluir")) return;
  excluirOrdem(Number(f.get("id")));
  atualizarTelas();
  redirect("/ordens");
}

/* ======================= Usuários ======================= */

function validarCadastro(f: FormData, excetoId?: number) {
  const nome = txt(f, "nome");
  const usuario = txt(f, "usuario").toLowerCase();
  const papel = txt(f, "papel");
  if (!nome) return { erro: "Informe o nome." } as const;
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario))
    return { erro: "Usuário: 3 a 30 letras minúsculas, números, ponto, hífen ou _." } as const;
  if (loginEmUso(usuario, excetoId)) return { erro: `O usuário “${usuario}” já existe.` } as const;
  if (!papelValido(papel)) return { erro: "Escolha o perfil." } as const;
  return { nome, usuario, papel } as const;
}

export async function acaoCriarUsuario(_: Resultado, f: FormData): Promise<Resultado> {
  const u = await logado();
  if (!pode(u.papel, "usuarios")) return falhou(f, SEM_PERMISSAO);
  const v = validarCadastro(f);
  if ("erro" in v) return falhou(f, v.erro!);
  const senha = String(f.get("senha") ?? "");
  const fraca = senhaFraca(senha);
  if (fraca) return falhou(f, fraca);
  criarUsuario({ ...v, senha });
  revalidatePath("/usuarios");
  return ok(`${PAPEIS[v.papel].label} “${v.nome}” cadastrado. Login: ${v.usuario}`);
}

export async function acaoEditarUsuario(_: Resultado, f: FormData): Promise<Resultado> {
  const u = await logado();
  if (!pode(u.papel, "usuarios")) return falhou(f, SEM_PERMISSAO);
  const alvo = obterUsuario(Number(f.get("id")));
  if (!alvo) return falhou(f, "Usuário não encontrado.");
  const v = validarCadastro(f, alvo.id);
  if ("erro" in v) return falhou(f, v.erro!);
  const ativo = f.get("ativo") === "on";

  const perdeAdmin = alvo.papel === "admin" && alvo.ativo && (v.papel !== "admin" || !ativo);
  if (perdeAdmin && adminsAtivos() <= 1) return falhou(f, "Precisa existir pelo menos um administrador ativo.");
  if (alvo.id === u.id && !ativo) return falhou(f, "Você não pode desativar a si mesmo.");

  const novaSenha = String(f.get("novaSenha") ?? "");
  if (novaSenha && senhaFraca(novaSenha)) return falhou(f, senhaFraca(novaSenha)!);

  atualizarUsuario(alvo.id, { ...v, ativo });
  if (novaSenha) {
    trocarSenha(alvo.id, novaSenha, alvo.id === u.id ? await tokenAtualHash() : undefined);
  }
  revalidatePath("/usuarios");
  atualizarTelas();
  return ok(novaSenha ? "Dados e senha atualizados." : "Dados atualizados.");
}

export async function acaoMinhaSenha(_: Resultado, f: FormData): Promise<Resultado> {
  const u = await logado();
  const atual = String(f.get("senhaAtual") ?? "");
  const nova = String(f.get("senhaNova") ?? "");
  const hash = db.get<{ h: string }>(`SELECT senha_hash AS h FROM usuarios WHERE id = @id`, { id: u.id })?.h ?? "";
  if (!conferirSenha(atual, hash)) return falhou(f, "A senha atual está incorreta.");
  const fraca = senhaFraca(nova);
  if (fraca) return falhou(f, fraca);
  if (nova !== String(f.get("senhaNova2") ?? "")) return falhou(f, "As senhas novas não conferem.");
  trocarSenha(u.id, nova, await tokenAtualHash());
  return ok("Senha alterada. Suas outras sessões foram encerradas.");
}
