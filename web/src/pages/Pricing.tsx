import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/client";
import { useCommissionRules, useMultipliers, usePricingZones, useTankSizes } from "@/lib/hooks";
import { Card, PageHeader, formatMNT } from "@/components/ui/Layout";

interface CalcResult {
  zone: string;
  tank: string;
  appliedMultipliers: { id: string; name: string; pct: number }[];
  breakdown: {
    base: number; tankAdjusted: number; distanceSurcharge: number;
    subtotalBeforeZone: number; zoneMultiplied: number;
    urgencyTotalPct: number; surchargeAmount: number;
    preVat: number; vatAmount: number; total: number;
  };
}

export default function Pricing() {
  const zones = usePricingZones();
  const mults = useMultipliers();
  const comms = useCommissionRules();
  const tanks = useTankSizes();

  const [zoneId, setZoneId] = useState<string>("");
  const [tankId, setTankId] = useState<string>("");
  const [service, setService] = useState("Соруулга");
  const [distance, setDistance] = useState(5);
  const [selectedMults, setSelectedMults] = useState<string[]>([]);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function calculate() {
    const z = zoneId || zones.data[0]?.id;
    const t = tankId || tanks.data[1]?.id;
    if (!z || !t) return;
    setBusy(true);
    try {
      const fn = httpsCallable<unknown, CalcResult>(functions, "calculatePrice");
      const r = await fn({ zoneId: z, tankId: t, service, distanceKm: distance, multiplierIds: selectedMults });
      setResult(r.data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Үнэлгээний систем" sub="Бүс × үйлчилгээ × танк × нэмэгдэл × НӨАТ" />
      <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Бүсийн тариф" className="lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="text-left text-ink/50 text-xs uppercase">
              <tr><th className="py-2">Бүс</th><th>Соруулга</th><th>Суулгалт</th><th>Засвар</th><th>₮/км</th><th>×</th></tr>
            </thead>
            <tbody>
              {zones.data.map((z) => (
                <tr key={z.id} className="border-t border-ink/5">
                  <td className="py-2 font-medium">{z.name}</td>
                  <td className="mono">{formatMNT(z.servicePump)}</td>
                  <td className="mono">{formatMNT(z.serviceInstall)}</td>
                  <td className="mono">{formatMNT(z.serviceRepair)}</td>
                  <td className="mono">{formatMNT(z.distanceKmRate)}</td>
                  <td className="mono">{z.multiplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Тооны машин">
          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="text-ink/60">Бүс</span>
              <select className="w-full mt-1 border border-ink/10 rounded-md p-2" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                <option value="">— сонгох —</option>
                {zones.data.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-ink/60">Үйлчилгээ</span>
              <select className="w-full mt-1 border border-ink/10 rounded-md p-2" value={service} onChange={(e) => setService(e.target.value)}>
                {["Соруулга", "Суулгалт", "Засвар"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-ink/60">Танк</span>
              <select className="w-full mt-1 border border-ink/10 rounded-md p-2" value={tankId} onChange={(e) => setTankId(e.target.value)}>
                <option value="">— сонгох —</option>
                {tanks.data.map((t) => <option key={t.id} value={t.id}>{t.label} (×{t.coefficient})</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-ink/60">Зай (км)</span>
              <input type="number" min={0} className="w-full mt-1 border border-ink/10 rounded-md p-2 mono" value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
            </label>
            <div>
              <div className="text-ink/60 mb-1">Нэмэгдэл</div>
              {mults.data.map((m) => (
                <label key={m.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedMults.includes(m.id)}
                    onChange={(e) =>
                      setSelectedMults(e.target.checked ? [...selectedMults, m.id] : selectedMults.filter((x) => x !== m.id))
                    }
                  />
                  <span>{m.name} <span className="text-accent mono">+{m.pct}%</span></span>
                </label>
              ))}
            </div>
            <button className="btn primary w-full" onClick={calculate} disabled={busy}>
              {busy ? "Тооцоолж байна…" : "Тооцоолох"}
            </button>

            {result && (
              <div className="mt-3 pt-3 border-t border-ink/10 text-xs space-y-1">
                <Row k="Танкаар тохируулсан" v={result.breakdown.tankAdjusted} />
                <Row k="Зайн нэмэгдэл" v={result.breakdown.distanceSurcharge} />
                <Row k="Бүсийн коэф" v={result.breakdown.zoneMultiplied} />
                <Row k={`Нэмэгдэл ${result.breakdown.urgencyTotalPct}%`} v={result.breakdown.surchargeAmount} />
                <Row k="НӨАТ 10%" v={result.breakdown.vatAmount} />
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-ink/10">
                  <span>Нийт</span><span className="mono text-accent">{formatMNT(result.breakdown.total)}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Нэмэгдэл итгэлцүүр" className="lg:col-span-2">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {mults.data.map((m) => (
              <li key={m.id} className="flex justify-between border-l-2 border-accent pl-3">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-ink/50">{m.scope}</div>
                </div>
                <div className="mono text-accent">+{m.pct}%</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Техникчийн комисс">
          <ul className="space-y-3 text-sm">
            {comms.data.map((c) => (
              <li key={c.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{c.role}</div>
                  <div className="text-xs text-ink/50 mono">{c.basePct}% + {c.bonusPct}% (бонус)</div>
                </div>
                <div className="mono text-xs text-ink/50">≤ {formatMNT(c.monthlyCap)}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink/60">{k}</span>
      <span className="mono">{formatMNT(v)}</span>
    </div>
  );
}
