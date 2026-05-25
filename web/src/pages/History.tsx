import { useState } from "react";
import { useOrders } from "@/lib/hooks";
import { OrderDoc } from "@/lib/types";
import { Card, PageHeader, StatusPill, formatMNT } from "@/components/ui/Layout";

export default function History() {
  const { data } = useOrders();
  const completed = data.filter((o) => o.status === "Дуусгасан");
  const [selected, setSelected] = useState<OrderDoc | null>(null);
  const current = selected ?? completed[0] ?? null;

  return (
    <div>
      <PageHeader title="Үйлчилгээний түүх" sub={`${completed.length} гүйцэтгэгдсэн ажил`} />
      <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <ul className="space-y-2 text-sm max-h-[600px] overflow-auto">
            {completed.map((o) => (
              <li
                key={o.id}
                onClick={() => setSelected(o)}
                className={`p-2 rounded-md cursor-pointer hover:bg-ink/5 ${current?.id === o.id ? "bg-ink/5" : ""}`}
              >
                <div className="mono text-xs text-ink/50">{o.code}</div>
                <div className="font-medium">{o.customer}</div>
                <div className="text-xs text-ink/60">{o.service} · {o.tank}</div>
                <div className="text-xs mono mt-1">{formatMNT(o.totalPrice)}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          {current ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="mono text-xs text-ink/50">{current.code}</div>
                  <div className="font-semibold text-lg">{current.customer}</div>
                  <div className="text-sm text-ink/60">{current.district} · {current.service} · {current.tank}</div>
                </div>
                <StatusPill status={current.status} />
              </div>
              <div className="text-3xl font-semibold mono text-accent">{formatMNT(current.totalPrice)}</div>
              <p className="text-sm text-ink/50">
                Timeline, гэрэл зураг, гарын үсэг, баталгаат хугацаа — дараагийн фазад Cloud Functions + Storage-аар нэмнэ.
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink/50">Гүйцэтгэсэн захиалга байхгүй.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
