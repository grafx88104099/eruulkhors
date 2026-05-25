import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMyTechOrders } from "@/lib/techHooks";
import { Card, PageHeader, StatusPill, formatMNT } from "@/components/ui/Layout";

const STATUS_FILTERS = [
  "Бүгд",
  "Хуваарилагдсан",
  "Зам дээр",
  "Гүйцэтгэж байна",
  "Дуусгасан",
  "Цуцлагдсан",
];

export default function TechOrders() {
  const { data: orders, loading } = useMyTechOrders();
  const [filter, setFilter] = useState("Хуваарилагдсан");

  const filtered = useMemo(
    () => (filter === "Бүгд" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  return (
    <div className="pb-20 lg:pb-8">
      <PageHeader
        title="Захиалга"
        sub={`${orders.length} нийт${loading ? " · ачааллаж байна…" : ""}`}
      />

      {/* Filter chips */}
      <div className="px-4 sm:px-8 pt-4 -mx-1 overflow-x-auto">
        <div className="flex gap-2 px-1 min-w-min">
          {STATUS_FILTERS.map((s) => {
            const n = s === "Бүгд" ? orders.length : orders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`chip whitespace-nowrap shrink-0 ${filter === s ? "on" : ""}`}
              >
                {s} <span className="mono opacity-60 ml-1">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-8 space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <div className="text-sm text-ink/50 py-10 text-center">
              {loading ? "Ачааллаж байна…" : "Захиалга алга"}
            </div>
          </Card>
        ) : (
          filtered.map((o) => (
            <Link
              key={o.id}
              to={`/tech/orders/${o.id}`}
              className="card p-4 block hover:border-emerald-300 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mono text-[10px] text-ink/40 uppercase">{o.code}</div>
                  <div className="font-semibold truncate">{o.customer}</div>
                  <div className="text-xs text-ink/60 truncate">
                    {o.district ? `${o.district} · ` : ""}{o.service} · {o.tank}
                  </div>
                </div>
                <StatusPill status={o.status} />
              </div>
              <div className="mt-3 pt-3 border-t border-ink/5 flex items-center justify-between text-sm">
                <span className="text-ink/60 mono text-xs">ETA: {o.eta || "—"}</span>
                <span className="mono font-semibold text-emerald-700">
                  {formatMNT(o.totalPrice)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
