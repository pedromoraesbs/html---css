export type StatusKey =
  | "recebido"
  | "diagnostico"
  | "aprovacao"
  | "peca"
  | "reparo"
  | "pronto"
  | "semconserto"
  | "entregue";

export const STATUS: { key: StatusKey; label: string; cor: string; fundo: string }[] = [
  { key: "recebido", label: "Recebido", cor: "#475569", fundo: "#f1f5f9" },
  { key: "diagnostico", label: "Em diagnóstico", cor: "#7c3aed", fundo: "#f3e8ff" },
  { key: "aprovacao", label: "Aguardando aprovação", cor: "#b45309", fundo: "#fef3c7" },
  { key: "peca", label: "Aguardando peça", cor: "#c2410c", fundo: "#ffedd5" },
  { key: "reparo", label: "Em reparo", cor: "#1d4ed8", fundo: "#dbeafe" },
  { key: "pronto", label: "Pronto p/ retirada", cor: "#15803d", fundo: "#dcfce7" },
  { key: "semconserto", label: "Sem conserto", cor: "#b91c1c", fundo: "#fee2e2" },
  { key: "entregue", label: "Entregue", cor: "#334155", fundo: "#e2e8f0" },
];

export const STATUS_MAP = Object.fromEntries(STATUS.map((s) => [s.key, s])) as Record<
  StatusKey,
  (typeof STATUS)[number]
>;

export const TIPOS = [
  "Computador",
  "Notebook",
  "Impressora",
  "Monitor",
  "Tablet",
  "Celular",
  "Nobreak",
  "Servidor",
  "Periférico",
  "Outro",
] as const;

export const TIPO_CORES = [
  "#1d4ed8", "#7c3aed", "#0891b2", "#15803d", "#c2410c",
  "#be185d", "#b45309", "#475569", "#0d9488", "#94a3b8",
];

export const PRIORIDADES = [
  { key: "normal", label: "Normal" },
  { key: "alta", label: "Alta / Urgente" },
  { key: "baixa", label: "Baixa" },
] as const;

export const PAGAMENTOS = [
  "Pix",
  "Dinheiro",
  "Cartão de débito",
  "Cartão de crédito",
  "Boleto / Faturado",
  "Garantia (sem custo)",
];

export function statusValido(s: string): s is StatusKey {
  return STATUS.some((x) => x.key === s);
}

/* ---------------- Perfis de usuário ---------------- */

export type Papel = "admin" | "campo" | "bancada";

export const PAPEIS: Record<Papel, { label: string; desc: string; cor: string; fundo: string }> = {
  campo: {
    label: "Técnico de campo",
    desc: "Faz a visita técnica, retira o equipamento no cliente e devolve depois do conserto",
    cor: "#0e7490",
    fundo: "#cffafe",
  },
  bancada: {
    label: "Técnico de bancada",
    desc: "Faz o diagnóstico, o orçamento e o conserto",
    cor: "#7c3aed",
    fundo: "#ede9fe",
  },
  admin: {
    label: "Administrador",
    desc: "Acesso total e cadastro de usuários",
    cor: "#1d4ed8",
    fundo: "#dbeafe",
  },
};

export function papelValido(p: string): p is Papel {
  return p === "admin" || p === "campo" || p === "bancada";
}

/* ---------------- Número do chamado ---------------- */

/**
 * Sigla de cada tipo de equipamento no número do chamado.
 * Formato: SIGLA-ANO-SEQUÊNCIA  →  ex.: NTB-2026-0007 (7º notebook de 2026).
 * A sequência é separada por tipo e recomeça a cada ano.
 */
export const SIGLA_TIPO: Record<string, string> = {
  Computador: "DSK",
  Notebook: "NTB",
  Impressora: "IMP",
  Monitor: "MON",
  Tablet: "TAB",
  Celular: "CEL",
  Nobreak: "NBK",
  Servidor: "SRV",
  Periférico: "PER",
  Outro: "OUT",
};

export const siglaDoTipo = (tipo: string) => SIGLA_TIPO[tipo] ?? "OUT";
