// Shared UI bits + icons (inline SVG)
const I = {
  search: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="7" r="4.5"/><path d="m11 11 3 3"/></svg>,
  bell:   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3.5 12h9l-1.2-2V7a3.3 3.3 0 0 0-6.6 0v3z"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/></svg>,
  plus:   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10"/></svg>,
  filter: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2.5 3.5h11l-4 5v4.5l-3-1.5v-3z"/></svg>,
  download: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 2v8m-3-3 3 3 3-3M3 13h10"/></svg>,
  more: <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="13" cy="8" r="1.2"/></svg>,
  chev: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="m6 4 4 4-4 4"/></svg>,
  layers: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="m8 2 6 3-6 3-6-3z"/><path d="m2 8 6 3 6-3M2 11l6 3 6-3"/></svg>,
  zoomIn: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 5v6M5 8h6"/></svg>,
  zoomOut: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 8h6"/></svg>,
  locate: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/></svg>,
  // nav
  dash:    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2.5" y="2.5" width="5" height="5"/><rect x="8.5" y="2.5" width="5" height="3"/><rect x="2.5" y="8.5" width="5" height="5"/><rect x="8.5" y="6.5" width="5" height="7"/></svg>,
  truck:   <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1.5" y="4.5" width="8" height="6"/><path d="M9.5 6.5h3l2 2v2h-5z"/><circle cx="4" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/></svg>,
  list:    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 4h10M3 8h10M3 12h10"/></svg>,
  tag:     <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2.5 8.5V3h5.5l5.5 5.5L8 14z"/><circle cx="5.5" cy="5.5" r=".8" fill="currentColor"/></svg>,
  clock:   <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></svg>,
  user:    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="6" r="2.5"/><path d="M3.5 13c.8-2 2.5-3 4.5-3s3.7 1 4.5 3"/></svg>,
  cog:     <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5 13 13M3 13l1.5-1.5M11.5 4.5 13 3"/></svg>,
  bolt:    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="m9 1-6 8h4l-1 6 6-8H8z"/></svg>,
  chart:   <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 13V3M2 13h11M5 10V7M8 10V5M11 10V8"/></svg>,
};

function Pill({ tone="", children, dot }) {
  return <span className={`pill ${tone}`}>{dot && <span className="pdot" />}{children}</span>;
}

function Sparkline({ values, color="#111315", fill="none" }) {
  const w = 110, h = 28, p = 2;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = (w - p*2) / (values.length - 1);
  const pts = values.map((v,i)=> [p + i*step, h - p - ((v-min)/range)*(h - p*2)]);
  const d = pts.map((pt,i)=> (i===0?"M":"L") + pt[0].toFixed(1) + " " + pt[1].toFixed(1)).join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}

function Bars({ values, color="#111315", height=58 }) {
  const max = Math.max(...values);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {values.map((v,i)=>(
        <div key={i} style={{
          flex: 1,
          height: `${(v/max)*100}%`,
          background: i === values.length-1 ? "var(--orange)" : color,
          opacity: i === values.length-1 ? 1 : 0.85,
          borderRadius: 1,
        }}/>
      ))}
    </div>
  );
}

window.I = I;
window.Pill = Pill;
window.Sparkline = Sparkline;
window.Bars = Bars;
