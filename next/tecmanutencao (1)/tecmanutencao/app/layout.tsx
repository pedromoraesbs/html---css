import type { Metadata, Viewport } from "next";
import Cabecalho from "@/components/Cabecalho";
import { usuarioAtual } from "@/lib/auth";
import { PAPEIS } from "@/lib/constantes";
import { pode } from "@/lib/permissoes";
import { EMPRESA } from "@/lib/empresa";
import "./globals.css";

export const metadata: Metadata = {
  title: `${EMPRESA.sistema} — Gestão de Equipamentos`,
  description: "Controle interno de equipamentos eletrônicos em manutenção",
  appleWebApp: { capable: true, title: EMPRESA.sistema, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const u = await usuarioAtual();
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Open+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Cabecalho
          nomeSistema={EMPRESA.sistema}
          usuario={u ? { nome: u.nome, papel: PAPEIS[u.papel].label } : null}
          podeEntrada={!!u && pode(u.papel, "registrarEntrada")}
          podeUsuarios={!!u && pode(u.papel, "usuarios")}
        />
        <main>{children}</main>
      </body>
    </html>
  );
}
