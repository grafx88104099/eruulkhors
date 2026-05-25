import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/client";
import { useMyTechOrders, useMyTechnician, useCommissionRules } from "@/lib/techHooks";
import { ROLE_LABELS, useRoles } from "@/lib/useRoles";
import { Card, PageHeader, StatusPill, formatMNT } from "@/components/ui/Layout";

const ACTIVE_STATUSES = ["Хуваарилагдсан", "Зам дээр", "Гүйцэтгэж байна"];

export default function TechToday() {
  const u = auth.currentUser!;
  const { primaryRole, roles } = useRoles();
  const { data: technician } = useMyTechnician();
  const { data: orders, loading } = useMyTechOrders();
  const commissionRules = useCommissionRules();

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const myActive   = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const myToday    = orders.filter((o) => isToday(o.createdAt, todayStart));
  const doneToday  = myToday.filter((o) => o.status === "Дуусгасан");
  const current    = myActive[0];

  const techRole = roles.find((r) => r.startsWith("tech_")) ?? primaryRole;
  const rule = commissionRules.find((c) => c.role === techRole);
  const todayEarnings = rule
    ? doneToday.reduce((s, o) => s + (Number(o.totalPrice) || 0) * (rule.basePct / 100), 0)
    : 0;

  return (
    <div className="pb-20 lg:pb-8">
      <PageHeader
        title={`Сайн уу, ${u.displayName?.split(" ")[0] ?? "Хамтрагч"}!`}
        sub={technician
          ? `${technician.code} · ${ROLE_LABELS[technician.role] ?? technician.role}`
          : "Технич бүртгэл хүлээгдэж байна"}
        right={<TechStatusToggle uid={u.uid} status={technician?.status} />}
      />

      <div className="p-4 sm:p-8 space-y-4">
        {/* Today stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Идэвхтэй" value={myActive.length} tone="accent" />
          <StatCard label="Өнөөдөр дуусгасан" value={doneToday.length} tone="ok" />
          <StatCard label="Өнөөдрийн орлого" value={formatMNT(Math.round(todayEarnings))} tone="emerald" small />
        </div>

        {/* Current active job */}
        {current ? (
          <Card>
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-ink/40 mb-1">Идэвхтэй ажил</div>
                <div className="mono text-xs text-ink/50">{current.code}</div>
                <div className="font-semibold text-lg truncate">{current.customer}</div>
                <div className="text-sm text-ink/60 truncate">
                  {current.district ? `${current.district} · ` : ""}{current.service} · {current.tank}
                </div>
              </div>
              <StatusPill status={current.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="text-ink/60">ETA: <span className="mono">{current.eta || "—"}</span></div>
              <div className="mono font-semibold text-emerald-700">{formatMNT(current.totalPrice)}</div>
            </div>
            <Link
              to={`/tech/orders/${current.id}`}
              className="mt-4 block w-full text-center px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
            >
              Ажил руу орох →
            </Link>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-6">
              <div className="text-4xl mb-2">☕</div>
              <div className="font-medium">Идэвхтэй ажил алга</div>
              <p className="text-sm text-ink/60 mt-1">
                Шинэ захиалга оноогдох үед энд гарах болно.
              </p>
            </div>
          </Card>
        )}

        {/* Upcoming today */}
        <Card title={`Хүлээгдэж буй ажлууд (${myActive.length})`}>
          {loading ? (
            <div className="text-sm text-ink/50 py-6 text-center">Ачааллаж байна…</div>
          ) : myActive.length === 0 ? (
            <div className="text-sm text-ink/50 py-6 text-center">Хүлээгдэж буй ажил алга</div>
          ) : (
            <ul className="space-y-2">
              {myActive.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/tech/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-md hover:bg-ink/5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{o.customer}</div>
                      <div className="text-xs text-ink/60 mono truncate">
                        {o.code} · {o.eta || "—"}
                      </div>
                    </div>
                    <StatusPill status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/tech/orders" className="block mt-3 text-center text-sm text-emerald-700 hover:underline">
            Бүх захиалга харах →
          </Link>
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/tech/earnings" className="card p-4 hover:border-emerald-300 transition">
            <div className="text-2xl mb-1">💰</div>
            <div className="font-medium text-sm">Орлого</div>
            <div className="text-xs text-ink/60 mt-0.5">Сар, нийт төлбөр</div>
          </Link>
          <Link to="/tech/profile" className="card p-4 hover:border-emerald-300 transition">
            <div className="text-2xl mb-1">👤</div>
            <div className="font-medium text-sm">Профайл</div>
            <div className="text-xs text-ink/60 mt-0.5">Нэр, утас, мэдээлэл</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone, small }: { label: string; value: number | string; tone: "accent" | "ok" | "emerald"; small?: boolean }) {
  const toneClass =
    tone === "ok" ? "text-emerald-700" :
    tone === "emerald" ? "text-emerald-700" :
    "text-accent";
  return (
    <div className="card p-3">
      <div className="text-[10px] uppercase tracking-wider text-ink/40">{label}</div>
      <div className={`mono font-semibold mt-1 ${small ? "text-base" : "text-2xl"} ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function TechStatusToggle({ uid, status }: { uid: string; status?: "busy" | "idle" | "off" }) {
  const [busy, setBusy] = useState(false);
  if (!status) return null;
  // busy үед автомат — гараар сольж болохгүй
  if (status === "busy") {
    return <span className="chip pill-busy text-xs">Завгүй</span>;
  }
  async function toggle(next: "idle" | "off") {
    setBusy(true);
    try {
      await updateDoc(doc(db, "technicians", uid), { status: next, updatedAt: serverTimestamp() });
    } catch (e) { /* rule-rejected — silent */ }
    finally { setBusy(false); }
  }
  return (
    <div className="flex items-center gap-1 bg-ink/5 rounded-full p-0.5 text-xs">
      <button
        onClick={() => toggle("idle")}
        disabled={busy || status === "idle"}
        className={`px-3 py-1 rounded-full ${status === "idle" ? "bg-emerald-600 text-white" : "text-ink/60 hover:text-ink"}`}
      >
        Чөлөөтэй
      </button>
      <button
        onClick={() => toggle("off")}
        disabled={busy || status === "off"}
        className={`px-3 py-1 rounded-full ${status === "off" ? "bg-ink text-paper" : "text-ink/60 hover:text-ink"}`}
      >
        Завсар
      </button>
    </div>
  );
}

function isToday(ts: any, todayStart: Date): boolean {
  if (!ts) return false;
  const d = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
  if (!(d instanceof Date) || isNaN(d.getTime())) return false;
  return d.getTime() >= todayStart.getTime();
}
