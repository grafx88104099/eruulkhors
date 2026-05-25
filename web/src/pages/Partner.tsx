import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/firebase/client";
import { homeForRoles } from "@/lib/useRoles";
import AuthModal from "@/components/AuthModal";
import { BrandMark } from "@/components/BrandMark";

const ROLE_OPTIONS = [
  { key: "tech_install", label: "Суулгагч",   desc: "Септик систем суурилуулах ажил" },
  { key: "tech_pump",    label: "Соруулагч",  desc: "Бохир соруулах техник ажиллуулах" },
  { key: "tech_repair",  label: "Засварчин",  desc: "Систем засвар, үйлчилгээ" },
  { key: "tech_driver",  label: "Жолооч",     desc: "Хүргэлт, тээвэрлэлт" },
] as const;

const UB_DISTRICTS = [
  "Багануур", "Багахангай", "Баянгол", "Баянзүрх", "Налайх",
  "Сонгинохайрхан", "Сүхбаатар", "Хан-Уул", "Чингэлтэй",
];

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  companyName: string;
  roles: string[];
  districts: string[];
  experienceYears: string;
  vehicleInfo: string;
  note: string;
}

const INITIAL: FormState = {
  fullName: "",
  phone: "",
  email: "",
  companyName: "",
  roles: [],
  districts: [],
  experienceYears: "",
  vehicleInfo: "",
  note: "",
};

type AuthMode = "login" | "signup";

export default function Partner() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [home, setHome] = useState<string>("/tech");

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const t = await u.getIdTokenResult();
        const claims: any = t.claims;
        const rs = Array.isArray(claims.roles) ? claims.roles : claims.role ? [claims.role] : ["customer"];
        setHome(homeForRoles(rs));
      }
    });
  }, []);

  function toggle(list: keyof Pick<FormState, "roles" | "districts">, value: string) {
    setForm((f) => {
      const cur = f[list];
      return { ...f, [list]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.fullName.trim().length < 2) {
      setError("Бүтэн нэрээ оруулна уу"); return;
    }
    if (form.phone.trim().length < 6) {
      setError("Утасны дугаар буруу байна"); return;
    }
    if (form.roles.length === 0) {
      setError("Хийх боломжтой үйлчилгээгээ сонгоно уу"); return;
    }

    setSubmitting(true);
    try {
      const expYears = Number(form.experienceYears);
      await addDoc(collection(db, "partner_applications"), {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        companyName: form.companyName.trim(),
        roles: form.roles,
        districts: form.districts,
        experienceYears: Number.isFinite(expYears) && expYears >= 0 ? expYears : 0,
        vehicleInfo: form.vehicleInfo.trim(),
        note: form.note.trim(),
        status: "pending",
        source: "web_landing",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setForm(INITIAL);
    } catch (err: any) {
      setError(err?.message ?? "Хүсэлт илгээхэд алдаа гарлаа. Та дахин оролдоно уу.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-paper text-ink min-h-screen">
      {/* ───────── Header ───────── */}
      <header className="fixed top-0 inset-x-0 z-30 bg-paper/80 backdrop-blur border-b border-ink/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="font-semibold text-lg flex items-center gap-2 min-w-0">
            <BrandMark size={20} />
            <span className="truncate">eruulkhors</span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <Link
                to={home}
                className="px-4 py-1.5 rounded-md text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                Системд орох →
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setAuthMode("login")}
                  className="px-3 py-1.5 rounded-md text-sm hover:bg-ink/5"
                >
                  Нэвтрэх
                </button>
                <a
                  href="#apply"
                  className="hidden sm:inline-block px-4 py-1.5 rounded-md text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Бүртгүүлэх
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative pt-32 pb-16 px-4 sm:px-8 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-paper overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 chip border border-emerald-300/30 text-emerald-200 mb-5">
            🔧 Үйлчилгээ үзүүлэгчдийн сүлжээнд нэгдээрэй
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
            Pластик Центр-ийн <span className="text-emerald-300">хамтрагч</span> болоорой
          </h1>
          <p className="mt-5 text-base sm:text-lg text-paper/85 max-w-2xl mx-auto">
            Хээрийн ажилтан, соруулагч, засварчин, жолооч нараа орон даяар бүртгэж байна.
            Тогтмол захиалга, шударга үнэлгээ, орчин үеийн мобайл аппликейшнтэй.
          </p>
          <div className="mt-8 flex gap-3 justify-center flex-wrap">
            {user ? (
              <Link
                to={home}
                className="px-7 py-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-ink font-medium text-base transition"
              >
                Системд орох →
              </Link>
            ) : (
              <>
                <a
                  href="#apply"
                  className="px-7 py-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-ink font-medium text-base transition"
                >
                  Бүртгүүлэх хүсэлт →
                </a>
                <button
                  onClick={() => setAuthMode("login")}
                  className="px-7 py-3 rounded-md border border-paper/30 hover:bg-paper/10 text-base transition"
                >
                  Нэвтрэх
                </button>
              </>
            )}
          </div>
          <p className="mt-4 text-sm text-paper/60">
            Аль хэдийн зөвшөөрөгдсөн үү? <button onClick={() => setAuthMode("login")} className="underline hover:text-paper">Энд нэвтэрнэ үү</button>
          </p>
        </div>
      </section>

      {/* ───────── Why partner ───────── */}
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs uppercase tracking-wider text-emerald-700 mb-3 font-medium">Яагаад манайтай?</div>
            <h2 className="text-3xl font-semibold">Хамтрагчдад өгөх боломжууд</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "📲", title: "Мобайл аппликейшн", desc: "Захиалга, навигаци, гарын үсэг, тайлан утсан дээр шууд" },
              { icon: "💰", title: "Тогтмол орлого", desc: "Өдөр тутамын захиалга, ил тод үнэлгээ, шударга commission" },
              { icon: "🛠", title: "Дэмжлэг", desc: "Сургалт, материал, dispatcher-ийн тусламжтай" },
              { icon: "🗺", title: "Дүүрэг сонгох", desc: "Танд тохиромжтой бүс нутгийн захиалга л очно" },
              { icon: "⭐", title: "Үнэлгээ", desc: "Чанартай ажиллаж байгаа үед нэмэлт бонус, эрэмбэлэлт" },
              { icon: "📈", title: "Хөгжих", desc: "Манай үйлчилгээний хүрээ тэлэхэд та хамтдаа өсөнө" },
            ].map((f) => (
              <div key={f.title} className="card p-5">
                <div className="text-3xl">{f.icon}</div>
                <div className="font-semibold mt-2">{f.title}</div>
                <div className="text-sm text-ink/60 mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Apply form ───────── */}
      <section id="apply" className="py-16 px-4 sm:px-8 bg-paper-soft">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-xs uppercase tracking-wider text-emerald-700 mb-3 font-medium">Бүртгүүлэх</div>
            <h2 className="text-3xl font-semibold">Үйлчилгээ үзүүлэгчээр бүртгүүлэх хүсэлт</h2>
            <p className="text-ink/60 mt-3">
              Доорх маягтыг бөглөвөл манай dispatcher тантай 1-3 ажлын өдөрт холбогдоно.
            </p>
          </div>

          {submitted ? (
            <div className="card p-10 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">Хүсэлт амжилттай илгээгдлээ</h3>
              <p className="text-ink/60 mb-6">
                Манай баг таны хүсэлтийг хянаад утсаар, эсвэл и-мэйлээр удахгүй холбогдох болно.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link to="/" className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium">
                  Нүүр хуудас руу буцах
                </Link>
                <button onClick={() => setSubmitted(false)} className="px-5 py-2.5 rounded-md border border-ink/15 hover:bg-ink/5 text-sm">
                  Шинэ хүсэлт илгээх
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="card p-6 sm:p-8 space-y-6">
              {/* Personal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Бүтэн нэр *">
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="input"
                    placeholder="Ж: Бат-Эрдэнэ Ган-Эрдэнэ"
                  />
                </Field>
                <Field label="Утас *">
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input mono"
                    placeholder="9911-2233"
                  />
                </Field>
                <Field label="И-мэйл">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input"
                    placeholder="example@mail.com"
                  />
                </Field>
                <Field label="Байгууллагын нэр">
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="input"
                    placeholder="(хувь хүн бол хоосон)"
                  />
                </Field>
              </div>

              {/* Roles */}
              <div>
                <div className="text-sm font-medium mb-2">Хийх боломжтой үйлчилгээ * <span className="text-ink/40 font-normal">(олныг сонгож болно)</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((r) => {
                    const active = form.roles.includes(r.key);
                    return (
                      <label
                        key={r.key}
                        className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition ${
                          active
                            ? "border-emerald-600 bg-emerald-50"
                            : "border-ink/10 hover:border-emerald-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggle("roles", r.key)}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-sm font-medium">{r.label}</div>
                          <div className="text-xs text-ink/60">{r.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Districts */}
              <div>
                <div className="text-sm font-medium mb-2">Үйлчлэх дүүрэг <span className="text-ink/40 font-normal">(олныг сонгож болно)</span></div>
                <div className="flex flex-wrap gap-2">
                  {UB_DISTRICTS.map((d) => {
                    const active = form.districts.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggle("districts", d)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${
                          active
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-paper border-ink/15 text-ink/70 hover:border-emerald-400"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Туршлага (жилээр)">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                    className="input mono"
                    placeholder="0"
                  />
                </Field>
                <Field label="Тээврийн хэрэгсэл">
                  <input
                    type="text"
                    value={form.vehicleInfo}
                    onChange={(e) => setForm({ ...form, vehicleInfo: e.target.value })}
                    className="input"
                    placeholder="Ж: Hyundai HD78 (2018), сорогч"
                  />
                </Field>
              </div>

              <Field label="Нэмэлт мэдээлэл">
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={3}
                  className="input"
                  placeholder="Өөрийн тухай, ажиллах хүсэлтэй цаг, тоног төхөөрөмж..."
                />
              </Field>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-xs text-ink/50">
                  Хүсэлт илгээснээр та манай үйлчилгээний нөхцлийг хүлээн зөвшөөрсөнд тооцно.
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition"
                >
                  {submitting ? "Илгээж байна..." : "Хүсэлт илгээх →"}
                </button>
              </div>
            </form>
          )}

          <div className="text-center mt-8 text-sm text-ink/60">
            Эсвэл утсаар шууд холбогдоорой:{" "}
            <a href="tel:70004308" className="font-medium mono text-emerald-700">7000-4308</a>
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="bg-ink text-paper py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-paper/60">
          <span>© 2026 Plastic Center LLC · Бүх эрх хуулиар хамгаалагдсан</span>
          <Link to="/" className="hover:text-paper">← Нүүр хуудас</Link>
        </div>
      </footer>

      <AuthModal
        open={authMode !== null}
        initialMode={authMode ?? "login"}
        audience="partner"
        onClose={() => setAuthMode(null)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-medium mb-1.5">{label}</div>
      {children}
    </label>
  );
}
