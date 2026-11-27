import { redirect } from "next/navigation";
import { FormLogin, FormPrimeiroAcesso } from "@/components/FormsConta";
import { usuarioAtual } from "@/lib/auth";
import { contarUsuarios } from "@/lib/usuarios";

export const dynamic = "force-dynamic";

export default async function Login() {
  if (await usuarioAtual()) redirect("/");
  const primeiroAcesso = contarUsuarios() === 0;
  return (
    <div className="login-wrap">
      {primeiroAcesso ? <FormPrimeiroAcesso /> : <FormLogin />}
    </div>
  );
}
