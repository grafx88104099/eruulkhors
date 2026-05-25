import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/firebase/client";
import { OrderDoc } from "@/lib/types";
import { Card, PageHeader, StatusPill, formatMNT } from "@/components/ui/Layout";

interface Event {
  id: string;
  at?: any;
  title: string;
  meta?: string;
  state?: string;
}

const STATUS_STEPS = [
  "Хүлээгдэж буй",
  "Хуваарилагдсан",
  "Зам дээр",
  "Гүйцэтгэж байна",
  "Дуусгасан",
];

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState<OrderDoc | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "cancel" | "rate">(null);
  const [showRate, setShowRate] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsubO = onSnapshot(doc(db, "orders", id),
      (snap) => {
        setOrder(snap.exists() ? { id: snap.id, ...snap.data() } as OrderDoc : null);
        setLoading(false);
      },
      (e) => { setErr(e.message); setLoading(false); }
    );
    const unsubE = onSnapshot(query(collection(db, "orders", id, "events"), orderBy("at", "desc")),
      (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Event))),
    );
    return () => { unsubO(); unsubE(); };
  }, [id]);

  if (loading) return <div className="p-8 text-sm text-ink/60">Ачааллаж байна…</div>;
  if (err) return <div className="p-8 text-sm text-err">{err}</div>;
  if (!order) return <div className="p-8 text-sm text-ink/60">Захиалга олдсонгүй.</div>;

  const isCancelled = order.status === "Цуцлагдсан";
  const isCompleted = order.status === "Дуусгасан";
  const canCancel = order.status === "Хүлээгдэж буй";
  const canRate = isCompleted && !(order as any).rating;

  async function cancel() {
    if (!confirm("Захиалгыг цуцлах уу?")) return;
    setBusy("cancel");
    try {
      const fn = httpsCallable(functions, "cancelMyOrder");
      await fn({ orderId: id });
    } catch (ex: any) {
      alert(ex.message);
    } finally { setBusy(null); }
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div>
      <PageHeader
        title={order.code}
        sub={`${order.service} · ${order.tank}`}
        right={<Link to="/me" className="btn text-sm">← Буцах</Link>}
      />

      <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm text-ink/60">{order.district}</div>
              <div className="font-semibold mt-1">{(order as any).address ?? "—"}</div>
              <div className="text-xs text-ink/50 mono mt-1">{(order as any).customerPhone ?? "—"}</div>
            </div>
            <StatusPill status={order.status} />
          </div>

          {!isCancelled && (
            <div className="my-6">
              <div className="flex justify-between mb-2">
                {STATUS_STEPS.map((s, i) => {
                  const done = i <= currentStepIdx;
                  const active = i === currentStepIdx;
                  return (
                    <div key={s} className="flex-1 text-center">
                      <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${
                        done ? (active ? "bg-accent text-white ring-4 ring-accent/20" : "bg-ok text-white") : "bg-ink/10 text-ink/40"
                      }`}>
                        {done && !active ? "✓" : i + 1}
                      </div>
                      <div className={`mt-1 text-[10px] ${done ? "text-ink" : "text-ink/40"}`}>{s}</div>
                    </div>
                  );
                })}
              </div>
              <div className="h-1 bg-ink/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${(Math.max(0, currentStepIdx) / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-ink/50">Техникч</dt>
            <dd>{order.technicianCode ?? "Хуваарилагдаагүй"}</dd>
            <dt className="text-ink/50">ETA</dt>
            <dd className="mono">{order.eta}</dd>
            <dt className="text-ink/50">Зай</dt>
            <dd className="mono">{order.distanceKm} км</dd>
            <dt className="text-ink/50">Тэмдэглэл</dt>
            <dd>{(order as any).notes || "—"}</dd>
          </dl>

          {canCancel && (
            <button onClick={cancel} disabled={busy !== null} className="btn mt-5 border-err/30 text-err hover:bg-err/5">
              {busy === "cancel" ? "Цуцалж байна…" : "Захиалга цуцлах"}
            </button>
          )}
          {canRate && (
            <button onClick={() => setShowRate(true)} className="btn primary mt-5">
              ★ Үнэлгээ өгөх
            </button>
          )}
          {(order as any).rating && (
            <div className="mt-5 p-3 bg-ok/5 border border-ok/20 rounded-md">
              <div className="text-sm">Таны үнэлгээ: {"★".repeat((order as any).rating)}{"☆".repeat(5 - (order as any).rating)}</div>
              {(order as any).ratingComment && (
                <div className="text-xs text-ink/60 mt-1">"{(order as any).ratingComment}"</div>
              )}
            </div>
          )}
        </Card>

        <Card title="Үнэ">
          <div className="text-3xl font-semibold mono text-accent">{formatMNT(order.totalPrice)}</div>
          {order.priceBreakdown && (
            <table className="w-full text-xs mt-4">
              <tbody className="text-ink/60">
                <tr><td className="py-1">Танкаар</td><td className="text-right mono">{formatMNT(order.priceBreakdown.tankAdjusted)}</td></tr>
                <tr><td className="py-1">Зайн нэмэгдэл</td><td className="text-right mono">{formatMNT(order.priceBreakdown.distanceSurcharge)}</td></tr>
                {order.priceBreakdown.urgencyTotalPct > 0 && (
                  <tr><td className="py-1">Яаралтай {order.priceBreakdown.urgencyTotalPct}%</td><td className="text-right mono">{formatMNT(order.priceBreakdown.surchargeAmount)}</td></tr>
                )}
                <tr><td className="py-1">НӨАТ 10%</td><td className="text-right mono">{formatMNT(order.priceBreakdown.vatAmount)}</td></tr>
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Үйл явц" className="lg:col-span-3">
          {events.length === 0 ? (
            <p className="text-sm text-ink/50">Үйл явдал байхгүй.</p>
          ) : (
            <ol className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm border-l-2 border-accent/30 pl-3">
                  <div className="flex-1">
                    <div className="font-medium">{e.title}</div>
                    {e.meta && <div className="text-xs text-ink/60">{e.meta}</div>}
                  </div>
                  <div className="text-xs text-ink/50 mono">
                    {e.at?.toDate ? new Date(e.at.toDate()).toLocaleString("mn-MN") : ""}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {showRate && (
        <RateModal
          orderId={id!}
          onClose={() => setShowRate(false)}
          onDone={() => setShowRate(false)}
        />
      )}
    </div>
  );
}

function RateModal({ orderId, onClose, onDone }: { orderId: string; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setErr(null);
    try {
      const fn = httpsCallable(functions, "rateOrder");
      await fn({ orderId, rating, comment });
      onDone();
    } catch (ex: any) { setErr(ex.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/70" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-sm bg-paper text-ink space-y-4">
        <div className="text-lg font-semibold">Үйлчилгээг үнэлээрэй</div>
        <div className="flex justify-center gap-2 text-4xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} className={n <= rating ? "text-accent" : "text-ink/20"}>★</button>
          ))}
        </div>
        <textarea
          placeholder="Сэтгэгдэл (заавал биш)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full border border-ink/10 rounded-md p-2 text-sm"
        />
        {err && <div className="text-xs text-err">{err}</div>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn">Хаах</button>
          <button onClick={submit} disabled={busy} className="btn primary">{busy ? "Илгээж байна…" : "Илгээх"}</button>
        </div>
      </div>
    </div>
  );
}
