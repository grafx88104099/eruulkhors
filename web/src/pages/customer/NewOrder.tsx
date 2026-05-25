import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/client";
import { useMultipliers, useTankSizes } from "@/lib/hooks";
import { useCollection } from "@/lib/hooks";
import { Card, PageHeader, formatMNT } from "@/components/ui/Layout";

interface District { id: string; name: string }

const SERVICES = [
  { value: "Соруулга", label: "Соруулга", icon: "💧", desc: "Танкны хог хаягдал соруулах" },
  { value: "Засвар",   label: "Засвар",   icon: "🔧", desc: "Эвдрэл, гэмтлийг засварлах" },
  { value: "Суулгалт", label: "Суулгалт", icon: "🏗",  desc: "Шинэ танк суулгах" },
];

const TIMES = [
  { value: "asap",     label: "Аль болох хурдан", note: "(2 цагийн дотор)" },
  { value: "today",    label: "Өнөөдрийн дотор",  note: "" },
  { value: "tomorrow", label: "Маргааш",          note: "" },
];

export default function NewOrder() {
  const nav = useNavigate();
  const tanks = useTankSizes();
  const mults = useMultipliers();
  const districts = useCollection<District>("districts");

  const [service, setService] = useState("Соруулга");
  const [tankId, setTankId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [preferredTime, setPreferredTime] = useState("asap");
  const [distanceKm, setDistanceKm] = useState(5);

  const [pricePreview, setPricePreview] = useState<{ total: number; loading: boolean }>({ total: 0, loading: false });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Яаралтай үед multiplier auto-apply
  const activeMultIds = preferredTime === "asap" ? mults.data.filter((m) => m.code === "urgent").map((m) => m.id) : [];

  // Live price preview
  useEffect(() => {
    if (!tankId) return;
    setPricePreview({ total: 0, loading: true });
    const fn = httpsCallable<unknown, { breakdown: { total: number } }>(functions, "calculatePrice");
    fn({
      zoneId: "zone-center",
      tankId,
      service,
      distanceKm,
      multiplierIds: activeMultIds,
    }).then((r) => {
      setPricePreview({ total: r.data.breakdown.total, loading: false });
    }).catch(() => setPricePreview({ total: 0, loading: false }));
  }, [tankId, service, distanceKm, preferredTime]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tankId || !districtId) return;
    setSubmitting(true); setErr(null);
    try {
      const fn = httpsCallable<unknown, { id: string; code: string }>(functions, "createOrder");
      const r = await fn({
        service, tankId, districtId, address, phone, notes,
        preferredTime,
        multiplierIds: activeMultIds,
        distanceKm,
      });
      nav(`/me/orders/${r.data.id}`);
    } catch (ex: any) {
      setErr(ex.message ?? "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = tankId && districtId && address.trim() && phone.trim();

  return (
    <div>
      <PageHeader title="Шинэ захиалга" sub="Үнэлгээ автоматаар тооцоологдоно" />

      <form onSubmit={submit} className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card title="1. Үйлчилгээний төрөл">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setService(s.value)}
                  className={`text-left p-3 rounded-lg border-2 transition ${
                    service === s.value ? "border-accent bg-accent/5" : "border-ink/10 hover:border-ink/20"
                  }`}
                >
                  <div className="text-2xl">{s.icon}</div>
                  <div className="font-medium mt-1">{s.label}</div>
                  <div className="text-xs text-ink/60">{s.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card title="2. Танкны хэмжээ">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {tanks.data.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTankId(t.id)}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    tankId === t.id ? "border-accent bg-accent/5" : "border-ink/10 hover:border-ink/20"
                  }`}
                >
                  <div className="font-semibold">{t.label}</div>
                  <div className="text-xs text-ink/50 mono">×{t.coefficient}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card title="3. Хаяг + холбоо барих">
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-ink/60">Дүүрэг</span>
                <select className="w-full mt-1 border border-ink/10 rounded-md p-2" value={districtId} onChange={(e) => setDistrictId(e.target.value)} required>
                  <option value="">— сонгох —</option>
                  {districts.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-ink/60">Дэлгэрэнгүй хаяг</span>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Хороо, гудамж, байр, тоот" className="w-full mt-1 border border-ink/10 rounded-md p-2" required />
              </label>
              <label className="block">
                <span className="text-ink/60">Утас</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+976 99XX XXXX" className="w-full mt-1 border border-ink/10 rounded-md p-2 mono" required />
              </label>
              <label className="block">
                <span className="text-ink/60">Зайн ойролцоо (км)</span>
                <input type="number" min={0} max={60} value={distanceKm} onChange={(e) => setDistanceKm(Number(e.target.value))} className="w-full mt-1 border border-ink/10 rounded-md p-2 mono" />
              </label>
              <label className="block">
                <span className="text-ink/60">Тэмдэглэл (заавал биш)</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Жишээ: Гэрт нохой бий, эзэн 12 цагт ирнэ" className="w-full mt-1 border border-ink/10 rounded-md p-2" />
              </label>
            </div>
          </Card>

          <Card title="4. Хэзээ ирэх ёстой вэ?">
            <div className="space-y-2">
              {TIMES.map((t) => (
                <label key={t.value} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                  preferredTime === t.value ? "border-accent bg-accent/5" : "border-ink/10"
                }`}>
                  <input
                    type="radio"
                    name="time"
                    value={t.value}
                    checked={preferredTime === t.value}
                    onChange={() => setPreferredTime(t.value)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{t.label}</div>
                    {t.note && <div className="text-xs text-ink/50">{t.note}</div>}
                  </div>
                  {t.value === "asap" && <span className="chip pill-busy">+50% яаралтай</span>}
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Summary sidebar */}
        <div>
          <Card title="Захиалгын дүн" className="sticky top-4">
            <dl className="space-y-2 text-sm">
              <Row k="Үйлчилгээ" v={service} />
              <Row k="Танк" v={tanks.data.find((t) => t.id === tankId)?.label ?? "—"} />
              <Row k="Дүүрэг" v={districts.data.find((d) => d.id === districtId)?.name ?? "—"} />
              <Row k="Хаяг" v={address || "—"} />
              <Row k="Зай" v={`${distanceKm} км`} />
              <Row k="Хугацаа" v={TIMES.find((t) => t.value === preferredTime)?.label ?? "—"} />
            </dl>

            <div className="border-t border-ink/10 mt-4 pt-4">
              <div className="text-xs text-ink/50 uppercase tracking-wider mb-1">Тооцоолсон үнэ</div>
              <div className="text-3xl font-semibold mono text-accent">
                {pricePreview.loading ? "…" : formatMNT(pricePreview.total)}
              </div>
              <div className="text-[11px] text-ink/40 mt-1">НӨАТ багтсан · ойролцоо</div>
            </div>

            {err && <div className="text-xs text-err mt-3">{err}</div>}

            <button type="submit" className="btn primary w-full mt-4" disabled={!canSubmit || submitting}>
              {submitting ? "Илгээж байна…" : "Захиалга баталгаажуулах"}
            </button>
          </Card>
        </div>
      </form>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink/50 shrink-0">{k}</dt>
      <dd className="text-right truncate">{v}</dd>
    </div>
  );
}
