import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase/client";
import { startUserSync } from "@/lib/userSync";
import { homeForRoles, useRoles } from "@/lib/useRoles";
import { ReactNode } from "react";

// Shells (тус бүр өөрийн URL prefix-тэй тусдаа портал)
import AdminShell from "./components/AdminShell";
import CustomerShell from "./components/CustomerShell";
import TechShell from "./components/TechShell";

// Admin pages (/app/*)
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Pricing from "./pages/Pricing";
import Inventory from "./pages/Inventory";
import Dispatch from "./pages/Dispatch";
import History from "./pages/History";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import People from "./pages/People";

// Tech pages (/tech/*)
import TechToday from "./pages/tech/Today";
import TechAvailable from "./pages/tech/Available";
import TechOrders from "./pages/tech/Orders";
import TechOrderDetail from "./pages/tech/OrderDetail";
import TechEarnings from "./pages/tech/Earnings";
import TechProfile from "./pages/tech/Profile";

// Customer pages (/me/*)
import CustomerHome from "./pages/customer/Home";
import NewOrder from "./pages/customer/NewOrder";
import CustomerOrderDetail from "./pages/customer/OrderDetail";
import CustomerHistory from "./pages/customer/History";

// Public pages
import Landing from "./pages/Landing";
import Partner from "./pages/Partner";
import AdminLogin from "./pages/AdminLogin";

const ADMIN_ROLES = ["super_admin", "dispatcher", "warehouse", "finance"];
const TECH_ROLES  = ["super_admin", "tech_driver", "tech_pump", "tech_repair", "tech_install"];
const CUSTOMER_ROLES = ["super_admin", "customer"];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); });
    const unsubSync = startUserSync();
    return () => { unsubAuth(); unsubSync(); };
  }, []);

  if (!authReady) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-ink/60">Ачааллаж байна…</div>;
  }

  return (
    <Routes>
      {/* ─── Public ─── */}
      <Route path="/"        element={<Landing />} />
      <Route path="/partner" element={<Partner />} />
      <Route path="/admin"   element={<AdminLogin />} />
      <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
      <Route path="/login"   element={user ? <RoleRedirect /> : <Landing initialAuth="login" />} />
      <Route path="/signup"  element={user ? <RoleRedirect /> : <Landing initialAuth="signup" />} />

      {/* ─── Backoffice (admin) /app/* ─── */}
      <Route element={user ? <AdminShell user={user} /> : <Navigate to="/admin" replace />}>
        <Route path="/app"           element={<RoleGuard allow={ADMIN_ROLES}><Dashboard /></RoleGuard>} />
        <Route path="/app/dispatch"  element={<RoleGuard allow={["super_admin", "dispatcher"]}><Dispatch /></RoleGuard>} />
        <Route path="/app/orders"    element={<RoleGuard allow={["super_admin", "dispatcher", "finance"]}><Orders /></RoleGuard>} />
        <Route path="/app/pricing"   element={<RoleGuard allow={["super_admin", "finance"]}><Pricing /></RoleGuard>} />
        <Route path="/app/history"   element={<RoleGuard allow={["super_admin", "dispatcher", "finance"]}><History /></RoleGuard>} />
        <Route path="/app/inventory" element={<RoleGuard allow={["super_admin", "warehouse"]}><Inventory /></RoleGuard>} />
        <Route path="/app/products"  element={<RoleGuard allow={["super_admin", "warehouse", "finance"]}><Products /></RoleGuard>} />
        <Route path="/app/people"    element={<RoleGuard allow={["super_admin", "dispatcher"]}><People /></RoleGuard>} />
        <Route path="/app/profile"   element={<Profile />} />
        <Route path="/app/partners"  element={<Navigate to="/app/people?tab=applications" replace />} />
      </Route>

      {/* ─── Customer /me/* ─── */}
      <Route element={user ? <CustomerShell user={user} /> : <Navigate to="/login" replace />}>
        <Route path="/me"             element={<RoleGuard allow={CUSTOMER_ROLES}><CustomerHome /></RoleGuard>} />
        <Route path="/me/new"         element={<RoleGuard allow={CUSTOMER_ROLES}><NewOrder /></RoleGuard>} />
        <Route path="/me/orders/:id"  element={<RoleGuard allow={CUSTOMER_ROLES}><CustomerOrderDetail /></RoleGuard>} />
        <Route path="/me/history"     element={<RoleGuard allow={CUSTOMER_ROLES}><CustomerHistory /></RoleGuard>} />
        <Route path="/me/profile"     element={<Profile />} />
      </Route>

      {/* ─── Tech /tech/* ─── */}
      <Route element={user ? <TechShell /> : <Navigate to="/login" replace />}>
        <Route path="/tech"             element={<RoleGuard allow={TECH_ROLES}><TechToday /></RoleGuard>} />
        <Route path="/tech/available"   element={<RoleGuard allow={TECH_ROLES}><TechAvailable /></RoleGuard>} />
        <Route path="/tech/orders"      element={<RoleGuard allow={TECH_ROLES}><TechOrders /></RoleGuard>} />
        <Route path="/tech/orders/:id"  element={<RoleGuard allow={TECH_ROLES}><TechOrderDetail /></RoleGuard>} />
        <Route path="/tech/earnings"    element={<RoleGuard allow={TECH_ROLES}><TechEarnings /></RoleGuard>} />
        <Route path="/tech/profile"     element={<RoleGuard allow={TECH_ROLES}><TechProfile /></RoleGuard>} />
      </Route>

      {/* ─── Legacy redirects ─── */}
      <Route path="/dispatch"          element={<Navigate to="/app/dispatch" replace />} />
      <Route path="/orders"            element={<Navigate to="/app/orders" replace />} />
      <Route path="/pricing"           element={<Navigate to="/app/pricing" replace />} />
      <Route path="/history"           element={<Navigate to="/app/history" replace />} />
      <Route path="/inventory"         element={<Navigate to="/app/inventory" replace />} />
      <Route path="/profile"           element={<Navigate to="/app/profile" replace />} />
      <Route path="/app/tech"          element={<Navigate to="/tech" replace />} />
      <Route path="/app/tech/orders"   element={<Navigate to="/tech/orders" replace />} />
      <Route path="/app/tech/earnings" element={<Navigate to="/tech/earnings" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Нэвтэрсний дараа role-оор тохирох эхний хуудас руу шилжүүлэх. */
function RoleRedirect() {
  const { roles, ready } = useRoles();
  if (!ready) return null;
  return <Navigate to={homeForRoles(roles)} replace />;
}

/** Энэ child нь зөвхөн нэвтэрсэн хэрэглэгч заасан ролуудын аль нэгийг агуулсан үед л render-лэгдэнэ.
 *  Үгүй бол тухайн хэрэглэгчийн home рүү автоматаар redirect хийнэ. */
function RoleGuard({ allow, children }: { allow: string[]; children: ReactNode }) {
  const { roles, hasAny, ready } = useRoles();
  if (!ready) return null;
  if (!hasAny(allow)) return <Navigate to={homeForRoles(roles)} replace />;
  return <>{children}</>;
}
