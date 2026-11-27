import type { DatabaseSync } from "node:sqlite";
import { siglaDoTipo } from "./constantes";

/** Ano (fuso de São Paulo) de uma data ISO. */
const anoDe = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(new Date(iso));

/**
 * Próximo número de chamado para o tipo de equipamento, ex.: NTB-2026-0008.
 * Deve ser chamado dentro da transação que insere a OS, para não repetir número.
 */
export function proximoChamado(conexao: DatabaseSync, tipo: string, dataIso: string): string {
  const prefixo = `${siglaDoTipo(tipo)}-${anoDe(dataIso)}-`;
  const row = conexao
    .prepare(
      `SELECT MAX(CAST(SUBSTR(chamado, ?) AS INTEGER)) AS ultimo
         FROM ordens WHERE chamado LIKE ? ESCAPE '\\'`
    )
    .get(prefixo.length + 1, prefixo.replace(/[%_\\]/g, "\\$&") + "%") as { ultimo: number | null } | undefined;
  const seq = (row?.ultimo ?? 0) + 1;
  return prefixo + String(seq).padStart(4, "0");
}

/** Dá número de chamado às OS que ainda não têm (bancos antigos e dados de exemplo). */
export function preencherChamadosFaltantes(conexao: DatabaseSync) {
  const sem = conexao
    .prepare(`SELECT id, tipo, criado_em AS criadoEm FROM ordens WHERE chamado IS NULL OR TRIM(chamado) = '' ORDER BY criado_em, id`)
    .all() as { id: number; tipo: string; criadoEm: string }[];
  if (!sem.length) return;
  const upd = conexao.prepare(`UPDATE ordens SET chamado = ? WHERE id = ?`);
  conexao.exec("BEGIN");
  try {
    for (const o of sem) upd.run(proximoChamado(conexao, o.tipo, o.criadoEm), o.id);
    conexao.exec("COMMIT");
  } catch (e) {
    conexao.exec("ROLLBACK");
    throw e;
  }
}
