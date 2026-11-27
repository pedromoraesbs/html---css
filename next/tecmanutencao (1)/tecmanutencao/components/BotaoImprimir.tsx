"use client";

export default function BotaoImprimir() {
  return (
    <button type="button" className="btn" onClick={() => window.print()}>
      🖨 Imprimir
    </button>
  );
}
