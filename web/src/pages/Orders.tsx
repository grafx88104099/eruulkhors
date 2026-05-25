import { useState } from "react";
import { useOrders } from "@/lib/hooks";
import { OrderDoc } from "@/lib/types";
import { Card, PageHeader, StatusPill, formatMNT } from "@/components/ui/Layout";

const STATUS_FILTERS = ["Бүгд", "Хүлээгдэж буй", "Хуваарилагдсан", "Зам дээр", "Гүйцэтгэж байна", "Дуусгасан", "Цуцлагдсан"];

export default function Orders() {
  const [filter, setFilter] = useState("Бүгд");
  const [selected, setSelected] = useState<OrderDoc | null>(null);
  const { data: all, loading } = useOrders();
  const list = filter === "Бүгд" ? all : all.filter((o) => o.status === filter);

  return (
    <div>
      <PageHeader title="Захиалга удирдлага" sub={`${all.length} захиалга${loading ? " · ачааллаж байна…" : ""}`} />
      <div className="px-4 sm:px-8 pt-4 flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => {
          const n = s === "Бүгд" ? all.length : all.filter((o) => o.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)} className={`chip ${filter === s ? "on" : ""}`}>
              {s} <span className="mono opacity-60 ml-1">{n}</span>
            </button>
          );
        })}
      </div>
      <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-left text-ink/50 text-xs uppercase">
              <tr>
                <th className="py-2">ID</th>
                <th>Харилцагч / Дүүрэг</th>
                <th>Үйлчилгээ</th>
                <th>Техникч</th>
                <th>Статус</th>
                <th>ETA</th>
                <th className="text-right">Үнэ</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className={`border-t border-ink/5 cursor-pointer hover:bg-ink/5 ${selected?.id === o.id ? "bg-ink/5" : ""}`}
                >
                  <td className="py-2 mono">{o.code}</td>
                  <td>
                    <div className="font-medium">{o.customer}</div>
                    <div className="text-xs text-ink/50">{o.district}</div>
                  </td>
                  <td>{o.service} · {o.tank}</td>
                  <td className="mono text-xs">{o.technicianCode ?? "—"}</td>
                  <td><StatusPill status={o.status} /></td>
                  <td className="mono">{o.eta}</td>
                  <td className="text-right mono">{formatMNT(o.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <OrderDetail order={selected} />
      </div>
    </div>
  );
}

function OrderDetail({ order }: { order: OrderDoc | null }) {
  if (!order) {
    return (
      <Card>
        <p className="text-sm text-ink/50">Захиалга сонгоход дэлгэрэнгүй мэдээлэл энд харагдана.</p>
      </Card>
    );
  }
  const bd = order.priceBreakdown ?? null;
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-start">
          <div>
            <div className="mono text-xs text-ink/50">{order.code}</div>
            <div className="font-semibold text-lg">{order.customer}</div>
            <div className="text-sm text-ink/60">{order.district}</div>
          </div>
          <StatusPill status={order.status} />
        </div>
        <dl className="mt-4 text-sm grid grid-cols-2 gap-y-2">
          <dt className="text-ink/50">Үйлчилгээ</dt><dd>{order.service}</dd>
          <dt className="text-ink/50">Танк</dt><dd>{order.tank}</dd>
          <dt className="text-ink/50">Зай</dt><dd className="mono">{order.distanceKm} км</dd>
          <dt className="text-ink/50">Техникч</dt><dd>{order.technicianCode ?? "—"}</dd>
          <dt className="text-ink/50">ETA</dt><dd className="mono">{order.eta}</dd>
        </dl>
      </Card>

      {bd && (
        <Card title="Үнийн задаргаа">
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Танкаар тохируулсан", bd.tankAdjusted],
                ["Зайн нэмэгдэл", bd.distanceSurcharge],
                ["Бүсийн коэф (×)", bd.zoneMultiplied],
                [`Нэмэгдэл (${bd.urgencyTotalPct ?? 0}%)`, bd.surchargeAmount],
                ["НӨАТ 10%", bd.vatAmount],
              ].map(([label, val]) => (
                <tr key={label as string} className="border-t border-ink/5">
                  <td className="py-1.5 text-ink/60">{label}</td>
                  <td className="text-right mono">{val ? formatMNT(val as number) : "—"}</td>
                </tr>
              ))}
              <tr className="border-t border-ink/20 font-semibold">
                <td className="py-2">Нийт</td>
                <td className="text-right mono text-accent">{formatMNT(order.totalPrice)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
