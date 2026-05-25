function Dashboard() {
  const orders = window.PCDATA.orders;
  const techs = window.PCDATA.technicians;
  const active = orders.filter(o => ["Зам дээр","Гүйцэтгэж байна","Хуваарилагдсан"].includes(o.status));
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Үйл ажиллагааны самбар</h1>
          <div className="page-sub">Бямба гариг · 2026.05.09 · Ажлын ээлж 06:00 — 22:00</div>
        </div>
        <div className="row gap-12">
          <div className="page-tabs">
            <div className="page-tab active">Өнөөдөр</div>
            <div className="page-tab">7 хоног</div>
            <div className="page-tab">Сар</div>
            <div className="page-tab">Улирал</div>
          </div>
          <button className="btn"><span style={{width:14,height:14}}>{I.download}</span>Тайлан татах</button>
          <button className="btn accent"><span style={{width:14,height:14}}>{I.plus}</span>Захиалга үүсгэх</button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <Kpi label="Идэвхтэй захиалга" value="47" delta="+12" deltaTone="up" hint="Өчигдөр 35"
             spark={[28,30,32,29,33,38,42,47]} />
        <Kpi label="Хуваарилагдаагүй" value="6" delta="+2" deltaTone="dn" hint="Дунджаар 4"
             spark={[3,4,5,4,5,6,5,6]} color="var(--orange)"/>
        <Kpi label="Өнөөдрийн орлого" value="₮14.2М" delta="+18%" deltaTone="up" hint="Зорилт 12М"
             spark={[6,7,9,8,11,12,13,14]} />
        <Kpi label="Дундаж хариу" value="38мин" delta="−4мин" deltaTone="up" hint="Зорилт 45мин"
             spark={[44,42,41,43,40,39,38,38]} />
        <Kpi label="Гүйцэтгэлийн SLA" value="96.4%" delta="+1.2" deltaTone="up" hint="7 хоног"
             spark={[93,94,94,95,96,96,96,96.4]} />
      </div>

      {/* main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        {/* Live ops */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Бодит цагийн үйл ажиллагаа</span>
            <Pill tone="green" dot>Шууд дамжуулалт</Pill>
            <div className="right row gap-12">
              <span className="mono muted" style={{fontSize:11}}>СҮҮЛИЙН ШИНЭЧЛЭЛ · 14:42:08</span>
            </div>
          </div>
          <div style={{ height: 360, position: "relative" }}>
            <UBMap technicians={techs} compact />
          </div>
        </div>

        {/* Workload by service */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Цагийн хуваарь · Өнөөдөр</span>
            <span className="right mono muted" style={{fontSize:11}}>06 → 22:00</span>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily:"var(--font-mono)", fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing:".06em", marginBottom:8 }}>
              <span>06</span><span>09</span><span>12</span><span>15</span><span>18</span><span>21</span>
            </div>
            <Bars values={[3,5,8,12,14,17,15,11,9,7,5,4,3,2,2,1]} height={92} color="#2C2E32" />
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <SvcStat color="var(--orange)" label="Соруулга" value="22" pct={47} />
              <SvcStat color="var(--blue)"   label="Засвар" value="14" pct={30} />
              <SvcStat color="var(--ink)"     label="Суулгалт" value="8" pct={17} />
              <SvcStat color="var(--muted)"   label="Үзлэг"   value="3" pct={6} />
            </div>
          </div>
        </div>

        {/* Active jobs feed */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Гүйцэтгэгдэж буй захиалга · {active.length}</span>
            <div className="right"><a href="#" onClick={(e)=>{e.preventDefault(); window.go("orders");}} className="mono" style={{fontSize:11, color:"var(--ink)"}}>Бүгдийг харах →</a></div>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>ID</th><th>Хэрэглэгч</th><th>Үйлчилгээ</th><th>Гүйцэтгэгч</th><th>Төлөв</th><th style={{textAlign:"right"}}>Үнэ</th></tr>
            </thead>
            <tbody>
              {active.slice(0,6).map(o => {
                const tech = techs.find(t => t.id === o.tech);
                return (
                  <tr key={o.id}>
                    <td className="id">{o.id}</td>
                    <td><div style={{fontWeight:500}}>{o.customer}</div><div className="muted" style={{fontSize:11}}>{o.district}</div></td>
                    <td>{o.service} · <span className="mono muted">{o.tank}</span></td>
                    <td>{tech ? <div className="row" style={{gap:8}}><div className="avatar" style={{width:22,height:22,fontSize:10,background:"#E8E6DD",color:"var(--ink)"}}>{tech.name.split(" ")[1]?.[0]}{tech.name.split(" ")[2]?.[0]||""}</div><span style={{fontSize:12.5}}>{tech.name}</span></div> : <span className="muted">—</span>}</td>
                    <td><StatusPill status={o.status} priority={o.priority} /></td>
                    <td className="num" style={{textAlign:"right"}}>{o.price.toLocaleString()}₮</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Contractor status */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Гүйцэтгэгчдийн төлөв</span>
            <span className="right mono muted" style={{fontSize:11}}>{techs.filter(t=>t.status!=="off").length}/{techs.length} ОНЛАЙН</span>
          </div>
          <div className="card-body" style={{ padding: 6 }}>
            {techs.map(t => (
              <div key={t.id} className="tech-row">
                <div className="avatar" style={{background:"#E8E6DD",color:"var(--ink)"}}>{t.name.split(" ")[1]?.[0]}{t.name.split(" ")[2]?.[0]||""}</div>
                <div>
                  <div className="tech-name">{t.name}</div>
                  <div className="tech-meta">{t.id} · {t.role} · {t.vehicle}</div>
                </div>
                <div className={`tech-avail ${t.status==="busy"?"busy":t.status==="idle"?"idle":"off"}`}>
                  {t.status==="busy" ? `▶ ${t.job}` : t.status==="idle" ? "● Сул" : "○ Ээлжээс гарсан"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, deltaTone, hint, spark, color="#111315" }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div style={{ position:"absolute", right: 12, top: 12, width: 90 }}>
        <Sparkline values={spark} color={color} />
      </div>
      <div className="kpi-foot">
        <span className={`delta ${deltaTone==="up"?"up":deltaTone==="dn"?"dn":"flat"}`}>{delta}</span>
        <span>{hint}</span>
      </div>
    </div>
  );
}

function SvcStat({ color, label, value, pct }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent:"space-between", marginBottom: 4, fontSize: 12 }}>
        <span className="row" style={{gap:6}}><span style={{width:8,height:8,background:color,borderRadius:2}}/> {label}</span>
        <span className="mono"><b>{value}</b> <span className="muted">· {pct}%</span></span>
      </div>
      <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }}/>
      </div>
    </div>
  );
}

function StatusPill({ status, priority }) {
  const map = {
    "Зам дээр":         "blue",
    "Гүйцэтгэж байна":  "orange",
    "Хуваарилагдсан":   "amber",
    "Хүлээгдэж буй":    "ghost",
    "Дуусгасан":        "green",
    "Цуцлагдсан":       "red",
  };
  return (
    <div className="row" style={{gap:6}}>
      <Pill tone={map[status]||""} dot>{status}</Pill>
      {priority === "Яаралтай" && <Pill tone="orange">⚡ Яаралтай</Pill>}
    </div>
  );
}

window.Dashboard = Dashboard;
window.StatusPill = StatusPill;
