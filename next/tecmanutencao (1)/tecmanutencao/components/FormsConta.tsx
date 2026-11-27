"use client";

import { useActionState } from "react";
import {
  acaoCriarUsuario,
  acaoEditarUsuario,
  acaoLogin,
  acaoMinhaSenha,
  acaoPrimeiroAcesso,
  type Resultado,
} from "@/app/actions";
import { PAPEIS, type Papel } from "@/lib/constantes";

export function Mensagem({ r }: { r: Resultado }) {
  if (r.erro) return <div className="msg erro">{r.erro}</div>;
  if (r.ok) return <div className="msg ok">{r.ok}</div>;
  return null;
}

/* ---------- Login ---------- */
export function FormLogin() {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoLogin, {});
  return (
    <form action={acao} className="card login" key={r.t}>
      <h1>Entrar</h1>
      <p className="sub">Acesso restrito à equipe técnica.</p>
      <div className="f">
        <label>Usuário</label>
        <input name="usuario" autoComplete="username" required autoFocus defaultValue={r.valores?.usuario} />
      </div>
      <div className="f">
        <label>Senha</label>
        <input name="senha" type="password" autoComplete="current-password" required />
      </div>
      <Mensagem r={r} />
      <button className="btn" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}

/* ---------- Primeiro acesso (cria o administrador) ---------- */
export function FormPrimeiroAcesso() {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoPrimeiroAcesso, {});
  const v = (k: string) => r.valores?.[k];
  return (
    <form action={acao} className="card login" key={r.t}>
      <h1>Primeiro acesso</h1>
      <p className="sub">Nenhum usuário cadastrado ainda. Crie o administrador do sistema.</p>
      <div className="f"><label>Seu nome</label><input name="nome" required defaultValue={v("nome")} /></div>
      <div className="f"><label>Usuário (login)</label><input name="usuario" required autoComplete="username" defaultValue={v("usuario")} placeholder="ex.: admin" /></div>
      <div className="f"><label>Senha</label><input name="senha" type="password" required autoComplete="new-password" minLength={6} /></div>
      <div className="f"><label>Repita a senha</label><input name="senha2" type="password" required autoComplete="new-password" minLength={6} /></div>
      <Mensagem r={r} />
      <button className="btn" disabled={enviando}>{enviando ? "Criando…" : "Criar administrador e entrar"}</button>
    </form>
  );
}

/* ---------- Minha senha ---------- */
export function FormMinhaSenha() {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoMinhaSenha, {});
  return (
    <form action={acao} className="card" key={r.t} style={{ maxWidth: 480 }}>
      <h2>Trocar minha senha</h2>
      <div className="fg" style={{ gridTemplateColumns: "1fr" }}>
        <div className="f"><label>Senha atual</label><input name="senhaAtual" type="password" required autoComplete="current-password" /></div>
        <div className="f"><label>Nova senha</label><input name="senhaNova" type="password" required minLength={6} autoComplete="new-password" /></div>
        <div className="f"><label>Repita a nova senha</label><input name="senhaNova2" type="password" required minLength={6} autoComplete="new-password" /></div>
      </div>
      <Mensagem r={r} />
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn" disabled={enviando}>{enviando ? "Salvando…" : "Alterar senha"}</button>
      </div>
    </form>
  );
}

/* ---------- Usuários (admin) ---------- */
function CamposUsuario({ v, papel }: { v: (k: string) => string | undefined; papel?: Papel }) {
  return (
    <>
      <div className="f"><label className="req">Nome</label><input name="nome" required defaultValue={v("nome")} /></div>
      <div className="f">
        <label className="req">Usuário (login)</label>
        <input name="usuario" required defaultValue={v("usuario")} placeholder="ex.: joao.silva" autoComplete="off" />
      </div>
      <div className="f">
        <label className="req">Perfil</label>
        <select name="papel" defaultValue={v("papel") ?? papel ?? "campo"}>
          {(Object.keys(PAPEIS) as Papel[]).map((p) => (
            <option key={p} value={p}>{PAPEIS[p].label}</option>
          ))}
        </select>
      </div>
    </>
  );
}

export function FormNovoUsuario() {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoCriarUsuario, {});
  const v = (k: string) => (r.erro ? r.valores?.[k] : undefined);
  return (
    <form action={acao} className="card" key={r.t}>
      <h2>Cadastrar usuário</h2>
      <div className="fg">
        <CamposUsuario v={v} />
        <div className="f">
          <label className="req">Senha inicial</label>
          <input name="senha" type="password" required minLength={6} autoComplete="new-password" />
        </div>
      </div>
      <Mensagem r={r} />
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn" disabled={enviando}>{enviando ? "Cadastrando…" : "Cadastrar"}</button>
      </div>
    </form>
  );
}

export function FormEditarUsuario(props: { id: number; nome: string; usuario: string; papel: Papel; ativo: boolean }) {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoEditarUsuario, {});
  const v = (k: string) => r.valores?.[k] ?? (props as unknown as Record<string, string>)[k];
  return (
    <form action={acao} key={r.t} style={{ padding: "12px 0 4px" }}>
      <input type="hidden" name="id" value={props.id} />
      <div className="fg">
        <CamposUsuario v={v} papel={props.papel} />
        <div className="f">
          <label>Nova senha (opcional)</label>
          <input name="novaSenha" type="password" minLength={6} autoComplete="new-password" placeholder="deixe em branco para manter" />
        </div>
        <div className="f" style={{ display: "flex", alignItems: "flex-end" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", margin: 0, fontSize: 16, fontWeight: 500 }}>
            <input type="checkbox" name="ativo" defaultChecked={r.valores ? r.valores.ativo === "on" : props.ativo} style={{ width: "auto" }} />
            Usuário ativo
          </label>
        </div>
      </div>
      <Mensagem r={r} />
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn sm" disabled={enviando}>{enviando ? "Salvando…" : "Salvar alterações"}</button>
      </div>
    </form>
  );
}
