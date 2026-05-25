function App() {
  const [route, setRoute] = React.useState("dashboard");
  React.useEffect(() => { window.go = setRoute; }, []);

  const nav = [
    { id: "dashboard", label: "Үйл ажиллагаа", icon: I.dash, badge: null },
    { id: "dispatch",  label: "Ачилт удирдлага", icon: I.truck, badge: "47" },
    { id: "orders",    label: "Захиалга",       icon: I.list, badge: "6" },
    { id: "pricing",   label: "Үнийн систем",    icon: I.tag, badge: null },
    { id: "history",   label: "Үйлчилгээний түүх", icon: I.clock, badge: null },
    { id: "inventory", label: "Агуулах",            icon: I.layers, badge: "⚠" },
    { id: "mobile",    label: "Хээрийн ажилтнууд", icon: I.bolt, badge: "3" },
  ];

  const sub = [
    { id: "analytics", label: "Шинжилгээ",      icon: I.chart },
    { id: "users",     label: "Хэрэглэгчид",     icon: I.user },
    { id: "settings",  label: "Тохиргоо",         icon: I.cog },
  ];

  const crumbsMap = {
    dashboard: ["Үйл ажиллагаа", "Самбар"],
    dispatch:  ["Үйл ажиллагаа", "Ачилт удирдлага"],
    orders:    ["Үйлчилгээ",      "Захиалга удирдлага"],
    pricing:   ["Тохиргоо",       "Үнийн систем"],
    history:   ["Үйлчилгээ",      "Түүх"],
    inventory: ["Үйл ажиллагаа",  "Агуулахын удирдлага"],
    mobile:    ["Хээрийн ажилтан", "Гар утасны апп · 3 үүрэг"],
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PC</div>
          <div>
            <div className="brand-name">Plastic Center</div>
            <div className="brand-sub">FSOS · v2.4</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Үндсэн</div>
          {nav.map(n => (
            <div key={n.id}
              className={`nav-item ${route===n.id?"active":""}`}
              onClick={()=>setRoute(n.id)}>
              <span style={{display:"flex"}}>{n.icon}</span>
              <span>{n.label}</span>
              {n.badge && <span className="badge">{n.badge}</span>}
            </div>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Бусад</div>
          {sub.map(n => (
            <div key={n.id} className="nav-item">
              <span style={{display:"flex"}}>{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </div>

        {/* Shift status block */}
        <div style={{
          margin: "auto 12px 12px", padding: 10,
          background: "#1A1D22", borderRadius: 5,
          border: "1px solid #23272E",
        }}>
          <div className="row" style={{justifyContent:"space-between", marginBottom: 6}}>
            <span style={{fontFamily:"Geist Mono, monospace", fontSize:10, color:"#8A8E96", textTransform:"uppercase", letterSpacing:".07em"}}>Идэвхтэй ээлж</span>
            <span style={{width: 6, height: 6, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 0 2px rgba(31,138,91,.25)"}}/>
          </div>
          <div style={{color:"#FFF", fontSize: 12.5, fontWeight: 500}}>Өдрийн ээлж · A-баг</div>
          <div style={{fontFamily:"Geist Mono, monospace", fontSize: 11, color:"#8A8E96", marginTop: 2}}>06:00 — 22:00 · 12/14 онлайн</div>
        </div>

        <div className="sidebar-foot">
          <div className="avatar">ББ</div>
          <div style={{flex:1, minWidth:0}}>
            <div className="user-name">Б. Билгүүн</div>
            <div className="user-role">Супер админ</div>
          </div>
          <button className="icon-btn" style={{background:"transparent", borderColor:"#23272E", color:"#8A8E96", width:26, height:26}}>{I.cog}</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumbs">
            <span>{crumbsMap[route][0]}</span>
            <span className="sep">/</span>
            <span className="here">{crumbsMap[route][1]}</span>
          </div>

          <div className="topbar-search">
            <span style={{width:14,height:14}}>{I.search}</span>
            <span>Хайх... захиалга, гүйцэтгэгч, хаяг</span>
            <kbd>⌘K</kbd>
          </div>

          <div className="topbar-actions">
            <span className="shift-pill"><span className="dot"/> Бямба · 14:42</span>
            <button className="icon-btn">{I.bell}</button>
            <button className="btn accent"><span style={{width:14, height:14}}>{I.plus}</span>Захиалга</button>
          </div>
        </header>

        <div data-screen-label={crumbsMap[route].join(" / ")}>
          {route === "dashboard" && <Dashboard/>}
          {route === "dispatch"  && <Dispatch/>}
          {route === "orders"    && <Orders/>}
          {route === "pricing"   && <Pricing/>}
          {route === "history"   && <History/>}
          {route === "inventory" && <Inventory/>}
          {route === "mobile"    && <MobileApps/>}
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
