// Field-worker mobile apps — Driver / Pump operator / Repair technician
// Three role variants shown side-by-side inside Android frames.

const MOBILE_ROLES = [
  { id: "driver", label: "Тээвэрлэгч",   sub: "Жолооч",            badge: "TX-018", name: "Х. Болормаа" },
  { id: "pump",   label: "Соруулагч",    sub: "Сорогч машины операторч", badge: "TX-040", name: "Н. Бат-Эрдэнэ" },
  { id: "repair", label: "Засварчин",    sub: "Засвар үйлчилгээ",  badge: "TX-022", name: "Г. Мөнхтөр" },
];

function MobileApps() {
  const [active, setActive] = React.useState("driver");

  return (
    <div className="page" style={{ background: "#1A1D22", color: "#D4D6DB", minHeight: "calc(100vh - 52px)" }}>
      <div className="page-head">
        <div>
          <h1 className="page-title" style={{ color: "white" }}>Гар утасны хэрэглээ · Хээрийн ажилтнууд</h1>
          <div className="page-sub" style={{ color: "#8A8E96" }}>
            Гурван үүргийн дагуу тусгайлсан интерфэйс · Android · 412 × 892
          </div>
        </div>
        <div className="row" style={{ gap: 4, background: "#0F1114", padding: 4, borderRadius: 6, border: "1px solid #23272E" }}>
          {MOBILE_ROLES.map(r => (
            <span key={r.id}
              onClick={() => setActive(r.id)}
              style={{
                padding: "6px 12px", fontSize: 12.5, borderRadius: 4, cursor: "pointer",
                background: active === r.id ? "var(--orange)" : "transparent",
                color: active === r.id ? "white" : "#BCC0C8",
              }}>
              {r.label}
            </span>
          ))}
        </div>
      </div>

      {/* Side-by-side device array */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28,
        justifyItems: "center", padding: "8px 0 40px",
      }}>
        {MOBILE_ROLES.map(r => (
          <MobileDevice key={r.id} role={r} highlighted={active === r.id} />
        ))}
      </div>
    </div>
  );
}

function MobileDevice({ role, highlighted }) {
  return (
    <div style={{
      transform: highlighted ? "scale(1)" : "scale(0.96)",
      filter: highlighted ? "none" : "saturate(0.85) brightness(0.92)",
      transition: "transform 200ms, filter 200ms",
    }}>
      <div style={{ marginBottom: 10, fontFamily: "var(--font-mono)", fontSize: 11, color: "#8A8E96", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {role.badge} · {role.sub}
      </div>
      <AndroidDevice width={380} height={780}>
        {role.id === "driver" && <DriverApp tech={role}/>}
        {role.id === "pump"   && <PumpApp tech={role}/>}
        {role.id === "repair" && <RepairApp tech={role}/>}
      </AndroidDevice>
    </div>
  );
}

// ─── Shared mobile primitives ──────────────────────────────
const M = {
  bg: "#F4F2EC",
  card: "#FFFFFF",
  ink: "#111315",
  muted: "#6B6E73",
  line: "#E6E4DE",
  orange: "#E54B16",
  green: "#1F8A5B",
  blue: "#1E4FB6",
  red: "#B41F1F",
  amber: "#B5750A",
};

function MHeader({ title, sub, role, tone = "ink" }) {
  return (
    <div style={{ background: tone === "ink" ? "#0F1114" : "var(--orange)", color: "white", padding: "14px 16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          ● {role.badge} · ИДЭВХТЭЙ
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.7 }}>14:42</span>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "grid", placeItems: "center", fontSize: 10, fontFamily: "var(--font-mono)" }}>
            {role.name.split(" ")[1]?.[0]}{role.name.split(" ")[2]?.[0] || ""}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{title}</div>
      <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function MStatTile({ label, value, accent = false }) {
  return (
    <div style={{
      background: M.card, border: `1px solid ${M.line}`, borderRadius: 8, padding: "10px 12px",
    }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: M.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600, color: accent ? M.orange : M.ink, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function MJobCard({ id, customer, district, eta, tone = "blue", action, tank, distance, accent }) {
  const toneMap = {
    blue: { bg: "#E5ECFA", fg: M.blue },
    orange: { bg: "#FFEDE4", fg: M.orange },
    green: { bg: "#E0F1E8", fg: M.green },
    amber: { bg: "#FAEFD6", fg: M.amber },
  };
  const t = toneMap[tone];
  return (
    <div style={{ background: M.card, border: `1px solid ${M.line}`, borderLeft: accent ? `3px solid ${M.orange}` : `1px solid ${M.line}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: M.muted }}>{id}</span>
        <span style={{ background: t.bg, color: t.fg, fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 8px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{action}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: M.ink, marginBottom: 2 }}>{customer}</div>
      <div style={{ fontSize: 12, color: M.muted }}>{district}</div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: M.muted }}>
        {tank && <span>📦 {tank}</span>}
        {distance && <span>↦ {distance}</span>}
        {eta && <span style={{ color: M.orange, fontWeight: 600, marginLeft: "auto" }}>ETA {eta}</span>}
      </div>
    </div>
  );
}

// ─── Driver app: route navigation ────────────────────────────
function DriverApp({ tech }) {
  return (
    <div style={{ background: M.bg, minHeight: "100%", color: M.ink }}>
      <MHeader role={tech} title="Маршрутаа эхлүүлээрэй" sub="3 захиалга · 47 км · ≈ 5ц 20мин" />

      {/* Mini map */}
      <div style={{ height: 180, background: "#EFEDE6", position: "relative", borderBottom: `1px solid ${M.line}` }}>
        <svg viewBox="0 0 380 180" width="100%" height="100%" preserveAspectRatio="none">
          <defs>
            <pattern id="mgrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#DDD9CC" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="380" height="180" fill="url(#mgrid)"/>
          <path d="M 20 140 L 80 110 L 150 90 L 220 70 L 290 60 L 360 30" stroke={M.orange} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="6 4"/>
          <path d="M 20 140 L 80 110" stroke={M.orange} strokeWidth="3" fill="none" strokeLinecap="round"/>
          <circle cx="20" cy="140" r="6" fill={M.orange}/>
          <circle cx="20" cy="140" r="12" fill={M.orange} opacity="0.2"/>
          <circle cx="80" cy="110" r="5" fill={M.ink}/>
          <circle cx="220" cy="70" r="5" fill={M.ink}/>
          <circle cx="360" cy="30" r="5" fill={M.green}/>
          <text x="92" y="105" fontFamily="Geist Mono" fontSize="9" fill={M.ink}>1 · Дашням</text>
          <text x="232" y="65" fontFamily="Geist Mono" fontSize="9" fill={M.ink}>2 · Цэцэгмаа</text>
          <text x="306" y="25" fontFamily="Geist Mono" fontSize="9" fill={M.green}>3 · Эко Хороолол</text>
        </svg>
        <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.95)", border: `1px solid ${M.line}`, borderRadius: 6, padding: "6px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}>
          <div style={{ color: M.muted, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Дараагийн</div>
          <div style={{ color: M.ink, fontWeight: 600 }}>2.4 км · Зүүн чиглэл</div>
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <button style={{
          width: "100%", height: 56, fontSize: 16, fontWeight: 600, color: "white",
          background: M.orange, border: 0, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginBottom: 14,
        }}>
          ▶ Маршрут эхлүүлэх
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
          <MStatTile label="Захиалга" value="3"/>
          <MStatTile label="Зай" value="47км"/>
          <MStatTile label="Цалин" value="84К₮" accent/>
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: M.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Өнөөдрийн зогсоол · 3
        </div>

        <MJobCard id="ORD-2840" customer="Ц. Дашням"        district="Баянзүрх · 14-р хороо"   tank="3 м³ танк"   distance="2.4 км"  eta="13:05" tone="orange" action="Очиж байна" accent/>
        <MJobCard id="ORD-2843" customer="Алтанбулаг ХХК"  district="Баянзүрх · 9-р хороо"     tank="5 м³ танк"   distance="6.1 км"  eta="14:20" tone="amber"  action="Дараагийн"/>
        <MJobCard id="ORD-2834" customer="Эко Хороолол"     district="Хан-Уул · 7-р хороо"       tank="10 м³ танк"  distance="14.8 км" eta="16:45" tone="blue"   action="Хүлээгдэж буй"/>

        <div style={{ marginTop: 12, padding: "10px 12px", background: "#FAFAF8", border: `1px solid ${M.line}`, borderRadius: 8 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: M.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Машин · УБА-3421</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13 }}>Шатахуун</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>72%</span>
          </div>
          <div style={{ height: 4, background: "#E6E4DE", borderRadius: 2, marginTop: 4 }}>
            <div style={{ width: "72%", height: "100%", background: M.green, borderRadius: 2 }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pump operator app: workflow checklist ─────────────────
function PumpApp({ tech }) {
  return (
    <div style={{ background: M.bg, minHeight: "100%", color: M.ink }}>
      <MHeader role={tech} title="Соруулга — Алтанбулаг" sub="ORD-2843 · 5 м³ · Баянзүрх 9-р хороо" tone="orange"/>

      {/* Job timer */}
      <div style={{ background: "#0F1114", color: "white", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Идэвхтэй</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>00:38:14</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Хийгдэж буй</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>Алхам 4 / 7</div>
        </div>
      </div>

      <div style={{ padding: 14 }}>
        {/* Tank progress */}
        <div style={{ background: M.card, border: `1px solid ${M.line}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Танкны түвшин</div>
              <div style={{ fontSize: 11, color: M.muted, marginTop: 2 }}>5 м³ танк · 65% дүүрсэн</div>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: M.orange }}>3.2<span style={{ fontSize: 13, color: M.muted, fontWeight: 500 }}> /5.0 м³</span></div>
          </div>
          <div style={{ height: 14, background: "#F4F2EC", borderRadius: 4, overflow: "hidden", border: `1px solid ${M.line}` }}>
            <div style={{ width: "65%", height: "100%", background: `repeating-linear-gradient(135deg, ${M.orange} 0 8px, #C73E10 8px 16px)` }}/>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: M.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span>0 м³</span><span>2.5</span><span>5.0 м³</span>
          </div>
        </div>

        {/* Workflow steps */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: M.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Ажлын дараалал
        </div>
        <div style={{ background: M.card, border: `1px solid ${M.line}`, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
          {[
            { t: "Газар дээр ирсэн", st: "done", time: "13:42" },
            { t: "Танкны байрлал шалгасан", st: "done", time: "13:45" },
            { t: "Хоолой холбосон", st: "done", time: "13:51" },
            { t: "Соруулга хийж байна", st: "now", time: "14:04" },
            { t: "Хог тээвэрлэх", st: "next" },
            { t: "Цэвэрлэгээ", st: "next" },
            { t: "Хэрэглэгчийн гарын үсэг", st: "next" },
          ].map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px",
              borderBottom: i < 6 ? `1px solid ${M.line}` : 0,
              background: s.st === "now" ? "#FFF6F0" : "transparent",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flex: "none",
                display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700,
                background: s.st === "done" ? M.green : s.st === "now" ? M.orange : "#FFF",
                color: s.st === "next" ? M.muted : "white",
                border: s.st === "next" ? `1.5px solid ${M.line}` : 0,
              }}>{s.st === "done" ? "✓" : s.st === "now" ? "▶" : i+1}</div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: s.st === "now" ? 600 : 500 }}>{s.t}</div>
              {s.time && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: M.muted }}>{s.time}</span>}
            </div>
          ))}
        </div>

        {/* Photos */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: M.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Зургийн нотолгоо · 2 / 4
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
          {["Танк", "Хоолой", "+", "+"].map((p, i) => (
            <div key={i} style={{
              aspectRatio: "1 / 1",
              background: i < 2 ? `repeating-linear-gradient(45deg, #DEDBD2 0 6px, #D4D1C7 6px 12px)` : "#FFF",
              border: i < 2 ? "0" : `1.5px dashed ${M.line}`,
              borderRadius: 6,
              display: "grid", placeItems: "center",
              fontFamily: "var(--font-mono)", fontSize: 10, color: i < 2 ? M.muted : M.muted,
              fontWeight: i < 2 ? 500 : 700,
              fontSize: i < 2 ? 9 : 18,
            }}>{p}</div>
          ))}
        </div>

        <button style={{
          width: "100%", height: 52, fontSize: 15, fontWeight: 600, color: "white",
          background: M.orange, border: 0, borderRadius: 10,
        }}>Дараагийн алхам →</button>
      </div>
    </div>
  );
}

// ─── Repair technician app: diagnostic checklist ─────────────
function RepairApp({ tech }) {
  return (
    <div style={{ background: M.bg, minHeight: "100%", color: M.ink }}>
      <MHeader role={tech} title="Засвар үйлчилгээ" sub="ORD-2841 · Сан Гэр Хороолол · Сонгинохайрхан"/>

      <div style={{ padding: 14 }}>
        {/* Issue summary */}
        <div style={{ background: "#FFEDE4", border: `1px solid #FFD3BD`, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: M.orange, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>⚠ Гомдлын мэдээлэл</span>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: M.ink, lineHeight: 1.5 }}>
            "Танкнаас үнэр гарч байна. Сүүлийн 3 хоног үерсэх шинж тэмдэг."
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: M.muted, marginTop: 6 }}>
            Хэрэглэгч мэдэгдсэн · 2026.05.09 09:55 · Утас +976 9911 4280
          </div>
        </div>

        {/* Diagnostic checklist */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: M.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Оношилгоо · 3 / 6
        </div>
        <div style={{ background: M.card, border: `1px solid ${M.line}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
          {[
            { t: "Гадаад харагдах байдал шалгасан", st: "ok", v: "Бүрэн" },
            { t: "Үнэр шалгах",                      st: "fail", v: "Илэрсэн" },
            { t: "Бактерийн идэвхжил", st: "ok",   v: "Хэвийн" },
            { t: "Агааржуулалтын систем",            st: "now",  v: "Шалгаж байна" },
            { t: "Гадагшлуулах хоолой",              st: "next" },
            { t: "Электрон сенсор",                   st: "next" },
          ].map((s, i) => {
            const tone = s.st === "ok" ? { bg: "#E0F1E8", fg: M.green, sym: "✓" }
              : s.st === "fail" ? { bg: "#FBE5E5", fg: M.red, sym: "✕" }
              : s.st === "now" ? { bg: "#FFEDE4", fg: M.orange, sym: "▶" }
              : { bg: "#F4F2EC", fg: M.muted, sym: "○" };
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px",
                borderBottom: i < 5 ? `1px solid ${M.line}` : 0,
              }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", background: tone.bg, color: tone.fg, fontWeight: 700, fontSize: 11, flex: "none" }}>{tone.sym}</div>
                <div style={{ flex: 1, fontSize: 13 }}>{s.t}</div>
                {s.v && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: tone.fg, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{s.v}</span>}
              </div>
            );
          })}
        </div>

        {/* Parts inventory */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: M.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Сэлбэг хэрэглэгдэх
        </div>
        <div style={{ background: M.card, border: `1px solid ${M.line}`, borderRadius: 10, padding: 4, marginBottom: 14 }}>
          {[
            { p: "Резинэн уплотнитель",     n: "× 2", price: 24000 },
            { p: "Агааржуулалтын филтр",     n: "× 1", price: 38000 },
            { p: "Бактерийн нэмэлт (200мл)", n: "× 1", price: 18000 },
          ].map((p, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", padding: "9px 10px",
              borderBottom: i < 2 ? `1px solid ${M.line}` : 0,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.p}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: M.muted }}>{p.n}</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>{p.price.toLocaleString()}₮</div>
            </div>
          ))}
          <div style={{ padding: "10px 10px", borderTop: `1px solid ${M.ink}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: M.muted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Сэлбэгийн нийт</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700 }}>80,000₮</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button style={{ height: 50, fontSize: 13, fontWeight: 600, color: M.ink, background: M.card, border: `1px solid ${M.line}`, borderRadius: 10 }}>+ Зураг</button>
          <button style={{ height: 50, fontSize: 13, fontWeight: 600, color: "white", background: M.ink, borderRadius: 10, border: 0 }}>Дуусгах →</button>
        </div>
      </div>
    </div>
  );
}

window.MobileApps = MobileApps;
