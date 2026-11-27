import { STATUS_MAP, type StatusKey } from "@/lib/constantes";

export default function StatusPill({ status }: { status: StatusKey }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.recebido;
  return (
    <span className="pill" style={{ color: s.cor, background: s.fundo }}>
      {s.label}
    </span>
  );
}
