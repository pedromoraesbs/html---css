export const osNum = (n: number) => "#" + String(n).padStart(4, "0");

export const brl = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TZ = "America/Sao_Paulo";

export const data = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ }) : "—";

export const dataHora = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        timeZone: TZ,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/** "2026-11-20" -> "20/11/2026" */
export const dataIso = (s: string | null | undefined) => (s ? s.split("-").reverse().join("/") : "—");

/** Data de hoje no formato yyyy-mm-dd (fuso de São Paulo) */
export const hojeIso = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

/** Converte "1.250,50" ou "1250.5" em número. Retorna null se vazio, NaN se inválido. */
export function parseValor(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const limpo = s.replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(limpo)) return NaN;
  const norm = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(norm);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export const diasDesde = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
