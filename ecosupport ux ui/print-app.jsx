// Print-only entry: renders every screen stacked, one per page
function PrintApp() {
  const screens = [
    { id: "cover",     title: "Plastic Center · FSOS",            sub: "Field Service Operating System · Үйл ажиллагааны цогц систем" },
    { id: "dashboard", title: "Үйл ажиллагааны самбар",          comp: <Dashboard/> },
    { id: "dispatch",  title: "Ачилт удирдлага",                  comp: <DispatchStatic/> },
    { id: "orders",    title: "Захиалга удирдлага",                comp: <Orders/> },
    { id: "pricing",   title: "Үнийн систем",                      comp: <Pricing/> },
    { id: "history",   title: "Үйлчилгээний түүх",                 comp: <History/> },
    { id: "inventory", title: "Агуулахын удирдлага",               comp: <Inventory/> },
    { id: "mobile",    title: "Хээрийн ажилтнууд · Гар утасны апп", comp: <MobileApps/> },
  ];

  return (
    <div className="print-root">
      {screens.map((s, i) => (
        <section key={s.id} className={`print-page ${s.id === "cover" ? "is-cover" : ""}`} data-screen-label={`${String(i).padStart(2,"0")} ${s.title}`}>
          {s.id === "cover" ? <CoverPage/> : (
            <>
              <header className="print-header">
                <div className="row" style={{gap:10, alignItems:"center"}}>
                  <div className="brand-mark" style={{width:22, height:22, fontSize: 11}}>PC</div>
                  <span style={{fontWeight: 600, letterSpacing:"-0.01em"}}>Plastic Center · FSOS</span>
                  <span style={{color: "var(--muted)"}}>—</span>
                  <span>{s.title}</span>
                </div>
                <span className="mono" style={{fontSize: 10.5, color: "var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em"}}>
                  {String(i).padStart(2,"0")} / {String(screens.length-1).padStart(2,"0")}
                </span>
              </header>
              <div className="print-screen">
                {s.comp}
              </div>
            </>
          )}
        </section>
      ))}
    </div>
  );
}

function CoverPage() {
  return (
    <div className="cover">
      <div className="cover-top">
        <div className="row" style={{gap: 12}}>
          <div className="brand-mark" style={{width: 38, height: 38, fontSize: 16}}>PC</div>
          <div>
            <div style={{fontSize: 14, fontWeight: 600}}>Plastic Center</div>
            <div className="mono muted" style={{fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em"}}>FSOS · v2.4</div>
          </div>
        </div>
        <div className="mono muted" style={{fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em"}}>
          Design proposal · 2026.05
        </div>
      </div>

      <div className="cover-main">
        <div className="mono" style={{fontSize: 11, color: "var(--orange)", textTransform:"uppercase", letterSpacing: "0.12em", marginBottom: 24}}>
          Field Service Operating System
        </div>
        <h1 className="cover-title">Үйл ажиллагааны<br/>цогц систем</h1>
        <p className="cover-sub">
          Био септик танкны суурилуулалт, соруулга, засвар үйлчилгээ үзүүлэгч компанийн
          өдөр тутмын үйл ажиллагааг нэгдсэн нэг цонхноос удирдах систем.
          Захиалгаас эхлээд гүйцэтгэл, төлбөр, агуулах, баталгаа хүртэлх бүхэл циклийг хамарна.
        </p>

        <div className="cover-modules">
          {[
            ["01", "Үйл ажиллагааны самбар",   "KPI · бодит цагийн газрын зураг · идэвхтэй захиалга"],
            ["02", "Ачилт удирдлага",          "Захиалгын дамжуулалт · UB дүүргийн зураг · гүйцэтгэгч"],
            ["03", "Захиалга удирдлага",        "Бүх захиалгын CRUD · үнийн задаргаа · хуваарилалт"],
            ["04", "Үнийн систем",              "Бүсчилсэн тариф · коэф. · комисс · томъёо"],
            ["05", "Үйлчилгээний түүх",         "Архив · фото нотолгоо · гарын үсэг · баталгаа"],
            ["06", "Агуулахын удирдлага",       "3 агуулах · 16 SKU · хөдөлгөөн · PO · нийлүүлэгч"],
            ["07", "Хээрийн ажилтан",           "Тээвэрлэгч · Соруулагч · Засварчин · Android апп"],
          ].map(m => (
            <div key={m[0]} className="cover-mod">
              <div className="mono" style={{fontSize: 10.5, color: "var(--orange)", letterSpacing: "0.08em"}}>{m[0]}</div>
              <div style={{fontSize: 15, fontWeight: 600, letterSpacing:"-0.01em", margin: "2px 0 4px"}}>{m[1]}</div>
              <div className="muted" style={{fontSize: 11.5, lineHeight: 1.5}}>{m[2]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="cover-foot">
        <div className="mono muted" style={{fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em"}}>
          Дараагийн хуудаснуудад · 7 модулийн дэлгэрэнгүй интерфэйс
        </div>
        <div className="mono muted" style={{fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em"}}>
          Монгол кирилл · MNT · Улаанбаатар
        </div>
      </div>
    </div>
  );
}

// Static Dispatch wrapper — same content but without the calc(100vh) constraint
function DispatchStatic() {
  return <div style={{ height: 820 }}><Dispatch/></div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<PrintApp/>);

// Auto-print after fonts + Babel finish
(async () => {
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch(e){}
  await new Promise(r => setTimeout(r, 800));
  window.print();
})();
