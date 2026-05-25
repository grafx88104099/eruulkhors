import { useState } from "react";
import { addDoc, collection, deleteDoc, doc, limit, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/client";
import { useCollection } from "@/lib/hooks";
import { Card, PageHeader, formatMNT } from "@/components/ui/Layout";

interface ProductDoc {
  id: string;
  code: string;
  name: string;
  category: string;
  capacity: number;
  capacityUnit: string;
  price: number;
  description: string;
  features: string[];
  standard: string;
  photoURL: string;
  active: boolean;
}

const CATEGORIES = ["Бүгд", "Танк", "Бохирын худаг", "Дагалдах хэрэгсэл"];

export default function Products() {
  const { data: products, loading } = useCollection<ProductDoc>("products", limit(500));
  const [cat, setCat] = useState("Бүгд");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ProductDoc | "new" | null>(null);

  const filtered = products.filter((p) =>
    (cat === "Бүгд" || p.category === cat) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()))
  );
  const totalValue = filtered.reduce((s, p) => s + Number(p.price || 0), 0);

  return (
    <div>
      <PageHeader
        title="Бүтээгдэхүүн"
        sub={`${filtered.length} төрөл${loading ? " · ачааллаж байна…" : ""}`}
        right={<button onClick={() => setEditing("new")} className="btn primary">+ Шинэ бүтээгдэхүүн</button>}
      />

      <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-ink/50 uppercase tracking-wider">Нийт төрөл</div>
          <div className="text-3xl font-semibold mt-2 mono">{products.length}</div>
        </Card>
        <Card>
          <div className="text-xs text-ink/50 uppercase tracking-wider">Идэвхтэй</div>
          <div className="text-3xl font-semibold mt-2 mono text-ok">{products.filter((p) => p.active).length}</div>
        </Card>
        <Card>
          <div className="text-xs text-ink/50 uppercase tracking-wider">Танк</div>
          <div className="text-3xl font-semibold mt-2 mono">{products.filter((p) => p.category === "Танк").length}</div>
        </Card>
        <Card>
          <div className="text-xs text-ink/50 uppercase tracking-wider">Нийт каталог</div>
          <div className="text-3xl font-semibold mt-2 mono text-accent">{formatMNT(totalValue)}</div>
        </Card>

        <Card className="lg:col-span-4">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`chip ${cat === c ? "on" : ""}`}>
                  {c} <span className="opacity-50 mono ml-1">{c === "Бүгд" ? products.length : products.filter((p) => p.category === c).length}</span>
                </button>
              ))}
            </div>
            <input
              placeholder="Нэр, кодоор хайх…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-ink/10 rounded-md px-3 py-1.5 text-sm w-full sm:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-left text-ink/50 text-xs uppercase">
                <tr>
                  <th className="py-2 w-20">Зураг</th>
                  <th>Код</th>
                  <th>Нэр</th>
                  <th>Төрөл</th>
                  <th className="text-right">Багтаамж</th>
                  <th className="text-right">Үнэ</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-ink/5 hover:bg-ink/5">
                    <td className="py-2">
                      {p.photoURL ? (
                        <img src={p.photoURL} alt={p.name} className="w-14 h-14 object-contain bg-ink/5 rounded-md" />
                      ) : (
                        <div className="w-14 h-14 bg-ink/5 rounded-md flex items-center justify-center text-ink/30 text-xs">—</div>
                      )}
                    </td>
                    <td className="mono text-xs">{p.code}</td>
                    <td>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-ink/50">{p.description?.slice(0, 60)}{p.description?.length > 60 ? "…" : ""}</div>
                    </td>
                    <td className="text-xs text-ink/60">{p.category}</td>
                    <td className="text-right mono">{p.capacity} {p.capacityUnit}</td>
                    <td className="text-right mono font-medium">{formatMNT(p.price)}</td>
                    <td>
                      {p.active ? (
                        <span className="chip pill-idle">Идэвхтэй</span>
                      ) : (
                        <span className="chip pill-off">Идэвхгүй</span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => setEditing(p)} className="btn text-xs">Засах</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-ink/50 py-8 text-sm">Бүтээгдэхүүн олдсонгүй</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {editing && (
        <ProductEditor
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ProductEditor({ product, onClose, onDone }: {
  product: ProductDoc | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const isNew = !product;
  const [code, setCode] = useState(product?.code ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "Танк");
  const [capacity, setCapacity] = useState(product?.capacity ?? 0);
  const [capacityUnit, setCapacityUnit] = useState(product?.capacityUnit ?? "тн");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [description, setDescription] = useState(product?.description ?? "");
  const [featuresText, setFeaturesText] = useState((product?.features ?? []).join("\n"));
  const [standard, setStandard] = useState(product?.standard ?? "MNS 5924:20");
  const [photoURL, setPhotoURL] = useState(product?.photoURL ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!code.trim() || !name.trim()) { setErr("Код + нэр шаардлагатай"); return; }
    setBusy(true); setErr(null);
    try {
      const data = {
        code: code.trim(),
        name: name.trim(),
        category, capacity: Number(capacity), capacityUnit,
        price: Number(price),
        description: description.trim(),
        features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
        standard, photoURL, active,
        updatedAt: serverTimestamp(),
      };
      if (isNew) {
        await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
      } else {
        await updateDoc(doc(db, "products", product!.id), data);
      }
      onDone();
    } catch (ex: any) {
      setErr(ex.message ?? "Алдаа");
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!product) return;
    if (!confirm(`"${product.name}"-ийг устгах уу?`)) return;
    setBusy(true);
    try { await deleteDoc(doc(db, "products", product.id)); onDone(); }
    catch (ex: any) { setErr(ex.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/70" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-lg bg-paper text-ink space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold text-lg">{isNew ? "Шинэ бүтээгдэхүүн" : "Бүтээгдэхүүн засах"}</div>
            {!isNew && <div className="text-xs text-ink/50 mono">{product?.code}</div>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink/10">✕</button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-ink/60">Код</span>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TANK-3.0" className="w-full mt-1 border border-ink/10 rounded-md p-2 mono" />
            </label>
            <label className="block">
              <span className="text-xs text-ink/60">Төрөл</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 border border-ink/10 rounded-md p-2">
                <option>Танк</option>
                <option>Бохирын худаг</option>
                <option>Дагалдах хэрэгсэл</option>
                <option>Бусад</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-ink/60">Нэр</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 border border-ink/10 rounded-md p-2" />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs text-ink/60">Багтаамж</span>
              <input type="number" step="0.1" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full mt-1 border border-ink/10 rounded-md p-2 mono" />
            </label>
            <label className="block">
              <span className="text-xs text-ink/60">Нэгж</span>
              <select value={capacityUnit} onChange={(e) => setCapacityUnit(e.target.value)} className="w-full mt-1 border border-ink/10 rounded-md p-2">
                <option>тн</option>
                <option>л</option>
                <option>м³</option>
                <option>м</option>
                <option>мм</option>
                <option>ширхэг</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-ink/60">Үнэ (₮)</span>
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full mt-1 border border-ink/10 rounded-md p-2 mono" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-ink/60">Тайлбар</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full mt-1 border border-ink/10 rounded-md p-2" />
          </label>
          <label className="block">
            <span className="text-xs text-ink/60">Онцлог (мөр тус бүрт нэгийг)</span>
            <textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} rows={3} placeholder="100% битүүмжлэлтэй&#10;Дахин боловсруулсан пластик&#10;5 жилийн баталгаа" className="w-full mt-1 border border-ink/10 rounded-md p-2" />
          </label>
          <label className="block">
            <span className="text-xs text-ink/60">Зургийн URL</span>
            <div className="flex gap-2 items-start mt-1">
              <input value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="/products/tank-3.0.jpg" className="flex-1 border border-ink/10 rounded-md p-2 mono text-xs" />
              {photoURL && (
                <img src={photoURL} alt="" className="w-12 h-12 object-contain bg-ink/5 rounded-md" />
              )}
            </div>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-ink/60">Стандарт</span>
              <input value={standard} onChange={(e) => setStandard(e.target.value)} className="w-full mt-1 border border-ink/10 rounded-md p-2 mono" />
            </label>
            <label className="flex items-center gap-2 mt-5">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <span>Идэвхтэй</span>
            </label>
          </div>
        </div>

        {err && <div className="text-xs text-err">{err}</div>}

        <div className="flex gap-2 justify-end pt-2">
          {!isNew && (
            <button onClick={remove} disabled={busy} className="btn border-err/30 text-err hover:bg-err/5 mr-auto">Устгах</button>
          )}
          <button onClick={onClose} className="btn">Цуцлах</button>
          <button onClick={save} disabled={busy} className="btn primary">
            {busy ? "Хадгалж байна…" : "Хадгалах"}
          </button>
        </div>
      </div>
    </div>
  );
}
