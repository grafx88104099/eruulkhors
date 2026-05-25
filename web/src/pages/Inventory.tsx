import { useMemo, useState } from "react";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/firebase/client";
import { useSKUs, useStockLevels, useStockMovements, useWarehouses } from "@/lib/hooks";
import { WarehouseDoc } from "@/lib/types";
import { Card, PageHeader, formatMNT } from "@/components/ui/Layout";
import LocationPicker, { LatLng } from "@/components/LocationPicker";

const recordStockMovement = httpsCallable<
  {
    warehouseCode: string;
    skuCode: string;
    type: "in" | "out" | "adjust";
    quantity: number;
    reason?: string;
    note?: string;
    unitCost?: number;
  },
  { ok: boolean; newStock: number; oldStock: number; movementId: string }
>(functions, "recordStockMovement");

interface MovementContext {
  warehouseCode?: string;
  skuCode?: string;
}

export default function Inventory() {
  const [whFilter, setWhFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseDoc | "new" | null>(null);
  const [movementCtx, setMovementCtx] = useState<MovementContext | null>(null);

  const whs = useWarehouses();
  const stock = useStockLevels();
  const skus = useSKUs();
  const movements = useStockMovements(20);

  const items = stock.data.filter((s) =>
    (whFilter === "ALL" || s.warehouseCode === whFilter) &&
    (!search || s.skuCode.toLowerCase().includes(search.toLowerCase()) || s.skuName.toLowerCase().includes(search.toLowerCase())),
  );
  const lowStock = items.filter((i) => i.isLow);
  const totalValue = items.reduce((s, i) => s + i.stock * i.skuCost, 0);

  return (
    <div>
      <PageHeader
        title="Агуулахын удирдлага"
        sub={`${whs.data.length} агуулах · ${items.length} SKU · ${formatMNT(totalValue)} нийт өртөг`}
        right={
          <div className="flex gap-2">
            <button
              onClick={() => setMovementCtx({})}
              className="btn emerald text-sm"
              disabled={whs.data.length === 0 || skus.data.length === 0}
            >
              ↕ Хөдөлгөөн
            </button>
            <button onClick={() => setEditingWarehouse("new")} className="btn primary text-sm">
              + Шинэ агуулах
            </button>
          </div>
        }
      />

      <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {whs.data.map((w) => (
          <WarehouseCard
            key={w.id}
            warehouse={w}
            stockCount={stock.data.filter((s) => s.warehouseCode === w.code).length}
            onFilter={() => setWhFilter(w.code)}
            onEdit={() => setEditingWarehouse(w)}
          />
        ))}

        {whs.data.length === 0 && (
          <Card className="lg:col-span-3">
            <div className="text-center py-10">
              <div className="text-4xl mb-2">📦</div>
              <div className="font-medium">Агуулах байхгүй байна</div>
              <p className="text-sm text-ink/60 mt-1 mb-4">
                Эхний агуулахаа үүсгэн нөөц удирдлагаа эхлүүлээрэй.
              </p>
              <button onClick={() => setEditingWarehouse("new")} className="btn primary">
                + Эхний агуулах үүсгэх
              </button>
            </div>
          </Card>
        )}

        <Card className="lg:col-span-2 overflow-x-auto">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              <button className={`chip ${whFilter === "ALL" ? "on" : ""}`} onClick={() => setWhFilter("ALL")}>Бүх агуулах</button>
              {whs.data.map((w) => (
                <button key={w.id} className={`chip ${whFilter === w.code ? "on" : ""}`} onClick={() => setWhFilter(w.code)}>{w.code}</button>
              ))}
            </div>
            <input
              placeholder="SKU эсвэл нэрээр хайх…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-ink/10 rounded-md px-3 py-1.5 text-sm w-full sm:w-56"
            />
          </div>
          <table className="w-full text-sm min-w-[680px]">
            <thead className="text-left text-ink/50 text-xs uppercase">
              <tr>
                <th className="py-2">SKU</th><th>Нэр</th><th>Төрөл</th>
                <th className="text-right">Нөөц</th><th className="text-right">Мин</th><th className="text-right">Өртөг</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className={`border-t border-ink/5 ${i.isCritical ? "bg-err/5" : i.isLow ? "bg-warn/5" : ""}`}>
                  <td className="py-2 mono text-xs">{i.skuCode}</td>
                  <td>{i.skuName}</td>
                  <td className="text-xs text-ink/60">{i.skuCategory}</td>
                  <td className="text-right mono">{i.stock} {i.skuUnit}</td>
                  <td className="text-right mono text-ink/50">{i.minThreshold}</td>
                  <td className="text-right mono">{formatMNT(i.skuCost)}</td>
                  <td className="text-right pr-2">
                    <button
                      onClick={() => setMovementCtx({ warehouseCode: i.warehouseCode, skuCode: i.skuCode })}
                      className="text-xs text-emerald-700 hover:underline whitespace-nowrap"
                    >
                      ↕ Хөдөлгөөн
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Хөдөлгөөний түүх */}
        <Card title={`Сүүлийн хөдөлгөөн (${movements.data.length})`} className="lg:col-span-3 overflow-x-auto">
          {movements.data.length === 0 ? (
            <p className="text-sm text-ink/50 text-center py-6">
              Хөдөлгөөн бүртгэгдээгүй. Дээрх "↕ Хөдөлгөөн" товчоор орлого/зарлага бүртгээрэй.
            </p>
          ) : (
            <table className="w-full text-sm min-w-[760px]">
              <thead className="text-left text-ink/50 text-xs uppercase">
                <tr>
                  <th className="py-2">Огноо</th>
                  <th>Төрөл</th>
                  <th>SKU</th>
                  <th>Агуулах</th>
                  <th className="text-right">Тоо</th>
                  <th className="text-right">Балансж</th>
                  <th>Шалтгаан</th>
                </tr>
              </thead>
              <tbody>
                {movements.data.map((m) => (
                  <tr key={m.id} className="border-t border-ink/5 hover:bg-ink/5">
                    <td className="py-2 text-xs text-ink/60 mono">{formatTs(m.createdAt)}</td>
                    <td>
                      <MovementBadge type={m.type} />
                    </td>
                    <td>
                      <div className="font-medium text-xs">{m.skuCode}</div>
                      <div className="text-[11px] text-ink/50 truncate max-w-[160px]">{m.skuName}</div>
                    </td>
                    <td className="mono text-xs">{m.warehouseCode}</td>
                    <td className="text-right mono font-semibold">
                      <span className={m.delta > 0 ? "text-emerald-700" : m.delta < 0 ? "text-red-700" : "text-ink/60"}>
                        {m.delta > 0 ? "+" : ""}{m.delta} {m.skuUnit ?? ""}
                      </span>
                    </td>
                    <td className="text-right mono text-xs text-ink/60">
                      {m.balanceBefore} → <span className="font-medium text-ink">{m.balanceAfter}</span>
                    </td>
                    <td className="text-xs text-ink/70 truncate max-w-[200px]">
                      {m.reason || m.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Шаардлагатай арга хэмжээ">
          {lowStock.length === 0 ? (
            <p className="text-sm text-ink/50">Нөөц хэвийн.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStock.map((i) => (
                <li key={i.id} className="border-l-2 border-accent pl-3">
                  <div className="font-medium">{i.skuCode}</div>
                  <div className="text-xs text-ink/60">{i.skuName}</div>
                  <div className="text-xs mono mt-1">
                    <span className={i.isCritical ? "text-err" : "text-warn"}>Үлдэгдэл {i.stock}</span>
                    <span className="text-ink/40"> / мин {i.minThreshold}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {editingWarehouse && (
        <WarehouseEditor
          warehouse={editingWarehouse === "new" ? null : editingWarehouse}
          stockCount={
            editingWarehouse === "new"
              ? 0
              : stock.data.filter((s) => s.warehouseCode === editingWarehouse.code).length
          }
          onClose={() => setEditingWarehouse(null)}
        />
      )}

      {movementCtx && (
        <StockMovementModal
          context={movementCtx}
          onClose={() => setMovementCtx(null)}
        />
      )}
    </div>
  );
}

function MovementBadge({ type }: { type: "in" | "out" | "adjust" }) {
  const config = {
    in:     { label: "Орлого",  cls: "bg-emerald-100 text-emerald-700" },
    out:    { label: "Зарлага", cls: "bg-red-100 text-red-700" },
    adjust: { label: "Засвар",  cls: "bg-amber-100 text-amber-700" },
  }[type];
  return <span className={`chip ${config.cls} border-transparent text-[10px]`}>{config.label}</span>;
}

function formatTs(ts: any): string {
  if (!ts) return "—";
  const d = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
  if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
  return d.toLocaleString("mn-MN", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

const IN_REASONS  = ["Худалдан авалт", "Шилжүүлэг ирсэн", "Буцаалт"];
const OUT_REASONS = ["Захиалга", "Засвар үйлчилгээ", "Шилжүүлэг гарсан", "Гэмтэл/хорогдол"];
const ADJUST_REASONS = ["Тооллого зөрсөн", "Алдааг засах"];

function StockMovementModal({
  context,
  onClose,
}: {
  context: MovementContext;
  onClose: () => void;
}) {
  const whs = useWarehouses();
  const skus = useSKUs();
  const stock = useStockLevels();

  const [type, setType] = useState<"in" | "out" | "adjust">("in");
  const [warehouseCode, setWarehouseCode] = useState(context.warehouseCode ?? "");
  const [skuCode, setSkuCode] = useState(context.skuCode ?? "");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [unitCost, setUnitCost] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentStock = useMemo(() => {
    if (!warehouseCode || !skuCode) return null;
    const row = stock.data.find((s) => s.warehouseCode === warehouseCode && s.skuCode === skuCode);
    return row ? { stock: row.stock, unit: row.skuUnit, min: row.minThreshold } : null;
  }, [stock.data, warehouseCode, skuCode]);

  const qtyNum = Number(quantity);
  const delta = type === "in" ? Math.abs(qtyNum) : type === "out" ? -Math.abs(qtyNum) : qtyNum;
  const projectedStock = currentStock ? currentStock.stock + (Number.isFinite(delta) ? delta : 0) : null;

  const reasonOptions = type === "in" ? IN_REASONS : type === "out" ? OUT_REASONS : ADJUST_REASONS;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null);

    if (!warehouseCode || !skuCode) { setError("Агуулах ба SKU сонгоно уу"); return; }
    if (!Number.isFinite(qtyNum) || qtyNum === 0) { setError("Хүчинтэй тоо оруулна уу"); return; }
    if ((type === "in" || type === "out") && qtyNum <= 0) { setError("Орлого/зарлагад эерэг тоо"); return; }

    setSubmitting(true);
    try {
      const cost = Number(unitCost);
      const res = await recordStockMovement({
        warehouseCode,
        skuCode,
        type,
        quantity: qtyNum,
        reason: reason || undefined,
        note: note.trim() || undefined,
        unitCost: Number.isFinite(cost) && cost > 0 ? cost : undefined,
      });
      setSuccess(`✓ ${res.data.oldStock} → ${res.data.newStock}`);
      setQuantity(""); setNote(""); setReason("");
    } catch (e: any) {
      setError(e?.message ?? "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-paper rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-paper border-b border-ink/10 px-5 py-4 flex justify-between items-center">
          <div>
            <div className="font-semibold text-lg">Нөөцийн хөдөлгөөн</div>
            <div className="text-xs text-ink/50">Орлого / Зарлага / Засвар</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink/10">✕</button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {([
              { k: "in",     label: "📥 Орлого",  cls: "border-emerald-600 bg-emerald-50 text-emerald-700" },
              { k: "out",    label: "📤 Зарлага", cls: "border-red-500 bg-red-50 text-red-700" },
              { k: "adjust", label: "✎ Засвар",   cls: "border-amber-500 bg-amber-50 text-amber-700" },
            ] as const).map((opt) => (
              <button
                key={opt.k}
                type="button"
                onClick={() => { setType(opt.k); setReason(""); }}
                className={`px-3 py-2 rounded-md text-sm border font-medium transition ${
                  type === opt.k ? opt.cls : "border-ink/10 hover:border-ink/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Warehouse + SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm font-medium mb-1.5">Агуулах *</div>
              <select value={warehouseCode} onChange={(e) => setWarehouseCode(e.target.value)} className="input">
                <option value="">Сонгоно уу</option>
                {whs.data.map((w) => <option key={w.id} value={w.code}>{w.code} · {w.name}</option>)}
              </select>
            </label>
            <label className="block">
              <div className="text-sm font-medium mb-1.5">SKU *</div>
              <select value={skuCode} onChange={(e) => setSkuCode(e.target.value)} className="input">
                <option value="">Сонгоно уу</option>
                {skus.data.map((s) => (
                  <option key={s.id} value={s.code}>{s.code} · {s.name}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Current stock display */}
          {currentStock && (
            <div className="rounded-md bg-ink/5 px-3 py-2 text-sm flex items-center justify-between">
              <span className="text-ink/60">Одоогийн нөөц</span>
              <span className="mono font-medium">
                {currentStock.stock} {currentStock.unit}
                {currentStock.min > 0 && (
                  <span className="text-ink/40"> / мин {currentStock.min}</span>
                )}
              </span>
            </div>
          )}

          {/* Quantity */}
          <label className="block">
            <div className="text-sm font-medium mb-1.5">
              Тоо хэмжээ * <span className="text-[11px] text-ink/40">
                {type === "adjust" ? "(+/- тоо)" : "(эерэг тоо)"}
              </span>
            </div>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input mono text-lg"
              placeholder={type === "adjust" ? "+ эсвэл - утга" : "100"}
            />
          </label>

          {/* Projected balance */}
          {projectedStock !== null && quantity && Number.isFinite(qtyNum) && qtyNum !== 0 && (
            <div className={`rounded-md px-3 py-2 text-sm flex items-center justify-between ${
              projectedStock < 0 ? "bg-red-50 text-red-700"
              : projectedStock <= (currentStock?.min ?? 0) ? "bg-amber-50 text-amber-800"
              : "bg-emerald-50 text-emerald-800"
            }`}>
              <span>Хөдөлгөөний дараа</span>
              <span className="mono font-semibold">
                {currentStock?.stock} <span className="opacity-60">→</span> {projectedStock}
                {projectedStock < 0 && " ⚠"}
              </span>
            </div>
          )}

          {/* Reason chips */}
          <div>
            <div className="text-sm font-medium mb-1.5">Шалтгаан</div>
            <div className="flex flex-wrap gap-1.5">
              {reasonOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(reason === r ? "" : r)}
                  className={`chip text-xs ${reason === r ? "on" : ""}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <label className="block">
            <div className="text-sm font-medium mb-1.5">Тэмдэглэл</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="input"
              placeholder="Нэмэлт мэдээлэл..."
            />
          </label>

          {/* Unit cost (in only) */}
          {type === "in" && (
            <label className="block">
              <div className="text-sm font-medium mb-1.5">
                Нэгжийн өртөг (₮) <span className="text-[11px] text-ink/40">(орлогын үед — SKU-ийн default-ыг overlay)</span>
              </div>
              <input
                type="number"
                min={0}
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="input mono"
                placeholder="(заавал биш)"
              />
            </label>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 break-words">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              {success}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn flex-1">Хаах</button>
            <button type="submit" disabled={submitting} className={`flex-1 btn ${
              type === "in" ? "emerald" : type === "out" ? "primary" : ""
            }`}>
              {submitting ? "Бүртгэж байна…" : "Бүртгэх →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WarehouseCard({
  warehouse: w,
  stockCount,
  onFilter,
  onEdit,
}: {
  warehouse: WarehouseDoc;
  stockCount: number;
  onFilter: () => void;
  onEdit: () => void;
}) {
  return (
    <Card>
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-ink/50 mono">{w.code}</div>
          <div className="font-semibold truncate">{w.name}</div>
          <div className="text-xs text-ink/50 truncate">{w.location}</div>
        </div>
        <button
          onClick={onEdit}
          className="text-ink/40 hover:text-ink w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center"
          title="Засах"
        >
          ⋯
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-ink/40 text-[10px] uppercase">Багтаамж</div>
          <div className="mono">{w.capacity}м²</div>
        </div>
        <div>
          <div className="text-ink/40 text-[10px] uppercase">SKU</div>
          <div className="mono">{stockCount}</div>
        </div>
        <div>
          <div className="text-ink/40 text-[10px] uppercase">Менежер</div>
          <div className="truncate">{w.manager}</div>
        </div>
      </div>
      {w.geo && (
        <a
          href={`https://www.google.com/maps?q=${w.geo.lat},${w.geo.lng}`}
          target="_blank"
          rel="noopener"
          className="mt-2 inline-flex items-center gap-1 text-[11px] mono text-emerald-700 hover:underline"
        >
          📍 {w.geo.lat.toFixed(5)}, {w.geo.lng.toFixed(5)}
        </a>
      )}
      <button onClick={onFilter} className="chip mt-3 text-xs">Нөөц шүүх →</button>
    </Card>
  );
}

function WarehouseEditor({
  warehouse,
  stockCount,
  onClose,
}: {
  warehouse: WarehouseDoc | null;
  stockCount: number;
  onClose: () => void;
}) {
  const isNew = warehouse === null;
  const [code, setCode] = useState(warehouse?.code ?? "");
  const [name, setName] = useState(warehouse?.name ?? "");
  const [location, setLocation] = useState(warehouse?.location ?? "");
  const [capacity, setCapacity] = useState<string>(String(warehouse?.capacity ?? ""));
  const [manager, setManager] = useState(warehouse?.manager ?? "");
  const [geo, setGeo] = useState<LatLng | null>(warehouse?.geo ?? null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const codeClean = code.trim().toUpperCase();
    if (!codeClean || !name.trim() || !location.trim()) {
      setError("Код, нэр, байршил шаардлагатай");
      return;
    }
    if (!/^[A-Z0-9-]{2,20}$/.test(codeClean)) {
      setError("Код нь зөвхөн том үсэг, тоо, зураас (2-20 тэмдэгт)");
      return;
    }
    const capacityNum = Number(capacity);
    if (capacity && (!Number.isFinite(capacityNum) || capacityNum < 0)) {
      setError("Багтаамж хүчингүй");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: codeClean,
        name: name.trim(),
        location: location.trim(),
        capacity: capacityNum || 0,
        manager: manager.trim(),
        geo: geo,
        updatedAt: serverTimestamp(),
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      };
      await setDoc(doc(db, "warehouses", codeClean), payload, { merge: !isNew });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!warehouse) return;
    if (stockCount > 0) {
      setError(`Энэ агуулахад ${stockCount} SKU хадгалагдсан тул устгах боломжгүй.`);
      return;
    }
    setSaving(true); setError(null);
    try {
      await deleteDoc(doc(db, "warehouses", warehouse.id));
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Устгах үед алдаа");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-paper rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-paper border-b border-ink/10 px-5 py-4 flex justify-between items-center">
          <div>
            <div className="font-semibold text-lg">
              {isNew ? "Шинэ агуулах" : "Агуулах засах"}
            </div>
            {!isNew && <div className="text-xs text-ink/50 mono">{warehouse.code}</div>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink/10">✕</button>
        </div>

        <form onSubmit={save} className="p-5 space-y-4">
          <label className="block">
            <div className="text-sm font-medium mb-1.5">Код *</div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={!isNew}
              className="input mono uppercase disabled:bg-ink/5 disabled:text-ink/60"
              placeholder="WH-03"
            />
            {isNew && (
              <p className="text-[11px] text-ink/40 mt-1">Жишээ: WH-01 · 2-20 тэмдэгт, А-Я, 0-9, зураас</p>
            )}
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1.5">Нэр *</div>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Жишээ: Төв агуулах" />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1.5">Байршил *</div>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="input" placeholder="Баянзүрх дүүрэг, 10-р хороо" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm font-medium mb-1.5">Багтаамж (м²)</div>
              <input
                type="number"
                min={0}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="input mono"
                placeholder="500"
              />
            </label>
            <label className="block">
              <div className="text-sm font-medium mb-1.5">Менежер</div>
              <input value={manager} onChange={(e) => setManager(e.target.value)} className="input" placeholder="Б.Эрдэнэ" />
            </label>
          </div>

          {/* Газрын зураг — цэг хатгах */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-sm font-medium">Газрын зургийн координат</div>
              {geo && (
                <button
                  type="button"
                  onClick={() => setGeo(null)}
                  className="text-xs text-ink/50 hover:text-red-700"
                >
                  Цэвэрлэх
                </button>
              )}
            </div>
            <LocationPicker value={geo} onChange={setGeo} height={220} />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn flex-1">Хаах</button>
            <button type="submit" disabled={saving} className="btn primary flex-1">
              {saving ? "Хадгалж байна…" : isNew ? "Үүсгэх" : "Хадгалах"}
            </button>
          </div>

          {/* Delete section — edit mode only */}
          {!isNew && (
            <div className="pt-4 mt-2 border-t border-ink/10">
              {!confirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium transition"
                >
                  🗑 Энэ агуулахыг устгах
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-3">
                    {stockCount > 0 ? (
                      <>
                        ⚠ Энэ агуулахад <span className="mono font-medium">{stockCount}</span> SKU бүртгэлтэй.
                        Эхлээд бүх нөөцийг шилжүүлж/устгана уу.
                      </>
                    ) : (
                      <>Та <span className="mono font-medium">{warehouse.code}</span> агуулахыг бүрмөсөн устгах гэж байна. Энэ үйлдлийг буцаах боломжгүй.</>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="btn flex-1"
                    >
                      Цуцлах
                    </button>
                    <button
                      type="button"
                      onClick={remove}
                      disabled={saving || stockCount > 0}
                      className="flex-1 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition"
                    >
                      {saving ? "Устгаж байна…" : "Бүрмөсөн устгах"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
