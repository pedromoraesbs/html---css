import FormNovaOrdem from "@/components/FormNovaOrdem";
import { exigirUsuario } from "@/lib/auth";
import { listarAtivosPorPapel } from "@/lib/usuarios";

export const dynamic = "force-dynamic";

export default async function NovaOrdem() {
  const u = await exigirUsuario("admin", "campo");
  const opcoes = (p: "campo" | "bancada") => listarAtivosPorPapel(p).map(({ id, nome }) => ({ id, nome }));
  return (
    <section>
      <h1>Registrar entrada de equipamento</h1>
      <p className="sub">
        Equipamento retirado na visita técnica. {u.papel === "campo" && "Você ficará como técnico de campo desta OS. "}
        Campos com * são obrigatórios.
      </p>
      <FormNovaOrdem campos={u.papel === "admin" ? opcoes("campo") : null} bancadas={opcoes("bancada")} />
    </section>
  );
}
