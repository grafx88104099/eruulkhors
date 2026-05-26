import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { BrandMark } from "@/components/BrandMark";

const ADMIN_ROLES = new Set(["super_admin", "dispatcher", "warehouse", "finance"]);

export default function AdminLogin() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [checkingRole, setCheckingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState<null | "email" | "google" | "reset">(null);
  const [err, setErr] = useState<string | null>(null);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

  // Хэрэв аль хэдийн нэвтэрсэн бол админ роль шалгах. Force-refresh the
  // token (`true`) so that a claim issued AFTER the cached token (e.g. a
  // freshly promoted super_admin) is picked up without requiring another
  // sign-out + sign-in.
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setRoleError(null);
      if (!u) return;
      setCheckingRole(true);
      try {
        const t = await u.getIdTokenResult(true);
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
    setErr(null); setBusy("email");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pwd);
      // Role шалгалт onAuthStateChanged-аар хийгдэнэ
    } catch (ex: any) {
      setErr(humanError(ex));
    } finally {
      setBusy(null);
    }
  }

  async function submitGoogle() {
    setErr(null); setBusy("google");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      // onAuthStateChanged effect-ийн дотор админ роль шалгана. Хэрэв
      // тухайн Google account админ биш бол доорх "Хандалт татгалзлаа"
      // блок гарч ирнэ.
    } catch (ex: any) {
      setErr(humanError(ex));
    } finally {
      setBusy(null);
    }
  }

  async function sendReset() {
    const target = email.trim();
    setErr(null); setResetSentTo(null);
    if (!target) {
      setErr("Эхлээд имэйлээ оруулна уу");
      return;
    }
    setBusy("reset");
    try {
      await sendPasswordResetEmail(auth, target);
      // Confirm to user regardless of whether the email is registered —
      // Firebase intentionally doesn't reveal which addresses exist, and
      // we shouldn't either (account-enumeration mitigation).
      setResetSentTo(target);
    } catch (ex: any) {
      // Even on failure (rate-limited, malformed), don't leak existence.
      // Show the generic confirmation unless it's clearly a client-side
      // input problem.
      if (ex?.code === "auth/invalid-email") {
        setErr("Имэйл формат буруу");
      } else if (ex?.code === "auth/too-many-requests") {
        setErr("Хэт олон оролдлого — хэсэг хүлээгээд оролдоно уу");
      } else {
        setResetSentTo(target);
      }
    } finally {
      setBusy(null);
    }
  }

  async function leave() {
    await signOut(auth);
    setUser(null);
    setRoleError(null);
  }

  return (
    <div className="min-h-screen bg-soil-900 text-paper flex flex-col">
      {/* Top bar */}
      <header className="border-b border-paper/10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold text-base flex items-center gap-2">
            <BrandMark size={18} />
            <span>eruul hors</span>
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
            <div className="bg-paper/5 border border-paper/10 rounded-xl p-6 space-y-4">
              <button
                type="button"
                onClick={submitGoogle}
                disabled={busy !== null}
                className="w-full px-4 py-2.5 rounded-md bg-paper text-ink hover:bg-paper/90 disabled:opacity-50 text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <GoogleLogo />
                {busy === "google" ? "Үргэлжилж байна…" : "Google-ээр нэвтрэх"}
              </button>

              <div className="flex items-center gap-3 text-xs text-paper/40">
                <div className="flex-1 h-px bg-paper/10" />
                <span>эсвэл и-мэйлээр</span>
                <div className="flex-1 h-px bg-paper/10" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                <label className="block">
                  <div className="text-sm font-medium mb-1.5">И-мэйл</div>
                  <input
                    type="email"
                    required
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
                {resetSentTo && (
                  <div className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2">
                    Хэрэв <span className="mono">{resetSentTo}</span> бүртгэлтэй бол нууц үг сэргээх имэйл илгээгдсэн. Inbox + spam хавтасаа шалгана уу.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy !== null}
                  className="w-full px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-medium transition"
                >
                  {busy === "email" ? "Нэвтэрч байна…" : "Нэвтрэх →"}
                </button>

                <button
                  type="button"
                  onClick={sendReset}
                  disabled={busy !== null}
                  className="w-full text-xs text-paper/60 hover:text-paper underline disabled:opacity-50"
                >
                  {busy === "reset" ? "Илгээж байна…" : "Нууц үгээ мартсан уу?"}
                </button>
              </form>

              <p className="text-[11px] text-paper/40 text-center pt-2">
                Зөвхөн зөвшөөрөгдсөн ажилтнууд хандах боломжтой.
                Бүртгэл шинээр үүсгэх боломжгүй.
              </p>
            </div>
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
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return "Цонх хаагдсан";
  }
  if (code === "auth/popup-blocked") {
    return "Browser pop-up-ыг блоклосон байна. Pop-up-г зөвшөөрөөд дахин оролдоно уу.";
  }
  return e?.message ?? "Алдаа гарлаа";
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5l-6-5.2C29 35.6 26.6 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.4 39.6 16.1 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.4-4.4 5.8l6 5.2c-.4.4 6.4-4.7 6.4-15 0-1.3-.1-2.4-.7-3.5z" />
    </svg>
  );
}
