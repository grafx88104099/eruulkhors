// Mock operational data — Mongolian Cyrillic, MNT pricing, UB districts
window.PCDATA = {
  districts: [
    "Баянзүрх", "Сүхбаатар", "Чингэлтэй", "Хан-Уул", "Сонгинохайрхан",
    "Баянгол", "Налайх", "Багануур", "Багахангай"
  ],
  technicians: [
    { id: "TX-014", name: "Б. Энхбаяр", role: "Суулгагч",         status: "busy", job: "ORD-2840", lat: 47.918, lng: 106.917, vehicle: "УБА-3421" },
    { id: "TX-022", name: "Г. Мөнхтөр",  role: "Засварчин",       status: "busy", job: "ORD-2841", lat: 47.926, lng: 106.870, vehicle: "УБА-1198" },
    { id: "TX-007", name: "Д. Батжаргал", role: "Соруулагч",       status: "idle", job: null,       lat: 47.910, lng: 106.954, vehicle: "УББ-7702" },
    { id: "TX-031", name: "Ц. Анхбаяр",  role: "Суулгагч",         status: "busy", job: "ORD-2837", lat: 47.892, lng: 106.832, vehicle: "УБА-3119" },
    { id: "TX-018", name: "Х. Болормаа", role: "Жолооч",           status: "idle", job: null,       lat: 47.935, lng: 106.910, vehicle: "УБА-5544" },
    { id: "TX-040", name: "Н. Бат-Эрдэнэ", role: "Соруулагч",     status: "busy", job: "ORD-2842", lat: 47.880, lng: 106.880, vehicle: "УББ-7841" },
    { id: "TX-009", name: "С. Нямсүрэн",  role: "Засварчин",       status: "off",  job: null,       lat: 47.905, lng: 106.860, vehicle: "—" },
    { id: "TX-025", name: "О. Түмэндэлгэр", role: "Жолооч",       status: "busy", job: "ORD-2843", lat: 47.945, lng: 106.940, vehicle: "УБА-2299" },
  ],
  orders: [
    { id: "ORD-2843", customer: "Алтанбулаг ХХК",     district: "Баянзүрх",       service: "Соруулга",    tank: "5 м³",  priority: "Яаралтай",  status: "Хуваарилагдсан", tech: "TX-025", price: 285000, eta: "14:20", created: "2026-05-09 11:42" },
    { id: "ORD-2842", customer: "Б. Цэцэгмаа",        district: "Хан-Уул",         service: "Соруулга",    tank: "3 м³",  priority: "Яаралтай",  status: "Зам дээр",       tech: "TX-040", price: 195000, eta: "13:50", created: "2026-05-09 10:18" },
    { id: "ORD-2841", customer: "Сан Гэр Хороолол",   district: "Сонгинохайрхан",  service: "Засвар",      tank: "5 м³",  priority: "Энгийн",    status: "Гүйцэтгэж байна", tech: "TX-022", price: 420000, eta: "—",     created: "2026-05-09 09:55" },
    { id: "ORD-2840", customer: "Ц. Дашням",          district: "Баянзүрх",       service: "Суулгалт",    tank: "3 м³",  priority: "Энгийн",    status: "Гүйцэтгэж байна", tech: "TX-014", price: 1850000, eta: "—",   created: "2026-05-09 08:30" },
    { id: "ORD-2839", customer: "Шинэ Зууны Хүчин",   district: "Чингэлтэй",      service: "Соруулга",    tank: "10 м³", priority: "Энгийн",    status: "Дуусгасан",       tech: "TX-007", price: 380000, eta: "—",     created: "2026-05-09 07:15" },
    { id: "ORD-2838", customer: "Б. Эрдэнэбат",       district: "Баянгол",         service: "Засвар",      tank: "3 м³",  priority: "Энгийн",    status: "Дуусгасан",       tech: "TX-022", price: 145000, eta: "—",     created: "2026-05-08 17:42" },
    { id: "ORD-2837", customer: "Хүлэг Констракшн",   district: "Сонгинохайрхан",  service: "Суулгалт",    tank: "5 м³",  priority: "Энгийн",    status: "Гүйцэтгэж байна", tech: "TX-031", price: 2400000, eta: "—",   created: "2026-05-08 16:20" },
    { id: "ORD-2836", customer: "Г. Оргил",            district: "Налайх",         service: "Соруулга",    tank: "3 м³",  priority: "Энгийн",    status: "Хуваарилагдсан", tech: "TX-018", price: 320000, eta: "16:00", created: "2026-05-08 15:55" },
    { id: "ORD-2835", customer: "Ж. Алтансүх",        district: "Баянзүрх",       service: "Засвар",      tank: "5 м³",  priority: "Энгийн",    status: "Хүлээгдэж буй",   tech: null,     price: 220000, eta: "—",     created: "2026-05-08 14:30" },
    { id: "ORD-2834", customer: "Эко Хороолол",        district: "Хан-Уул",         service: "Соруулга",    tank: "10 м³", priority: "Энгийн",    status: "Дуусгасан",       tech: "TX-007", price: 380000, eta: "—",     created: "2026-05-08 12:12" },
    { id: "ORD-2833", customer: "Н. Сараа",            district: "Баянгол",         service: "Соруулга",    tank: "3 м³",  priority: "Энгийн",    status: "Цуцлагдсан",      tech: null,     price: 180000, eta: "—",     created: "2026-05-08 11:08" },
    { id: "ORD-2832", customer: "Үндэсний Орон Сууц", district: "Сүхбаатар",      service: "Суулгалт",    tank: "5 м³",  priority: "Энгийн",    status: "Дуусгасан",       tech: "TX-014", price: 2100000, eta: "—",   created: "2026-05-08 09:45" },
  ],
  pricing_zones: [
    { zone: "Төв 4 дүүрэг",   service_pump: 180000, service_install: 1850000, service_repair: 145000, distance_km: 2500, multiplier: 1.0 },
    { zone: "Гадна дүүрэг",   service_pump: 240000, service_install: 1950000, service_repair: 165000, distance_km: 3200, multiplier: 1.15 },
    { zone: "Хот орчим",      service_pump: 320000, service_install: 2150000, service_repair: 195000, distance_km: 4500, multiplier: 1.35 },
    { zone: "Алслагдсан бүс", service_pump: 480000, service_install: 2650000, service_repair: 285000, distance_km: 6800, multiplier: 1.6 },
  ],
  multipliers: [
    { name: "Яаралтай дуудлага",    pct: 50, scope: "2 цагийн дотор очих" },
    { name: "Шөнийн ээлж",          pct: 35, scope: "22:00 — 06:00" },
    { name: "Ням гаригт",            pct: 25, scope: "Долоо хоногийн амралт" },
    { name: "Өвлийн бүс",            pct: 20, scope: "11 сар — 3 сар" },
  ],
  commissions: [
    { role: "Суулгагч",   base: 18, bonus: 4, cap: 1200000 },
    { role: "Соруулагч",  base: 22, bonus: 5, cap: 850000 },
    { role: "Засварчин",  base: 25, bonus: 6, cap: 950000 },
    { role: "Жолооч",     base: 12, bonus: 3, cap: 600000 },
  ],
  history_events: [
    { time: "14:32", title: "Үйлчилгээ дууссан",        meta: "Хэрэглэгчийн гарын үсэг авсан · Б. Энхбаяр", state: "done" },
    { time: "14:18", title: "Зургийн нотолгоо нэмэгдсэн", meta: "8 фото · Суулгалтын дараа",                  state: "done" },
    { time: "13:05", title: "Суулгалт эхэлсэн",          meta: "Гүний усны төвшин шалгасан · 3.2м",          state: "done" },
    { time: "12:40", title: "Машин ирсэн",                meta: "УБА-3421 · 14 мин ETA-аас өмнө",             state: "done" },
    { time: "11:42", title: "Захиалга үүссэн",            meta: "Web — өөрөө захиалсан · 1,850,000₮",          state: "done" },
  ],
};
