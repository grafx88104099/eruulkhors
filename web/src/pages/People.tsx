import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { limit, orderBy, where } from "firebase/firestore";
import { useCollection } from "@/lib/hooks";
import { Card, PageHeader } from "@/components/ui/Layout";
import { TechnicianDoc } from "@/lib/types";
import { PartnerApplicationsPanel } from "./PartnerApplications";

type Tab = "applications" | "technicians" | "customers";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "applications", label: "Хүсэлтүүд",      icon: "📝" },
  { key: "technicians",  label: "Технич ажилчид", icon: "🔧" },
  { key: "customers",    label: "Захиалагчид",    icon: "🌿" },
];

const ROLE_LABELS: Record<string, string> = {
  tech_install: "Суулгагч",
  tech_pump: "Соруулагч",
  tech_repair: "Засварчин",
  tech_driver: "Жолооч",
};

const TECH_STATUS_LABELS: Record<string, string> = {
  busy: "Завгүй",
  idle: "Чөлөөтэй",
  off: "Завсар",
};

const TECH_STATUS_TONE: Record<string, string> = {
  busy: "bg-accent/15 text-accent",
  idle: "bg-ok/15 text-ok",
  off: "bg-ink-line/15 text-ink/60",
};

interface PartnerApplicationLite {
  id: string;
  status: string;
}

interface UserDoc {
  id: string;
  displayName?: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  role?: string;
  roles?: string[];
  createdAt?: any;
  lastSignInAt?: any;
}

export default function People() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "applications";

  // Хяналтын метрикүүд (бүх таб дээр гарчигт харуулна)
  const { data: apps } = useCollection<PartnerApplicationLite>("partner_applications", limit(500));
  const { data: techs } = useCollection<TechnicianDoc>("technicians", limit(500));
  const { data: customers } = useCollection<UserDoc>("users", where("role", "==", "customer"), limit(500));

  const pendingCount = apps.filter((a) => a.status === "pending").length;

  function setTab(next: Tab) {
    const p = new URLSearchParams(params);
    p.set("tab", next);
    setParams(p, { replace: true });
  }

  return (
    <div className="pb-20 lg:pb-8">
      <PageHeader
        title="Хамтрагчид"
        sub={`${apps.length} хүсэлт · ${techs.length} технич · ${customers.length} захиалагч`}
      />

      {/* ─── Tab strip ─── */}
      <div className="px-4 sm:px-8 pt-4 -mx-1 overflow-x-auto border-b border-ink/10">
        <div className="flex gap-1 px-1 min-w-min">
          {TABS.map((t) => {
            const active = tab === t.key;
            const counter =
              t.key === "applications" ? pendingCount :
              t.key === "technicians"  ? techs.length :
              customers.length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  active
                    ? "border-emerald-600 text-ink"
                    : "border-transparent text-ink/50 hover:text-ink"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {counter > 0 && (
                  <span className={`mono text-[10px] px-1.5 py-0.5 rounded-full ${
                    active ? "bg-emerald-600 text-white" : "bg-ink/10 text-ink/60"
                  }`}>
                    {counter}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 sm:px-8">
        {tab === "applications" && <PartnerApplicationsPanel />}
        {tab === "technicians" && <TechniciansPanel data={techs} />}
        {tab === "customers" && <CustomersPanel data={customers} />}
      </div>
    </div>
  );
}

/* ──────────────────── Technicians tab ──────────────────── */

function TechniciansPanel({ data }: { data: TechnicianDoc[] }) {
  const [roleFilter, setRoleFilter] = useState<string>("Бүгд");
  const [statusFilter, setStatusFilter] = useState<string>("Бүгд");

  const filtered = useMemo(() => {
    return data.filter((t) => {
      if (roleFilter !== "Бүгд" && t.role !== roleFilter) return false;
      if (statusFilter !== "Бүгд" && t.status !== statusFilter) return false;
      return true;
    });
  }, [data, roleFilter, statusFilter]);

  const roles = ["Бүгд", ...Object.keys(ROLE_LABELS)];
  const statuses = ["Бүгд", "busy", "idle", "off"];

  return (
    <div className="pt-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-ink/40 mb-1.5">Үүрэг</div>
          <div className="-mx-1 overflow-x-auto">
            <div className="flex gap-2 px-1 min-w-min">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`chip whitespace-nowrap shrink-0 ${roleFilter === r ? "on" : ""}`}
                >
                  {r === "Бүгд" ? "Бүгд" : ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-ink/40 mb-1.5">Статус</div>
          <div className="-mx-1 overflow-x-auto">
            <div className="flex gap-2 px-1 min-w-min">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`chip whitespace-nowrap shrink-0 ${statusFilter === s ? "on" : ""}`}
                >
                  {s === "Бүгд" ? "Бүгд" : TECH_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-sm text-ink/50 py-10 text-center">Технич олдсонгүй</div>
        </Card>
      ) : (
        <>
          {/* Мобайл — card grid */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((t) => (
              <TechnicianCard key={t.id} tech={t} />
            ))}
          </div>

          {/* Desktop — table */}
          <Card className="hidden lg:block overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-ink/50 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4">Код</th>
                  <th>Нэр</th>
                  <th>Үүрэг</th>
                  <th>Статус</th>
                  <th>Үнэлгээ</th>
                  <th className="pr-4">Тээвэр</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t border-ink/5 hover:bg-ink/5">
                    <td className="py-3 px-4 mono text-xs">{t.code}</td>
                    <td className="font-medium">{t.name}</td>
                    <td className="text-xs">{ROLE_LABELS[t.role] ?? t.role}</td>
                    <td>
                      <span className={`chip ${TECH_STATUS_TONE[t.status] ?? ""} border-transparent`}>
                        {TECH_STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="mono text-xs">{t.rating?.toFixed(1) ?? "—"} ★</td>
                    <td className="pr-4 mono text-xs text-ink/60">{t.vehiclePlate ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function TechnicianCard({ tech }: { tech: TechnicianDoc }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-ink/40 mono">{tech.code}</div>
          <div className="font-semibold truncate">{tech.name}</div>
          <div className="text-xs text-ink/60 mt-0.5">{ROLE_LABELS[tech.role] ?? tech.role}</div>
        </div>
        <span className={`chip ${TECH_STATUS_TONE[tech.status] ?? ""} border-transparent shrink-0`}>
          {TECH_STATUS_LABELS[tech.status] ?? tech.status}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-ink/5 grid grid-cols-2 gap-x-3 text-xs">
        <div>
          <div className="text-ink/40 text-[10px] uppercase">Үнэлгээ</div>
          <div className="mono">{tech.rating?.toFixed(1) ?? "—"} ★</div>
        </div>
        <div>
          <div className="text-ink/40 text-[10px] uppercase">Тээвэр</div>
          <div className="mono text-ink/70 truncate">{tech.vehiclePlate ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── Customers tab ──────────────────── */

function CustomersPanel({ data }: { data: UserDoc[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((c) =>
      (c.displayName ?? "").toLowerCase().includes(term) ||
      (c.email ?? "").toLowerCase().includes(term) ||
      (c.phone ?? "").toLowerCase().includes(term),
    );
  }, [data, q]);

  return (
    <div className="pt-4 space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Нэр, и-мэйл, утсаар хайх…"
        className="input"
      />

      {filtered.length === 0 ? (
        <Card>
          <div className="text-sm text-ink/50 py-10 text-center">
            {q ? "Тохирох захиалагч олдсонгүй" : "Захиалагч бүртгэгдээгүй байна"}
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile — card list */}
          <div className="lg:hidden space-y-3">
            {filtered.map((c) => (
              <CustomerCard key={c.id} customer={c} />
            ))}
          </div>

          {/* Desktop — table */}
          <Card className="hidden lg:block overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-ink/50 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4">Нэр</th>
                  <th>И-мэйл</th>
                  <th>Утас</th>
                  <th>Бүртгүүлсэн</th>
                  <th className="pr-4">Сүүлд нэвтэрсэн</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-ink/5 hover:bg-ink/5">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {c.photoURL ? (
                          <img src={c.photoURL} alt="" className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-medium">
                            {(c.displayName?.[0] ?? c.email?.[0] ?? "?").toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{c.displayName ?? "—"}</span>
                      </div>
                    </td>
                    <td className="text-xs text-ink/70 break-all">{c.email ?? "—"}</td>
                    <td className="mono text-xs">{c.phone ?? "—"}</td>
                    <td className="mono text-xs text-ink/60">{formatDate(c.createdAt)}</td>
                    <td className="pr-4 mono text-xs text-ink/60">{formatDate(c.lastSignInAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function CustomerCard({ customer: c }: { customer: UserDoc }) {
  return (
    <div className="card p-4 flex gap-3">
      {c.photoURL ? (
        <img src={c.photoURL} alt="" className="w-12 h-12 rounded-full shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-base font-medium shrink-0">
          {(c.displayName?.[0] ?? c.email?.[0] ?? "?").toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-semibold truncate">{c.displayName ?? "—"}</div>
        {c.email && (
          <a href={`mailto:${c.email}`} className="block text-xs text-ink/60 hover:text-emerald-700 truncate">
            {c.email}
          </a>
        )}
        {c.phone && (
          <a href={`tel:${c.phone}`} className="block text-xs mono text-ink/60 hover:text-emerald-700">
            {c.phone}
          </a>
        )}
        <div className="mt-1.5 text-[10px] text-ink/40 mono">
          Бүртгүүлсэн: {formatDate(c.createdAt)}
        </div>
      </div>
    </div>
  );
}

function formatDate(ts: any): string {
  if (!ts) return "—";
  const d = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
  if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("mn-MN", { year: "2-digit", month: "2-digit", day: "2-digit" });
}
