function Pricing() {
  const z = window.PCDATA.pricing_zones;
  const m = window.PCDATA.multipliers;
  const c = window.PCDATA.commissions;
  const [tab, setTab] = React.useState("zones");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Үнийн систем</h1>
          <div className="page-sub">Зөвхөн супер админ засах эрхтэй · Сүүлд шинэчлэгдсэн: 2026.05.04 14:22</div>
        </div>
        <div className="row gap-12">
          <Pill tone="amber" dot>Засагдаж байна</Pill>
          <button className="btn">Түүх харах</button>
          <button className="btn">Хүчингүй болгох</button>
          <button className="btn primary">Хадгалах · Бүх бүсэд</button>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 14, gap: 4 }}>
        <Tab id="zones"     v={tab} set={setTab}>Бүсчилсэн үнэ</Tab>
        <Tab id="distance"  v={tab} set={setTab}>Зайн тариф</Tab>
        <Tab id="multipliers" v={tab} set={setTab}>Үржих коэффициент</Tab>
        <Tab id="commission" v={tab} set={setTab}>Комиссын систем</Tab>
        <Tab id="seasonal"  v={tab} set={setTab}>Улирлын тохиргоо</Tab>
        <div className="right row gap-12">
          <span className="mono muted" style={{fontSize:11}}>Бүх дүн ₮ (Монгол төгрөг)</span>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>
        <div className="col" style={{gap:14}}>
          {tab === "zones" && (
            <>
              <div className="card">
                <div className="card-head">
                  <span className="card-title">Үндсэн үйлчилгээний үнэ · Бүсээр</span>
                  <span className="right mono muted" style={{fontSize:11}}>4 БҮС × 3 ҮЙЛЧИЛГЭЭ</span>
                </div>
                <table className="matrix">
                  <thead>
                    <tr>
                      <th>Бүс</th>
                      <th>Соруулга</th>
                      <th>Засвар</th>
                      <th>Суулгалт</th>
                      <th>Зайн тариф (км)</th>
                      <th>Үржих коэф.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {z.map(r => (
                      <tr key={r.zone}>
                        <td style={{fontFamily:"var(--font-sans)"}}>{r.zone}</td>
                        <td><span className="editable">{r.service_pump.toLocaleString()}₮</span></td>
                        <td><span className="editable">{r.service_repair.toLocaleString()}₮</span></td>
                        <td><span className="editable">{r.service_install.toLocaleString()}₮</span></td>
                        <td><span className="editable">{r.distance_km.toLocaleString()}₮</span></td>
                        <td><span className="editable">×{r.multiplier.toFixed(2)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{padding: "10px 14px", borderTop:"1px solid var(--line)", display:"flex", alignItems:"center", gap: 10, fontSize: 12, color: "var(--muted)"}}>
                  <span>Дөрөв дэх багана нь зайн нэмэгдлийн ₮/км үнэлгээ</span>
                  <button className="btn sm right">+ Бүс нэмэх</button>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <span className="card-title">Тангийн хэмжээний коэффициент</span>
                </div>
                <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap: 1, background:"var(--line)"}}>
                  {[
                    { s: "1.5 м³", m: 0.7 }, { s: "3 м³", m: 1.0, base: true },
                    { s: "5 м³", m: 1.4 }, { s: "10 м³", m: 2.1 }, { s: "Тусгай", m: 2.8 },
                  ].map(t => (
                    <div key={t.s} style={{ background:"var(--surface)", padding:"14px 16px", textAlign:"center"}}>
                      <div className="mono" style={{fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em"}}>{t.s}</div>
                      <div style={{fontFamily:"var(--font-mono)", fontSize: 22, fontWeight:600, marginTop:4}}>×{t.m.toFixed(2)}</div>
                      {t.base && <div className="mono" style={{fontSize:10, color:"var(--orange)", marginTop:2}}>СУУРЬ</div>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "multipliers" && (
            <div className="card">
              <div className="card-head"><span className="card-title">Нэмэгдэл коэффициент</span></div>
              <table className="matrix">
                <thead>
                  <tr><th>Нэр</th><th>Хэмжээ</th><th>Хамрах хүрээ</th><th>Идэвхтэй</th></tr>
                </thead>
                <tbody>
                  {m.map(r => (
                    <tr key={r.name}>
                      <td>{r.name}</td>
                      <td><span className="editable">+{r.pct}%</span></td>
                      <td style={{fontFamily:"var(--font-sans)", color:"var(--muted)"}}>{r.scope}</td>
                      <td><Pill tone="green" dot>Идэвхтэй</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "commission" && (
            <div className="card">
              <div className="card-head"><span className="card-title">Гүйцэтгэгчийн комиссын систем</span></div>
              <table className="matrix">
                <thead>
                  <tr><th>Үүрэг</th><th>Үндсэн %</th><th>Урамшуулал</th><th>Сарын дээд хязгаар</th></tr>
                </thead>
                <tbody>
                  {c.map(r => (
                    <tr key={r.role}>
                      <td>{r.role}</td>
                      <td><span className="editable">{r.base}%</span></td>
                      <td><span className="editable">+{r.bonus}%</span></td>
                      <td><span className="editable">{r.cap.toLocaleString()}₮</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "distance" && (
            <div className="card">
              <div className="card-head"><span className="card-title">Зайн томъёо</span></div>
              <div className="card-body">
                <div style={{ background:"#0F1114", color:"#E8EAEC", padding: "16px 18px", borderRadius: 6, fontFamily:"var(--font-mono)", fontSize: 13.5, lineHeight: 1.7}}>
                  <div style={{color:"#6E727A", marginBottom: 6}}># Захиалгын эцсийн үнэ</div>
                  <div><span style={{color:"#FF8C5A"}}>final_price</span> = (base_service × <span style={{color:"#FF8C5A"}}>tank_coef</span>) <br/>
                    &nbsp;&nbsp;+ (distance_km × zone_rate)<br/>
                    &nbsp;&nbsp;× zone_multiplier <br/>
                    &nbsp;&nbsp;× (1 + urgency_pct + night_pct + weekend_pct)<br/>
                    &nbsp;&nbsp;+ vat_10
                  </div>
                </div>
                <div style={{marginTop: 12, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: 10}}>
                  <Stat label="Зайн дундаж" value="2,800₮/км" mono />
                  <Stat label="Хамгийн бага" value="3 км" mono />
                  <Stat label="Хамгийн их" value="60 км" mono />
                </div>
              </div>
            </div>
          )}

          {tab === "seasonal" && (
            <div className="card">
              <div className="card-head"><span className="card-title">Улирлын идэвхжил</span></div>
              <div className="card-body">
                <div style={{display:"flex", justifyContent:"space-between", marginBottom:8, fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)"}}>
                  {["1","2","3","4","5","6","7","8","9","10","11","12"].map(m=><span key={m}>{m}-р сар</span>)}
                </div>
                <Bars values={[1.20,1.18,1.10,1.00,0.95,0.92,0.90,0.92,0.95,1.05,1.18,1.22]} height={120} color="#2C2E32" />
                <div className="muted" style={{fontSize:12, marginTop: 8}}>Өвлийн сард ×1.20, зуны сард ×0.92 хүртэл хэлбэлзэнэ.</div>
              </div>
            </div>
          )}
        </div>

        {/* Right rail — calculator */}
        <aside className="card" style={{position:"sticky", top: 72, height:"fit-content"}}>
          <div className="card-head">
            <span className="card-title">Үнийн тооцоолуур</span>
            <Pill tone="blue" dot>LIVE</Pill>
          </div>
          <div className="card-body">
            <PField label="Үйлчилгээ" value="Соруулга" />
            <PField label="Тангийн хэмжээ" value="5 м³ (×1.40)" />
            <PField label="Бүс" value="Гадна дүүрэг" />
            <PField label="Зай" value="14.2 км" mono />
            <PField label="Яаралтай" value="Тийм (+50%)" />

            <div style={{ height: 1, background:"var(--line)", margin:"12px 0"}}/>

            <div className="col" style={{gap: 6, fontSize: 12.5}}>
              <Row k="Үндсэн" v="240,000₮"/>
              <Row k="Тангийн коэф." v="× 1.40"/>
              <Row k="Зайн нэмэгдэл" v="+45,440₮"/>
              <Row k="Бүсийн коэф." v="× 1.15"/>
              <Row k="Яаралтай" v="+50%"/>
              <Row k="НӨАТ 10%" v="+58,000₮"/>
            </div>

            <div style={{
              marginTop: 12, padding: "12px 14px",
              background: "var(--ink)", color:"white", borderRadius: 6,
              display:"flex", justifyContent:"space-between", alignItems:"center"
            }}>
              <span className="mono" style={{fontSize:11, opacity:0.7, textTransform:"uppercase", letterSpacing:"0.06em"}}>Эцсийн үнэ</span>
              <span style={{fontFamily:"var(--font-mono)", fontSize: 22, fontWeight:600}}>638,440₮</span>
            </div>

            <div className="muted" style={{fontSize:11.5, marginTop: 10}}>
              Энэ тооцоолол нь админуудын тохируулсан коэффициентэд тулгуурлан автоматаар бодогдоно.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Tab({ id, v, set, children }) {
  return <span className={`chip ${v===id?"on":""}`} onClick={()=>set(id)}>{children}</span>;
}

function PField({ label, value, mono }) {
  return (
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap: 12, padding:"7px 0", borderBottom:"1px dashed var(--line)"}}>
      <span className="muted" style={{fontSize:12, flex: "1 1 auto", minWidth: 0}}>{label}</span>
      <span style={{fontSize:12.5, fontWeight: 500, fontFamily: mono ? "var(--font-mono)" : "", textAlign: "right", flex: "0 0 auto", whiteSpace: "nowrap"}}>{value}</span>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", gap: 12}}>
      <span className="muted" style={{minWidth: 0}}>{k}</span>
      <span className="mono" style={{whiteSpace:"nowrap"}}>{v}</span>
    </div>
  );
}

window.Pricing = Pricing;
