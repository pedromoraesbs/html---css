import type { Papel } from "./constantes";

/**
 * O que cada perfil pode fazer. Usado tanto para esconder botões na tela
 * quanto para bloquear as ações no servidor.
 */
const REGRAS = {
  registrarEntrada: ["admin", "campo"],      // trouxe o equipamento do cliente
  respostaOrcamento: ["admin", "campo"],     // repassa a resposta do cliente ao orçamento
  registrarSaida: ["admin", "campo"],        // devolveu o equipamento ao cliente
  andamento: ["admin", "bancada"],           // muda o status do conserto
  diagnostico: ["admin", "bancada"],         // diagnóstico, orçamento e previsão
  assumir: ["bancada"],                      // técnico de bancada pega uma OS sem responsável
  atribuir: ["admin"],                       // troca os técnicos responsáveis
  excluir: ["admin"],
  usuarios: ["admin"],
} as const satisfies Record<string, readonly Papel[]>;

export type Acao = keyof typeof REGRAS;

export function pode(papel: Papel, acao: Acao): boolean {
  return (REGRAS[acao] as readonly Papel[]).includes(papel);
}
