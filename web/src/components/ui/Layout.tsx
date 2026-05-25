import { ReactNode } from "react";

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between px-8 pt-8 pb-4 border-b border-ink/10">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {sub && <p className="text-sm text-ink/60 mt-1">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`card p-5 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-ink/70 mb-3">{title}</h3>}
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Дуусгасан" ? "bg-ok/15 text-ok"
    : status === "Цуцлагдсан" ? "bg-err/15 text-err"
    : status === "Гүйцэтгэж байна" ? "bg-accent/15 text-accent"
    : status === "Зам дээр" ? "bg-info/15 text-info"
    : status === "Хуваарилагдсан" ? "bg-warn/15 text-warn"
    : "bg-ink-line/15 text-ink/60";
  return <span className={`chip ${tone} border-transparent`}>{status}</span>;
}

export function formatMNT(n: number | string) {
  const num = typeof n === "string" ? parseInt(n, 10) : n;
  return `${num.toLocaleString("mn-MN")}₮`;
}
