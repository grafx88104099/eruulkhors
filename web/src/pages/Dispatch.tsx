import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { divIcon } from "leaflet";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/client";
import { useDistricts, useOrders, useTankSizes, useTechnicians } from "@/lib/hooks";
import { Card, PageHeader, StatusPill, formatMNT } from "@/components/ui/Layout";

const UB_CENTER: [number, number] = [47.918, 106.917];

const createDispatchOrder = httpsCallable<
  any,
  { ok: boolean; id: string; code: string; totalPrice: number; broadcastTo: string[] }
>(functions, "createDispatchOrder");

const SERVICES = ["Соруулга", "Засвар", "Суулгалт"];
const PRIORITIES = ["Энгийн", "Яаралтай"];
const TECH_ROLES = [
  { key: "tech_install", label: "Суулгагч" },
  { key: "tech_pump",    label: "Соруулагч" },
  { key: "tech_repair",  label: "Засварчин" },
  { key: "tech_driver",  label: "Жолооч" },
];

const DEFAULT_BROADCAST: Record<string, string[]> = {
  "Соруулга": ["tech_pump", "tech_driver"],
  "Засвар":   ["tech_repair"],
  "Суулгалт": ["tech_install", "tech_driver"],
};

function techIcon(status: string) {
  const color = status === "busy" ? "#E54B16" : status === "idle" ? "#1B7A3E" : "#888";
  return divIcon({
    className: "",
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 1px ${color}"></div>`,
    iconSize: [14, 14],
  });
}

export default function Dispatch() {
  const techs = useTechnicians();
  const orders = useOrders();
  const [showCreate, setShowCreate] = useState(false);

  const techList = techs.data;
  const unassigned = orders.data.filter((o) => !o.technicianCode && o.status === "Хүлээгдэж буй");
  const openBroadcasts = unassigned.filter((o) => (o as any).isOpen === true);

  return (
    <div>
      <PageHeader
        title="Ачилт удирдлага"
        sub={`${openBroadcasts.length} нээлттэй дуудлага · ${techList.length} технич`}
        right={
          <button
            onClick={() => setShowCreate(true)}
            className="btn primary text-sm"
          >
            + Шинэ дуудлага
          </button>
        }
      />
      <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={`Хүлээгдэж буй захиалга (${unassigned.length})`}>
          <ul className="space-y-2 text-sm">
            {unassigned.length === 0 && <li className="text-ink/50">Хүлээгдэж буй захиалга алга.</li>}
            {unassigned.map((o) => (
              <li key={o.id} className="border-l-2 border-accent pl-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{o.customer}</div>
                    <div className="text-xs text-ink/60">{o.code} · {o.service} · {o.tank}</div>
                  </div>
                  {(o as any).isOpen === true && (
                    <span className="chip bg-emerald-100 text-emerald-700 border-transparent text-[10px]">
                      📡 Нээлттэй
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <StatusPill status={o.priority} />
                  <span className="mono text-xs text-emerald-700">{formatMNT(o.totalPrice)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2 p-0 overflow-hidden h-[420px] sm:h-[520px]">
          <MapContainer center={UB_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='© OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {techList.filter((t) => t.location?.lat && t.location?.lng).map((t) => (
              <Marker key={t.id} position={[t.location!.lat, t.location!.lng]} icon={techIcon(t.status)}>
                <Popup>
                  <strong>{t.code} {t.name}</strong><br />
                  {t.role} · {t.status}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Card>

        <Card title="Бүх техникч" className="lg:col-span-3 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-left text-ink/50 text-xs uppercase">
              <tr><th className="py-2">Код</th><th>Нэр</th><th>Үүрэг</th><th>Машин</th><th>Үнэлгээ</th><th>Төлөв</th></tr>
            </thead>
            <tbody>
              {techList.map((t) => (
                <tr key={t.id} className="border-t border-ink/5">
                  <td className="py-2 mono">{t.code}</td>
                  <td>{t.name}</td>
                  <td>{t.role}</td>
                  <td className="mono">{t.vehiclePlate ?? "—"}</td>
                  <td className="mono">★ {Number(t.rating).toFixed(2)}</td>
                  <td><span className={`chip pill-${t.status}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {showCreate && <CreateDispatchModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateDispatchModal({ onClose }: { onClose: () => void }) {
  const { data: tanks } = useTankSizes();
  const { data: districts } = useDistricts();

  const [service, setService] = useState("Соруулга");
  const [tankId, setTankId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [distanceKm, setDistanceKm] = useState("5");
  const [priority, setPriority] = useState("Энгийн");
  const [broadcastTo, setBroadcastTo] = useState<string[]>(DEFAULT_BROADCAST["Соруулга"]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function pickService(s: string) {
    setService(s);
    setBroadcastTo(DEFAULT_BROADCAST[s] ?? []);
  }

  function toggleRole(r: string) {
    setBroadcastTo((cur) => cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null);

    if (!tankId || !districtId || !address || !phone) {
      setError("Танк, дүүрэг, хаяг, утас шаардлагатай");
      return;
    }
    if (broadcastTo.length === 0) {
      setError("Дор хаяж нэг үүрэг сонгоно уу");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createDispatchOrder({
        service, tankId, districtId, address, phone,
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
        priority,
        distanceKm: Number(distanceKm) || 5,
        broadcastTo,
      });
      setSuccess(`✓ ${res.data.code} нээгдсэн · ${res.data.broadcastTo.length} үүрэгт`);
      // Reset
      setTankId(""); setDistrictId(""); setAddress(""); setPhone(""); setCustomerName(""); setNotes("");
    } catch (e: any) {
      setError(e?.message ?? "Алдаа");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-paper rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-paper border-b border-ink/10 px-5 py-4 flex justify-between items-center">
          <div>
            <div className="font-semibold text-lg">Шинэ дуудлага</div>
            <div className="text-xs text-ink/50">Нээлттэй broadcast — техникч уралдаж авна</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink/10">✕</button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Service */}
          <div>
            <div className="text-sm font-medium mb-1.5">Үйлчилгээ</div>
            <div className="grid grid-cols-3 gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => pickService(s)}
                  className={`px-3 py-2 rounded-md text-sm border transition ${
                    service === s
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-medium"
                      : "border-ink/10 hover:border-emerald-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label>
              <div className="text-sm font-medium mb-1.5">Танкны хэмжээ *</div>
              <select value={tankId} onChange={(e) => setTankId(e.target.value)} className="input">
                <option value="">Сонгоно уу</option>
                {tanks.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
            <label>
              <div className="text-sm font-medium mb-1.5">Дүүрэг *</div>
              <select value={districtId} onChange={(e) => setDistrictId(e.target.value)} className="input">
                <option value="">Сонгоно уу</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name ?? d.id}</option>)}
              </select>
            </label>
          </div>

          <label>
            <div className="text-sm font-medium mb-1.5">Хаяг *</div>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input" rows={2} placeholder="Жишээ: 1-р хороо, 23-р байрны 12 тоот" />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label>
              <div className="text-sm font-medium mb-1.5">Хэрэглэгчийн утас *</div>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input mono" placeholder="9911-2233" />
            </label>
            <label>
              <div className="text-sm font-medium mb-1.5">Хэрэглэгч</div>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input" placeholder="(заавал биш)" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label>
              <div className="text-sm font-medium mb-1.5">Зай (км)</div>
              <input type="number" min={0} value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} className="input mono" />
            </label>
            <label>
              <div className="text-sm font-medium mb-1.5">Тэргүүлэх</div>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>

          {/* Broadcast to */}
          <div>
            <div className="text-sm font-medium mb-1.5">
              Хэнд харагдах * <span className="text-ink/40 text-xs">(уралдаж авах техникчийн үүрэг)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TECH_ROLES.map((r) => {
                const on = broadcastTo.includes(r.key);
                return (
                  <label
                    key={r.key}
                    className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition ${
                      on ? "border-emerald-600 bg-emerald-50" : "border-ink/10 hover:border-emerald-400"
                    }`}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggleRole(r.key)} />
                    <span className="text-sm">{r.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <label>
            <div className="text-sm font-medium mb-1.5">Тэмдэглэл</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} placeholder="Нэмэлт мэдээлэл..." />
          </label>

          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
          {success && <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">{success}</div>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn flex-1">Хаах</button>
            <button type="submit" disabled={submitting} className="btn emerald flex-1">
              {submitting ? "Үүсгэж байна…" : "📡 Нээх →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
