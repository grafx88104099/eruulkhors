import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

import { calculateOrderPrice, PricingInputs } from "./pricing";

initializeApp();
const db = getFirestore();
const adminAuth = getAuth();

const ROLES = [
  "super_admin", "dispatcher", "warehouse", "finance",
  "tech_driver", "tech_pump", "tech_repair", "tech_install",
  "customer",
] as const;
type Role = typeof ROLES[number];

function callerRoles(token: any): string[] {
  if (Array.isArray(token?.roles)) return token.roles;
  if (typeof token?.role === "string") return [token.role];
  return [];
}
function callerHasRole(token: any, r: Role) {
  return callerRoles(token).includes(r);
}

/* ------------------------------------------------------------------ */
/*  calculatePrice — callable for the web Pricing screen calculator.   */
/* ------------------------------------------------------------------ */
export const calculatePrice = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");
  const { zoneId, tankId, service, distanceKm, multiplierIds = [] } = req.data ?? {};
  if (!zoneId || !tankId || !service) {
    throw new HttpsError("invalid-argument", "zoneId, tankId, service шаардлагатай");
  }

  const [zoneSnap, tankSnap, multSnaps] = await Promise.all([
    db.doc(`pricingZones/${zoneId}`).get(),
    db.doc(`tankSizes/${tankId}`).get(),
    Promise.all((multiplierIds as string[]).map((id) => db.doc(`multipliers/${id}`).get())),
  ]);
  if (!zoneSnap.exists || !tankSnap.exists) {
    throw new HttpsError("not-found", "Бүс эсвэл танк олдсонгүй");
  }
  const zone = zoneSnap.data()!;
  const tank = tankSnap.data()!;
  const basePriceKey = service === "Соруулга" ? "servicePump"
    : service === "Суулгалт" ? "serviceInstall"
    : service === "Засвар" ? "serviceRepair" : null;
  if (!basePriceKey) throw new HttpsError("invalid-argument", "Үйлчилгээ буруу");

  const multipliers = multSnaps
    .filter((s) => s.exists && s.data()?.active !== false)
    .map((s) => ({ id: s.id, ...s.data()! } as any));

  const inp: PricingInputs = {
    baseServicePrice: Number(zone[basePriceKey] || 0),
    tankCoefficient: Number(tank.coefficient || 1),
    distanceKm: Number(distanceKm || 0),
    zoneDistanceRate: Number(zone.distanceKmRate || 0),
    zoneMultiplier: Number(zone.multiplier || 1),
    multiplierPcts: multipliers.map((m: any) => Number(m.pct)),
  };
  const breakdown = calculateOrderPrice(inp);
  return {
    zone: zone.name,
    tank: tank.label,
    appliedMultipliers: multipliers.map((m: any) => ({ id: m.id, name: m.name, pct: m.pct })),
    breakdown,
  };
});

/* ------------------------------------------------------------------ */
/*  Roles core helper                                                  */
/* ------------------------------------------------------------------ */
async function applyRoles(actorUid: string, uid: string, roles: string[]) {
  if (!uid || !Array.isArray(roles) || roles.length === 0) {
    throw new HttpsError("invalid-argument", "uid + хүчинтэй roles[] шаардлагатай");
  }
  const invalid = roles.filter((r) => !ROLES.includes(r as Role));
  if (invalid.length) {
    throw new HttpsError("invalid-argument", `Үл мэдэгдэх роль: ${invalid.join(", ")}`);
  }
  const dedup = Array.from(new Set(roles)) as Role[];
  if (uid === actorUid && !dedup.includes("super_admin")) {
    throw new HttpsError("failed-precondition", "Та өөрийнхөө супер админ эрхийг буулгаж чадахгүй");
  }
  // Эхний нь "primary" — token.role-д ч хадгална (legacy compat)
  await adminAuth.setCustomUserClaims(uid, { role: dedup[0], roles: dedup });
  await db.doc(`users/${uid}`).set({
    role: dedup[0],
    roles: dedup,
    roleUpdatedAt: FieldValue.serverTimestamp(),
    roleUpdatedBy: actorUid,
  }, { merge: true });
  logger.info(`User ${uid} roles -> [${dedup.join(",")}] by ${actorUid}`);
  return { ok: true, uid, roles: dedup };
}

/* ------------------------------------------------------------------ */
/*  setUserRoles — олон ролийг array-аар тавина (super_admin зөвхөн)    */
/* ------------------------------------------------------------------ */
export const setUserRoles = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");
  if (!callerHasRole(req.auth.token, "super_admin")) {
    throw new HttpsError("permission-denied", "Зөвхөн супер админ ролийг өөрчлөх боломжтой");
  }
  const { uid, roles } = req.data ?? {};
  return applyRoles(req.auth.uid, uid, roles);
});

/* setUserRole — Хуучин нэг рольтой callable (backward compatible) */
export const setUserRole = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");
  if (!callerHasRole(req.auth.token, "super_admin")) {
    throw new HttpsError("permission-denied", "Зөвхөн супер админ");
  }
  const { uid, role } = req.data ?? {};
  return applyRoles(req.auth.uid, uid, [role]);
});

/* ------------------------------------------------------------------ */
/*  updateMyProfile — хэрэглэгч өөрийн displayName, phone засна         */
/* ------------------------------------------------------------------ */
export const updateMyProfile = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");
  const { displayName, phone } = req.data ?? {};
  const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof displayName === "string" && displayName.length <= 80) {
    updates.displayName = displayName;
    await adminAuth.updateUser(req.auth.uid, { displayName });
  }
  if (typeof phone === "string" && phone.length <= 32) {
    updates.phone = phone;
  }
  await db.doc(`users/${req.auth.uid}`).set(updates, { merge: true });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/*  listUsers — super_admin зориулсан хэрэглэгчдийн жагсаалт           */
/* ------------------------------------------------------------------ */
export const listUsers = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");
  if (!callerHasRole(req.auth.token, "super_admin")) {
    throw new HttpsError("permission-denied", "Зөвхөн супер админд харагдана");
  }
  const result = await adminAuth.listUsers(200);
  return {
    users: result.users.map((u) => {
      const claims = u.customClaims as any;
      const roles: string[] = Array.isArray(claims?.roles)
        ? claims.roles
        : claims?.role ? [claims.role] : ["customer"];
      return {
        uid: u.uid,
        email: u.email ?? null,
        displayName: u.displayName ?? null,
        photoURL: u.photoURL ?? null,
        disabled: u.disabled,
        role: roles[0],
        roles,
        providerId: u.providerData[0]?.providerId ?? "unknown",
        lastSignInTime: u.metadata.lastSignInTime,
        creationTime: u.metadata.creationTime,
      };
    }),
  };
});

/* ------------------------------------------------------------------ */
/*  createOrder — Захиалагч шинэ захиалга үүсгэх                       */
/* ------------------------------------------------------------------ */
export const createOrder = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");

  const {
    service,        // "Соруулга" | "Засвар" | "Суулгалт"
    tankId,         // "tank-3m3" гэх мэт
    districtId,     // "bayanzurkh" гэх мэт
    address,        // үнэгүй текст
    phone,          // утас
    notes,          // нэмэлт тэмдэглэл
    preferredTime,  // "asap" | "today" | "tomorrow" | ISO дата
    multiplierIds = [],
    distanceKm = 5,
  } = req.data ?? {};

  if (!service || !tankId || !districtId || !address || !phone) {
    throw new HttpsError("invalid-argument", "service, tankId, districtId, address, phone шаардлагатай");
  }
  const services = ["Соруулга", "Засвар", "Суулгалт"];
  if (!services.includes(service)) throw new HttpsError("invalid-argument", "service буруу");

  // District-аас zone-ыг таамаглах (одоогоор бүгд "zone-center" — ирээдүйд polygon-р)
  const districtSnap = await db.doc(`districts/${districtId}`).get();
  if (!districtSnap.exists) throw new HttpsError("not-found", "Дүүрэг олдсонгүй");

  const tankSnap = await db.doc(`tankSizes/${tankId}`).get();
  if (!tankSnap.exists) throw new HttpsError("not-found", "Танкны хэмжээ олдсонгүй");

  const zoneId = "zone-center"; // TODO: district-аас тооцох
  const zoneSnap = await db.doc(`pricingZones/${zoneId}`).get();
  if (!zoneSnap.exists) throw new HttpsError("not-found", "Үнэлгээний бүс олдсонгүй");

  const zone = zoneSnap.data()!;
  const tank = tankSnap.data()!;
  const basePriceKey = service === "Соруулга" ? "servicePump"
    : service === "Суулгалт" ? "serviceInstall" : "serviceRepair";

  const multSnaps = await Promise.all(
    (multiplierIds as string[]).map((id) => db.doc(`multipliers/${id}`).get())
  );
  const mults = multSnaps.filter((s) => s.exists).map((s) => s.data()!);

  const breakdown = calculateOrderPrice({
    baseServicePrice: Number(zone[basePriceKey] || 0),
    tankCoefficient: Number(tank.coefficient || 1),
    distanceKm: Number(distanceKm || 0),
    zoneDistanceRate: Number(zone.distanceKmRate || 0),
    zoneMultiplier: Number(zone.multiplier || 1),
    multiplierPcts: mults.map((m: any) => Number(m.pct)),
  });

  // Дараагийн ORD код үүсгэх (нийт + 1)
  const allOrders = await db.collection("orders").count().get();
  const next = (allOrders.data().count || 0) + 2900; // эхлэх дугаар
  const code = `ORD-${next}`;

  const userDoc = await db.doc(`users/${req.auth.uid}`).get();
  const customerName = userDoc.data()?.displayName || req.auth.token.name || req.auth.token.email || "Захиалагч";

  const order = {
    code,
    customerId: req.auth.uid,
    customer: customerName,
    customerPhone: phone,
    district: districtId,
    address,
    service,
    tank: tank.label,
    tankId,
    zoneId,
    priority: preferredTime === "asap" ? "Яаралтай" : "Энгийн",
    status: "Хүлээгдэж буй",
    technicianId: null,
    technicianCode: null,
    eta: "—",
    notes: notes ?? "",
    preferredTime: preferredTime ?? "asap",
    distanceKm: Number(distanceKm),
    multiplierIds,
    totalPrice: breakdown.total,
    priceBreakdown: breakdown,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = await db.collection("orders").add(order);
  await ref.collection("events").add({
    at: FieldValue.serverTimestamp(),
    title: "Захиалга үүсгэгдсэн",
    meta: `${breakdown.total.toLocaleString()}₮`,
    state: "done",
  });
  logger.info(`Order ${code} created by customer ${req.auth.uid}`);
  return { ok: true, id: ref.id, code, totalPrice: breakdown.total, breakdown };
});

/* ------------------------------------------------------------------ */
/*  cancelMyOrder — Захиалагч өөрийн "Хүлээгдэж буй" захиалгыг цуцлах    */
/* ------------------------------------------------------------------ */
export const cancelMyOrder = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");
  const { orderId, reason } = req.data ?? {};
  if (!orderId) throw new HttpsError("invalid-argument", "orderId шаардлагатай");

  const ref = db.doc(`orders/${orderId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Захиалга олдсонгүй");
  const o = snap.data()!;
  if (o.customerId !== req.auth.uid) {
    throw new HttpsError("permission-denied", "Танд хамаарахгүй захиалга");
  }
  if (o.status !== "Хүлээгдэж буй") {
    throw new HttpsError("failed-precondition", "Зөвхөн хүлээгдэж буй захиалгыг цуцлах боломжтой");
  }

  await ref.update({
    status: "Цуцлагдсан",
    cancelReason: reason ?? "",
    cancelledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await ref.collection("events").add({
    at: FieldValue.serverTimestamp(),
    title: "Захиалагч цуцалсан",
    meta: reason ?? "",
    state: "done",
  });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/*  rateOrder — Дуусгасан захиалгад үнэлгээ                            */
/* ------------------------------------------------------------------ */
export const rateOrder = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");
  const { orderId, rating, comment } = req.data ?? {};
  const r = Number(rating);
  if (!orderId || isNaN(r) || r < 1 || r > 5) {
    throw new HttpsError("invalid-argument", "orderId + rating(1-5) шаардлагатай");
  }

  const ref = db.doc(`orders/${orderId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Захиалга олдсонгүй");
  const o = snap.data()!;
  if (o.customerId !== req.auth.uid) {
    throw new HttpsError("permission-denied", "Танд хамаарахгүй захиалга");
  }
  if (o.status !== "Дуусгасан") {
    throw new HttpsError("failed-precondition", "Зөвхөн дуусгасан захиалгад үнэлгээ өгөх боломжтой");
  }

  await ref.update({
    rating: r,
    ratingComment: comment ?? "",
    ratedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await ref.collection("events").add({
    at: FieldValue.serverTimestamp(),
    title: `Захиалагч ${r}★ үнэлэв`,
    meta: comment ?? "",
    state: "done",
  });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/*  onOrderWritten — recalc total price + maintain status timeline.    */
/* ------------------------------------------------------------------ */
export const onOrderWritten = onDocumentWritten("orders/{orderId}", async (event) => {
  const after = event.data?.after.data();
  const before = event.data?.before.data();
  if (!after) return;

  // 1. Recalculate price if pricing-affecting fields changed
  const pricingChanged = !before
    || before.zoneId !== after.zoneId
    || before.tankId !== after.tankId
    || before.service !== after.service
    || before.distanceKm !== after.distanceKm
    || JSON.stringify(before.multiplierIds || []) !== JSON.stringify(after.multiplierIds || []);

  if (pricingChanged && after.zoneId && after.tankId && after.service) {
    try {
      const [zoneSnap, tankSnap, multSnaps] = await Promise.all([
        db.doc(`pricingZones/${after.zoneId}`).get(),
        db.doc(`tankSizes/${after.tankId}`).get(),
        Promise.all((after.multiplierIds ?? []).map((id: string) => db.doc(`multipliers/${id}`).get())),
      ]);
      if (zoneSnap.exists && tankSnap.exists) {
        const zone = zoneSnap.data()!;
        const tank = tankSnap.data()!;
        const basePriceKey = after.service === "Соруулга" ? "servicePump"
          : after.service === "Суулгалт" ? "serviceInstall" : "serviceRepair";
        const mults = multSnaps.filter((s: any) => s.exists).map((s: any) => s.data());
        const breakdown = calculateOrderPrice({
          baseServicePrice: Number(zone[basePriceKey] || 0),
          tankCoefficient: Number(tank.coefficient || 1),
          distanceKm: Number(after.distanceKm || 0),
          zoneDistanceRate: Number(zone.distanceKmRate || 0),
          zoneMultiplier: Number(zone.multiplier || 1),
          multiplierPcts: mults.map((m: any) => Number(m.pct)),
        });
        await event.data!.after.ref.update({
          totalPrice: breakdown.total,
          priceBreakdown: breakdown,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      logger.error("Order recalc failed", e);
    }
  }

  // 2. Append a status-change event
  if (before && before.status !== after.status) {
    await event.data!.after.ref.collection("events").add({
      at: FieldValue.serverTimestamp(),
      title: `Статус: ${after.status}`,
      state: "done",
    });
  }
});

/* ------------------------------------------------------------------ */
/*  recordStockMovement — Агуулахын орлого/зарлага/засвар хөдөлгөөн     */
/*  • Атомт runTransaction: stockLevels update + stockMovements log    */
/* ------------------------------------------------------------------ */
type StockMovementType = "in" | "out" | "adjust";

export const recordStockMovement = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");
  if (!callerHasRole(req.auth.token, "super_admin") && !callerHasRole(req.auth.token, "warehouse")) {
    throw new HttpsError("permission-denied", "Зөвхөн админ эсвэл агуулахын ажилтан");
  }

  const {
    warehouseCode,
    skuCode,
    type,
    quantity,
    note,
    reason,
    unitCost,
  } = req.data ?? {};

  if (typeof warehouseCode !== "string" || !warehouseCode) {
    throw new HttpsError("invalid-argument", "warehouseCode шаардлагатай");
  }
  if (typeof skuCode !== "string" || !skuCode) {
    throw new HttpsError("invalid-argument", "skuCode шаардлагатай");
  }
  if (!["in", "out", "adjust"].includes(type)) {
    throw new HttpsError("invalid-argument", "type нь in/out/adjust байх ёстой");
  }
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty === 0) {
    throw new HttpsError("invalid-argument", "quantity 0-ээс ялгаатай тоо байх ёстой");
  }
  if ((type === "in" || type === "out") && qty <= 0) {
    throw new HttpsError("invalid-argument", "in/out хөдөлгөөнд quantity нь +тоо");
  }

  const mvType = type as StockMovementType;
  const delta = mvType === "in" ? Math.abs(qty)
    : mvType === "out" ? -Math.abs(qty)
    : qty; // adjust — гарын утга шууд

  const result = await db.runTransaction(async (tx) => {
    const skuRef = db.doc(`skus/${skuCode}`);
    const whRef = db.doc(`warehouses/${warehouseCode}`);
    const [skuSnap, whSnap] = await Promise.all([tx.get(skuRef), tx.get(whRef)]);
    if (!skuSnap.exists) throw new HttpsError("not-found", `SKU олдсонгүй: ${skuCode}`);
    if (!whSnap.exists) throw new HttpsError("not-found", `Агуулах олдсонгүй: ${warehouseCode}`);

    const sku = skuSnap.data() as any;
    const wh = whSnap.data() as any;

    const stockId = `${warehouseCode}_${skuCode}`;
    const stockRef = db.doc(`stockLevels/${stockId}`);
    const stockSnap = await tx.get(stockRef);

    const currentStock = stockSnap.exists ? Number(stockSnap.data()?.stock ?? 0) : 0;
    const newStock = currentStock + delta;

    if (newStock < 0) {
      throw new HttpsError(
        "failed-precondition",
        `Хангалттай нөөц алга. Одоогийн: ${currentStock} ${sku.unit ?? ""}, шаардаж байгаа: ${Math.abs(delta)} ${sku.unit ?? ""}`,
      );
    }

    const min = stockSnap.exists ? Number(stockSnap.data()?.minThreshold ?? 0) : Number(sku.minThreshold ?? 0);
    const max = stockSnap.exists ? Number(stockSnap.data()?.maxThreshold ?? 0) : Number(sku.maxThreshold ?? 0);
    const isLow = newStock <= min;
    const isCritical = newStock < min * 0.5;

    const stockBase = {
      skuCode,
      skuName: sku.name,
      skuCategory: sku.category,
      skuUnit: sku.unit,
      skuCost: Number(sku.cost ?? sku.skuCost ?? 0),
      warehouseCode,
      warehouseName: wh.name,
      stock: newStock,
      reserved: stockSnap.exists ? Number(stockSnap.data()?.reserved ?? 0) : 0,
      minThreshold: min,
      maxThreshold: max,
      isLow,
      isCritical,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (stockSnap.exists) {
      tx.update(stockRef, stockBase);
    } else {
      tx.set(stockRef, { ...stockBase, createdAt: FieldValue.serverTimestamp() });
    }

    const effectiveUnitCost = Number(
      typeof unitCost === "number" && Number.isFinite(unitCost)
        ? unitCost
        : sku.cost ?? sku.skuCost ?? 0,
    );

    const movementRef = db.collection("stockMovements").doc();
    tx.set(movementRef, {
      skuCode,
      skuName: sku.name,
      skuUnit: sku.unit,
      warehouseCode,
      warehouseName: wh.name,
      type: mvType,
      quantity: Math.abs(qty),
      delta,
      balanceBefore: currentStock,
      balanceAfter: newStock,
      unitCost: effectiveUnitCost,
      totalValue: effectiveUnitCost * Math.abs(qty),
      reason: typeof reason === "string" ? reason.trim() : "",
      note: typeof note === "string" ? note.trim() : "",
      actorUid: req.auth!.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { movementId: movementRef.id, newStock, oldStock: currentStock };
  });

  logger.info(`Stock ${mvType} ${warehouseCode}/${skuCode} ${delta > 0 ? "+" : ""}${delta} → ${result.newStock} (by ${req.auth.uid})`);
  return { ok: true, ...result };
});

/* ------------------------------------------------------------------ */
/*  createDispatchOrder — Админ broadcast захиалга үүсгэх              */
/*  • technicianId=null, isOpen=true                                    */
/*  • createOrder-ийн pricing логикийг дахин ашиглана                  */
/* ------------------------------------------------------------------ */
const TECH_ROLE_KEYS = ["tech_install", "tech_pump", "tech_repair", "tech_driver"] as const;

function defaultBroadcastFor(service: string): string[] {
  if (service === "Соруулга") return ["tech_pump", "tech_driver"];
  if (service === "Засвар") return ["tech_repair"];
  if (service === "Суулгалт") return ["tech_install", "tech_driver"];
  return [...TECH_ROLE_KEYS];
}

export const createDispatchOrder = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");
  if (!callerHasRole(req.auth.token, "super_admin") && !callerHasRole(req.auth.token, "dispatcher")) {
    throw new HttpsError("permission-denied", "Зөвхөн супер админ эсвэл диспетчер");
  }

  const {
    service,
    tankId,
    districtId,
    address,
    phone,
    customerName,
    notes,
    priority = "Энгийн",
    distanceKm = 5,
    multiplierIds = [],
    broadcastTo,
  } = req.data ?? {};

  if (!service || !tankId || !districtId || !address || !phone) {
    throw new HttpsError("invalid-argument", "service, tankId, districtId, address, phone шаардлагатай");
  }
  const services = ["Соруулга", "Засвар", "Суулгалт"];
  if (!services.includes(service)) throw new HttpsError("invalid-argument", "service буруу");

  const districtSnap = await db.doc(`districts/${districtId}`).get();
  if (!districtSnap.exists) throw new HttpsError("not-found", "Дүүрэг олдсонгүй");
  const tankSnap = await db.doc(`tankSizes/${tankId}`).get();
  if (!tankSnap.exists) throw new HttpsError("not-found", "Танкны хэмжээ олдсонгүй");
  const zoneId = "zone-center";
  const zoneSnap = await db.doc(`pricingZones/${zoneId}`).get();
  if (!zoneSnap.exists) throw new HttpsError("not-found", "Үнэлгээний бүс олдсонгүй");

  const zone = zoneSnap.data()!;
  const tank = tankSnap.data()!;
  const basePriceKey = service === "Соруулга" ? "servicePump"
    : service === "Суулгалт" ? "serviceInstall" : "serviceRepair";

  const multSnaps = await Promise.all(
    (multiplierIds as string[]).map((id) => db.doc(`multipliers/${id}`).get()),
  );
  const mults = multSnaps.filter((s) => s.exists).map((s) => s.data()!);

  const breakdown = calculateOrderPrice({
    baseServicePrice: Number(zone[basePriceKey] || 0),
    tankCoefficient: Number(tank.coefficient || 1),
    distanceKm: Number(distanceKm || 0),
    zoneDistanceRate: Number(zone.distanceKmRate || 0),
    zoneMultiplier: Number(zone.multiplier || 1),
    multiplierPcts: mults.map((m: any) => Number(m.pct)),
  });

  const allOrders = await db.collection("orders").count().get();
  const next = (allOrders.data().count || 0) + 2900;
  const code = `ORD-${next}`;

  const resolvedBroadcast = Array.isArray(broadcastTo) && broadcastTo.length > 0
    ? broadcastTo.filter((r: string) => (TECH_ROLE_KEYS as readonly string[]).includes(r))
    : defaultBroadcastFor(service);

  const order = {
    code,
    customerId: null,
    customer: typeof customerName === "string" && customerName.trim()
      ? customerName.trim()
      : "Дуудлага захиалга",
    customerPhone: phone,
    district: districtId,
    address,
    service,
    tank: tank.label,
    tankId,
    zoneId,
    priority,
    status: "Хүлээгдэж буй",
    technicianId: null,
    technicianCode: null,
    eta: "—",
    notes: notes ?? "",
    distanceKm: Number(distanceKm),
    multiplierIds,
    totalPrice: breakdown.total,
    priceBreakdown: breakdown,
    // Broadcast metadata
    isOpen: true,
    broadcastTo: resolvedBroadcast,
    broadcastedAt: FieldValue.serverTimestamp(),
    broadcastedBy: req.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = await db.collection("orders").add(order);
  await ref.collection("events").add({
    at: FieldValue.serverTimestamp(),
    title: `Дуудлага нээгдсэн — ${resolvedBroadcast.length} үүрэгт`,
    meta: `${breakdown.total.toLocaleString()}₮`,
    state: "done",
  });
  logger.info(`Dispatch order ${code} broadcast to [${resolvedBroadcast.join(",")}] by ${req.auth.uid}`);
  return { ok: true, id: ref.id, code, totalPrice: breakdown.total, broadcastTo: resolvedBroadcast };
});

/* ------------------------------------------------------------------ */
/*  claimOrder — Технич нээлттэй дуудлагыг атомт авах                   */
/* ------------------------------------------------------------------ */
export const claimOrder = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");
  const callerRoleList = callerRoles(req.auth.token);
  const techRoles = callerRoleList.filter((r) => r.startsWith("tech_"));
  if (techRoles.length === 0 && !callerHasRole(req.auth.token, "super_admin")) {
    throw new HttpsError("permission-denied", "Зөвхөн технич");
  }

  const { orderId } = req.data ?? {};
  if (typeof orderId !== "string" || !orderId) {
    throw new HttpsError("invalid-argument", "orderId шаардлагатай");
  }

  const result = await db.runTransaction(async (tx) => {
    const orderRef = db.doc(`orders/${orderId}`);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "Дуудлага олдсонгүй");
    }
    const order = orderSnap.data() as any;

    if (order.isOpen !== true || order.technicianId) {
      throw new HttpsError("aborted", "Дуудлагыг аль хэдийн өөр технич авсан");
    }
    if (order.status !== "Хүлээгдэж буй") {
      throw new HttpsError("failed-precondition", "Дуудлага нээлттэй биш");
    }

    const broadcastTo: string[] = Array.isArray(order.broadcastTo) ? order.broadcastTo : [];
    if (broadcastTo.length > 0 && !techRoles.some((r) => broadcastTo.includes(r))) {
      throw new HttpsError("permission-denied", "Энэ дуудлага таны үүрэгт тохирохгүй");
    }

    const techSnap = await tx.get(db.doc(`technicians/${req.auth!.uid}`));
    const techCode = techSnap.exists ? (techSnap.data() as any)?.code ?? null : null;
    const techName = techSnap.exists ? (techSnap.data() as any)?.name ?? null : null;

    tx.update(orderRef, {
      isOpen: false,
      technicianId: req.auth!.uid,
      technicianCode: techCode,
      status: "Хуваарилагдсан",
      claimedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { code: order.code, techCode, techName };
  });

  // Event log (transaction-аас гадуур — read-only)
  try {
    await db.collection(`orders/${orderId}/events`).add({
      at: FieldValue.serverTimestamp(),
      title: `Технич авсан — ${result.techCode ?? req.auth!.uid.slice(0, 6)}`,
      state: "done",
    });
  } catch { /* swallow */ }

  logger.info(`Order ${result.code} claimed by ${result.techCode ?? req.auth.uid}`);
  return { ok: true, orderId, technicianCode: result.techCode };
});

/* ------------------------------------------------------------------ */
/*  approvePartnerApplication — Үйлчилгээ үзүүлэгчийг зөвшөөрөх        */
/*  • Auth user олох/үүсгэх                                             */
/*  • role custom claims тавих (applyRoles)                            */
/*  • technicians/{uid} doc үүсгэх (code + role)                       */
/*  • partner_applications-ийг status=approved болгох                  */
/* ------------------------------------------------------------------ */
function normalizePhoneE164(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+") && /^\+\d{7,15}$/.test(cleaned)) return cleaned;
  const local = cleaned.replace(/^976/, "").replace(/^\+/, "");
  if (/^\d{8}$/.test(local)) return `+976${local}`;
  return null;
}

async function nextTechnicianCode(): Promise<string> {
  const counterRef = db.doc("counters/technicians");
  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const n = (snap.data()?.value ?? 0) + 1;
    tx.set(counterRef, { value: n, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return n;
  });
  return `T-${String(next).padStart(3, "0")}`;
}

export const approvePartnerApplication = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Нэвтэрнэ үү");
  if (!callerHasRole(req.auth.token, "super_admin") && !callerHasRole(req.auth.token, "dispatcher")) {
    throw new HttpsError("permission-denied", "Зөвхөн супер админ эсвэл диспетчер");
  }

  const { applicationId, adminNote } = req.data ?? {};
  if (typeof applicationId !== "string" || !applicationId) {
    throw new HttpsError("invalid-argument", "applicationId шаардлагатай");
  }

  const appRef = db.doc(`partner_applications/${applicationId}`);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new HttpsError("not-found", "Хүсэлт олдсонгүй");
  const app = appSnap.data() as any;
  if (app.status === "approved") {
    throw new HttpsError("failed-precondition", "Хүсэлт аль хэдийн зөвшөөрөгдсөн");
  }

  const requestedRoles: string[] = Array.isArray(app.roles) ? app.roles : [];
  const validRoles = requestedRoles.filter((r) => ROLES.includes(r as Role));
  if (validRoles.length === 0) {
    throw new HttpsError("failed-precondition", "Хүсэлтэд хүчинтэй роль олдсонгүй");
  }

  const email: string | null = typeof app.email === "string" && app.email.trim() ? app.email.trim() : null;
  const phoneE164 = normalizePhoneE164(typeof app.phone === "string" ? app.phone : "");
  const fullName: string = typeof app.fullName === "string" ? app.fullName.trim() : "";

  // 1) Auth user олох — email-р, дараа нь утсаар
  let user = null as Awaited<ReturnType<typeof adminAuth.getUser>> | null;
  if (email) {
    try { user = await adminAuth.getUserByEmail(email); } catch { /* not found */ }
  }
  if (!user && phoneE164) {
    try { user = await adminAuth.getUserByPhoneNumber(phoneE164); } catch { /* not found */ }
  }

  // 2) Үгүй бол шинээр үүсгэх
  let createdNewUser = false;
  if (!user) {
    if (!email && !phoneE164) {
      throw new HttpsError(
        "failed-precondition",
        "И-мэйл эсвэл олон улсын форматын утас (+976XXXXXXXX) шаардлагатай",
      );
    }
    const props: any = {};
    if (fullName) props.displayName = fullName;
    if (email) props.email = email;
    if (phoneE164) props.phoneNumber = phoneE164;
    user = await adminAuth.createUser(props);
    createdNewUser = true;
  }

  // 3) Roles тавих (applyRoles нь users/{uid} doc-ийг merge хийнэ)
  await applyRoles(req.auth.uid, user.uid, validRoles);

  // 4) users doc-д нэр/утас зэргийг merge хийх
  await db.doc(`users/${user.uid}`).set({
    displayName: fullName || user.displayName || null,
    phone: typeof app.phone === "string" ? app.phone : null,
    email: email,
    partnerApplicationId: applicationId,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // 5) technicians/{uid} doc — байхгүй бол шинээр (technicianCode үүсгэнэ)
  const techRef = db.doc(`technicians/${user.uid}`);
  const techSnap = await techRef.get();
  const primaryRole = validRoles[0];
  let technicianCode: string;
  if (!techSnap.exists) {
    technicianCode = await nextTechnicianCode();
    await techRef.set({
      code: technicianCode,
      name: fullName || "Үл мэдэгдэх",
      role: primaryRole,
      status: "off",
      rating: 5.0,
      vehiclePlate: null,
      location: null,
      districts: Array.isArray(app.districts) ? app.districts : [],
      experienceYears: typeof app.experienceYears === "number" ? app.experienceYears : 0,
      vehicleInfo: typeof app.vehicleInfo === "string" ? app.vehicleInfo : "",
      sourceApplicationId: applicationId,
      createdAt: FieldValue.serverTimestamp(),
    });
  } else {
    technicianCode = (techSnap.data() as any)?.code ?? await nextTechnicianCode();
    await techRef.set({
      name: fullName || (techSnap.data() as any)?.name,
      role: primaryRole,
      sourceApplicationId: applicationId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  // 6) Хүсэлтийн төлөвийг зөвшөөрсөн болгох
  const appUpdate: any = {
    status: "approved",
    reviewedBy: req.auth.uid,
    reviewedAt: FieldValue.serverTimestamp(),
    technicianUid: user.uid,
    technicianCode,
  };
  if (typeof adminNote === "string" && adminNote.trim()) {
    appUpdate.adminNote = adminNote.trim();
  }
  await appRef.update(appUpdate);

  logger.info(`Partner application ${applicationId} approved → technician ${technicianCode} (${user.uid}) by ${req.auth.uid}`);

  return {
    ok: true,
    uid: user.uid,
    technicianCode,
    roles: validRoles,
    createdNewUser,
  };
});

/* ------------------------------------------------------------------ */
/*  onLocationPing — keep technician's current location up-to-date.    */
/* ------------------------------------------------------------------ */
export const onLocationPing = onDocumentWritten("locationPings/{pingId}", async (event) => {
  const ping = event.data?.after.data();
  if (!ping?.technicianId || !ping?.lat || !ping?.lng) return;
  await db.doc(`technicians/${ping.technicianId}`).update({
    location: { lat: ping.lat, lng: ping.lng },
    updatedAt: FieldValue.serverTimestamp(),
  });
});

/* ------------------------------------------------------------------ */
/*  onStockChange — flag low-stock + write alert.                      */
/* ------------------------------------------------------------------ */
export const onStockChange = onDocumentUpdated("stockLevels/{id}", async (event) => {
  const after = event.data?.after.data();
  if (!after) return;
  const low = after.stock <= after.minThreshold;
  const critical = after.stock < after.minThreshold * 0.5;
  if (after.isLow !== low || after.isCritical !== critical) {
    await event.data!.after.ref.update({ isLow: low, isCritical: critical });
  }
});
