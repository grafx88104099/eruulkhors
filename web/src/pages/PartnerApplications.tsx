import { useEffect, useMemo, useState } from "react";
import { doc, limit, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "@/firebase/client";
import { useCollection } from "@/lib/hooks";
import { Card, PageHeader } from "@/components/ui/Layout";

const approvePartnerApplication = httpsCallable<
  { applicationId: string; adminNote?: string },
  { ok: boolean; uid: string; technicianCode: string; roles: string[]; createdNewUser: boolean }
>(functions, "approvePartnerApplication");

type AppStatus = "pending" | "reviewing" | "approved" | "rejected";

interface PartnerApplicationDoc {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  companyName?: string;
  roles: string[];
  districts: string[];
  experienceYears?: number;
  vehicleInfo?: string;
  note?: string;
  status: AppStatus;
  source?: string;
  createdAt?: any;
  reviewedBy?: string;
  reviewedAt?: any;
  adminNote?: string;
  technicianUid?: string;
  technicianCode?: string;
}

const ROLE_LABELS: Record<string, string> = {
  tech_install: "Суулгагч",
  tech_pump: "Соруулагч",
  tech_repair: "Засварчин",
  tech_driver: "Жолооч",
};

const STATUS_LABELS: Record<AppStatus, string> = {
  pending: "Хүлээгдэж буй",
  reviewing: "Хянагдаж буй",
  approved: "Зөвшөөрсөн",
  rejected: "Татгалзсан",
};

const STATUS_TONE: Record<AppStatus, string> = {
  pending: "bg-warn/15 text-warn",
  reviewing: "bg-info/15 text-info",
  approved: "bg-ok/15 text-ok",
  rejected: "bg-err/15 text-err",
};

const STATUS_FILTERS: ("Бүгд" | AppStatus)[] = ["Бүгд", "pending", "reviewing", "approved", "rejected"];

export default function PartnerApplications() {
  return <PartnerApplicationsPanel showHeader />;
}

export function PartnerApplicationsPanel({ showHeader = false }: { showHeader?: boolean }) {
  const { data, loading } = useCollection<PartnerApplicationDoc>(
    "partner_applications",
    orderBy("createdAt", "desc"),
    limit(300),
  );
  const [filter, setFilter] = useState<"Бүгд" | AppStatus>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "Бүгд" ? data : data.filter((d) => d.status === filter)),
    [data, filter],
  );
  const selected = data.find((d) => d.id === selectedId) ?? null;

  // Mobile detail overlay-г нээх үед арын scroll-ийг түгжих
  useEffect(() => {
    if (selected && window.matchMedia("(max-width: 1023px)").matches) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [selected]);

  return (
    <div className="pb-20 lg:pb-0">
      {showHeader && (
        <PageHeader
          title="Үйлчилгээ үзүүлэгчийн хүсэлт"
          sub={`${data.length} нийт${loading ? " · ачааллаж байна…" : ""}`}
        />
      )}

      {/* Статус filter — гар утсанд эгнээгээр scroll */}
      <div className={`${showHeader ? "px-4 sm:px-8 pt-4" : "pt-2"} -mx-1 overflow-x-auto`}>
        <div className="flex gap-2 px-1 min-w-min">
          {STATUS_FILTERS.map((s) => {
            const n = s === "Бүгд" ? data.length : data.filter((d) => d.status === s).length;
            const label = s === "Бүгд" ? "Бүгд" : STATUS_LABELS[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`chip whitespace-nowrap shrink-0 ${filter === s ? "on" : ""}`}
              >
                {label} <span className="mono opacity-60 ml-1">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${showHeader ? "p-4 sm:p-8" : "pt-4"} grid grid-cols-1 lg:grid-cols-3 gap-4`}>
        {/* ─── Хүсэлтийн жагсаалт ─── */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <div className="text-sm text-ink/50 py-10 text-center">
                {loading ? "Ачааллаж байна…" : "Хүсэлт олдсонгүй"}
              </div>
            </Card>
          ) : (
            <>
              {/* Гар утас — карт хэлбэрээр */}
              <div className="lg:hidden space-y-3">
                {filtered.map((a) => (
                  <ApplicationCard
                    key={a.id}
                    app={a}
                    active={selected?.id === a.id}
                    onSelect={() => setSelectedId(a.id)}
                  />
                ))}
              </div>

              {/* Дэлгэц — хүснэгт хэлбэрээр */}
              <Card className="hidden lg:block overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead className="text-left text-ink/50 text-xs uppercase">
                    <tr>
                      <th className="py-3 px-4">Огноо</th>
                      <th>Нэр / Утас</th>
                      <th>Үйлчилгээ</th>
                      <th>Дүүрэг</th>
                      <th>Туршлага</th>
                      <th className="pr-4">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedId(a.id)}
                        className={`border-t border-ink/5 cursor-pointer hover:bg-ink/5 ${
                          selected?.id === a.id ? "bg-ink/5" : ""
                        }`}
                      >
                        <td className="py-3 px-4 mono text-xs text-ink/60">{formatDate(a.createdAt)}</td>
                        <td>
                          <div className="font-medium">{a.fullName}</div>
                          <div className="text-xs text-ink/50 mono">{a.phone}</div>
                        </td>
                        <td className="text-xs">
                          {a.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}
                        </td>
                        <td className="text-xs text-ink/60">
                          {a.districts.length > 0
                            ? a.districts.slice(0, 2).join(", ") + (a.districts.length > 2 ? ` +${a.districts.length - 2}` : "")
                            : "—"}
                        </td>
                        <td className="mono text-xs">{a.experienceYears ?? 0} жил</td>
                        <td className="pr-4">
                          <span className={`chip ${STATUS_TONE[a.status]} border-transparent`}>
                            {STATUS_LABELS[a.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </div>

        {/* ─── Дэлгэрэнгүй (desktop side-panel) ─── */}
        <div className="hidden lg:block">
          {selected ? (
            <ApplicationDetail application={selected} onClose={() => setSelectedId(null)} />
          ) : (
            <Card>
              <p className="text-sm text-ink/50">Хүсэлт сонгоход дэлгэрэнгүй мэдээлэл энд харагдана.</p>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Дэлгэрэнгүй (mobile full-screen drawer) ─── */}
      {selected && (
        <div className="lg:hidden fixed inset-0 z-50 bg-paper flex flex-col">
          <div className="sticky top-0 bg-paper border-b border-ink/10 px-4 py-3 flex justify-between items-center shrink-0">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink/40">Хүсэлт</div>
              <div className="font-semibold truncate max-w-[260px]">{selected.fullName}</div>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="w-9 h-9 rounded-full border border-ink/15 flex items-center justify-center text-ink/60 hover:bg-ink/5"
              aria-label="Хаах"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <ApplicationDetail
              application={selected}
              onClose={() => setSelectedId(null)}
              hideHeaderClose
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  app,
  active,
  onSelect,
}: {
  app: PartnerApplicationDoc;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`card w-full text-left p-4 transition ${
        active ? "ring-2 ring-emerald-500" : "hover:border-emerald-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{app.fullName}</div>
          <a
            href={`tel:${app.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm mono text-ink/60 hover:text-emerald-700"
          >
            {app.phone}
          </a>
        </div>
        <span className={`chip ${STATUS_TONE[app.status]} border-transparent shrink-0`}>
          {STATUS_LABELS[app.status]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {app.roles.map((r) => (
          <span key={r} className="chip text-xs">{ROLE_LABELS[r] ?? r}</span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-ink/60">
        <div>
          <div className="text-ink/40 text-[10px] uppercase">Дүүрэг</div>
          <div className="truncate">
            {app.districts.length > 0
              ? app.districts.slice(0, 2).join(", ") + (app.districts.length > 2 ? ` +${app.districts.length - 2}` : "")
              : "—"}
          </div>
        </div>
        <div>
          <div className="text-ink/40 text-[10px] uppercase">Туршлага</div>
          <div className="mono">{app.experienceYears ?? 0} жил</div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-ink/5 text-[11px] text-ink/40 mono">
        {formatDate(app.createdAt)}
      </div>
    </button>
  );
}

function ApplicationDetail({
  application,
  onClose,
  hideHeaderClose = false,
}: {
  application: PartnerApplicationDoc;
  onClose: () => void;
  hideHeaderClose?: boolean;
}) {
  const [busy, setBusy] = useState<AppStatus | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function updateStatus(next: AppStatus) {
    setBusy(next);
    setError(null);
    setSuccess(null);
    try {
      if (next === "approved") {
        const res = await approvePartnerApplication({
          applicationId: application.id,
          adminNote: adminNote.trim() || undefined,
        });
        const data = res.data;
        setSuccess(
          `Зөвшөөрсөн · Технич код: ${data.technicianCode}${data.createdNewUser ? " · Шинэ хэрэглэгч үүсгэв" : ""}`,
        );
      } else {
        const uid = auth.currentUser?.uid ?? null;
        await updateDoc(doc(db, "partner_applications", application.id), {
          status: next,
          reviewedBy: uid,
          reviewedAt: serverTimestamp(),
          ...(adminNote.trim() ? { adminNote: adminNote.trim() } : {}),
        });
      }
      setAdminNote("");
    } catch (e: any) {
      setError(e?.message ?? "Алдаа гарлаа");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-ink/50 mono truncate">{application.id}</div>
            <div className="font-semibold text-lg break-words">{application.fullName}</div>
            {application.companyName && (
              <div className="text-sm text-ink/60 break-words">{application.companyName}</div>
            )}
          </div>
          {!hideHeaderClose && (
            <button onClick={onClose} className="text-ink/40 hover:text-ink text-xl leading-none shrink-0">
              ×
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className={`chip ${STATUS_TONE[application.status]} border-transparent`}>
            {STATUS_LABELS[application.status]}
          </span>
          <span className="text-xs text-ink/50 mono">{formatDate(application.createdAt)}</span>
        </div>

        <dl className="mt-4 text-sm space-y-3">
          <Row label="Утас">
            <a href={`tel:${application.phone}`} className="mono hover:underline">{application.phone}</a>
          </Row>

          {application.email && (
            <Row label="И-мэйл">
              <a href={`mailto:${application.email}`} className="break-all hover:underline">
                {application.email}
              </a>
            </Row>
          )}

          <Row label="Үүрэг">
            <div className="flex flex-wrap gap-1">
              {application.roles.map((r) => (
                <span key={r} className="chip">{ROLE_LABELS[r] ?? r}</span>
              ))}
            </div>
          </Row>

          {application.districts.length > 0 && (
            <Row label="Дүүрэг">
              <div className="text-xs">{application.districts.join(", ")}</div>
            </Row>
          )}

          <Row label="Туршлага">
            <span className="mono">{application.experienceYears ?? 0} жил</span>
          </Row>

          {application.vehicleInfo && <Row label="Тээвэр">{application.vehicleInfo}</Row>}

          {application.note && (
            <Row label="Тэмдэглэл">
              <div className="whitespace-pre-wrap break-words">{application.note}</div>
            </Row>
          )}

          {application.adminNote && (
            <Row label="Админ">
              <div className="whitespace-pre-wrap break-words text-ink/70 italic">
                {application.adminNote}
              </div>
            </Row>
          )}
        </dl>
      </Card>

      <Card title="Шийдвэр">
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          rows={2}
          placeholder="Дотоод тэмдэглэл (заавал биш)"
          className="input"
        />

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            disabled={busy !== null || application.status === "reviewing"}
            onClick={() => updateStatus("reviewing")}
            className="btn"
          >
            {busy === "reviewing" ? "..." : "Хянаж байна"}
          </button>
          <button
            disabled={busy !== null || application.status === "pending"}
            onClick={() => updateStatus("pending")}
            className="btn"
          >
            {busy === "pending" ? "..." : "Хүлээгдэж буй"}
          </button>
          <button
            disabled={busy !== null || application.status === "approved"}
            onClick={() => updateStatus("approved")}
            className="btn emerald"
          >
            {busy === "approved" ? "..." : "✓ Зөвшөөрөх"}
          </button>
          <button
            disabled={busy !== null || application.status === "rejected"}
            onClick={() => updateStatus("rejected")}
            className="btn"
            style={{
              background: "rgb(239 68 68 / 0.1)",
              color: "rgb(185 28 28)",
              borderColor: "rgb(239 68 68 / 0.3)",
            }}
          >
            {busy === "rejected" ? "..." : "✕ Татгалзах"}
          </button>
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 break-words">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 break-words">
            ✓ {success}
          </div>
        )}

        {application.status === "approved" && application.technicianCode && (
          <div className="mt-3 text-xs text-ink/70 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 break-words">
            Технич код: <span className="mono font-medium">{application.technicianCode}</span>
            {application.technicianUid && (
              <span className="ml-2 text-ink/50 mono text-[10px]">
                uid: {application.technicianUid.slice(0, 8)}…
              </span>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 items-start">
      <dt className="text-ink/50 text-xs pt-0.5">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function formatDate(ts: any): string {
  if (!ts) return "—";
  const d = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
  if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
  return d.toLocaleString("mn-MN", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
