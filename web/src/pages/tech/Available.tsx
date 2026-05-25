import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/client";
import { useAvailableOrders } from "@/lib/techHooks";
import { useRoles } from "@/lib/useRoles";
import { OrderDoc } from "@/lib/types";
import { Card, PageHeader, formatMNT } from "@/components/ui/Layout";

const claimOrder = httpsCallable<
  { orderId: string },
  { ok: boolean; orderId: string; technicianCode: string | null }
>(functions, "claimOrder");

const SERVICE_ICONS: Record<string, string> = {
  "Соруулга": "🚛",
  "Засвар": "🛠",
  "Суулгалт": "🚧",
};

export default function TechAvailable() {
  const nav = useNavigate();
  const { roles } = useRoles();
  const { data: orders, loading } = useAvailableOrders();

  const myTechRoles = roles.filter((r) => r.startsWith("tech_"));

  // Зөвхөн өөрийн үүрэгт тохирсон дуудлагыг харуулна
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const broadcastTo = (o as any).broadcastTo as string[] | undefined;
      if (!broadcastTo || broadcastTo.length === 0) return true;
      return myTechRoles.some((r) => broadcastTo.includes(r));
    });
  }, [orders, myTechRoles]);

  return (
    <div>
      <PageHeader
        title="Шинэ дуудлага"
        sub={loading
          ? "Ачааллаж байна…"
          : filtered.length > 0
            ? `${filtered.length} дуудлага · уралдааны горим`
            : "Одоогоор дуудлага алга"}
      />

      <div className="p-4 sm:p-8 space-y-3">
        {loading ? (
          <Card><div className="py-10 text-center text-sm text-ink/50">Ачааллаж байна…</div></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <div className="text-5xl mb-3 opacity-30">📡</div>
              <div className="font-medium">Нээлттэй дуудлага алга</div>
              <p className="text-sm text-ink/60 mt-1">
                Шинэ дуудлага гарангуут энд автоматаар харагдана. <br />
                <span className="text-[11px]">Real-time холбогдсон.</span>
              </p>
            </div>
          </Card>
        ) : (
          filtered.map((o) => (
            <AvailableOrderCard
              key={o.id}
              order={o}
              onClaimed={() => nav(`/tech/orders/${o.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AvailableOrderCard({ order: o, onClaimed }: { order: OrderDoc; onClaimed: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setBusy(true); setError(null);
    try {
      await claimOrder({ orderId: o.id });
      onClaimed();
    } catch (e: any) {
      const msg = e?.code === "functions/aborted" || /авагдсан/.test(e?.message ?? "")
        ? "⚡ Аль хэдийн өөр технич авчээ"
        : e?.message ?? "Алдаа гарлаа";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4 border-2 border-emerald-100 hover:border-emerald-400 transition">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{SERVICE_ICONS[o.service] ?? "📋"}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold">{o.service}</div>
            {o.priority === "Яаралтай" && (
              <span className="chip bg-red-100 text-red-700 border-transparent text-[10px] animate-pulse">
                ⚡ Яаралтай
              </span>
            )}
          </div>
          <div className="text-sm text-ink/60 mt-0.5">{o.tank}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-ink/40 text-[10px] uppercase">Хаяг</div>
          <div className="truncate">{(o as any).address || o.district || "—"}</div>
        </div>
        <div>
          <div className="text-ink/40 text-[10px] uppercase">Зай</div>
          <div className="mono">{o.distanceKm} км</div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-ink/5 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase text-ink/40">Орлого</div>
          <div className="mono font-semibold text-emerald-700">{formatMNT(o.totalPrice)}</div>
        </div>
        <button
          onClick={claim}
          disabled={busy}
          className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
        >
          {busy ? "Авч байна…" : "Авах →"}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {(o as any).customerPhone && (
        <div className="mt-2 text-[10px] text-ink/40">
          Утас: <span className="mono">{(o as any).customerPhone}</span>
        </div>
      )}
    </div>
  );
}
