"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { STATUS, TIPOS } from "@/lib/constantes";

/** Filtros da lista: atualizam a URL (?q=&status=&tipo=) e a página é refeita no servidor. */
export default function FiltrosOrdens({ q, status, tipo, minhas }: { q: string; status: string; tipo: string; minhas: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [busca, setBusca] = useState(q);

  function aplicar(chave: string, valor: string) {
    const p = new URLSearchParams(params.toString());
    if (valor) p.set(chave, valor);
    else p.delete(chave);
    router.replace(`/ordens?${p.toString()}`);
  }

  // busca com pequeno atraso enquanto digita
  useEffect(() => {
    if (busca === q) return;
    const t = setTimeout(() => aplicar("q", busca.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  return (
    <div className="filters">
      <select value={minhas ? "1" : "0"} onChange={(e) => aplicar("minhas", e.target.value)}>
        <option value="1">Minhas OS</option>
        <option value="0">Todas da equipe</option>
      </select>
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por chamado, nº da OS, cliente, telefone, marca, modelo ou nº de série…"
      />
      <select value={status} onChange={(e) => aplicar("status", e.target.value)}>
        <option value="abertas">Em aberto (na loja)</option>
        <option value="todas">Todas as ordens</option>
        <option value="atrasadas">Atrasadas</option>
        <option value="sembancada">Sem técnico de bancada</option>
        {STATUS.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>
      <select value={tipo} onChange={(e) => aplicar("tipo", e.target.value)}>
        <option value="">Todos os tipos</option>
        {TIPOS.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}
