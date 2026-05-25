/**
 * AdminShell — Backoffice/admin портал.
 *
 * URL: /app/*
 * UX: dark sidebar + dense data tables.  Энэ shell нь зөвхөн админ цэс рүү
 * чиглэгдсэн — захиалагч/tech цэсүүд харагдахгүй.  Олон рольтой хэрэглэгчид
 * sidebar-ийн доод хэсэгт жижигхэн "Бусад порталууд" хэсгээр шилжих боломжтой.
 */
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { signOut, User } from "firebase/auth";
import { auth } from "@/firebase/client";
import { useRoles } from "@/lib/useRoles";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  roles?: string[];
}

const NAV: NavItem[] = [
  { to: "/app",            label: "Самбар", end: true, roles: ["super_admin", "dispatcher", "finance"] },
  { to: "/app/dispatch",   label: "Ачилт",             roles: ["super_admin", "dispatcher"] },
  { to: "/app/orders",     label: "Захиалга",          roles: ["super_admin", "dispatcher", "finance"] },
  { to: "/app/products",   label: "Бүтээгдэхүүн",      roles: ["super_admin", "warehouse", "finance"] },
  { to: "/app/pricing",    label: "Үнэлгээ",           roles: ["super_admin", "finance"] },
  { to: "/app/history",    label: "Түүх",              roles: ["super_admin", "dispatcher", "finance"] },
  { to: "/app/inventory",  label: "Агуулах",           roles: ["super_admin", "warehouse"] },
  { to: "/app/people",     label: "Хамтрагчид",        roles: ["super_admin", "dispatcher"] },
];

const TECH_ROLES = ["tech_driver", "tech_pump", "tech_repair", "tech_install"];

export default function AdminShell({ user }: { user: User }) {
  const { roles, hasAny } = useRoles();
  const [navOpen, setNavOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setNavOpen(false); }, [loc.pathname]);

  const visibleNav = NAV.filter((n) => !n.roles || hasAny(n.roles));
  const otherPortals = buildOtherPortals(roles);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <header className="lg:hidden flex items-center justify-between bg-ink text-paper p-4">
        <Link to="/" className="font-semibold" title="Нүүр хуудас">
          <span className="text-accent">●</span> eruulkhors
          <span className="text-xs text-paper/40 ml-2 mono">admin</span>
        </Link>
        <button onClick={() => setNavOpen(!navOpen)} className="text-sm">{navOpen ? "Хаах" : "Цэс"}</button>
      </header>

      <aside className={`bg-ink text-paper p-5 flex-col gap-1 shrink-0 lg:w-64 lg:flex ${navOpen ? "flex" : "hidden lg:flex"}`}>
        <Link to="/" className="text-xl font-semibold mb-5 hidden lg:block hover:opacity-80" title="Нүүр хуудас">
          <span className="text-accent">●</span> eruulkhors
          <span className="text-xs text-paper/40 ml-2 mono">admin</span>
        </Link>

        <div className="text-xs uppercase tracking-wider opacity-50 mb-2">Backoffice</div>
        {visibleNav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm ${isActive ? "bg-paper/10 text-paper" : "text-paper/60 hover:text-paper hover:bg-paper/5"}`
            }
          >
            {n.label}
          </NavLink>
        ))}

        <div className="mt-auto pt-4 text-xs space-y-2 border-t border-paper/10">
          {otherPortals.length > 0 && (
            <div className="pb-3 border-b border-paper/10">
              <div className="text-paper/40 text-[10px] uppercase tracking-wider mb-1.5">Бусад порталууд</div>
              <div className="flex flex-col gap-1">
                {otherPortals.map((p) => (
                  <Link key={p.to} to={p.to} className="flex items-center gap-2 text-paper/60 hover:text-paper">
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <Link to="/app/profile" className="flex items-center gap-2 pt-3 hover:opacity-80">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-xs font-medium">
                {(user.displayName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <div className="truncate">{user.displayName ?? user.email ?? "Зочин"}</div>
              <div className="text-paper/40 truncate text-[10px]">{roles.length} роль</div>
            </div>
          </Link>
          <button onClick={() => signOut(auth)} className="underline opacity-70 hover:opacity-100">Гарах</button>
          <div className="mono opacity-50">v0.1.0 · UB FSOS</div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function buildOtherPortals(roles: string[]) {
  const out: { to: string; label: string; icon: string }[] = [];
  if (roles.includes("super_admin") || roles.includes("customer")) {
    out.push({ to: "/me", label: "Захиалагчийн портал", icon: "🌿" });
  }
  if (roles.some((r) => r === "super_admin" || TECH_ROLES.includes(r))) {
    out.push({ to: "/tech", label: "Хамтрагчийн портал", icon: "🔧" });
  }
  return out;
}
