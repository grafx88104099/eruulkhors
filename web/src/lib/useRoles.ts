import { useEffect, useState } from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { auth } from "@/firebase/client";

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Супер админ",
  dispatcher: "Диспетчер",
  warehouse: "Агуулахын ажилтан",
  finance: "Санхүү",
  tech_driver: "Жолооч",
  tech_pump: "Соруулагч",
  tech_repair: "Засварчин",
  tech_install: "Суулгагч",
  customer: "Захиалагч",
};

export const ALL_ROLES = Object.keys(ROLE_LABELS);

/**
 * Returns the array of roles the signed-in user holds, read from the Firebase
 * Auth ID token's custom claims (`roles[]` if present, otherwise the legacy
 * `role` string is wrapped into a single-element array).
 *
 * Token шинэчлэгдэх бүрд (login, role өөрчлөгдсөнтэй холбоотой refresh) автоматаар update.
 */
export function useRoles(): {
  roles: string[];
  primaryRole: string;
  hasRole: (r: string) => boolean;
  hasAny: (rs: string[]) => boolean;
  ready: boolean;
} {
  const [roles, setRoles] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u: User | null) => {
      if (!u) { setRoles([]); setReady(true); return; }
      const t = await u.getIdTokenResult();
      const claims: any = t.claims;
      let rs: string[] = [];
      if (Array.isArray(claims.roles)) rs = claims.roles;
      else if (typeof claims.role === "string") rs = [claims.role];
      else rs = ["customer"];
      setRoles(rs);
      setReady(true);
    });
    return () => unsub();
  }, []);

  return {
    roles,
    primaryRole: roles[0] ?? "customer",
    hasRole: (r: string) => roles.includes(r),
    hasAny: (rs: string[]) => rs.some((r) => roles.includes(r)),
    ready,
  };
}

/** Хэрэглэгчийн хамгийн өндөр приоритет role-д тохирох home route. */
export function homeForRoles(roles: string[]): string {
  // Priority order: admin → tech → customer
  if (roles.some((r) => ["super_admin", "dispatcher", "warehouse", "finance"].includes(r))) {
    return "/app";
  }
  if (roles.some((r) => r.startsWith("tech_"))) return "/tech";
  return "/me";
}
