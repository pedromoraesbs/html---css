import { NextResponse, type NextRequest } from "next/server";

/**
 * Barreira rápida: quem não tem o cookie de sessão vai para /login.
 * A validação de verdade (sessão existe, não expirou, usuário ativo, perfil)
 * acontece no servidor, em lib/auth.ts.
 */
export function proxy(req: NextRequest) {
  const temSessao = req.cookies.has("tm_sessao");
  if (!temSessao && !req.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
