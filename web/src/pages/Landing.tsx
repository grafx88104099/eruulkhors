import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "@/firebase/client";
import { homeForRoles } from "@/lib/useRoles";
import AuthModal, { Audience } from "@/components/AuthModal";
import { BrandMark } from "@/components/BrandMark";

interface CatalogProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  capacity: number;
  capacityUnit: string;
  price: number;
  description: string;
  features: string[];
  photoURL: string;
}

type Mode = "login" | "signup";

interface LandingProps {
  initialAuth?: Mode;
  initialAudience?: Audience;
}

export default function Landing({ initialAuth, initialAudience }: LandingProps) {
  const [authMode, setAuthMode] = useState<Mode | null>(initialAuth ?? null);
  const [audience, setAudience] = useState<Audience>(initialAudience ?? "customer");
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [home, setHome] = useState<string>("/app");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [cat, setCat] = useState<string>("Бүгд");

  function openAuth(mode: Mode, aud: Audience = "customer") {
    setAudience(aud);
    setAuthMode(mode);
  }

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

  // Firestore-аас идэвхтэй бүтээгдэхүүний каталог ачаалах
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(
          collection(db, "products"),
          where("active", "==", true),
          orderBy("category"),
          orderBy("capacity"),
        ));
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CatalogProduct)));
      } catch {
        // Fallback — index дутвал хяналтгүй унш
        const snap = await getDocs(collection(db, "products"));
        setProducts(snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as CatalogProduct))
          .filter((p) => (p as any).active !== false)
          .sort((a, b) => a.category.localeCompare(b.category) || a.capacity - b.capacity));
      }
    })();
  }, []);

  const categories = ["Бүгд", ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = cat === "Бүгд" ? products : products.filter((p) => p.category === cat);

  return (
    <div className="bg-paper text-ink">
      {/* ───────── Header ───────── */}
      <header className="fixed top-0 inset-x-0 z-30 bg-paper/80 backdrop-blur border-b border-ink/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <a href="#top" className="font-semibold text-lg flex items-center gap-2">
            <BrandMark size={22} />
            <span>eruulkhors</span>
            <span className="hidden sm:inline text-xs text-ink/40 mono">· plasticcenter.mn</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <a href="#about" className="text-ink/70 hover:text-ink">Бидний тухай</a>
            <a href="#products" className="text-ink/70 hover:text-ink">Бүтээгдэхүүн</a>
            <a href="#platform" className="text-ink/70 hover:text-ink">Систем</a>
            <a href="#contact" className="text-ink/70 hover:text-ink">Холбоо барих</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to={home} className="px-4 py-1.5 rounded-md text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                Системд орох →
              </Link>
            ) : (
              <>
                <button onClick={() => openAuth("login", "customer")} className="px-3 py-1.5 rounded-md text-sm hover:bg-ink/5">Нэвтрэх</button>
                <button onClick={() => openAuth("signup", "customer")} className="px-4 py-1.5 rounded-md text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium">Бүртгүүлэх</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section id="top" className="relative h-screen flex items-center justify-center text-paper overflow-hidden">
        <div
          className="absolute inset-0 bg-emerald-950"
          style={{ backgroundImage: "url('/hero.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/85 via-ink/60 to-emerald-900/70" />

        <div className="relative z-10 text-center px-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 chip border border-paper/30 text-paper/90 mb-6">
            <Leaf /> Хоггүй Монголын төлөө хамтдаа
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
            Байгалиа <span className="text-emerald-300">хайрлая</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-paper/85 max-w-xl mx-auto">
            Пластик гялгар уутыг дахин боловсруулж био-септик систем үйлдвэрлэж, цэвэр Монгол орны төлөө 2016 оноос үйл ажиллагаа явуулж байна.
          </p>
          <div className="mt-9 flex justify-center gap-3 flex-wrap">
            {user ? (
              <Link to={home} className="px-6 py-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-ink font-medium text-base transition">
                Системд орох →
              </Link>
            ) : (
              <button onClick={() => openAuth("signup", "customer")} className="px-6 py-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-ink font-medium text-base transition">
                Үнэгүй нэгдэх →
              </button>
            )}
            <a href="#products" className="px-6 py-3 rounded-md border border-paper/30 hover:bg-paper/10 text-base transition">
              Бүтээгдэхүүн харах
            </a>
          </div>
        </div>

        <a href="#stats" className="absolute bottom-6 left-1/2 -translate-x-1/2 text-paper/60 text-xs flex flex-col items-center gap-1 animate-pulse">
          <span>Дэлгэрэнгүй</span>
          <span>↓</span>
        </a>
      </section>

      {/* ───────── Stats bar ───────── */}
      <section id="stats" className="bg-ink text-paper py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ["3,500+", "тонн пластикийг дахин боловсруулсан"],
            ["2,500+", "айл өрх, байгууллагад үйлчилсэн"],
            ["2016", "оноос үйл ажиллагаа явуулж байна"],
            ["MNS 5924:20", "стандартыг хангасан"],
          ].map(([v, label]) => (
            <div key={label as string}>
              <div className="text-3xl sm:text-4xl font-semibold mono text-emerald-300">{v}</div>
              <div className="text-xs sm:text-sm text-paper/60 mt-2">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── About ───────── */}
      <section id="about" className="py-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-700 mb-3 font-medium">Бидний тухай</div>
            <h2 className="text-3xl sm:text-4xl font-semibold leading-tight mb-5">
              Монгол улсын анхны <span className="text-emerald-600">дахин боловсруулсан</span> пластик бохирын системийн үйлдвэр
            </h2>
            <p className="text-ink/70 leading-relaxed mb-4">
              Пластик Центр ХХК нь 2016 оноос хаягдал гялгар уутыг дахин боловсруулж 2,500 гаруй айл өрх,
              аж ахуйн нэгж байгууллагын нүхэн жорлонгийн асуудлыг шийдэж байна.
            </p>
            <p className="text-ink/70 leading-relaxed">
              Манай үйлдвэр нь экологид ээлтэй, удаан эдэлгээтэй, ус нэвт нэвтрэхгүй био-септик танк, бохирын
              худгийн систем үйлдвэрлэдэг бөгөөд MNS 5924:20 стандартыг бүрэн хангасан.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "♻️", title: "Дахин боловсруулсан", desc: "Хаягдал гялгар уутаас" },
              { icon: "💧", title: "Ус нэвт нэвтрэхгүй", desc: "100% битүүмжлэлтэй" },
              { icon: "🌱", title: "Экологид ээлтэй", desc: "Хогийн ландфилл бууруулсан" },
              { icon: "⏱", title: "Удаан эдэлгээтэй", desc: "Олон жил хадгалагдана" },
            ].map((f) => (
              <div key={f.title} className="card p-5">
                <div className="text-3xl">{f.icon}</div>
                <div className="font-semibold mt-2">{f.title}</div>
                <div className="text-xs text-ink/60 mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Products ───────── */}
      <section id="products" className="py-20 px-4 sm:px-8 bg-paper-soft">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs uppercase tracking-wider text-emerald-700 mb-3 font-medium">Бүтээгдэхүүний каталог</div>
            <h2 className="text-3xl sm:text-4xl font-semibold">Манай {products.length} бүтээгдэхүүн</h2>
            <p className="text-ink/60 mt-3 max-w-2xl mx-auto">
              Дахин боловсруулсан пластикаар бүтэн битүүмжтэй био-септик систем, бохирын худгийн иж бүрдэл.
            </p>
          </div>

          {/* Category filter */}
          {products.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-4 py-1.5 rounded-full text-sm transition border ${
                    cat === c
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-paper border-ink/10 text-ink/70 hover:border-emerald-400"
                  }`}
                >
                  {c}
                  <span className="ml-1.5 opacity-60 mono text-xs">
                    {c === "Бүгд" ? products.length : products.filter((p) => p.category === c).length}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Product grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center text-ink/50 py-10">Каталог ачаалж байна…</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <CatalogCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            {user ? (
              <Link to={home} className="inline-block px-6 py-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition">
                Системд орох →
              </Link>
            ) : (
              <button onClick={() => openAuth("signup", "customer")} className="px-6 py-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition">
                Захиалга өгөх →
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ───────── Platform CTA ───────── */}
      <section id="platform" className="py-20 px-4 sm:px-8 bg-emerald-950 text-paper">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 chip border border-emerald-400/30 text-emerald-200 mb-4">
              ✨ Шинээр
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">
              Plastic Center-ийн <span className="text-emerald-300">шинэ үе шатны</span> цахим систем
            </h2>
            <p className="text-paper/70 mt-4 max-w-2xl mx-auto">
              Захиалагч, үйлчилгээ үзүүлэгч, нийлүүлэгч, экологийн хамгаалагч бүх талыг нэг платформ дээр холбож,
              үйлчилгээний хүрээ, ил тод байдал, чанарыг шинэ түвшинд гаргана.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              { icon: "🌿", title: "Захиалагчид", desc: "Хэдхэн товшилтоор үйлчилгээ захиалах, real-time төлөв хянах, түүх, үнэлгээ" },
              { icon: "🔧", title: "Үйлчилгээ үзүүлэгчид", desc: "Хээрийн ажилтны мобайл UI, GPS навигаци, цахим гарын үсэг, зургийн нотолгоо" },
              { icon: "📊", title: "Менежментэд", desc: "Real-time dashboard, dispatch, агуулах, динамик үнэлгээ, тайлан" },
            ].map((f) => (
              <div key={f.title} className="bg-paper/5 border border-paper/10 rounded-lg p-6">
                <div className="text-4xl mb-3">{f.icon}</div>
                <div className="font-semibold text-lg">{f.title}</div>
                <div className="text-sm text-paper/70 mt-2">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="text-center">
            {user ? (
              <Link to={home} className="px-7 py-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-ink font-medium text-base transition inline-block">
                Системд орох →
              </Link>
            ) : (
              <>
                <button onClick={() => openAuth("signup", "customer")} className="px-7 py-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-ink font-medium text-base transition">
                  Үнэгүй нэгдэх →
                </button>
                <button onClick={() => openAuth("login", "customer")} className="ml-2 px-7 py-3 rounded-md border border-paper/30 hover:bg-paper/10 text-base transition">
                  Нэвтрэх
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ───────── Why us ───────── */}
      <section className="py-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-wider text-emerald-700 mb-3 font-medium">Яагаад бид?</div>
            <h2 className="text-3xl sm:text-4xl font-semibold">Бидний давуу тал</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              ["♻️", "Экологид ээлтэй", "Хогийн ландфилл бууруулж дахин боловсруулсан түүхий эд"],
              ["🪶", "Хөнгөн", "Энгийн машинаар тээвэрлэх, угсрах боломжтой"],
              ["💧", "Ус нэвтрэхгүй", "Битүүмжлэл 100% — гүний ус, орчинд хор хөнөөлгүй"],
              ["📐", "Тохирмол хэмжээ", "Захиалагчийн хэрэгцээнд тулгуурлан хэмжээ, загвар"],
              ["🛡", "MNS 5924:20", "Монгол улсын стандартыг бүрэн хангасан"],
              ["📞", "Засвар үйлчилгээ", "Орон даяар хээрийн ажилтан сүлжээ"],
            ].map(([icon, title, desc]) => (
              <div key={title as string} className="card p-5">
                <div className="text-3xl">{icon}</div>
                <div className="font-semibold mt-2">{title}</div>
                <div className="text-sm text-ink/60 mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Contact ───────── */}
      <section id="contact" className="py-20 px-4 sm:px-8 bg-paper-soft">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-700 mb-3 font-medium">Холбоо барих</div>
            <h2 className="text-3xl sm:text-4xl font-semibold mb-6">Бидэнтэй холбогдоно уу</h2>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">📞</span>
                <div>
                  <div className="text-ink/50 text-xs">Утас</div>
                  <a href="tel:70004308" className="font-medium text-base mono">7000-4308</a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">✉️</span>
                <div>
                  <div className="text-ink/50 text-xs">И-мэйл</div>
                  <a href="mailto:info@plasticcenter.mn" className="font-medium">info@plasticcenter.mn</a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">📍</span>
                <div>
                  <div className="text-ink/50 text-xs">Хаяг</div>
                  <div className="font-medium">Баянзүрх дүүрэг, 10-р хороо</div>
                  <div className="text-ink/60 text-sm">Ботаникийн эцэс, Амгалан дулааны станцын зүүн талд</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">🌐</span>
                <div>
                  <div className="text-ink/50 text-xs">Сайт</div>
                  <a href="https://plasticcenter.mn" target="_blank" rel="noopener" className="font-medium">plasticcenter.mn</a>
                </div>
              </li>
            </ul>
          </div>

          <div className="card p-7 bg-emerald-600 text-white">
            <div className="text-3xl mb-2">🌱</div>
            <h3 className="text-2xl font-semibold mb-3">Үнэгүй зөвлөгөө авах</h3>
            <p className="text-white/80 mb-5">
              Бүртгүүлээд таны хэрэгцээнд тохирох септик системийг сонгож, үнийн санал авна уу.
            </p>
            {user ? (
              <Link to={home} className="inline-block px-6 py-3 rounded-md bg-white text-emerald-700 font-medium hover:bg-white/90 transition">
                Системд орох →
              </Link>
            ) : (
              <button onClick={() => openAuth("signup", "customer")} className="px-6 py-3 rounded-md bg-white text-emerald-700 font-medium hover:bg-white/90 transition">
                Үнэгүй бүртгүүлэх →
              </button>
            )}
            <div className="text-xs text-white/70 mt-4">
              Эсвэл утсаар: <a href="tel:70004308" className="underline mono">7000-4308</a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="bg-ink text-paper py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-8 text-sm">
          <div className="col-span-2 md:col-span-2">
            <div className="font-semibold text-lg mb-2 flex items-center gap-2">
              <BrandMark size={20} />
              <span>eruulkhors</span>
            </div>
            <div className="text-paper/60 mb-4">Пластик Центр ХХК · 2016 оноос үйл ажиллагаа явуулж байна</div>
            <div className="text-paper/40 text-xs">Хоггүй Монголын төлөө хамтдаа</div>
          </div>
          <div>
            <div className="text-paper/40 text-xs uppercase tracking-wider mb-3">Цэс</div>
            <ul className="space-y-2">
              <li><a href="#about" className="text-paper/70 hover:text-paper">Бидний тухай</a></li>
              <li><a href="#products" className="text-paper/70 hover:text-paper">Бүтээгдэхүүн</a></li>
              <li><a href="#platform" className="text-paper/70 hover:text-paper">Систем</a></li>
              <li><a href="#contact" className="text-paper/70 hover:text-paper">Холбоо барих</a></li>
            </ul>
          </div>
          <div>
            <div className="text-paper/40 text-xs uppercase tracking-wider mb-3">Хамтрах</div>
            <ul className="space-y-2">
              <li>
                <Link to="/partner" className="text-paper/70 hover:text-paper">
                  Үйлчилгээ үзүүлэгч
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-paper/40 text-xs uppercase tracking-wider mb-3">Админ</div>
            <ul className="space-y-2">
              <li>
                <Link to="/admin" className="inline-flex items-center gap-1.5 text-paper/70 hover:text-paper">
                  🔒 Backoffice нэвтрэлт
                </Link>
              </li>
              <li>
                <span className="text-paper/40 text-[11px]">
                  Дотоод ажилтан, диспетчер, агуулах, санхүү
                </span>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-paper/40 text-xs uppercase tracking-wider mb-3">Холбоо</div>
            <ul className="space-y-2 text-paper/70">
              <li><a href="tel:70004308" className="hover:text-paper mono">7000-4308</a></li>
              <li><a href="mailto:info@plasticcenter.mn" className="hover:text-paper">info@plasticcenter.mn</a></li>
              <li><a href="https://plasticcenter.mn" target="_blank" rel="noopener" className="hover:text-paper">plasticcenter.mn</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-paper/10 flex flex-col sm:flex-row justify-between text-xs text-paper/50 gap-2">
          <span>© 2026 Plastic Center LLC · Бүх эрх хуулиар хамгаалагдсан</span>
          <span className="mono">v0.1.0 · UB FSOS</span>
        </div>
      </footer>

      <AuthModal
        open={authMode !== null}
        initialMode={authMode ?? "login"}
        audience={audience}
        onClose={() => setAuthMode(null)}
      />
    </div>
  );
}

function CatalogCard({ product: p }: { product: CatalogProduct }) {
  return (
    <div className="card overflow-hidden hover:shadow-lg transition group">
      <div className="aspect-square bg-ink/5 flex items-center justify-center overflow-hidden">
        {p.photoURL ? (
          <img
            src={p.photoURL}
            alt={p.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition"
            loading="lazy"
          />
        ) : (
          <div className="text-5xl text-ink/20">📦</div>
        )}
      </div>
      <div className="p-4">
        <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium">{p.category}</div>
        <h3 className="font-semibold text-sm mt-1 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-base font-semibold mono text-emerald-700">{p.price.toLocaleString("mn-MN")}₮</span>
          <span className="text-xs text-ink/50 mono">{p.capacity} {p.capacityUnit}</span>
        </div>
      </div>
    </div>
  );
}

function Leaf() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 20A7 7 0 0 1 4 13c0-6 9-10 17-10-1 7-4 17-10 17z" />
      <path d="M4 13c6 0 13-7 13-7" />
    </svg>
  );
}
