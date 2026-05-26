import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { doc, onSnapshot } from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth, db, functions } from "@/firebase/client";
import { ALL_ROLES, ROLE_LABELS, useRoles } from "@/lib/useRoles";
import { Card, PageHeader } from "@/components/ui/Layout";

interface UserDoc {
  email?: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  role?: string;
  roles?: string[];
  provider?: string;
  createdAt?: any;
  lastSignInAt?: any;
}

interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  disabled: boolean;
  role: string;
  roles: string[];
  providerId: string;
  lastSignInTime: string;
  creationTime: string;
}

export default function Profile() {
  const u = auth.currentUser!;
  const { roles, hasRole } = useRoles();
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [displayName, setDisplayName] = useState(u.displayName ?? "");
  const [phone, setPhone] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, "users", u.uid), (snap) => {
      const data = snap.data() as UserDoc | undefined;
      setUserDoc(data ?? null);
      if (data?.displayName) setDisplayName(data.displayName);
      if (data?.phone) setPhone(data.phone);
    });
  }, [u.uid]);

  async function save() {
    setSaving(true); setErr(null);
    try {
      const fn = httpsCallable(functions, "updateMyProfile");
      await fn({ displayName, phone });
      setSavedAt(Date.now());
    } catch (ex: any) {
      setErr(ex.message ?? "Алдаа");
    } finally {
      setSaving(false);
    }
  }

  async function refreshToken() {
    await u.getIdToken(true);
  }

  const isSuperAdmin = hasRole("super_admin");

  return (
    <div>
      <PageHeader title="Профайл" sub="Өөрийн мэдээлэл болон эрх" />
      <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-5">
            {u.photoURL ? (
              <img src={u.photoURL} alt="" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center text-xl font-medium">
                {(u.displayName?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="font-semibold text-lg">{u.displayName ?? "—"}</div>
              <div className="text-sm text-ink/60">{u.email ?? "Anonymous"}</div>
              <div className="mono text-xs text-ink/40 mt-1">{u.uid}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {roles.map((r) => (
              <span key={r} className="chip pill-busy">{ROLE_LABELS[r] ?? r}</span>
            ))}
          </div>

          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="text-ink/60">Нэр</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full mt-1 border border-ink/10 rounded-md p-2" />
            </label>
            <label className="block">
              <span className="text-ink/60">Утас</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+976 99XX XXXX" className="w-full mt-1 border border-ink/10 rounded-md p-2 mono" />
            </label>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={save} disabled={saving} className="btn primary">
                {saving ? "Хадгалаж байна…" : "Хадгалах"}
              </button>
              {savedAt && <span className="text-xs text-ok">✓ Хадгаллаа</span>}
              {err && <span className="text-xs text-err">{err}</span>}
            </div>
          </div>
        </Card>

        <Card title="Бүртгэлийн мэдээлэл">
          <dl className="text-sm space-y-2">
            <Row k="Provider" v={userDoc?.provider ?? u.providerData[0]?.providerId ?? "—"} />
            <Row k="Roles" v={roles.map((r) => ROLE_LABELS[r] ?? r).join(", ") || "—"} />
            <Row k="Email verified" v={u.emailVerified ? "✓" : "✕"} />
            <Row k="Бүртгүүлсэн" v={u.metadata.creationTime ?? "—"} />
            <Row k="Сүүлд орсон" v={u.metadata.lastSignInTime ?? "—"} />
          </dl>
          <button onClick={refreshToken} className="btn w-full mt-4 text-xs">
            Token шинэчлэх
          </button>
        </Card>

        <PasswordCard />

        {isSuperAdmin && <UserManagement currentUid={u.uid} />}
      </div>
    </div>
  );
}

/**
 * Email/password нэвтэрсэн хэрэглэгчид нууц үгээ солих card.
 * Google sign-in only хэрэглэгчид нь password байхгүй учир card нуугдана.
 *
 * Firebase нь үндсэн нууц үг солихоос өмнө `reauthenticateWithCredential`
 * шаардана (хэрэв сүүлийн нэвтрэлт хэдхэн минутын дотор болсон бол ч ялгаагүй
 * заавал — `auth/requires-recent-login` алдаа гарахаас сэргийлдэг).
 */
function PasswordCard() {
  const u = auth.currentUser!;
  const hasPasswordProvider = u.providerData.some((p) => p.providerId === "password");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okAt, setOkAt] = useState<number | null>(null);

  if (!hasPasswordProvider) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkAt(null);

    if (newPw.length < 6) { setErr("Шинэ нууц үг 6+ тэмдэгт"); return; }
    if (newPw !== confirmPw) { setErr("Шинэ нууц үгүүд таарахгүй"); return; }
    if (newPw === currentPw) { setErr("Шинэ нууц үг хуучнаасаа ялгаатай байх ёстой"); return; }
    if (!u.email) { setErr("Имэйл байхгүй — нууц үг солих боломжгүй"); return; }

    setBusy(true);
    try {
      const cred = EmailAuthProvider.credential(u.email, currentPw);
      await reauthenticateWithCredential(u, cred);
      await updatePassword(u, newPw);
      setOkAt(Date.now());
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (ex: any) {
      setErr(humanPwError(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="lg:col-span-2" title="Нууц үг солих">
      <form onSubmit={submit} className="space-y-3 text-sm">
        <label className="block">
          <span className="text-ink/60">Одоогийн нууц үг</span>
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full mt-1 border border-ink/10 rounded-md p-2"
          />
        </label>
        <label className="block">
          <span className="text-ink/60">Шинэ нууц үг (6+ тэмдэгт)</span>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full mt-1 border border-ink/10 rounded-md p-2"
          />
        </label>
        <label className="block">
          <span className="text-ink/60">Шинэ нууц үг (давтан)</span>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full mt-1 border border-ink/10 rounded-md p-2"
          />
        </label>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={busy} className="btn primary">
            {busy ? "Солиж байна…" : "Нууц үг солих"}
          </button>
          {okAt && <span className="text-xs text-ok">✓ Шинэчиллээ</span>}
          {err && <span className="text-xs text-err">{err}</span>}
        </div>
      </form>
    </Card>
  );
}

function humanPwError(e: any): string {
  const code = e?.code ?? "";
  if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Одоогийн нууц үг буруу";
  }
  if (code === "auth/weak-password") return "Шинэ нууц үг хэт хялбар (6+ тэмдэгт)";
  if (code === "auth/requires-recent-login") return "Дахин нэвтэрч ороод оролдоно уу";
  if (code === "auth/too-many-requests") return "Хэт олон оролдлого — хэсэг хүлээгээд оролдоно уу";
  if (code === "auth/network-request-failed") return "Сүлжээний алдаа";
  return e?.message ?? "Алдаа гарлаа";
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink/50 shrink-0">{k}</dt>
      <dd className="text-right truncate mono text-xs">{v}</dd>
    </div>
  );
}

function UserManagement({ currentUid }: { currentUid: string }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  async function load() {
    try {
      const fn = httpsCallable<unknown, { users: AdminUser[] }>(functions, "listUsers");
      const r = await fn({});
      setUsers(r.data.users);
    } catch (ex: any) {
      setErr(ex.message);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <Card title="Хэрэглэгчдийн удирдлага (зөвхөн супер админ)" className="lg:col-span-3 overflow-x-auto">
      {err && <div className="text-xs text-err mb-2">{err}</div>}
      {!users && <p className="text-sm text-ink/50">Ачааллаж байна…</p>}
      {users && (
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left text-ink/50 text-xs uppercase">
            <tr>
              <th className="py-2">Хэрэглэгч</th>
              <th>Provider</th>
              <th>Бүртгүүлсэн</th>
              <th>Сүүлд орсон</th>
              <th>Роль</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className="border-t border-ink/5">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-ink/10 text-ink flex items-center justify-center text-xs">
                        {(u.displayName?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{u.displayName ?? "—"}</div>
                      <div className="text-xs text-ink/50">{u.email ?? u.uid.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="text-xs text-ink/60">{u.providerId}</td>
                <td className="text-xs mono">{new Date(u.creationTime).toLocaleDateString("mn-MN")}</td>
                <td className="text-xs mono">{new Date(u.lastSignInTime).toLocaleDateString("mn-MN")}</td>
                <td>
                  <div className="flex flex-wrap gap-1 max-w-[280px]">
                    {(u.roles ?? [u.role]).map((r) => (
                      <span key={r} className="chip text-[10px] py-0.5 px-2">{ROLE_LABELS[r] ?? r}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <button onClick={() => setEditing(u)} className="btn text-xs">Засах</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <RoleEditor
          user={editing}
          currentUid={currentUid}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load(); }}
          busy={busy}
          setBusy={setBusy}
          setErr={setErr}
        />
      )}
    </Card>
  );
}

function RoleEditor({ user, currentUid, onClose, onSaved, busy, setBusy, setErr }: {
  user: AdminUser;
  currentUid: string;
  onClose: () => void;
  onSaved: () => void;
  busy: string | null;
  setBusy: (v: string | null) => void;
  setErr: (v: string | null) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(user.roles ?? [user.role]));

  function toggle(r: string) {
    const next = new Set(selected);
    if (next.has(r)) next.delete(r); else next.add(r);
    if (next.size === 0) return; // require at least one
    setSelected(next);
  }

  async function save() {
    setBusy(user.uid); setErr(null);
    try {
      const fn = httpsCallable(functions, "setUserRoles");
      await fn({ uid: user.uid, roles: Array.from(selected) });
      onSaved();
    } catch (ex: any) {
      setErr(ex.message ?? "Алдаа");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md bg-paper text-ink space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold">{user.displayName ?? user.email}</div>
            <div className="text-xs text-ink/50 mono">{user.uid.slice(0, 12)}…</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink/10">✕</button>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-ink/50 mb-2">Ролиуд ({selected.size})</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {ALL_ROLES.map((r) => {
              const checked = selected.has(r);
              const disabled = user.uid === currentUid && r === "super_admin" && checked; // can't remove own super_admin
              return (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2 rounded-md border ${checked ? "border-accent bg-accent/5" : "border-ink/10"} cursor-pointer`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => !disabled && toggle(r)}
                    disabled={disabled}
                  />
                  <span>{ROLE_LABELS[r]}</span>
                </label>
              );
            })}
          </div>
          {user.uid === currentUid && (
            <p className="text-[11px] text-ink/50 mt-2">⚠ Өөрийнхөө супер админ ролийг хасах боломжгүй.</p>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="btn">Цуцлах</button>
          <button onClick={save} disabled={busy === user.uid} className="btn primary">
            {busy === user.uid ? "Хадгалж байна…" : "Хадгалах"}
          </button>
        </div>
      </div>
    </div>
  );
}
