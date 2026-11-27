import { db } from "./db";
import type { Papel, StatusKey } from "./constantes";
import { hojeIso } from "./format";
import { proximoChamado } from "./chamado";

export type Ordem = {
  id: number;
  criadoEm: string;
  atualizadoEm: string;
  status: StatusKey;
  clienteNome: string;
  clienteTel: string;
  clienteEmail: string | null;
  clienteDoc: string | null;
  endereco: string | null;
  tipo: string;
  marca: string;
  modelo: string | null;
  serie: string | null;
  acessorios: string | null;
  estado: string | null;
  defeito: string;
  prioridade: "normal" | "alta" | "baixa";
  campoId: number | null;
  campoNome: string | null;
  bancadaId: number | null;
  bancadaNome: string | null;
  tecnico: string | null;
  previsao: string | null;
  obs: string | null;
  diagnostico: string | null;
  orcamento: number | null;
  saidaEm: string | null;
  saidaPor: string | null;
  saidaDoc: string | null;
  saidaValor: number | null;
  saidaPgto: string | null;
  saidaResultado: "reparado" | "semconserto" | null;
  saidaGarantia: number | null;
} & DadosRat;

/** Campos usados no RAT (Relatório de Atendimento Técnico). */
export type DadosRat = {
  chamado: string | null;
  empresaParceira: string | null;
  horaInicio: string | null;
  horaFim: string | null;
  clienteResponsavel: string | null;
  clienteCargo: string | null;
  servicoLab: number;
  servicoReparo: number;
  servicoUpgrade: number;
  patrimonio: string | null;
  etiquetaCliente: string | null;
  backupFeito: number;
  backupPerfil: string | null;
  entregaModelo: string | null;
  entregaPatrimonio: string | null;
  entregaSerie: string | null;
  entregaEtiqueta: string | null;
};

export type Historico = { id: number; em: string; status: StatusKey; nota: string | null; autor: string | null };

export type Mensagem = {
  id: number;
  em: string;
  texto: string;
  usuarioId: number;
  autor: string;
  papel: Papel;
};

const BASE = `
  SELECT
    o.id, o.criado_em AS criadoEm, o.atualizado_em AS atualizadoEm, o.status,
    o.cliente_nome AS clienteNome, o.cliente_tel AS clienteTel, o.cliente_email AS clienteEmail,
    o.cliente_doc AS clienteDoc, o.endereco,
    o.tipo, o.marca, o.modelo, o.serie, o.acessorios, o.estado, o.defeito,
    o.prioridade, o.campo_id AS campoId, uc.nome AS campoNome, o.bancada_id AS bancadaId, ub.nome AS bancadaNome,
    o.tecnico, o.previsao, o.obs, o.diagnostico, o.orcamento,
    o.saida_em AS saidaEm, o.saida_por AS saidaPor, o.saida_doc AS saidaDoc, o.saida_valor AS saidaValor,
    o.saida_pgto AS saidaPgto, o.saida_resultado AS saidaResultado, o.saida_garantia AS saidaGarantia,
    o.chamado, o.empresa_parceira AS empresaParceira, o.hora_inicio AS horaInicio, o.hora_fim AS horaFim,
    o.cliente_responsavel AS clienteResponsavel, o.cliente_cargo AS clienteCargo,
    o.servico_lab AS servicoLab, o.servico_reparo AS servicoReparo, o.servico_upgrade AS servicoUpgrade,
    o.patrimonio, o.etiqueta_cliente AS etiquetaCliente, o.backup_feito AS backupFeito, o.backup_perfil AS backupPerfil,
    o.entrega_modelo AS entregaModelo, o.entrega_patrimonio AS entregaPatrimonio,
    o.entrega_serie AS entregaSerie, o.entrega_etiqueta AS entregaEtiqueta
  FROM ordens o
  LEFT JOIN usuarios uc ON uc.id = o.campo_id
  LEFT JOIN usuarios ub ON ub.id = o.bancada_id
`;

/* ---------------- Regras de negócio ---------------- */

export const estaAberta = (o: Pick<Ordem, "status">) => o.status !== "entregue";

export const estaAtrasada = (o: Pick<Ordem, "status" | "previsao">) =>
  estaAberta(o) &&
  !["pronto", "semconserto"].includes(o.status) &&
  !!o.previsao &&
  o.previsao < hojeIso();

export const descEquip = (o: Pick<Ordem, "tipo" | "marca" | "modelo">) =>
  [o.tipo, o.marca, o.modelo].filter(Boolean).join(" · ");

/** Nome do técnico de bancada (ou o texto da versão antiga). */
export const nomeBancada = (o: Pick<Ordem, "bancadaNome" | "tecnico">) => o.bancadaNome ?? o.tecnico ?? null;

/* ---------------- Consultas ---------------- */

export function listarOrdens(): Ordem[] {
  return db.all<Ordem>(`${BASE} ORDER BY o.id DESC`);
}

export type Filtros = { q?: string; status?: string; tipo?: string; minhas?: boolean; usuarioId?: number };

export function buscarOrdens({ q, status = "abertas", tipo, minhas, usuarioId }: Filtros): Ordem[] {
  const where: string[] = [];
  const params: Record<string, string | number> = {};

  if (status === "abertas") where.push(`o.status <> 'entregue'`);
  else if (status === "atrasadas") {
    where.push(
      `o.status NOT IN ('entregue','pronto','semconserto') AND o.previsao IS NOT NULL AND o.previsao <> '' AND o.previsao < @hoje`
    );
    params.hoje = hojeIso();
  } else if (status === "sembancada") {
    where.push(`o.status <> 'entregue' AND o.bancada_id IS NULL`);
  } else if (status && status !== "todas") {
    where.push(`o.status = @status`);
    params.status = status;
  }

  if (tipo) {
    where.push(`o.tipo = @tipo`);
    params.tipo = tipo;
  }

  if (minhas && usuarioId) {
    where.push(`(o.campo_id = @uid OR o.bancada_id = @uid)`);
    params.uid = usuarioId;
  }

  if (q) {
    where.push(`(
      CAST(o.id AS TEXT) = @qnum OR
      o.chamado LIKE @q OR o.cliente_nome LIKE @q OR o.cliente_tel LIKE @q OR o.cliente_doc LIKE @q OR
      o.marca LIKE @q OR o.modelo LIKE @q OR o.serie LIKE @q OR
      uc.nome LIKE @q OR ub.nome LIKE @q
    )`);
    params.q = `%${q}%`;
    params.qnum = q.replace(/\D/g, "").replace(/^0+/, "") || "-1";
  }

  return db.all<Ordem>(`${BASE} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY o.id DESC`, params);
}

export function obterOrdem(id: number): Ordem | undefined {
  if (!Number.isInteger(id)) return undefined;
  return db.get<Ordem>(`${BASE} WHERE o.id = @id`, { id });
}

export function obterHistorico(id: number): Historico[] {
  return db.all<Historico>(
    `SELECT h.id, h.em, h.status, h.nota, u.nome AS autor
       FROM historico h LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE h.ordem_id = @id ORDER BY h.em DESC, h.id DESC`,
    { id }
  );
}

/* ---------------- Escritas ---------------- */

export type NovaOrdem = {
  clienteNome: string;
  clienteTel: string;
  clienteEmail?: string;
  clienteDoc?: string;
  endereco?: string;
  tipo: string;
  marca: string;
  modelo?: string;
  serie?: string;
  acessorios?: string;
  estado?: string;
  defeito: string;
  prioridade: string;
  campoId: number | null;
  bancadaId: number | null;
  previsao?: string;
  obs?: string;
  empresaParceira?: string;
  horaInicio?: string;
  horaFim?: string;
  clienteResponsavel?: string;
  clienteCargo?: string;
  servicoLab: number;
  servicoReparo: number;
  servicoUpgrade: number;
  patrimonio?: string;
  etiquetaCliente?: string;
  backupFeito: number;
  backupPerfil?: string;
};

const addHist = (ordemId: number, usuarioId: number | null, em: string, status: string, nota: string | null) =>
  db.run(
    `INSERT INTO historico (ordem_id, usuario_id, em, status, nota) VALUES (@ordemId, @usuarioId, @em, @status, @nota)`,
    { ordemId, usuarioId, em, status, nota }
  );

const statusAtual = (id: number) =>
  db.get<{ status: string }>(`SELECT status FROM ordens WHERE id = @id`, { id })?.status ?? "recebido";

export const criarOrdem = (o: NovaOrdem, usuarioId: number): { id: number; chamado: string } =>
  db.transacao(() => {
    const agora = new Date().toISOString();
    // número do chamado gerado aqui, dentro da transação: nunca se repete
    const chamado = proximoChamado(db.conexao, o.tipo, agora);
    const r = db.run(
      `INSERT INTO ordens (
        criado_em, atualizado_em, status, cliente_nome, cliente_tel, cliente_email, cliente_doc, endereco,
        tipo, marca, modelo, serie, acessorios, estado, defeito, prioridade, campo_id, bancada_id, previsao, obs,
        chamado, empresa_parceira, hora_inicio, hora_fim, cliente_responsavel, cliente_cargo,
        servico_lab, servico_reparo, servico_upgrade, patrimonio, etiqueta_cliente, backup_feito, backup_perfil
      ) VALUES (
        @agora, @agora, 'recebido', @clienteNome, @clienteTel, @clienteEmail, @clienteDoc, @endereco,
        @tipo, @marca, @modelo, @serie, @acessorios, @estado, @defeito, @prioridade, @campoId, @bancadaId, @previsao, @obs,
        @chamado, @empresaParceira, @horaInicio, @horaFim, @clienteResponsavel, @clienteCargo,
        @servicoLab, @servicoReparo, @servicoUpgrade, @patrimonio, @etiquetaCliente, @backupFeito, @backupPerfil
      )`,
      { agora, ...o, chamado }
    );
    const id = r.lastInsertRowid;
    addHist(id, usuarioId, agora, "recebido", `Chamado ${chamado} aberto. Equipamento retirado no cliente e recebido na loja.`);
    return { id, chamado };
  });

export const atualizarAndamento = (id: number, status: StatusKey, nota: string | null, usuarioId: number) =>
  db.transacao(() => {
    const agora = new Date().toISOString();
    db.run(`UPDATE ordens SET status = @status, atualizado_em = @agora WHERE id = @id`, { status, agora, id });
    addHist(id, usuarioId, agora, status, nota);
  });

export function salvarDiagnostico(
  id: number,
  d: { diagnostico: string | null; orcamento: number | null; previsao: string | null }
) {
  db.run(
    `UPDATE ordens SET diagnostico = @diagnostico, orcamento = @orcamento,
       previsao = @previsao, atualizado_em = @agora WHERE id = @id`,
    { ...d, id, agora: new Date().toISOString() }
  );
}

export const atribuirTecnicos = (
  id: number,
  campo: { id: number | null; nome: string | null },
  bancada: { id: number | null; nome: string | null },
  usuarioId: number
) =>
  db.transacao(() => {
    const agora = new Date().toISOString();
    db.run(`UPDATE ordens SET campo_id = @c, bancada_id = @b, atualizado_em = @agora WHERE id = @id`, {
      c: campo.id,
      b: bancada.id,
      agora,
      id,
    });
    addHist(
      id,
      usuarioId,
      agora,
      statusAtual(id),
      `Responsáveis: campo — ${campo.nome ?? "ninguém"}; bancada — ${bancada.nome ?? "ninguém"}`
    );
  });

export const assumirOrdem = (id: number, usuarioId: number, nome: string) =>
  db.transacao(() => {
    const agora = new Date().toISOString();
    db.run(`UPDATE ordens SET bancada_id = @u, atualizado_em = @agora WHERE id = @id`, { u: usuarioId, agora, id });
    addHist(id, usuarioId, agora, statusAtual(id), `${nome} assumiu o conserto.`);
  });

export const registrarSaida = (
  id: number,
  s: {
    por: string;
    doc: string | null;
    valor: number | null;
    pgto: string;
    resultado: "reparado" | "semconserto";
    garantia: number | null;
    entregaModelo: string | null;
    entregaPatrimonio: string | null;
    entregaSerie: string | null;
    entregaEtiqueta: string | null;
  },
  usuarioId: number
) =>
  db.transacao(() => {
    const agora = new Date().toISOString();
    db.run(
      `UPDATE ordens SET status = 'entregue', atualizado_em = @agora, saida_em = @agora,
         saida_por = @por, saida_doc = @doc, saida_valor = @valor, saida_pgto = @pgto,
         saida_resultado = @resultado, saida_garantia = @garantia,
         entrega_modelo = @entregaModelo, entrega_patrimonio = @entregaPatrimonio,
         entrega_serie = @entregaSerie, entrega_etiqueta = @entregaEtiqueta
       WHERE id = @id`,
      { ...s, id, agora }
    );
    addHist(
      id,
      usuarioId,
      agora,
      "entregue",
      `Devolvido ao cliente — recebido por ${s.por}${s.resultado === "semconserto" ? " (sem conserto)" : ""}`
    );
  });

/** Atualiza os dados do atendimento usados no RAT (técnico de campo / admin). */
export function salvarDadosRat(id: number, d: Omit<DadosRat, "chamado" | "entregaModelo" | "entregaPatrimonio" | "entregaSerie" | "entregaEtiqueta"> &
  Partial<Pick<DadosRat, "entregaModelo" | "entregaPatrimonio" | "entregaSerie" | "entregaEtiqueta">>) {
  const comEntrega = d.entregaModelo !== undefined;
  db.run(
    `UPDATE ordens SET empresa_parceira = @empresaParceira, hora_inicio = @horaInicio,
       hora_fim = @horaFim, cliente_responsavel = @clienteResponsavel, cliente_cargo = @clienteCargo,
       servico_lab = @servicoLab, servico_reparo = @servicoReparo, servico_upgrade = @servicoUpgrade,
       patrimonio = @patrimonio, etiqueta_cliente = @etiquetaCliente, backup_feito = @backupFeito,
       backup_perfil = @backupPerfil, atualizado_em = @agora
       ${comEntrega ? `, entrega_modelo = @entregaModelo, entrega_patrimonio = @entregaPatrimonio,
       entrega_serie = @entregaSerie, entrega_etiqueta = @entregaEtiqueta` : ""}
     WHERE id = @id`,
    {
      ...(comEntrega ? d : (({ entregaModelo: _a, entregaPatrimonio: _b, entregaSerie: _c, entregaEtiqueta: _d, ...r }) => r)(d)),
      id,
      agora: new Date().toISOString(),
    }
  );
}

export function excluirOrdem(id: number) {
  db.transacao(() => {
    for (const t of ["historico", "mensagens", "leituras"]) db.run(`DELETE FROM ${t} WHERE ordem_id = @id`, { id });
    db.run(`DELETE FROM ordens WHERE id = @id`, { id });
  });
}

/* ---------------- Conversa entre campo e bancada ---------------- */

export function listarMensagens(ordemId: number): Mensagem[] {
  return db.all<Mensagem>(
    `SELECT m.id, m.em, m.texto, m.usuario_id AS usuarioId, u.nome AS autor, u.papel
       FROM mensagens m JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.ordem_id = @ordemId ORDER BY m.em, m.id`,
    { ordemId }
  );
}

export function enviarMensagem(ordemId: number, usuarioId: number, texto: string) {
  const agora = new Date().toISOString();
  db.transacao(() => {
    db.run(`INSERT INTO mensagens (ordem_id, usuario_id, em, texto) VALUES (@ordemId, @usuarioId, @agora, @texto)`, {
      ordemId,
      usuarioId,
      agora,
      texto,
    });
    marcarLida(ordemId, usuarioId, agora);
  });
}

export function marcarLida(ordemId: number, usuarioId: number, em = new Date().toISOString()) {
  db.run(
    `INSERT INTO leituras (usuario_id, ordem_id, lido_em) VALUES (@usuarioId, @ordemId, @em)
     ON CONFLICT (usuario_id, ordem_id) DO UPDATE SET lido_em = excluded.lido_em`,
    { usuarioId, ordemId, em }
  );
}

/**
 * Mensagens de outras pessoas que o usuário ainda não viu.
 * Técnicos veem as das OS em que são responsáveis (a bancada também as OS sem responsável);
 * o administrador vê de todas.
 */
const NAO_LIDAS = `
  FROM mensagens m
  JOIN ordens o ON o.id = m.ordem_id
  JOIN usuarios u ON u.id = m.usuario_id
  LEFT JOIN leituras l ON l.ordem_id = m.ordem_id AND l.usuario_id = @uid
  WHERE m.usuario_id <> @uid
    AND (l.lido_em IS NULL OR m.em > l.lido_em)
    AND (
      @papel = 'admin' OR o.campo_id = @uid OR o.bancada_id = @uid
      -- OS ainda sem técnico de bancada: todos da bancada acompanham
      OR (@papel = 'bancada' AND o.bancada_id IS NULL AND o.status <> 'entregue')
    )
`;

export function naoLidasPorOrdem(usuarioId: number, papel: Papel): Map<number, number> {
  const rows = db.all<{ ordemId: number; n: number }>(
    `SELECT m.ordem_id AS ordemId, COUNT(*) AS n ${NAO_LIDAS} GROUP BY m.ordem_id`,
    { uid: usuarioId, papel }
  );
  return new Map(rows.map((r) => [r.ordemId, r.n]));
}

export function ultimasNaoLidas(usuarioId: number, papel: Papel, limite = 6) {
  return db.all<{ ordemId: number; em: string; texto: string; autor: string; papel: Papel }>(
    `SELECT m.ordem_id AS ordemId, m.em, m.texto, u.nome AS autor, u.papel ${NAO_LIDAS} ORDER BY m.em DESC LIMIT @lim`,
    { uid: usuarioId, papel, lim: limite }
  );
}
