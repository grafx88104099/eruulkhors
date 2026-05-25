import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, functions } from "@/firebase/client";
import { useMyTechnician, useMyTechOrders } from "@/lib/techHooks";
import { ROLE_LABELS, useRoles } from "@/lib/useRoles";
import { Card, PageHeader } from "@/components/ui/Layout";

interface UserDoc {
  email?: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
}

export default function TechProfile() {
  const u = auth.currentUser!;
  const { roles } = useRoles();
  const { data: technician } = useMyTechnician();
  const { data: orders } = useMyTechOrders();

  const [displayName, setDisplayName] = useState(u.displayName ?? "");
  const [phone, setPhone] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, "users", u.uid), (snap) => {
      const data = snap.data() as UserDoc | undefined;
      if (data?.displayName) setDisplayName(data.displayName);
      if (data?.phone) setPhone(data.phone);
    });
  }, [u.uid]);

  async function save() {
    setSaving(true); setErr(null); setSavedAt(null);
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

  const techRoles = roles.filter((r) => r.startsWith("tech_"));
  const completed = orders.filter((o) => o.status === "Дуусгасан").length;
  const memberSince = u.metadata.creationTime
    ? new Date(u.metadata.creationTime).toLocaleDateString("mn-MN", {
        year: "numeric", month: "long",
      })
    : "—";

  return (
    <div>
      <PageHeader title="Профайл" sub="Өөрийн мэдээллээ удирдах" />

      <div className="p-4 sm:p-8 space-y-4 max-w-2xl mx-auto">
        {/* Avatar + identity */}
        <Card>
          <div className="flex items-center gap-4">
            {u.photoURL ? (
              <img src={u.photoURL} alt="" className="w-20 h-20 rounded-full" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-semibold">
                {(u.displayName?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-lg truncate">{u.displayName ?? "—"}</div>
              <div className="text-sm text-ink/60 truncate">{u.email ?? "—"}</div>
              {technician && (
                <div className="mono text-xs text-emerald-700 mt-1">{technician.code}</div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {techRoles.map((r) => (
              <span key={r} className="chip bg-emerald-100 text-emerald-700 border-transparent">
                {ROLE_LABELS[r] ?? r}
              </span>
            ))}
          </div>
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Дуусгасан" value={`${completed}`} />
          <StatBox label="Үнэлгээ" value={technician?.rating?.toFixed(1) ?? "—"} suffix="★" />
          <StatBox label="Гишүүн" value={memberSince} small />
        </div>

        {/* Edit form */}
        <Card title="Мэдээлэл засах">
          <div className="space-y-3">
            <label className="block">
              <div className="text-sm font-medium mb-1.5">Нэр</div>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input"
                placeholder="Бат-Эрдэнэ"
              />
            </label>
            <label className="block">
              <div className="text-sm font-medium mb-1.5">Утас</div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+976 9911 2233"
                className="input mono"
              />
            </label>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={save}
                disabled={saving}
                className="btn emerald disabled:opacity-50"
              >
                {saving ? "Хадгалж байна…" : "Хадгалах"}
              </button>
              {savedAt && <span className="text-xs text-emerald-700">✓ Хадгаллаа</span>}
              {err && <span className="text-xs text-red-700">{err}</span>}
            </div>
          </div>
        </Card>

        {/* Vehicle / details */}
        {technician && (
          <Card title="Үйлчилгээний мэдээлэл">
            <dl className="text-sm space-y-2">
              <Row label="Код">
                <span className="mono">{technician.code}</span>
              </Row>
              <Row label="Үндсэн үүрэг">
                {ROLE_LABELS[technician.role] ?? technician.role}
              </Row>
              <Row label="Тээвэр">
                <span className="mono">{technician.vehiclePlate ?? "—"}</span>
              </Row>
              <Row label="Статус">
                <StatusBadge status={technician.status} />
              </Row>
            </dl>
            <p className="text-[11px] text-ink/40 mt-3">
              Үүрэг, тээврийн мэдээллийг өөрчлөхийн тулд диспетчертэй холбогдоно уу.
            </p>
          </Card>
        )}

        {/* Sign out */}
        <button
          onClick={() => signOut(auth)}
          className="w-full p-4 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition text-sm font-medium"
        >
          🚪 Системээс гарах
        </button>

        <p className="text-[10px] text-ink/30 text-center mono pt-2">
          uid: {u.uid.slice(0, 12)}… · v0.1.0
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value, suffix, small }: { label: string; value: string; suffix?: string; small?: boolean }) {
  return (
    <div className="card p-3">
      <div className="text-[10px] uppercase tracking-wider text-ink/40">{label}</div>
      <div className={`mono font-semibold mt-1 text-emerald-700 ${small ? "text-xs" : "text-lg"}`}>
        {value}{suffix ? ` ${suffix}` : ""}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 items-baseline">
      <dt className="text-ink/50 text-xs">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "busy" ? "bg-accent/15 text-accent" :
    status === "idle" ? "bg-emerald-100 text-emerald-700" :
    "bg-ink-line/15 text-ink/60";
  const label = status === "busy" ? "Завгүй" : status === "idle" ? "Чөлөөтэй" : "Завсар";
  return <span className={`chip ${tone} border-transparent`}>{label}</span>;
}
