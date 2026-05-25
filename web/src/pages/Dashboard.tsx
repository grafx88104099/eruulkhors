import { useOrders, useTechnicians } from "@/lib/hooks";
import { Card, PageHeader, StatusPill, formatMNT } from "@/components/ui/Layout";

export default function Dashboard() {
  const orders = useOrders();
  const techs = useTechnicians();

  const results = orders.data;
  const techList = techs.data;
  const active = results.filter((o) => !["Дуусгасан", "Цуцлагдсан"].includes(o.status));
  const unassigned = results.filter((o) => !o.technicianCode);
  const dailyRevenue = results.filter((o) => o.status === "Дуусгасан").reduce((s, o) => s + Number(o.totalPrice || 0), 0);

  return (
    <div>
      <PageHeader title="Үйл ажиллагааны самбар" sub="Өнөөдрийн KPI, идэвхтэй ажлууд, техникчдийн төлөв" />
      <div className="p-4 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Идэвхтэй захиалга" value={active.length} accent />
        <Kpi label="Хуваарилагдаагүй" value={unassigned.length} />
        <Kpi label="Өдрийн орлого" value={formatMNT(dailyRevenue)} />
        <Kpi label="Техникч (бэлэн)" value={`${techList.filter((t) => t.status === "idle").length}/${techList.length}`} />

        <Card title="Идэвхтэй ажлууд" className="col-span-2 lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-left text-ink/50 text-xs uppercase">
                <tr>
                  <th className="py-2">ID</th>
                  <th>Харилцагч</th>
                  <th>Үйлчилгээ</th>
                  <th>Техникч</th>
                  <th>Статус</th>
                  <th className="text-right">Үнэ</th>
                </tr>
              </thead>
              <tbody>
                {active.slice(0, 8).map((o) => (
                  <tr key={o.id} className="border-t border-ink/5">
                    <td className="py-2 mono">{o.code}</td>
                    <td>{o.customer}</td>
                    <td>{o.service} · {o.tank}</td>
                    <td className="mono text-xs">{o.technicianCode ?? "—"}</td>
                    <td><StatusPill status={o.status} /></td>
                    <td className="text-right mono">{formatMNT(o.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Техникчийн төлөв" className="col-span-2 lg:col-span-1">
          <ul className="space-y-2 text-sm">
            {techList.map((t) => (
              <li key={t.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-ink/50 mono">{t.code} · {t.role}</div>
                </div>
                <span className={`chip pill-${t.status}`}>{t.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card>
      <div className="text-xs text-ink/50 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl sm:text-3xl font-semibold mt-2 mono ${accent ? "text-accent" : ""}`}>{value}</div>
    </Card>
  );
}
