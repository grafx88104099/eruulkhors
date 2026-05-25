import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/firebase/client";
import { useRoles } from "@/lib/useRoles";
import { useAvailableOrders } from "@/lib/techHooks";
import { BrandMark } from "@/components/BrandMark";

const NAV: { to: string; label: string; icon: string; end?: boolean; badgeKey?: "available" }[] = [
  { to: "/tech/available", label: "Шинэ",    icon: "🆕", badgeKey: "available" },
  { to: "/tech",           label: "Өнөөдөр", icon: "🏠", end: true },
  { to: "/tech/orders",    label: "Захиалга",icon: "📋" },
  { to: "/tech/earnings",  label: "Орлого",  icon: "💰" },
  { to: "/tech/profile",   label: "Профайл", icon: "👤" },
];

export default function TechShell() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const { hasAny, roles } = useRoles();
  const nav = useNavigate();
  const { data: available } = useAvailableOrders();

  const myTechRoles = useMemo(() => roles.filter((r) => r.startsWith("tech_")), [roles]);
  const availableCount = useMemo(() => {
    return available.filter((o) => {
      const bt = (o as any).broadcastTo as string[] | undefined;
      if (!bt || bt.length === 0) return true;
      return myTechRoles.some((r) => bt.includes(r));
    }).length;
  }, [available, myTechRoles]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (authReady && !user) nav("/login", { replace: true });
  }, [authReady, user, nav]);

  if (!authReady || !user) return null;

  const hasAdmin = hasAny(["super_admin", "dispatcher", "warehouse", "finance"]);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* ─── Top header ─── */}
      <header className="sticky top-0 z-30 bg-emerald-700 text-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link to="/tech" className="font-semibold flex items-center gap-2 min-w-0">
            <BrandMark size={18} />
            <span className="truncate">eruulkhors</span>
            <span className="hidden xs:inline text-xs text-white/60 mono">· Хамтрагч</span>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasAdmin && (
              <Link
                to="/app"
                className="text-xs px-2.5 py-1 rounded-full border border-white/30 hover:bg-white/10 transition"
                title="Админ руу"
              >
                Админ
              </Link>
            )}
            <button
              onClick={() => signOut(auth)}
              className="text-xs px-2.5 py-1 rounded-full border border-white/30 hover:bg-white/10 transition"
            >
              Гарах
            </button>
          </div>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="flex-1 max-w-2xl mx-auto w-full pb-24">
        <Outlet />
      </main>

      {/* ─── Bottom nav ─── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 bg-paper border-t border-ink/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-2xl mx-auto grid grid-cols-5">
          {NAV.map((item) => {
            const badge = item.badgeKey === "available" ? availableCount : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition ${
                    isActive ? "text-emerald-700" : "text-ink/50 hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <span className={`text-xl leading-none block ${isActive ? "scale-110" : ""} transition-transform`}>
                        {item.icon}
                      </span>
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center mono animate-pulse">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
