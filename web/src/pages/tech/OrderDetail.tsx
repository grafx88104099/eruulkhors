import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { OrderDoc } from "@/lib/types";
import { Card, PageHeader, StatusPill, formatMNT } from "@/components/ui/Layout";

const WORKFLOW_STEPS_BY_SERVICE: Record<string, string[]> = {
  "Соруулга": [
    "Очсон газартаа ирлээ",
    "Танкны байршил шалгасан",
    "Хоолой холбосон",
    "Соруулга эхлүүлсэн",
    "Хог хаягдал ачсан",
    "Талбайг цэвэрлэсэн",
    "Хэрэглэгчийн гарын үсэг авсан",
  ],
  "Засвар": [
    "Очсон газартаа ирлээ",
    "Эвдрэлийг шалгасан",
    "Сэлбэг бэлдсэн",
    "Засвар эхлүүлсэн",
    "Туршилт хийсэн",
    "Хэрэглэгчид хүлээлгэн өгсөн",
  ],
  "Суулгалт": [
    "Очсон газартаа ирлээ",
    "Газар шороо шалгасан",
    "Танк суурилуулсан",
    "Систем холбосон",
    "Туршилт хийсэн",
    "Хэрэглэгчид хүлээлгэн өгсөн",
  ],
};

interface OrderEvent {
  id: string;
  at?: any;
  title: string;
  state: string;
}

export default function TechOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [order, setOrder] = useState<OrderDoc | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "orders", id), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as OrderDoc);
      } else {
        setOrder(null);
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "orders", id, "events"), orderBy("at", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderEvent)));
    }, () => {});
    return () => unsub();
  }, [id]);

  async function transition(nextStatus: string) {
    if (!id) return;
    setBusy(true); setError(null);
    try {
      await updateDoc(doc(db, "orders", id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "orders", id, "events"), {
        at: serverTimestamp(),
        title: `Статус → ${nextStatus}`,
        state: "done",
      });
    } catch (e: any) {
      setError(e?.message ?? "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  async function logStep(title: string) {
    if (!id) return;
    try {
      await addDoc(collection(db, "orders", id, "events"), {
        at: serverTimestamp(),
        title,
        state: "done",
      });
    } catch (e: any) {
      setError(e?.message ?? "Алдаа");
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-ink/60">Ачааллаж байна…</div>;
  }
  if (!order) {
    return (
      <div className="p-8">
        <Card>
          <div className="text-center py-10">
            <div className="text-4xl mb-2">⚠️</div>
            <div className="font-medium">Захиалга олдсонгүй</div>
            <Link to="/tech/orders" className="btn mt-4 inline-block">← Бүх захиалга руу</Link>
          </div>
        </Card>
      </div>
    );
  }

  const steps = WORKFLOW_STEPS_BY_SERVICE[order.service] ?? WORKFLOW_STEPS_BY_SERVICE["Соруулга"];
  const completedSteps = new Set(
    events.filter((e) => steps.includes(e.title)).map((e) => e.title),
  );
  const nextStepIdx = steps.findIndex((s) => !completedSteps.has(s));

  return (
    <div className="pb-20 lg:pb-8">
      <PageHeader
        title={order.customer}
        sub={`${order.code} · ${order.service} · ${order.tank}`}
        right={
          <button onClick={() => nav(-1)} className="btn text-xs">← Буцах</button>
        }
      />

      <div className="p-4 sm:p-8 space-y-4 max-w-2xl mx-auto">
        {/* Status + actions */}
        <Card>
          <div className="flex items-center justify-between">
            <StatusPill status={order.status} />
            <span className="mono font-semibold text-emerald-700">{formatMNT(order.totalPrice)}</span>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            {order.status === "Хуваарилагдсан" && (
              <button
                disabled={busy}
                onClick={() => transition("Зам дээр")}
                className="btn primary flex-1"
              >
                🚗 Замд гарсан
              </button>
            )}
            {order.status === "Зам дээр" && (
              <button
                disabled={busy}
                onClick={() => transition("Гүйцэтгэж байна")}
                className="btn primary flex-1"
              >
                🛠 Ажил эхлэв
              </button>
            )}
            {order.status === "Гүйцэтгэж байна" && (
              <button
                disabled={busy || completedSteps.size < steps.length}
                onClick={() => transition("Дуусгасан")}
                className="btn emerald flex-1"
                title={completedSteps.size < steps.length ? "Бүх алхмыг дуусгана уу" : ""}
              >
                ✓ Захиалгыг дуусгах
              </button>
            )}
            {(order.status === "Дуусгасан" || order.status === "Цуцлагдсан") && (
              <div className="text-sm text-ink/60 py-2">Энэ захиалга хаагдсан.</div>
            )}
          </div>

          {error && (
            <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
        </Card>

        {/* Customer info */}
        <Card title="Хэрэглэгч">
          <dl className="text-sm space-y-2">
            <Row label="Хаяг">{order.district ?? "—"}</Row>
            <Row label="Зай"><span className="mono">{order.distanceKm} км</span></Row>
            <Row label="ETA"><span className="mono">{order.eta || "—"}</span></Row>
            {order.notes && <Row label="Тэмдэглэл">{order.notes}</Row>}
          </dl>
        </Card>

        {/* Workflow steps */}
        {(order.status === "Гүйцэтгэж байна" || order.status === "Зам дээр" || order.status === "Дуусгасан") && (
          <Card title={`Ажлын явц (${completedSteps.size}/${steps.length})`}>
            <ol className="space-y-2.5">
              {steps.map((s, i) => {
                const done = completedSteps.has(s);
                const isNext = !done && i === nextStepIdx;
                const disabled = order.status !== "Гүйцэтгэж байна" || done || !isNext;
                return (
                  <li key={s} className="flex items-center gap-3">
                    <button
                      disabled={disabled}
                      onClick={() => logStep(s)}
                      className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium shrink-0 transition ${
                        done
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : isNext
                          ? "border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                          : "border-ink/15 text-ink/30"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </button>
                    <span className={`text-sm ${done ? "text-ink/40 line-through" : "text-ink"}`}>{s}</span>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}

        {/* Event log */}
        {events.length > 0 && (
          <Card title="Үйл явдлын түүх">
            <ul className="space-y-2 text-xs">
              {events.slice().reverse().map((e) => (
                <li key={e.id} className="flex justify-between gap-3 py-1 border-b border-ink/5 last:border-0">
                  <span className="truncate">{e.title}</span>
                  <span className="mono text-ink/40 shrink-0">{formatTime(e.at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2 items-baseline">
      <dt className="text-ink/50 text-xs">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function formatTime(ts: any): string {
  if (!ts) return "—";
  const d = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
  if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" });
}
