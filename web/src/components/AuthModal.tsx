import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { homeForRoles } from "@/lib/useRoles";

type Mode = "login" | "signup";
export type Audience = "customer" | "staff" | "partner";

interface Props {
  open: boolean;
  initialMode?: Mode;
  audience?: Audience;
  onClose: () => void;
}

const AUDIENCE_THEME: Record<Audience, {
  badge: string;
  title: string;
  subtitle: (mode: Mode) => string;
  accentDot: string;
  primaryBtn: string;
  outerHeader?: string;
  showAnon: boolean;
  allowSignup: boolean;
  primaryProvider: "google" | "email";
}> = {
  customer: {
    badge: "🌿 Захиалагч",
    title: "eruulkhors",
    subtitle: (m) => m === "signup" ? "Шинэ хэрэглэгчээр бүртгүүлэх" : "Захиалагчийн нэвтрэлт",
    accentDot: "text-emerald-600",
    primaryBtn: "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white",
    showAnon: true,
    allowSignup: true,
    primaryProvider: "google",
  },
  staff: {
    badge: "🔒 Backoffice",
    title: "eruulkhors · admin",
    subtitle: () => "Дотоод ажилтны нэвтрэлт",
    accentDot: "text-ink",
    primaryBtn: "bg-ink hover:bg-ink-soft border-ink text-paper",
    outerHeader: "Зөвхөн дотоод ажилтан, үйлчилгээ үзүүлэгчид зориулсан",
    showAnon: false,
    allowSignup: false,
    primaryProvider: "email",
  },
  partner: {
    badge: "🔧 Үйлчилгээ үзүүлэгч",
    title: "eruulkhors · partner",
    subtitle: () => "Зөвшөөрөгдсөн партнерийн нэвтрэлт",
    accentDot: "text-emerald-600",
    primaryBtn: "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white",
    outerHeader: "Шинэ бол доорх анкетыг бөглөнө үү — админ зөвшөөрсний дараа нэвтэрнэ.",
    showAnon: false,
    allowSignup: false,
    primaryProvider: "google",
  },
};

export default function AuthModal({ open, initialMode = "login", audience = "customer", onClose }: Props) {
  const nav = useNavigate();
  const cfg = AUDIENCE_THEME[audience];
  const [mode, setMode] = useState<Mode>(cfg.allowSignup ? initialMode : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "email" | "google" | "anon">(null);

  useEffect(() => {
    if (open) setMode(cfg.allowSignup ? initialMode : "login");
  }, [open, initialMode, cfg.allowSignup]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  async function done() {
    onClose();
    const u = auth.currentUser;
    if (!u) { nav("/"); return; }
    try {
      // For brand-new accounts the `onUserCreate` Cloud Function assigns
      // the default 'customer' claim asynchronously. signInWithPopup can
      // return before the trigger completes, so `getIdTokenResult()`
      // would show empty claims and route the user incorrectly.
      //
      // Force-refresh the token a few times until we see a role appear,
      // up to ~4 seconds total. If nothing arrives we fall back to
      // 'customer' (the trigger's eventual default).
      const rs = await waitForRoles(u);

      if (audience === "customer") {
        // Захиалагчийн нэвтрэлт — үргэлж /me
        nav("/me");
      } else if (audience === "partner") {
        // Партнер хүсэлт — тех role-той бол /tech, эс бөгөөс анкет бөглөх
        const hasTech = rs.some((r) => r.startsWith("tech_"));
        if (hasTech) {
          nav("/tech");
        } else {
          setErr("Энэ бүртгэлд үйлчилгээ үзүүлэгч эрх алга байна. Доорх анкетыг бөглөнө үү.");
          return;
        }
      } else {
        // Staff нэвтрэлт — ролоор тохирох дотоод порталд илгээнэ
        const target = homeForRoles(rs);
        if (target === "/me") {
          setErr("Танд админ эрх алга байна. Захиалагчийн нэвтрэлтийг ашиглана уу.");
          return;
        }
        nav(target);
      }
    } catch {
      nav("/");
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy("email");
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, pwd);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, pwd);
      }
      done();
    } catch (ex: any) {
      setErr(humanError(ex));
    } finally {
      setBusy(null);
    }
  }

  async function withGoogle() {
    setErr(null); setBusy("google");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      done();
    } catch (ex: any) {
      setErr(humanError(ex));
    } finally {
      setBusy(null);
    }
  }

  async function withAnon() {
    setErr(null); setBusy("anon");
    try { await signInAnonymously(auth); done(); }
    catch (ex: any) { setErr(humanError(ex)); }
    finally { setBusy(null); }
  }

  const isSignup = mode === "signup";
  const googleBtn = (
    <button
      type="button"
      onClick={withGoogle}
      disabled={busy !== null}
      className={cfg.primaryProvider === "google"
        ? `btn w-full flex items-center justify-center gap-2 ${cfg.primaryBtn}`
        : "btn w-full flex items-center justify-center gap-2 border-ink/20 text-ink hover:bg-ink/5"}
    >
      <GoogleLogo />
      <span>{busy === "google" ? "Үргэлжилж байна…" : `Google-р ${isSignup ? "бүртгүүлэх" : "нэвтрэх"}`}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative card p-7 w-full max-w-sm space-y-5 bg-paper text-ink shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Хаах"
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-ink/10 flex items-center justify-center text-ink/60"
        >
          ✕
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 chip border border-ink/10 text-xs mb-2">
            {cfg.badge}
          </div>
          <div className="text-2xl font-semibold">
            <span className={cfg.accentDot}>●</span> {cfg.title}
          </div>
          <p className="text-sm text-ink/60 mt-1">{cfg.subtitle(mode)}</p>
          {cfg.outerHeader && (
            <p className="text-xs text-ink/40 mt-2 italic">{cfg.outerHeader}</p>
          )}
        </div>

        {cfg.allowSignup && (
          <div className="flex bg-ink/5 rounded-md p-1 text-sm">
            <button
              type="button"
              className={`flex-1 py-1.5 rounded font-medium ${!isSignup ? "bg-paper text-ink shadow-sm" : "text-ink/60"}`}
              onClick={() => setMode("login")}
            >Нэвтрэх</button>
            <button
              type="button"
              className={`flex-1 py-1.5 rounded font-medium ${isSignup ? "bg-paper text-ink shadow-sm" : "text-ink/60"}`}
              onClick={() => setMode("signup")}
            >Бүртгүүлэх</button>
          </div>
        )}

        {/* Provider order — audience-аас хамаарна */}
        {cfg.primaryProvider === "google" ? googleBtn : null}

        {cfg.primaryProvider === "google" && (
          <div className="flex items-center gap-3 text-xs text-ink/40">
            <div className="flex-1 h-px bg-ink/10" />
            <span>эсвэл и-мэйлээр</span>
            <div className="flex-1 h-px bg-ink/10" />
          </div>
        )}

        <form onSubmit={submitEmail} className="space-y-3">
          {isSignup && cfg.allowSignup && (
            <label className="block">
              <span className="text-xs text-ink/60">Нэр</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 border border-ink/10 rounded-md p-2" />
            </label>
          )}
          <label className="block">
            <span className="text-xs text-ink/60">И-мэйл</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mt-1 border border-ink/10 rounded-md p-2" />
          </label>
          <label className="block">
            <span className="text-xs text-ink/60">Нууц үг {isSignup && "(≥ 6 тэмдэгт)"}</span>
            <input type="password" minLength={isSignup ? 6 : undefined} value={pwd} onChange={(e) => setPwd(e.target.value)} required className="w-full mt-1 border border-ink/10 rounded-md p-2" />
          </label>
          <button className={`btn w-full ${cfg.primaryBtn}`} disabled={busy !== null}>
            {busy === "email" ? "Үргэлжилж байна…" : isSignup ? "Бүртгүүлэх" : "Нэвтрэх"}
          </button>
        </form>

        {cfg.primaryProvider === "email" && (
          <>
            <div className="flex items-center gap-3 text-xs text-ink/40">
              <div className="flex-1 h-px bg-ink/10" />
              <span>эсвэл</span>
              <div className="flex-1 h-px bg-ink/10" />
            </div>
            {googleBtn}
          </>
        )}

        {err && <div className="text-xs text-err">{err}</div>}

        {cfg.showAnon && (
          <button type="button" className="text-xs text-ink/50 underline w-full" onClick={withAnon} disabled={busy !== null}>
            Хөгжүүлэлт: нэрээ нуун нэвтрэх
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Poll Firebase Auth for a custom-claim role. New users get their default
 * 'customer' claim from the onUserCreate trigger, which may complete a
 * second or two after sign-in returns. Refreshing the ID token (`true`)
 * forces a server round-trip that picks up newly assigned claims.
 */
async function waitForRoles(u: import("firebase/auth").User): Promise<string[]> {
  // 5 attempts × ~800ms = ~4s ceiling. After that we trust the default.
  for (let attempt = 0; attempt < 5; attempt++) {
    const force = attempt > 0; // first read can use the cached token
    const t = await u.getIdTokenResult(force);
    const c: any = t.claims;
    if (Array.isArray(c.roles) && c.roles.length > 0) return c.roles;
    if (typeof c.role === "string" && c.role) return [c.role];
    await new Promise((r) => setTimeout(r, 800));
  }
  return ["customer"];
}

function humanError(ex: any): string {
  const code = ex?.code as string | undefined;
  const map: Record<string, string> = {
    "auth/invalid-email": "И-мэйл буруу байна",
    "auth/missing-password": "Нууц үг шаардлагатай",
    "auth/weak-password": "Нууц үг хэт хялбар байна (≥ 6 тэмдэгт)",
    "auth/email-already-in-use": "Энэ и-мэйл аль хэдийн бүртгэлтэй",
    "auth/invalid-credential": "И-мэйл эсвэл нууц үг буруу",
    "auth/user-not-found": "Хэрэглэгч олдсонгүй",
    "auth/wrong-password": "Нууц үг буруу",
    "auth/popup-closed-by-user": "Цонх хаагдсан",
    "auth/operation-not-allowed": "Энэ нэвтрэх арга console-д идэвхгүй байна",
  };
  return code && map[code] ? map[code] : ex?.message ?? "Алдаа гарлаа";
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
