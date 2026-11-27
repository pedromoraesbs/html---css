"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { acaoLogout } from "@/app/actions";

type Props = {
  nomeSistema: string;
  usuario: { nome: string; papel: string } | null;
  podeEntrada: boolean;
  podeUsuarios: boolean;
};

/**
 * Cabeçalho do sistema. No computador mostra o menu em linha;
 * no celular e tablet em pé vira um botão ☰ que abre o menu.
 */
export default function Cabecalho({ nomeSistema, usuario, podeEntrada, podeUsuarios }: Props) {
  const p = usePathname();
  const [aberto, setAberto] = useState(false);

  // fecha o menu ao trocar de página
  useEffect(() => setAberto(false), [p]);

  // fecha com Esc
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto]);

  const links = [
    { href: "/", label: "Painel", ativo: p === "/" },
    { href: "/ordens", label: "Ordens de serviço", ativo: p.startsWith("/ordens") && p !== "/ordens/nova" },
    ...(podeEntrada ? [{ href: "/ordens/nova", label: "+ Nova entrada", ativo: p === "/ordens/nova" }] : []),
    ...(podeUsuarios ? [{ href: "/usuarios", label: "Usuários", ativo: p.startsWith("/usuarios") }] : []),
  ];

  return (
    <header className={`topo ${aberto ? "aberto" : ""}`}>
      <Link href="/" className="logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
          <path d="M14.5 7.5l-3 3M9.5 8.5l1 1" />
        </svg>
        <span>{nomeSistema}</span>
      </Link>

      {usuario && (
        <>
          <button
            type="button"
            className="menu-btn"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={aberto}
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? "✕" : "☰"}
          </button>

          <div className="menu">
            <nav>
              {links.map((l) => (
                <Link key={l.href} href={l.href} aria-current={l.ativo ? "page" : undefined}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="user">
              <Link href="/conta" className="user-chip" title="Minha conta" aria-current={p === "/conta" ? "page" : undefined}>
                <span className="avatar">{usuario.nome.trim().charAt(0).toUpperCase()}</span>
                <span className="user-txt">
                  <b>{usuario.nome}</b>
                  <small>{usuario.papel}</small>
                </span>
              </Link>
              <form action={acaoLogout}>
                <button className="sair">Sair</button>
              </form>
            </div>
          </div>
          {aberto && <div className="menu-fundo" onClick={() => setAberto(false)} aria-hidden />}
        </>
      )}
    </header>
  );
}
