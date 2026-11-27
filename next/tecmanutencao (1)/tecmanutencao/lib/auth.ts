import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import type { Papel } from "./constantes";
import type { Usuario } from "./usuarios";

/**
 * Sessões guardadas no banco. O navegador recebe só um token aleatório
 * (cookie httpOnly); no banco fica o hash SHA-256 desse token.
 */
export const COOKIE_SESSAO = "tm_sessao";
const DURACAO_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

const sha256 = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

export async function iniciarSessao(usuarioId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const agora = Date.now();
  db.run(
    `INSERT INTO sessoes (token_hash, usuario_id, criado_em, expira_em) VALUES (@h, @u, @c, @e)`,
    { h: sha256(token), u: usuarioId, c: new Date(agora).toISOString(), e: new Date(agora + DURACAO_MS).toISOString() }
  );
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    // Defina COOKIE_SECURE=true quando o sistema estiver atrás de HTTPS
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: DURACAO_MS / 1000,
  });
}

export async function encerrarSessao() {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (token) db.run(`DELETE FROM sessoes WHERE token_hash = @h`, { h: sha256(token) });
  jar.delete(COOKIE_SESSAO);
}

/** Hash do token da sessão atual (para manter a sessão ao trocar a senha). */
export async function tokenAtualHash(): Promise<string | undefined> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  return token ? sha256(token) : undefined;
}

/** Usuário logado (ou null). Memorizado durante a renderização da página. */
export const usuarioAtual = cache(async (): Promise<Usuario | null> => {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  const u = db.get<Usuario>(
    `SELECT u.id, u.nome, u.usuario, u.papel, u.ativo, u.criado_em AS criadoEm
       FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
      WHERE s.token_hash = @h AND s.expira_em > @agora AND u.ativo = 1`,
    { h: sha256(token), agora: new Date().toISOString() }
  );
  return u ?? null;
});

/** Para páginas: manda para o login se não houver sessão, ou para o painel se o perfil não tiver acesso. */
export async function exigirUsuario(...papeis: Papel[]): Promise<Usuario> {
  const u = await usuarioAtual();
  if (!u) redirect("/login");
  if (papeis.length && !papeis.includes(u.papel)) redirect("/?sem-permissao=1");
  return u;
}
