import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { preencherChamadosFaltantes } from "./chamado";
import fs from "node:fs";
import path from "node:path";

/**
 * Conexão única com o banco SQLite.
 * Usa o SQLite embutido no próprio Node.js (módulo `node:sqlite`, Node 22.13+),
 * então não precisa instalar nem compilar nenhum driver.
 * O arquivo fica em ./data/tecmanutencao.db e é criado automaticamente.
 */
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "tecmanutencao.db");

const SCHEMA_FILE = path.join(process.cwd(), "lib", "schema.sql");

/** Colunas criadas depois da primeira versão: adiciona em bancos antigos sem perder dados. */
const MIGRACOES: [tabela: string, coluna: string, definicao: string][] = [
  ["ordens", "endereco", "TEXT"],
  ["ordens", "campo_id", "INTEGER REFERENCES usuarios(id)"],
  ["ordens", "bancada_id", "INTEGER REFERENCES usuarios(id)"],
  ["historico", "usuario_id", "INTEGER REFERENCES usuarios(id)"],
  ["ordens", "chamado", "TEXT"],
  ["ordens", "empresa_parceira", "TEXT"],
  ["ordens", "hora_inicio", "TEXT"],
  ["ordens", "hora_fim", "TEXT"],
  ["ordens", "cliente_responsavel", "TEXT"],
  ["ordens", "cliente_cargo", "TEXT"],
  ["ordens", "servico_lab", "INTEGER NOT NULL DEFAULT 1"],
  ["ordens", "servico_reparo", "INTEGER NOT NULL DEFAULT 1"],
  ["ordens", "servico_upgrade", "INTEGER NOT NULL DEFAULT 0"],
  ["ordens", "patrimonio", "TEXT"],
  ["ordens", "etiqueta_cliente", "TEXT"],
  ["ordens", "backup_feito", "INTEGER NOT NULL DEFAULT 0"],
  ["ordens", "backup_perfil", "TEXT"],
  ["ordens", "entrega_modelo", "TEXT"],
  ["ordens", "entrega_patrimonio", "TEXT"],
  ["ordens", "entrega_serie", "TEXT"],
  ["ordens", "entrega_etiqueta", "TEXT"],
];

function migrar(db: DatabaseSync) {
  for (const [tabela, coluna, def] of MIGRACOES) {
    const cols = db.prepare(`PRAGMA table_info(${tabela})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === coluna)) db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${def}`);
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ordens_campo   ON ordens(campo_id);
    CREATE INDEX IF NOT EXISTS idx_ordens_bancada ON ordens(bancada_id);
  `);
  db.prepare(`DELETE FROM sessoes WHERE expira_em < ?`).run(new Date().toISOString());
  preencherChamadosFaltantes(db);
}

function abrir() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new DatabaseSync(DB_FILE);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(fs.readFileSync(SCHEMA_FILE, "utf8"));
  migrar(db);
  return db;
}

// Evita abrir várias conexões durante o hot-reload do `next dev`
const g = globalThis as unknown as { __db?: DatabaseSync };
const conexao = g.__db ?? abrir();
if (process.env.NODE_ENV !== "production") g.__db = conexao;

export type Params = Record<string, unknown>;

/** O node:sqlite não aceita `undefined`: converte para NULL. */
function limpar(p: Params = {}): Record<string, SQLInputValue> {
  const r: Record<string, SQLInputValue> = {};
  for (const [k, v] of Object.entries(p)) r[k] = (v === undefined ? null : v) as SQLInputValue;
  return r;
}

/** Linhas do node:sqlite vêm sem protótipo; copiamos para objetos normais. */
const plano = <T>(row: unknown) => ({ ...(row as object) }) as T;

export const db = {
  /** Conexão direta (para funções que precisam do node:sqlite puro). */
  conexao,
  run(sql: string, params?: Params) {
    const r = conexao.prepare(sql).run(limpar(params));
    return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
  },
  get<T>(sql: string, params?: Params): T | undefined {
    const row = conexao.prepare(sql).get(limpar(params));
    return row ? plano<T>(row) : undefined;
  },
  all<T>(sql: string, params?: Params): T[] {
    return conexao.prepare(sql).all(limpar(params)).map((r) => plano<T>(r));
  },
  /** Executa várias operações como uma única transação. */
  transacao<T>(fn: () => T): T {
    conexao.exec("BEGIN");
    try {
      const r = fn();
      conexao.exec("COMMIT");
      return r;
    } catch (e) {
      conexao.exec("ROLLBACK");
      throw e;
    }
  },
};
