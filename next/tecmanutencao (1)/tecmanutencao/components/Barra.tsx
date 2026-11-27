export default function Barra({ label, valor, max, cor }: { label: string; valor: number; max: number; cor: string }) {
  return (
    <div className="bar-row">
      <span className="lbl">{label}</span>
      <div className="track">
        <div className="fill" style={{ width: `${(valor / Math.max(1, max)) * 100}%`, background: cor }} />
      </div>
      <span className="v">{valor}</span>
    </div>
  );
}
