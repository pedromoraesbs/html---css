"use client";

import { useActionState, useEffect, useState } from "react";
import { acaoMarcarPronto, type Resultado } from "@/app/actions";

/**
 * Botão rápido para o técnico de bancada: “✅ Pronto”.
 * 1º toque pede confirmação (some sozinho em 4 s); 2º toque confirma.
 */
export default function BotaoPronto({
  id,
  origem,
  compacto = false,
}: {
  id: number;
  origem: "os" | "painel";
  compacto?: boolean;
}) {
  const [r, acao, enviando] = useActionState<Resultado, FormData>(acaoMarcarPronto, {});
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    if (!confirmar) return;
    const t = setTimeout(() => setConfirmar(false), 4000);
    return () => clearTimeout(t);
  }, [confirmar]);

  return (
    <form
      action={acao}
      className={`pronto ${compacto ? "compacto" : ""}`}
      onSubmit={(e) => {
        if (!confirmar) {
          e.preventDefault();
          setConfirmar(true);
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="origem" value={origem} />
      <button
        className={`btn ok ${compacto ? "sm" : ""} ${confirmar ? "confirmando" : ""}`}
        disabled={enviando}
        title="Marcar como pronto para retirada e avisar o técnico de campo"
      >
        {enviando ? "Salvando…" : confirmar ? "Toque de novo para confirmar" : "✅ Pronto"}
      </button>
      {r.erro && <span className="pronto-msg erro">{r.erro}</span>}
      {r.ok && <span className="pronto-msg ok">{r.ok}</span>}
    </form>
  );
}
