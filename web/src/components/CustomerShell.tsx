/**
 * CustomerShell — захиалагчийн портал.
 *
 * URL: /me/*
 * UX: цайвар (paper) дэвсгэр, emerald accent, top horizontal nav (e-commerce маягтай).
 * Зөвхөн захиалагчийн цэс — админ/tech цэсүүд харагдахгүй.
 */
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { signOut, User } from "firebase/auth";
import { auth } from "@/firebase/client";
import { useRoles } from "@/lib/useRoles";
import { BrandMark } from "@/components/BrandMark";

const NAV = [
  { to: "/me",          label: "Миний нүүр",      end: true },
  { to: "/me/new",      label: "+ Шинэ захиалга" },
  { to: "/me/history",  label: "Түүх" },
];

const TECH_ROLES = ["tech_driver", "tech_pump", "tech_repair", "tech_install"];

export default function CustomerShell({ user }: { user: User }) {
  const { roles } = useRoles();
  const loc = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setNavOpen(false); setMenuOpen(false); }, [loc.pathname]);

  const otherPortals = buildOtherPortals(roles);

  return (
    <div className="min-h-screen bg-paper text-ink eco-theme flex flex-col">
      <header className="border-b border-ink/10 bg-paper/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-semibold text-lg flex items-center gap-1.5 shrink-0">
            <BrandMark size={20} />
            <span>eruul hors</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-4 flex-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm transition ${
                    isActive
                      ? "bg-emerald-600 text-white font-medium"
                      : "text-ink/70 hover:text-ink hover:bg-ink/5"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: profile menu */}
          <div className="relative ml-auto">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 hover:bg-ink/5 rounded-md p-1 pr-2 transition"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-medium">
                  {(user.displayName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-sm text-ink/70 max-w-[120px] truncate">
                {user.displayName ?? user.email ?? "Зочин"}
              </span>
              <span className="text-ink/40 text-xs">▼</span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-ink/10 rounded-lg shadow-lg z-20 py-1 text-sm">
                  <div className="px-4 py-3 border-b border-ink/5">
                    <div className="font-medium truncate">{user.displayName ?? "—"}</div>
                    <div className="text-xs text-ink/50 truncate">{user.email ?? user.uid.slice(0, 12)}</div>
                  </div>
                  <Link to="/me/profile" className="block px-4 py-2 hover:bg-ink/5">Профайл</Link>
                  <Link to="/me/history" className="block px-4 py-2 hover:bg-ink/5">Захиалгын түүх</Link>
                  {otherPortals.length > 0 && (
                    <>
                      <div className="border-t border-ink/5 my-1" />
                      <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-ink/40">Бусад порталууд</div>
                      {otherPortals.map((p) => (
                        <Link key={p.to} to={p.to} className="flex items-center gap-2 px-4 py-2 hover:bg-ink/5">
                          <span>{p.icon}</span>
                          <span>{p.label}</span>
                        </Link>
                      ))}
                    </>
                  )}
                  <div className="border-t border-ink/5 my-1" />
                  <button
                    onClick={() => signOut(auth)}
                    className="w-full text-left px-4 py-2 hover:bg-ink/5 text-err"
                  >
                    Гарах
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="md:hidden p-1.5 rounded-md hover:bg-ink/5"
            aria-label="Цэс"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {navOpen && (
          <nav className="md:hidden border-t border-ink/10 px-4 py-2 flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm ${
                    isActive ? "bg-emerald-600 text-white font-medium" : "text-ink/70 hover:bg-ink/5"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink/5 py-6 px-4 text-center text-xs text-ink/40">
        © 2026 Plastic Center LLC · <Link to="/" className="hover:text-ink/60">Нүүр хуудас</Link>
      </footer>
    </div>
  );
}

function buildOtherPortals(roles: string[]) {
  const out: { to: string; label: string; icon: string }[] = [];
  if (roles.some((r) => ["super_admin", "dispatcher", "warehouse", "finance"].includes(r))) {
    out.push({ to: "/app", label: "Backoffice", icon: "🗂" });
  }
  if (roles.some((r) => r === "super_admin" || TECH_ROLES.includes(r))) {
    out.push({ to: "/tech", label: "Хамтрагчийн портал", icon: "🔧" });
  }
  return out;
}
