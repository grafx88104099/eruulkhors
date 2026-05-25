/**
 * Plastic Center-ийн бүтээгдэхүүний жагсаалт + зургийг Firestore products collection-руу оруулна.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=../service-account.json node seed-products.mjs
 */
import admin from "firebase-admin";

admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || "ecosupport-1a5fd" });
const db = admin.firestore();

// Зургууд `web/public/products/`-д хадгалагдсан, web client-ээс /products/xxx.jpg replace.
const TANKS_BASE_FEATURES = [
  "100% битүүмжлэлтэй",
  "Дахин боловсруулсан пластик",
  "MNS 5924:20 стандарт",
];

const PRODUCTS = [
  // ──────────────── Танк (8 хэмжээ) ────────────────
  {
    code: "TANK-1.1", name: "Пластик био-септик танк 1.1 тн", category: "Танк",
    capacity: 1.1, capacityUnit: "тн", price: 850000,
    description: "Жижиг хэмжээтэй айл өрхөд тохиромжтой. Хөнгөн, угсрахад хялбар.",
    features: [...TANKS_BASE_FEATURES, "Хөнгөн жинтэй"],
    photoURL: "/products/tank-1.1.jpg",
  },
  {
    code: "TANK-1.6", name: "Пластик био-септик танк 1.6 тн", category: "Танк",
    capacity: 1.6, capacityUnit: "тн", price: 1080000,
    description: "Жижиг айл өрх, фермерийн аж ахуйд тохиромжтой.",
    features: [...TANKS_BASE_FEATURES, "Хөнгөн тээвэрлэлт"],
    photoURL: "/products/tank-1.6.jpg",
  },
  {
    code: "TANK-2.2", name: "Пластик био-септик танк 2.2 тн", category: "Танк",
    capacity: 2.2, capacityUnit: "тн", price: 1380000,
    description: "Дунд хэмжээтэй айл өрхөд (3-4 хүн) тохиромжтой.",
    features: [...TANKS_BASE_FEATURES, "Хямд тариф"],
    photoURL: "/products/tank-2.2.jpg",
  },
  {
    code: "TANK-3.0", name: "Пластик био-септик танк 3 тн", category: "Танк",
    capacity: 3.0, capacityUnit: "тн", price: 1650000,
    description: "Дундаж айл өрх (4-6 хүн) — хамгийн их захиалагдсан хэмжээ.",
    features: [...TANKS_BASE_FEATURES, "5 жилийн баталгаа"],
    photoURL: "/products/tank-3.0.jpg",
  },
  {
    code: "TANK-5.0", name: "Пластик био-септик танк 5 тн", category: "Танк",
    capacity: 5.0, capacityUnit: "тн", price: 2380000,
    description: "Том айл өрх (8-12 хүн), жижиг ТҮЦ-д тохиромжтой.",
    features: [...TANKS_BASE_FEATURES, "5 жилийн баталгаа"],
    photoURL: "/products/tank-5.0.jpg",
  },
  {
    code: "TANK-5.6", name: "Пластик био-септик танк 5.6 тн", category: "Танк",
    capacity: 5.6, capacityUnit: "тн", price: 2580000,
    description: "Том айл, аж ахуйн нэгжид зориулсан.",
    features: [...TANKS_BASE_FEATURES, "5 жилийн баталгаа"],
    photoURL: "/products/tank-5.6.jpg",
  },
  {
    code: "TANK-6.5", name: "Пластик био-септик танк 6.5 тн", category: "Танк",
    capacity: 6.5, capacityUnit: "тн", price: 2980000,
    description: "Их хэмжээний хэрэглээтэй айл, цех, фермерт зориулсан.",
    features: [...TANKS_BASE_FEATURES, "5 жилийн баталгаа"],
    photoURL: "/products/tank-6.5.jpg",
  },
  {
    code: "TANK-8.5", name: "Пластик био-септик танк 8.5 тн", category: "Танк",
    capacity: 8.5, capacityUnit: "тн", price: 3680000,
    description: "Орон сууцны хороолол, аж ахуйн нэгжид зориулсан хамгийн том хэмжээ.",
    features: [...TANKS_BASE_FEATURES, "5 жилийн баталгаа"],
    photoURL: "/products/tank-8.5.jpg",
  },

  // ──────────────── Бохирын худаг (Кольцо) ────────────────
  {
    code: "WELL-K-700", name: "Кольцо 700", category: "Бохирын худаг",
    capacity: 700, capacityUnit: "мм", price: 220000,
    description: "Жижиг диаметртэй худгийн модул цагираг.",
    features: ["1-2 хүн угсрах", "Тусгай тоног хэрэгсэлгүй", "MNS 5924:20"],
    photoURL: "/products/well-koltso-700.png",
  },
  {
    code: "WELL-K-1000", name: "Кольцо 1000", category: "Бохирын худаг",
    capacity: 1000, capacityUnit: "мм", price: 280000,
    description: "Стандарт диаметртэй модул цагираг. Хамгийн их захиалагдсан.",
    features: ["1-2 хүн угсрах", "Тусгай тоног хэрэгсэлгүй", "MNS 5924:20"],
    photoURL: "/products/well-koltso-1000.png",
  },
  {
    code: "WELL-K-1500", name: "Кольцо 1500", category: "Бохирын худаг",
    capacity: 1500, capacityUnit: "мм", price: 420000,
    description: "Том диаметртэй модул цагираг — их багтаамжтай.",
    features: ["2 хүн угсрах", "Тусгай тоног хэрэгсэлгүй", "MNS 5924:20"],
    photoURL: "/products/well-koltso-1500.png",
  },
  {
    code: "WELL-B-1000", name: "Ул таг 1000", category: "Бохирын худаг",
    capacity: 1000, capacityUnit: "мм", price: 180000,
    description: "Худгийн доод таг — 1000мм диаметрт.",
    features: ["Битүүмжлэлтэй", "Уян хатан суурьт суулгана"],
    photoURL: "/products/well-bottom-1000.png",
  },
  {
    code: "WELL-B-1500", name: "Ул таг 1500", category: "Бохирын худаг",
    capacity: 1500, capacityUnit: "мм", price: 280000,
    description: "Худгийн доод таг — 1500мм диаметрт.",
    features: ["Битүүмжлэлтэй", "Уян хатан суурьт суулгана"],
    photoURL: "/products/well-bottom-1500.png",
  },
  {
    code: "WELL-T-1000", name: "Шилжүүлэгч таг 1000", category: "Бохирын худаг",
    capacity: 1000, capacityUnit: "мм", price: 160000,
    description: "Диаметрийг 1000-аас 700 руу шилжүүлэх таг.",
    features: ["Диаметр шилжүүлэгч", "Битүүмжлэлтэй"],
    photoURL: "/products/well-transition-1000.png",
  },
  {
    code: "WELL-T-1500", name: "Шилжүүлэгч таг 1500", category: "Бохирын худаг",
    capacity: 1500, capacityUnit: "мм", price: 220000,
    description: "Диаметрийг 1500-аас 1000 руу шилжүүлэх таг.",
    features: ["Диаметр шилжүүлэгч", "Битүүмжлэлтэй"],
    photoURL: "/products/well-transition-1500.png",
  },
  {
    code: "WELL-TL", name: "Таг лук", category: "Бохирын худаг",
    capacity: 1, capacityUnit: "ширхэг", price: 140000,
    description: "Худгийн дээд таг — нээж хаах боломжтой.",
    features: ["Хүүхдийн аюулгүй түгжээ", "UV тэсвэртэй"],
    photoURL: "/products/well-tagluk.png",
  },
  {
    code: "WELL-SET", name: "Бохирын худгийн иж бүрдэл", category: "Бохирын худаг",
    capacity: 1, capacityUnit: "багц", price: 980000,
    description: "Бүрэн иж бүрдэл — цагираг + ул таг + дээд таг + холбоос.",
    features: ["Модул угсралт", "Хямд багц үнэ", "1 хүн угсрах"],
    photoURL: "/products/well-set.png",
  },

  // ──────────────── Дагалдах хэрэгсэл ────────────────
  {
    code: "ACC-PIPE-110", name: "ПВХ хоолой Ø110мм · 6м", category: "Дагалдах хэрэгсэл",
    capacity: 110, capacityUnit: "мм", price: 95000,
    description: "Бохирын систем угсрахад зориулсан стандарт хоолой.",
    features: ["6 метр урт", "Уян хатан", "Ус нэвт нэвтрэхгүй"],
    photoURL: "",
  },
];

async function deleteAll() {
  const snap = await db.collection("products").get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`🗑  ${snap.size} хуучин document устгасан`);
}

async function run() {
  await deleteAll();
  const batch = db.batch();
  for (const p of PRODUCTS) {
    batch.set(db.collection("products").doc(p.code), {
      ...p,
      standard: p.code.startsWith("TANK") ? "MNS 5924:20" : (p.code.startsWith("WELL") ? "MNS 5924:20" : "MNS"),
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  console.log(`✓ Seeded ${PRODUCTS.length} products`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
