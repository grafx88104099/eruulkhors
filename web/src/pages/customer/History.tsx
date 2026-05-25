import { Link } from "react-router-dom";
import { useMyOrders } from "@/lib/customerHooks";
import { Card, PageHeader, StatusPill, formatMNT } from "@/components/ui/Layout";

const FINAL = ["Дуусгасан", "Цуцлагдсан"];

export default function CustomerHistory() {
  const { data, loading } = useMyOrders();
  const items = data.filter((o) => FINAL.includes(o.status));

  return (
    <div>
      <PageHeader title="Захиалгын түүх" sub={`${items.length} ширхэг гүйцэтгэгдсэн/цуцлагдсан`} />
      <div className="p-4 sm:p-8">
        <Card>
          {loading ? (
            <p className="text-sm text-ink/50">Ачааллаж байна…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-ink/50">Түүх хоосон байна.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {items.map((o) => (
                <li key={o.id}>
                  <Link to={`/me/orders/${o.id}`} className="flex justify-between items-center py-4 hover:bg-ink/5 -mx-2 px-2 rounded">
                    <div>
                      <div className="font-medium">{o.service} · {o.tank}</div>
                      <div className="text-xs text-ink/50 mono">{o.code} · {o.district}</div>
                      {(o as any).rating && (
                        <div className="text-xs text-accent mt-1">
                          {"★".repeat((o as any).rating)}{"☆".repeat(5 - (o as any).rating)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <StatusPill status={o.status} />
                      <div className="mono text-sm mt-1">{formatMNT(o.totalPrice)}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
