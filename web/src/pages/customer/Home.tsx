import { Link } from "react-router-dom";
import { useMyOrders } from "@/lib/customerHooks";
import { Card, PageHeader, StatusPill, formatMNT } from "@/components/ui/Layout";

const ACTIVE_STATUSES = ["Хүлээгдэж буй", "Хуваарилагдсан", "Зам дээр", "Гүйцэтгэж байна"];

export default function CustomerHome() {
  const { data: orders, loading } = useMyOrders();
  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completed = orders.filter((o) => o.status === "Дуусгасан").length;
  const totalSpent = orders
    .filter((o) => o.status === "Дуусгасан")
    .reduce((s, o) => s + Number(o.totalPrice || 0), 0);

  return (
    <div>
      <PageHeader
        title="Тавтай морил"
        sub="Био-септик үйлчилгээ хэдхэн товшилтоор"
        right={
          <Link to="/me/new" className="btn primary">+ Шинэ захиалга</Link>
        }
      />

      <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-ink/50 uppercase tracking-wider">Идэвхтэй захиалга</div>
          <div className="text-3xl font-semibold mt-2 mono text-accent">{active.length}</div>
        </Card>
        <Card>
          <div className="text-xs text-ink/50 uppercase tracking-wider">Нийт гүйцэтгэгдсэн</div>
          <div className="text-3xl font-semibold mt-2 mono">{completed}</div>
        </Card>
        <Card>
          <div className="text-xs text-ink/50 uppercase tracking-wider">Нийт зарцуулалт</div>
          <div className="text-3xl font-semibold mt-2 mono">{formatMNT(totalSpent)}</div>
        </Card>

        <Card title="Идэвхтэй захиалга" className="lg:col-span-3">
          {loading ? (
            <p className="text-sm text-ink/50">Ачааллаж байна…</p>
          ) : active.length === 0 ? (
            <div className="text-center py-8 text-ink/50">
              <p className="text-sm mb-3">Та одоогоор идэвхтэй захиалгагүй байна.</p>
              <Link to="/me/new" className="btn primary">+ Эхний захиалга үүсгэх</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {active.map((o) => (
                <li key={o.id}>
                  <Link to={`/me/orders/${o.id}`} className="block border border-ink/10 rounded-lg p-4 hover:bg-ink/5 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{o.service} · {o.tank}</div>
                        <div className="text-xs text-ink/60 mt-0.5">{o.code} · {o.district}</div>
                      </div>
                      <StatusPill status={o.status} />
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-ink/60">ETA: <span className="mono">{o.eta}</span></span>
                      <span className="mono font-medium text-accent">{formatMNT(o.totalPrice)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Сүүлийн захиалгууд" className="lg:col-span-3">
          {orders.length === 0 ? (
            <p className="text-sm text-ink/50">Захиалга байхгүй байна.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link to={`/me/orders/${o.id}`} className="flex justify-between items-center py-3 hover:bg-ink/5 -mx-2 px-2 rounded">
                    <div>
                      <div className="text-sm font-medium">{o.service} · {o.tank}</div>
                      <div className="text-xs text-ink/50 mono">{o.code}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={o.status} />
                      <span className="mono text-sm">{formatMNT(o.totalPrice)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {orders.length > 5 && (
            <div className="text-center mt-3">
              <Link to="/me/history" className="text-sm text-accent underline">Бүгдийг харах →</Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
