import { useMemo, useState } from "react";
import { useMyTechOrders, useCommissionRules } from "@/lib/techHooks";
import { useRoles } from "@/lib/useRoles";
import { Card, PageHeader, formatMNT } from "@/components/ui/Layout";

type Period = "month" | "week" | "all";

export default function TechEarnings() {
  const { primaryRole, roles } = useRoles();
  const { data: orders, loading } = useMyTechOrders();
  const commissionRules = useCommissionRules();
  const [period, setPeriod] = useState<Period>("month");

  const techRole = roles.find((r) => r.startsWith("tech_")) ?? primaryRole;
  const rule = commissionRules.find((c) => c.role === techRole);

  const completed = useMemo(() => orders.filter((o) => o.status === "Дуусгасан"), [orders]);

  const { weekStart, monthStart } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const day = now.getDay() || 7;
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - day + 1); weekStart.setHours(0, 0, 0, 0);
    return { weekStart, monthStart };
  }, []);

  const inPeriod = useMemo(() => {
    return completed.filter((o) => {
      const d = toDate(o.createdAt);
      if (!d) return period === "all";
      if (period === "month") return d >= monthStart;
      if (period === "week") return d >= weekStart;
      return true;
    });
  }, [completed, period, monthStart, weekStart]);

  const basePct = rule?.basePct ?? 0;
  const monthCap = rule?.monthlyCap ?? null;

  const totalRevenue = inPeriod.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);
  const commission = totalRevenue * (basePct / 100);
  const allTimeCommission = completed.reduce(
    (s, o) => s + (Number(o.totalPrice) || 0) * (basePct / 100),
    0,
  );
  const monthCommission = completed
    .filter((o) => { const d = toDate(o.createdAt); return d && d >= monthStart; })
    .reduce((s, o) => s + (Number(o.totalPrice) || 0) * (basePct / 100), 0);

  return (
    <div className="pb-20 lg:pb-8">
      <PageHeader
        title="Орлого"
        sub={rule
          ? `Комисс: ${basePct}%${monthCap ? ` · Сарын дээд: ${formatMNT(monthCap)}` : ""}`
          : "Комиссын дүрэм одоогоор тохируулагдаагүй"}
      />

      <div className="p-4 sm:p-8 space-y-4 max-w-2xl mx-auto">
        {/* Period switcher */}
        <div className="flex gap-1 bg-ink/5 rounded-lg p-1">
          {([
            { k: "week", label: "Энэ долоо хоног" },
            { k: "month", label: "Энэ сар" },
            { k: "all", label: "Бүгд" },
          ] as { k: Period; label: string }[]).map((p) => (
            <button
              key={p.k}
              onClick={() => setPeriod(p.k)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                period === p.k ? "bg-emerald-600 text-white" : "text-ink/60 hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Headline */}
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-ink/40">Шимтгэлийн орлого</div>
          <div className="mt-2 mono text-4xl font-semibold text-emerald-700">
            {formatMNT(Math.round(commission))}
          </div>
          <div className="text-xs text-ink/50 mt-2">
            {inPeriod.length} захиалга · нийт {formatMNT(Math.round(totalRevenue))} орлого
            {basePct > 0 ? ` × ${basePct}%` : ""}
          </div>
        </Card>

        {/* Cap progress (if applicable) */}
        {monthCap && (
          <Card>
            <div className="flex justify-between items-baseline mb-2">
              <div className="text-sm font-medium">Сарын дээд хязгаар</div>
              <div className="text-xs text-ink/50 mono">
                {formatMNT(Math.round(monthCommission))} / {formatMNT(monthCap)}
              </div>
            </div>
            <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${Math.min(100, (monthCommission / monthCap) * 100)}%` }}
              />
            </div>
          </Card>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Энэ сар" value={formatMNT(Math.round(monthCommission))} />
          <StatBox label="Бүх түүх" value={formatMNT(Math.round(allTimeCommission))} />
        </div>

        {/* Completed orders list */}
        <Card title={`Дуусгасан захиалгууд (${inPeriod.length})`}>
          {loading ? (
            <div className="text-sm text-ink/50 py-6 text-center">Ачааллаж байна…</div>
          ) : inPeriod.length === 0 ? (
            <div className="text-sm text-ink/50 py-6 text-center">Энэ хугацаанд дуусгасан захиалга алга</div>
          ) : (
            <ul className="space-y-2">
              {inPeriod.slice(0, 50).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2 border-b border-ink/5 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{o.customer}</div>
                    <div className="text-[11px] text-ink/50 mono">
                      {o.code} · {formatDate(o.createdAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="mono text-xs text-ink/60">{formatMNT(o.totalPrice)}</div>
                    <div className="mono text-sm font-semibold text-emerald-700">
                      +{formatMNT(Math.round((Number(o.totalPrice) || 0) * (basePct / 100)))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <p className="text-[11px] text-ink/40 text-center pt-2">
          Шимтгэл нь дуусгасан захиалгын дүн × комиссын хувиар автомат тооцоологдоно.
          Бодит олголт сард 1-2 удаа Plastic Center санхүүгээс хийгдэнэ.
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="text-[10px] uppercase tracking-wider text-ink/40">{label}</div>
      <div className="mono text-base font-semibold mt-1 text-emerald-700 break-all">{value}</div>
    </div>
  );
}

function toDate(ts: any): Date | null {
  if (!ts) return null;
  const d = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
  return d instanceof Date && !isNaN(d.getTime()) ? d : null;
}

function formatDate(ts: any): string {
  const d = toDate(ts);
  return d ? d.toLocaleDateString("mn-MN", { month: "2-digit", day: "2-digit" }) : "—";
}
