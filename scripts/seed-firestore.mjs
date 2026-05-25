/**
 * Firestore seed — ports mock data from `ecosupport ux ui/data.js` and `screens/inventory.jsx`.
 *
 *   # against emulator:
 *   npm run seed:emulator
 *
 *   # against real Firebase project (needs GOOGLE_APPLICATION_CREDENTIALS):
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run seed
 */
import admin from "firebase-admin";

const projectId = process.env.GCLOUD_PROJECT || "ecosupport-1a5fd";
admin.initializeApp({ projectId });
const db = admin.firestore();

/* ------------------------------------------------------------------ */
/* Reference data (Cyrillic kept inside the document, never as ID).   */
/* ------------------------------------------------------------------ */

const DISTRICTS = [
  ["bayanzurkh",       "Баянзүрх"],
  ["sukhbaatar",       "Сүхбаатар"],
  ["chingeltei",       "Чингэлтэй"],
  ["khan-uul",         "Хан-Уул"],
  ["songinokhairkhan", "Сонгинохайрхан"],
  ["bayangol",         "Баянгол"],
  ["nalaikh",          "Налайх"],
  ["baganuur",         "Багануур"],
  ["bagakhangai",      "Багахангай"],
];

const TANKS = [
  ["tank-1_5m3",  "1.5 м³",  1.5, 0.7],
  ["tank-3m3",    "3 м³",    3,   1.0],
  ["tank-5m3",    "5 м³",    5,   1.4],
  ["tank-10m3",   "10 м³",   10,  2.1],
  ["tank-special","Тусгай",  15,  2.8],
];

const ZONES = [
  ["zone-center",  "Төв 4 дүүрэг",   180000, 1850000, 145000, 2500, 1.0,  1],
  ["zone-outer",   "Гадна дүүрэг",   240000, 1950000, 165000, 3200, 1.15, 2],
  ["zone-suburb",  "Хот орчим",      320000, 2150000, 195000, 4500, 1.35, 3],
  ["zone-remote",  "Алслагдсан бүс", 480000, 2650000, 285000, 6800, 1.6,  4],
];

const MULTIPLIERS = [
  ["urgent",  "Яаралтай дуудлага", 50, "2 цагийн дотор очих"],
  ["night",   "Шөнийн ээлж",       35, "22:00 — 06:00"],
  ["weekend", "Ням гаригт",        25, "Долоо хоногийн амралт"],
  ["winter",  "Өвлийн бүс",        20, "11 сар — 3 сар"],
];

const COMMISSIONS = [
  ["installer", "Суулгагч",  18, 4, 1200000],
  ["pump_op",   "Соруулагч", 22, 5, 850000],
  ["repair",    "Засварчин", 25, 6, 950000],
  ["driver",    "Жолооч",    12, 3, 600000],
];

const TECHS = [
  ["TX-014", "Б. Энхбаяр",      "Суулгагч",  "busy", 47.918, 106.917, "УБА-3421"],
  ["TX-022", "Г. Мөнхтөр",      "Засварчин", "busy", 47.926, 106.870, "УБА-1198"],
  ["TX-007", "Д. Батжаргал",    "Соруулагч", "idle", 47.910, 106.954, "УББ-7702"],
  ["TX-031", "Ц. Анхбаяр",      "Суулгагч",  "busy", 47.892, 106.832, "УБА-3119"],
  ["TX-018", "Х. Болормаа",     "Жолооч",    "idle", 47.935, 106.910, "УБА-5544"],
  ["TX-040", "Н. Бат-Эрдэнэ",   "Соруулагч", "busy", 47.880, 106.880, "УББ-7841"],
  ["TX-009", "С. Нямсүрэн",     "Засварчин", "off",  47.905, 106.860, null],
  ["TX-025", "О. Түмэндэлгэр",  "Жолооч",    "busy", 47.945, 106.940, "УБА-2299"],
];

const ORDERS = [
  ["ORD-2843", "Алтанбулаг ХХК",     "bayanzurkh",       "Соруулга", "tank-5m3",  "Яаралтай", "Хуваарилагдсан",   "TX-025", 285000,  "14:20"],
  ["ORD-2842", "Б. Цэцэгмаа",        "khan-uul",         "Соруулга", "tank-3m3",  "Яаралтай", "Зам дээр",         "TX-040", 195000,  "13:50"],
  ["ORD-2841", "Сан Гэр Хороолол",   "songinokhairkhan", "Засвар",   "tank-5m3",  "Энгийн",   "Гүйцэтгэж байна",  "TX-022", 420000,  "—"],
  ["ORD-2840", "Ц. Дашням",          "bayanzurkh",       "Суулгалт", "tank-3m3",  "Энгийн",   "Гүйцэтгэж байна",  "TX-014", 1850000, "—"],
  ["ORD-2839", "Шинэ Зууны Хүчин",   "chingeltei",       "Соруулга", "tank-10m3", "Энгийн",   "Дуусгасан",        "TX-007", 380000,  "—"],
  ["ORD-2838", "Б. Эрдэнэбат",       "bayangol",         "Засвар",   "tank-3m3",  "Энгийн",   "Дуусгасан",        "TX-022", 145000,  "—"],
  ["ORD-2837", "Хүлэг Констракшн",   "songinokhairkhan", "Суулгалт", "tank-5m3",  "Энгийн",   "Гүйцэтгэж байна",  "TX-031", 2400000, "—"],
  ["ORD-2836", "Г. Оргил",           "nalaikh",          "Соруулга", "tank-3m3",  "Энгийн",   "Хуваарилагдсан",   "TX-018", 320000,  "16:00"],
  ["ORD-2835", "Ж. Алтансүх",        "bayanzurkh",       "Засвар",   "tank-5m3",  "Энгийн",   "Хүлээгдэж буй",    null,     220000,  "—"],
  ["ORD-2834", "Эко Хороолол",       "khan-uul",         "Соруулга", "tank-10m3", "Энгийн",   "Дуусгасан",        "TX-007", 380000,  "—"],
  ["ORD-2833", "Н. Сараа",           "bayangol",         "Соруулга", "tank-3m3",  "Энгийн",   "Цуцлагдсан",       null,     180000,  "—"],
  ["ORD-2832", "Үндэсний Орон Сууц", "sukhbaatar",       "Суулгалт", "tank-5m3",  "Энгийн",   "Дуусгасан",        "TX-014", 2100000, "—"],
];

const WAREHOUSES = [
  ["WH-01", "Төв агуулах",   "Хан-Уул дүүрэг · 7-р хороо",  1200, "Б. Дорж"],
  ["WH-02", "Баруун салбар", "Сонгинохайрхан · 21-р хороо", 600,  "С. Энхтуяа"],
  ["WH-03", "Зүүн салбар",   "Налайх · 4-р хороо",          400,  "Ц. Бат-Эрдэнэ"],
];

const SUPPLIERS = [
  ["sup-roto",       "Roto Plastic",  5],
  ["sup-khuree",     "Хүрээ ХХК",     7],
  ["sup-shunkhlai",  "Шунхлай ХХК",   3],
  ["sup-garyn",      "Гарын Авлага",  2],
  ["sup-ecomon",     "EcoMon LLC",    7],
  ["sup-koreatech",  "Korea Tech",    21],
];
const SUP_BY_NAME = Object.fromEntries(SUPPLIERS.map(([id, name]) => [name, id]));

const SKUS = [
  ["TNK-3000", "Био септик танк 3 м³",        "Танк",            "ширхэг", 1280000, "Roto Plastic",  "WH-01",  28, 12, 80, 6],
  ["TNK-5000", "Био септик танк 5 м³",        "Танк",            "ширхэг", 1850000, "Roto Plastic",  "WH-01",  14,  8, 50, 3],
  ["TNK-10K",  "Био септик танк 10 м³",       "Танк",            "ширхэг", 3450000, "Хүрээ ХХК",     "WH-01",   4,  6, 24, 2],
  ["TNK-1500", "Био септик танк 1.5 м³",      "Танк",            "ширхэг",  850000, "Roto Plastic",  "WH-02",  22, 10, 60, 0],
  ["PIP-110",  "ПВХ хоолой Ø110мм · 6м",      "Хоолой",          "м",        18500, "Шунхлай ХХК",   "WH-01", 412,120,800,24],
  ["PIP-160",  "ПВХ хоолой Ø160мм · 6м",      "Хоолой",          "м",        32000, "Шунхлай ХХК",   "WH-01", 188, 80,500,12],
  ["PIP-200",  "ПВХ хоолой Ø200мм · 6м",      "Хоолой",          "м",        48000, "Шунхлай ХХК",   "WH-02",  64, 40,200, 8],
  ["FIT-T110", "Тэвхэн холбогч Т Ø110мм",     "Холбоос",         "ширхэг",   12500, "Шунхлай ХХК",   "WH-01", 156, 60,300, 0],
  ["FIT-E110", "Тохой Ø110мм 90°",            "Холбоос",         "ширхэг",    8500, "Шунхлай ХХК",   "WH-01",   8, 50,250, 0],
  ["SEAL-110", "Резинэн уплотнитель Ø110",    "Холбоос",         "ширхэг",   12000, "Гарын Авлага",  "WH-01", 240,100,500,18],
  ["BIO-200",  "Бактерийн нэмэлт · 200мл",    "Хэрэгсэл",        "ширхэг",   18000, "EcoMon LLC",    "WH-01",  86, 40,200,12],
  ["BIO-1000", "Бактерийн нэмэлт · 1Л",       "Хэрэгсэл",        "ширхэг",   65000, "EcoMon LLC",    "WH-01",  32, 20,100, 4],
  ["FLT-AIR",  "Агааржуулалтын филтр",        "Хэрэгсэл",        "ширхэг",   38000, "EcoMon LLC",    "WH-02",  47, 30,150, 6],
  ["PMP-OIL",  "Соруулгын насосны тос · 5Л",  "Хэрэгсэл",        "ширхэг",   95000, "Шунхлай ХХК",   "WH-01",  18, 15, 60, 0],
  ["PMP-VAC",  "Вакуум насос 7.5 кВт",        "Тоног төхөөрөмж", "ширхэг", 4200000, "Korea Tech",    "WH-01",   3,  2,  8, 1],
  ["GLV-XL",   "Ажлын бээлий XL",             "ХАБ",             "хос",       4500, "Гарын Авлага",  "WH-01", 124, 50,300, 0],
];

const PURCHASE_ORDERS = [
  ["PO-2244", "Roto Plastic",   3, 18450000, "Хүлээгдэж буй", "2026.05.14"],
  ["PO-2243", "Шунхлай ХХК",    6, 4280000,  "Замдаа",         "2026.05.11"],
  ["PO-2242", "EcoMon LLC",     4, 1860000,  "Захиалсан",      "2026.05.16"],
  ["PO-2241", "Roto Plastic",   1, 10240000, "Хүлээж авсан",   "—"],
];

async function batchWrite(col, items) {
  const batch = db.batch();
  for (const [id, data] of items) {
    batch.set(db.collection(col).doc(id), data, { merge: true });
  }
  await batch.commit();
  console.log(`✓ ${col} (${items.length})`);
}

async function deleteCollection(col) {
  const snap = await db.collection(col).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`🗑  ${col} (${snap.size} doc устгасан)`);
}

async function run() {
  // Wipe Cyrillic-ID legacy collections before re-seeding with ASCII IDs.
  for (const col of ["commissionRules", "tankSizes", "customers", "suppliers", "districts"]) {
    await deleteCollection(col);
  }

  await batchWrite("districts", DISTRICTS.map(([id, name]) => [id, { id, name }]));

  await batchWrite("tankSizes", TANKS.map(([id, label, vol, coef]) => [
    id, { label, volumeM3: vol, coefficient: coef },
  ]));

  await batchWrite("pricingZones", ZONES.map(([id, name, pump, install, repair, dist, mult, order]) => [
    id, { name, servicePump: pump, serviceInstall: install, serviceRepair: repair, distanceKmRate: dist, multiplier: mult, order },
  ]));

  await batchWrite("multipliers", MULTIPLIERS.map(([code, name, pct, scope]) => [
    code, { code, name, pct, scope, active: true },
  ]));

  await batchWrite("commissionRules", COMMISSIONS.map(([id, role, base, bonus, cap]) => [
    id, { role, basePct: base, bonusPct: bonus, monthlyCap: cap },
  ]));

  await batchWrite("technicians", TECHS.map(([code, name, role, status, lat, lng, plate]) => [
    code, {
      code, name, role, status,
      location: { lat, lng },
      vehiclePlate: plate,
      rating: 4.5 + Math.random() * 0.5,
    },
  ]));

  // Customers use a sequential code as ID; original name lives in the doc.
  const customers = ORDERS.map(([_code, name, district], i) => [
    `CUST-${String(i + 1).padStart(4, "0")}`,
    { name, district },
  ]);
  // Dedup by name (multiple orders for same customer keep first occurrence)
  const seenNames = new Set();
  const customersUnique = customers.filter(([, c]) => {
    if (seenNames.has(c.name)) return false;
    seenNames.add(c.name);
    return true;
  });
  const CUST_BY_NAME = Object.fromEntries(customersUnique.map(([id, c]) => [c.name, id]));
  await batchWrite("customers", customersUnique);

  await batchWrite("orders", ORDERS.map(([code, customerName, district, service, tankId, priority, status, tech, price, eta]) => [
    code, {
      code,
      customer: customerName,
      customerId: CUST_BY_NAME[customerName] ?? null,
      district,
      service,
      tank: TANKS.find(([id]) => id === tankId)?.[1] ?? tankId,
      tankId,
      zoneId: "zone-center",
      priority,
      status,
      technicianCode: tech,
      technicianId: tech,
      eta,
      totalPrice: price,
      distanceKm: 5,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ]));

  await batchWrite("warehouses", WAREHOUSES.map(([code, name, location, capacity, manager]) => [
    code, { code, name, location, capacity, manager },
  ]));

  await batchWrite("suppliers", SUPPLIERS.map(([id, name, lead]) => [
    id, { name, leadTimeDays: lead, rating: 4.5 },
  ]));

  await batchWrite("skus", SKUS.map(([code, name, cat, unit, cost, supName]) => [
    code, {
      code, name, category: cat, unit, cost,
      supplier: supName,
      supplierId: SUP_BY_NAME[supName] ?? null,
    },
  ]));

  await batchWrite("stockLevels", SKUS.map(([code, name, cat, unit, cost, sup, wh, stock, min, max, reserved]) => [
    `${wh}_${code}`,
    {
      skuCode: code, skuName: name, skuCategory: cat, skuUnit: unit, skuCost: cost,
      warehouseCode: wh, stock, reserved, minThreshold: min, maxThreshold: max,
      isLow: stock <= min, isCritical: stock < min * 0.5,
    },
  ]));

  await batchWrite("purchaseOrders", PURCHASE_ORDERS.map(([code, supName, items, total, status, eta]) => [
    code, {
      code,
      supplier: supName,
      supplierId: SUP_BY_NAME[supName] ?? null,
      itemsCount: items, total, status, eta,
    },
  ]));

  console.log("\n✓ Seed complete.");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
