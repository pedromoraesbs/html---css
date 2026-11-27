import crypto from "node:crypto";
import { db } from "./db";
import type { Papel } from "./constantes";

export type Usuario = {
  id: number;
  nome: string;
  usuario: string;
  papel: Papel;
  ativo: number;
  criadoEm: string;
};

const COLS = `id, nome, usuario, papel, ativo, criado_em AS criadoEm`;

/* ---------------- Senhas (scrypt, embutido no Node) ---------------- */

export function hashSenha(senha: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(senha, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function conferirSenha(senha: string, armazenado: string): boolean {
  const [alg, saltHex, hashHex] = armazenado.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = crypto.scryptSync(senha, Buffer.from(saltHex, "hex"), esperado.length);
  return crypto.timingSafeEqual(calculado, esperado);
}

export const senhaFraca = (s: string) => (s.length < 6 ? "A senha precisa ter pelo menos 6 caracteres." : null);

/* ---------------- Consultas ---------------- */

export function contarUsuarios(): number {
  return db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM usuarios`)?.n ?? 0;
}

export function listarUsuarios(): Usuario[] {
  return db.all<Usuario>(`SELECT ${COLS} FROM usuarios ORDER BY ativo DESC, papel, nome`);
}

export function listarAtivosPorPapel(papel: Papel): Usuario[] {
  return db.all<Usuario>(`SELECT ${COLS} FROM usuarios WHERE ativo = 1 AND papel = @papel ORDER BY nome`, { papel });
}

export function obterUsuario(id: number): Usuario | undefined {
  return db.get<Usuario>(`SELECT ${COLS} FROM usuarios WHERE id = @id`, { id });
}

export function autenticar(login: string, senha: string): Usuario | null {
  const u = db.get<Usuario & { senhaHash: string }>(
    `SELECT ${COLS}, senha_hash AS senhaHash FROM usuarios WHERE usuario = @login`,
    { login }
  );
  if (!u || !u.ativo || !conferirSenha(senha, u.senhaHash)) return null;
  const { senhaHash: _, ...usuario } = u;
  return usuario;
}

export function loginEmUso(login: string, excetoId?: number): boolean {
  return !!db.get(`SELECT 1 AS x FROM usuarios WHERE usuario = @login AND id <> @id`, {
    login,
    id: excetoId ?? -1,
  });
}

export function adminsAtivos(): number {
  return db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM usuarios WHERE papel = 'admin' AND ativo = 1`)?.n ?? 0;
}

/* ---------------- Escritas ---------------- */

export function criarUsuario(d: { nome: string; usuario: string; senha: string; papel: Papel }): number {
  return db.run(
    `INSERT INTO usuarios (nome, usuario, senha_hash, papel, ativo, criado_em)
     VALUES (@nome, @usuario, @hash, @papel, 1, @agora)`,
    { nome: d.nome, usuario: d.usuario, hash: hashSenha(d.senha), papel: d.papel, agora: new Date().toISOString() }
  ).lastInsertRowid;
}

export function atualizarUsuario(id: number, d: { nome: string; usuario: string; papel: Papel; ativo: boolean }) {
  db.transacao(() => {
    db.run(`UPDATE usuarios SET nome = @nome, usuario = @usuario, papel = @papel, ativo = @ativo WHERE id = @id`, {
      ...d,
      ativo: d.ativo ? 1 : 0,
      id,
    });
    // usuário desativado perde as sessões abertas
    if (!d.ativo) db.run(`DELETE FROM sessoes WHERE usuario_id = @id`, { id });
  });
}

export function trocarSenha(id: number, senha: string, manterSessao?: string) {
  db.transacao(() => {
    db.run(`UPDATE usuarios SET senha_hash = @hash WHERE id = @id`, { hash: hashSenha(senha), id });
    // encerra as outras sessões desse usuário
    db.run(`DELETE FROM sessoes WHERE usuario_id = @id AND token_hash <> @manter`, { id, manter: manterSessao ?? "" });
  });
}
