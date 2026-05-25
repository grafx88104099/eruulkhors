import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "@/firebase/client";

const ADMIN_ROLES = new Set(["super_admin", "dispatcher", "warehouse", "finance"]);

export default function AdminLogin() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [checkingRole, setCheckingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Хэрэв аль хэдийн нэвтэрсэн бол админ роль шалгах
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setRoleError(null);
      if (!u) return;
      setCheckingRole(true);
      try {
        const t = await u.getIdTokenResult();
        const claims: any = t.claims;
        const rs: string[] = Array.isArray(claims.roles) ? claims.roles : claims.role ? [claims.role] : [];
        if (rs.some((r) => ADMIN_ROLES.has(r))) {
          nav("/app", { replace: true });
        } else {
          setRoleError("Энэ бүртгэлд админ эрх байхгүй байна.");
        }
      } finally {
        setCheckingRole(false);
      }
    });
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pwd);
      // Role шалгалт onAuthStateChanged-аар хийгдэнэ
    } catch (ex: any) {
      setErr(humanError(ex));
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    await signOut(auth);
    setUser(null);
    setRoleError(null);
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex flex-col">
      {/* Top bar */}
      <header className="border-b border-paper/10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold text-base flex items-center gap-2">
            <span className="text-emerald-400">●</span>
            <span>eruulkhors</span>
            <span className="text-xs text-paper/40 mono">· back office</span>
          </Link>
          <Link to="/" className="text-xs text-paper/60 hover:text-paper">← Нүүр</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-paper/5 border border-paper/10 mb-4 text-3xl">
              🔐
            </div>
            <h1 className="text-2xl font-semibold">Админ нэвтрэх</h1>
            <p className="text-sm text-paper/60 mt-2">
              Plastic Center FSOS · удирдлагын самбар
            </p>
          </div>

          {checkingRole ? (
            <div className="text-center text-sm text-paper/60">Эрх шалгаж байна…</div>
          ) : user && roleError ? (
            <div className="bg-paper/5 border border-paper/10 rounded-xl p-6 space-y-4">
              <div className="text-3xl text-center">⚠</div>
              <div className="text-center">
                <div className="font-medium">Хандалт татгалзлаа</div>
                <p className="text-sm text-paper/60 mt-1">{roleError}</p>
                <p className="text-xs text-paper/40 mt-3 mono break-all">
                  {user.email}
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={leave}
                  className="w-full px-4 py-2.5 rounded-md bg-paper/10 hover:bg-paper/20 text-sm transition"
                >
                  Өөр бүртгэлээр нэвтрэх
                </button>
                <Link
                  to="/me"
                  className="w-full text-center px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-sm font-medium transition"
                >
                  Захиалагчийн хэсэг рүү
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-paper/5 border border-paper/10 rounded-xl p-6 space-y-4">
              <label className="block">
                <div className="text-sm font-medium mb-1.5">И-мэйл</div>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md bg-paper/10 border border-paper/15 focus:border-emerald-400 focus:outline-none text-paper placeholder-paper/30"
                  placeholder="admin@plasticcenter.mn"
                />
              </label>
              <label className="block">
                <div className="text-sm font-medium mb-1.5">Нууц үг</div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md bg-paper/10 border border-paper/15 focus:border-emerald-400 focus:outline-none text-paper"
                  placeholder="••••••••"
                />
              </label>

              {err && (
                <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-medium transition"
              >
                {busy ? "Нэвтэрч байна…" : "Нэвтрэх →"}
              </button>

              <p className="text-[11px] text-paper/40 text-center pt-2">
                Зөвхөн зөвшөөрөгдсөн ажилтнууд хандах боломжтой.
                Бүртгэл шинээр үүсгэх боломжгүй.
              </p>
            </form>
          )}

          <div className="text-center mt-6 text-xs text-paper/40">
            Захиалагч уу? <Link to="/" className="underline hover:text-paper">Энд → нүүр хуудас</Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-paper/10 py-4 text-center text-xs text-paper/40">
        © 2026 Plastic Center LLC · v0.1.0
      </footer>
    </div>
  );
}

function humanError(e: any): string {
  const code = e?.code ?? "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "И-мэйл эсвэл нууц үг буруу";
  }
  if (code === "auth/too-many-requests") {
    return "Хэт олон оролдлого. Хэсэг зуурын дараа дахин оролдоно уу.";
  }
  if (code === "auth/network-request-failed") {
    return "Сүлжээний алдаа";
  }
  return e?.message ?? "Алдаа гарлаа";
}
