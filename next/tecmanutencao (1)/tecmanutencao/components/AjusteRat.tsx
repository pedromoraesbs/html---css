"use client";

import { useEffect } from "react";

/**
 * Na tela, aumenta ou diminui a folha A5 do RAT para caber na largura
 * disponível (celular, tablet ou computador). Não afeta a impressão.
 */
export default function AjusteRat() {
  useEffect(() => {
    const folha = document.querySelector<HTMLElement>(".rat");
    const area = document.querySelector<HTMLElement>(".rat-pagina");
    if (!folha || !area) return;
    const LARGURA_A5 = (148 / 25.4) * 96; // 148 mm em px CSS
    const ajustar = () => {
      const z = Math.min(1.35, (area.clientWidth - 2) / LARGURA_A5);
      folha.style.setProperty("--rat-zoom", z.toFixed(3));
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(area);
    return () => ro.disconnect();
  }, []);
  return null;
}
