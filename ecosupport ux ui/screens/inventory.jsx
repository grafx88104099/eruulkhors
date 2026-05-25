// Агуулахын удирдлагын модул — Warehouse / Inventory management
const WAREHOUSES = [
  { id: "WH-01", name: "Төв агуулах",        location: "Хан-Уул дүүрэг · 7-р хороо",   capacity: 1200, used: 847, manager: "Б. Дорж" },
  { id: "WH-02", name: "Баруун салбар",      location: "Сонгинохайрхан · 21-р хороо",  capacity: 600,  used: 412, manager: "С. Энхтуяа" },
  { id: "WH-03", name: "Зүүн салбар",        location: "Налайх · 4-р хороо",            capacity: 400,  used: 156, manager: "Ц. Бат-Эрдэнэ" },
];

const INVENTORY = [
  // Tanks
  { sku: "TNK-3000",  name: "Био септик танк 3 м³",        cat: "Танк",       unit: "ширхэг", stock: 28, min: 12, max: 80, reserved: 6,  cost: 1280000, supplier: "Roto Plastic", wh: "WH-01" },
  { sku: "TNK-5000",  name: "Био септик танк 5 м³",        cat: "Танк",       unit: "ширхэг", stock: 14, min: 8,  max: 50, reserved: 3,  cost: 1850000, supplier: "Roto Plastic", wh: "WH-01" },
  { sku: "TNK-10K",   name: "Био септик танк 10 м³",       cat: "Танк",       unit: "ширхэг", stock: 4,  min: 6,  max: 24, reserved: 2,  cost: 3450000, supplier: "Хүрээ ХХК",     wh: "WH-01" },
  { sku: "TNK-1500",  name: "Био септик танк 1.5 м³",      cat: "Танк",       unit: "ширхэг", stock: 22, min: 10, max: 60, reserved: 0,  cost: 850000,  supplier: "Roto Plastic", wh: "WH-02" },
  // Pipes
  { sku: "PIP-110",   name: "ПВХ хоолой Ø110мм · 6м",     cat: "Хоолой",     unit: "м",       stock: 412, min: 120, max: 800, reserved: 24, cost: 18500,   supplier: "Шунхлай ХХК",  wh: "WH-01" },
  { sku: "PIP-160",   name: "ПВХ хоолой Ø160мм · 6м",     cat: "Хоолой",     unit: "м",       stock: 188, min: 80,  max: 500, reserved: 12, cost: 32000,   supplier: "Шунхлай ХХК",  wh: "WH-01" },
  { sku: "PIP-200",   name: "ПВХ хоолой Ø200мм · 6м",     cat: "Хоолой",     unit: "м",       stock: 64,  min: 40,  max: 200, reserved: 8,  cost: 48000,   supplier: "Шунхлай ХХК",  wh: "WH-02" },
  // Fittings
  { sku: "FIT-T110",  name: "Тэвхэн холбогч Т Ø110мм",   cat: "Холбоос",    unit: "ширхэг", stock: 156, min: 60,  max: 300, reserved: 0,  cost: 12500,   supplier: "Шунхлай ХХК",  wh: "WH-01" },
  { sku: "FIT-E110",  name: "Тохой Ø110мм 90°",          cat: "Холбоос",    unit: "ширхэг", stock: 8,   min: 50,  max: 250, reserved: 0,  cost: 8500,    supplier: "Шунхлай ХХК",  wh: "WH-01" },
  { sku: "SEAL-110",  name: "Резинэн уплотнитель Ø110",  cat: "Холбоос",    unit: "ширхэг", stock: 240, min: 100, max: 500, reserved: 18, cost: 12000,   supplier: "Гарын Авлага", wh: "WH-01" },
  // Consumables
  { sku: "BIO-200",   name: "Бактерийн нэмэлт · 200мл",  cat: "Хэрэгсэл",   unit: "ширхэг", stock: 86,  min: 40,  max: 200, reserved: 12, cost: 18000,   supplier: "EcoMon LLC",   wh: "WH-01" },
  { sku: "BIO-1000",  name: "Бактерийн нэмэлт · 1Л",     cat: "Хэрэгсэл",   unit: "ширхэг", stock: 32,  min: 20,  max: 100, reserved: 4,  cost: 65000,   supplier: "EcoMon LLC",   wh: "WH-01" },
  { sku: "FLT-AIR",   name: "Агааржуулалтын филтр",       cat: "Хэрэгсэл",   unit: "ширхэг", stock: 47,  min: 30,  max: 150, reserved: 6,  cost: 38000,   supplier: "EcoMon LLC",   wh: "WH-02" },
  { sku: "PMP-OIL",   name: "Соруулгын насосны тос · 5Л", cat: "Хэрэгсэл",   unit: "ширхэг", stock: 18,  min: 15,  max: 60,  reserved: 0,  cost: 95000,   supplier: "Шунхлай ХХК",  wh: "WH-01" },
  // Equipment
  { sku: "PMP-VAC",   name: "Вакуум насос 7.5 кВт",       cat: "Тоног төхөөрөмж", unit: "ширхэг", stock: 3, min: 2, max: 8,   reserved: 1,  cost: 4200000, supplier: "Korea Tech", wh: "WH-01" },
  { sku: "GLV-XL",    name: "Ажлын бээлий XL",            cat: "ХАБ",        unit: "хос",     stock: 124, min: 50,  max: 300, reserved: 0,  cost: 4500,    supplier: "Гарын Авлага", wh: "WH-01" },
];

const STOCK_MOVEMENTS = [
  { id: "MV-7842", time: "14:38", type: "issue",    sku: "PIP-160",  qty: 12,  to: "TX-014 · ORD-2840",   actor: "Б. Дорж",     wh: "WH-01" },
  { id: "MV-7841", time: "14:22", type: "receive",  sku: "TNK-3000", qty: 8,   to: "Roto Plastic — PO-2241", actor: "Б. Дорж",  wh: "WH-01" },
  { id: "MV-7840", time: "13:58", type: "issue",    sku: "BIO-200",  qty: 4,   to: "TX-022 · ORD-2841",   actor: "С. Энхтуяа",  wh: "WH-02" },
  { id: "MV-7839", time: "13:30", type: "transfer", sku: "PIP-110",  qty: 60,  to: "WH-01 → WH-02",        actor: "Б. Дорж",     wh: "WH-01" },
  { id: "MV-7838", time: "12:14", type: "issue",    sku: "TNK-5000", qty: 1,   to: "TX-031 · ORD-2837",   actor: "Б. Дорж",     wh: "WH-01" },
  { id: "MV-7837", time: "11:50", type: "receive",  sku: "SEAL-110", qty: 100, to: "Гарын Авлага — PO-2240", actor: "Б. Дорж", wh: "WH-01" },
  { id: "MV-7836", time: "10:42", type: "adjust",   sku: "FIT-E110", qty: -2,  to: "Эвдрэлийн чөлөөлөлт",  actor: "Б. Дорж",     wh: "WH-01" },
  { id: "MV-7835", time: "09:18", type: "issue",    sku: "FLT-AIR",  qty: 1,   to: "TX-022 · ORD-2841",   actor: "С. Энхтуяа",  wh: "WH-02" },
];

const PURCHASE_ORDERS = [
  { id: "PO-2244", supplier: "Roto Plastic",   items: 3, total: 18450000, status: "Хүлээгдэж буй", eta: "2026.05.14" },
  { id: "PO-2243", supplier: "Шунхлай ХХК",    items: 6, total: 4280000,  status: "Замдаа",         eta: "2026.05.11" },
  { id: "PO-2242", supplier: "EcoMon LLC",     items: 4, total: 1860000,  status: "Захиалсан",       eta: "2026.05.16" },
  { id: "PO-2241", supplier: "Roto Plastic",   items: 1, total: 10240000, status: "Хүлээж авсан",   eta: "—" },
];

function Inventory() {
  const [tab, setTab] = React.useState("stock");
  const [whFilter, setWhFilter] = React.useState("ALL");
  const [catFilter, setCatFilter] = React.useState("ALL");
  const [search, setSearch] = React.useState("");

  const filtered = INVENTORY.filter(i =>
    (whFilter === "ALL" || i.wh === whFilter) &&
    (catFilter === "ALL" || i.cat === catFilter) &&
    (!search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const lowStock = INVENTORY.filter(i => i.stock <= i.min);
  const totalValue = INVENTORY.reduce((s, i) => s + i.stock * i.cost, 0);
  const cats = ["ALL", ...Array.from(new Set(INVENTORY.map(i => i.cat)))];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Агуулахын удирдлага</h1>
          <div className="page-sub">{WAREHOUSES.length} агуулах · {INVENTORY.length} нэр төрөл · Нийт үнэлгээ {(totalValue/1000000).toFixed(1)}М₮</div>
        </div>
        <div className="row gap-12">
          <button className="btn"><span style={{width:14,height:14}}>{I.download}</span>Нөөц тайлан</button>
          <button className="btn">+ Худалдан авалт</button>
          <button className="btn primary">+ Бараа хүлээж авах</button>
          <button className="btn accent">- Бараа гаргах</button>
        </div>
      </div>

      {/* Warehouse summary tiles */}
      <div className="kpi-grid" style={{ gridTemplateColumns: `repeat(${WAREHOUSES.length + 2}, 1fr)`, marginBottom: 14 }}>
        {WAREHOUSES.map(w => {
          const pct = Math.round((w.used / w.capacity) * 100);
          return (
            <div key={w.id} className="kpi" onClick={()=>setWhFilter(w.id)} style={{cursor:"pointer", outline: whFilter===w.id?"2px solid var(--orange)":"none", outlineOffset: -1}}>
              <div className="kpi-label">{w.id} · {w.name}</div>
              <div className="kpi-value" style={{fontSize: 22}}>{pct}<span style={{fontSize:13, color:"var(--muted)"}}>%</span></div>
              <div style={{height:4, background:"var(--surface-2)", borderRadius: 2, marginTop: 4}}>
                <div style={{width:`${pct}%`, height:"100%", background: pct > 85 ? "var(--orange)" : "var(--ink)", borderRadius: 2}}/>
              </div>
              <div className="kpi-foot" style={{marginTop: 6}}>
                <span className="mono">{w.used}/{w.capacity} м²</span>
                <span>· {w.location.split(" ")[0]}</span>
              </div>
            </div>
          );
        })}
        <div className="kpi" style={{background:"#FFF6F0"}}>
          <div className="kpi-label" style={{color:"var(--orange)"}}>⚠ Дуусах гэж буй</div>
          <div className="kpi-value" style={{color:"var(--orange)"}}>{lowStock.length}</div>
          <div className="kpi-foot"><span className="delta" style={{background:"#FFE0CC", color:"var(--orange)"}}>Шуурхай</span><span>Захиалга өгөх</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Нөөцийн үнэлгээ</div>
          <div className="kpi-value">{(totalValue/1000000).toFixed(1)}<span style={{fontSize:14, color:"var(--muted)"}}>М₮</span></div>
          <div className="kpi-foot"><span className="delta up">+4.2%</span><span>30 хоног</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="row" style={{ marginBottom: 14, gap: 4 }}>
        <span className={`chip ${tab==="stock"?"on":""}`}    onClick={()=>setTab("stock")}>Нөөц <span className="mono" style={{opacity:0.7}}>{INVENTORY.length}</span></span>
        <span className={`chip ${tab==="movements"?"on":""}`} onClick={()=>setTab("movements")}>Хөдөлгөөн <span className="mono" style={{opacity:0.7}}>{STOCK_MOVEMENTS.length}</span></span>
        <span className={`chip ${tab==="po"?"on":""}`}        onClick={()=>setTab("po")}>Худалдан авалт <span className="mono" style={{opacity:0.7}}>{PURCHASE_ORDERS.length}</span></span>
        <span className={`chip ${tab==="suppliers"?"on":""}`} onClick={()=>setTab("suppliers")}>Нийлүүлэгч</span>
        <span className={`chip ${tab==="map"?"on":""}`}       onClick={()=>setTab("map")}>Зохион байгуулалт</span>
      </div>

      {tab === "stock" && (
        <div style={{ display:"grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 14 }}>
          <div className="card">
            <div style={{padding:"10px 12px", borderBottom:"1px solid var(--line)", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
              <span className={`chip ${whFilter==="ALL"?"on":""}`} onClick={()=>setWhFilter("ALL")}>Бүх агуулах</span>
              {WAREHOUSES.map(w => <span key={w.id} className={`chip ${whFilter===w.id?"on":""}`} onClick={()=>setWhFilter(w.id)}>{w.id}</span>)}
              <div className="divider-v"/>
              {cats.map(c => <span key={c} className={`chip ${catFilter===c?"on":""}`} onClick={()=>setCatFilter(c)}>{c==="ALL"?"Бүгд":c}</span>)}
              <div className="search-input" style={{marginLeft:"auto", maxWidth: 240}}>
                <span style={{width:14,height:14,color:"var(--muted)"}}>{I.search}</span>
                <input placeholder="SKU, нэр..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Бараа</th>
                  <th>Ангилал</th>
                  <th className="num" style={{textAlign:"right"}}>Нөөц</th>
                  <th>Түвшин</th>
                  <th className="num" style={{textAlign:"right"}}>Захиалсан</th>
                  <th className="num" style={{textAlign:"right"}}>Үнэ</th>
                  <th>Агуулах</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => {
                  const ratio = i.stock / i.max;
                  const low = i.stock <= i.min;
                  const critical = i.stock < i.min * 0.5;
                  return (
                    <tr key={i.sku}>
                      <td className="id">{i.sku}</td>
                      <td>
                        <div style={{fontWeight: 500}}>{i.name}</div>
                        <div className="muted" style={{fontSize: 11}}>{i.supplier}</div>
                      </td>
                      <td><Pill>{i.cat}</Pill></td>
                      <td className="num" style={{textAlign:"right", fontWeight: 600, color: critical ? "var(--red)" : low ? "var(--orange)" : "var(--ink)"}}>
                        {i.stock} <span className="muted" style={{fontWeight: 400, fontSize: 11}}>{i.unit}</span>
                      </td>
                      <td style={{minWidth: 140}}>
                        <div style={{display:"flex", alignItems:"center", gap: 8}}>
                          <div style={{flex:1, height: 4, background:"var(--surface-2)", borderRadius: 2, position:"relative"}}>
                            <div style={{
                              width: `${Math.min(100, ratio*100)}%`, height:"100%",
                              background: critical ? "var(--red)" : low ? "var(--orange)" : "var(--green)",
                              borderRadius: 2,
                            }}/>
                            <div style={{position:"absolute", left: `${(i.min/i.max)*100}%`, top:-2, bottom:-2, width:1, background:"var(--ink)"}}/>
                          </div>
                          {critical ? <Pill tone="red">Критик</Pill> : low ? <Pill tone="orange">Бага</Pill> : <Pill tone="green">Хэвийн</Pill>}
                        </div>
                      </td>
                      <td className="num muted" style={{textAlign:"right"}}>{i.reserved || "—"}</td>
                      <td className="num" style={{textAlign:"right"}}>{i.cost.toLocaleString()}₮</td>
                      <td className="mono" style={{fontSize: 11.5, color:"var(--muted)"}}>{i.wh}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right rail: low stock */}
          <aside className="card" style={{height:"fit-content", position:"sticky", top: 72}}>
            <div className="card-head">
              <span className="card-title">Шаардлагатай арга хэмжээ</span>
              <Pill tone="orange" dot>{lowStock.length}</Pill>
            </div>
            <div className="card-body" style={{padding: 8}}>
              {lowStock.map(i => (
                <div key={i.sku} style={{padding: "10px 8px", borderBottom: "1px solid var(--line)"}}>
                  <div className="row" style={{justifyContent:"space-between", marginBottom: 4}}>
                    <span className="mono muted" style={{fontSize: 11}}>{i.sku}</span>
                    <Pill tone={i.stock < i.min*0.5 ? "red" : "orange"} dot>{i.stock < i.min*0.5 ? "Критик" : "Бага"}</Pill>
                  </div>
                  <div style={{fontSize: 12.5, fontWeight: 500, marginBottom: 4}}>{i.name}</div>
                  <div className="mono" style={{fontSize: 11, color:"var(--muted)"}}>
                    {i.stock} / мин. {i.min} {i.unit}
                  </div>
                  <button className="btn sm primary" style={{width: "100%", marginTop: 8, justifyContent: "center"}}>
                    Захиалга үүсгэх ({i.max - i.stock} {i.unit})
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {tab === "movements" && (
        <div className="card">
          <div className="card-head">
            <span className="card-title">Барааны хөдөлгөөн · Өнөөдөр</span>
            <span className="right mono muted" style={{fontSize: 11}}>СҮҮЛИЙН ШИНЭЧЛЭЛ 14:42</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Гүйлгээ</th>
                <th>Цаг</th>
                <th>Төрөл</th>
                <th>Бараа</th>
                <th className="num" style={{textAlign:"right"}}>Тоо</th>
                <th>Хүлээн авагч / Эх үүсвэр</th>
                <th>Хариуцагч</th>
                <th>Агуулах</th>
              </tr>
            </thead>
            <tbody>
              {STOCK_MOVEMENTS.map(m => {
                const item = INVENTORY.find(i => i.sku === m.sku);
                const tone = m.type === "receive" ? "green" : m.type === "issue" ? "orange" : m.type === "transfer" ? "blue" : "amber";
                const label = m.type === "receive" ? "↓ Хүлээж авсан" : m.type === "issue" ? "↑ Гаргасан" : m.type === "transfer" ? "↔ Шилжүүлсэн" : "⚙ Тохируулсан";
                return (
                  <tr key={m.id}>
                    <td className="id">{m.id}</td>
                    <td className="mono muted">{m.time}</td>
                    <td><Pill tone={tone}>{label}</Pill></td>
                    <td>
                      <div style={{fontSize: 12.5, fontWeight: 500}}>{item?.name || m.sku}</div>
                      <div className="mono muted" style={{fontSize: 11}}>{m.sku}</div>
                    </td>
                    <td className="num" style={{textAlign:"right", fontWeight: 600, color: m.qty < 0 ? "var(--red)" : "var(--ink)"}}>
                      {m.qty > 0 ? "+" : ""}{m.qty}
                    </td>
                    <td>{m.to}</td>
                    <td>{m.actor}</td>
                    <td className="mono muted" style={{fontSize: 11.5}}>{m.wh}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "po" && (
        <div className="card">
          <div className="card-head">
            <span className="card-title">Худалдан авалтын захиалга</span>
            <button className="btn sm primary right">+ Шинэ захиалга</button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Захиалга</th>
                <th>Нийлүүлэгч</th>
                <th className="num" style={{textAlign:"right"}}>Бараа</th>
                <th className="num" style={{textAlign:"right"}}>Дүн</th>
                <th>Төлөв</th>
                <th>Хүлээгдэж буй</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {PURCHASE_ORDERS.map(p => {
                const tone = p.status === "Замдаа" ? "blue" : p.status === "Хүлээж авсан" ? "green" : p.status === "Захиалсан" ? "amber" : "orange";
                return (
                  <tr key={p.id}>
                    <td className="id">{p.id}</td>
                    <td style={{fontWeight: 500}}>{p.supplier}</td>
                    <td className="num" style={{textAlign:"right"}}>{p.items}</td>
                    <td className="num" style={{textAlign:"right", fontWeight: 600}}>{p.total.toLocaleString()}₮</td>
                    <td><Pill tone={tone} dot>{p.status}</Pill></td>
                    <td className="mono muted">{p.eta}</td>
                    <td><button className="btn sm">Дэлгэрэнгүй →</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "suppliers" && (
        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 14}}>
          {[
            { name: "Roto Plastic",   cat: "Танк үйлдвэрлэгч", country: "Монгол · УБ", lead: "5-7 хоног", rating: 4.8, items: 4 },
            { name: "Шунхлай ХХК",    cat: "Хоолой · Холбоос", country: "Монгол · УБ", lead: "2-3 хоног", rating: 4.6, items: 8 },
            { name: "EcoMon LLC",     cat: "Био хэрэгсэл",      country: "Монгол · Дархан", lead: "7 хоног",   rating: 4.7, items: 5 },
            { name: "Korea Tech",     cat: "Тоног төхөөрөмж",   country: "БНСУ · Сөүл",     lead: "21 хоног",  rating: 4.9, items: 3 },
            { name: "Гарын Авлага",   cat: "ХАБ · Хэрэгсэл",   country: "Монгол · УБ", lead: "1-2 хоног", rating: 4.4, items: 12 },
            { name: "Хүрээ ХХК",      cat: "Том танк",          country: "Монгол · УБ", lead: "10-14 хоног", rating: 4.5, items: 2 },
          ].map(s => (
            <div key={s.name} className="card" style={{padding: 16}}>
              <div className="row" style={{justifyContent:"space-between", marginBottom: 10}}>
                <Pill>{s.cat}</Pill>
                <span className="mono" style={{fontSize: 12, fontWeight: 600}}>★ {s.rating}</span>
              </div>
              <div style={{fontSize: 16, fontWeight: 600, letterSpacing:"-0.01em", marginBottom: 2}}>{s.name}</div>
              <div className="muted" style={{fontSize: 12, marginBottom: 12}}>{s.country}</div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 6, marginBottom: 12}}>
                <Stat label="Нийлүүлэх хугацаа" value={s.lead}/>
                <Stat label="Барааны төрөл" value={`${s.items} нэр`}/>
              </div>
              <div className="row" style={{gap: 6}}>
                <button className="btn sm" style={{flex:1}}>Холбогдох</button>
                <button className="btn sm primary" style={{flex:1}}>Захиалга өгөх</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "map" && <WarehouseMap/>}
    </div>
  );
}

function WarehouseMap() {
  const cells = [
    ["A1","TNK-3000",28,"green"], ["A2","TNK-5000",14,"green"], ["A3","TNK-10K",4,"red"], ["A4","TNK-1500",22,"green"],
    ["B1","PIP-110",412,"green"], ["B2","PIP-160",188,"green"], ["B3","PIP-200",64,"green"], ["B4","—",0,"empty"],
    ["C1","FIT-T110",156,"green"], ["C2","FIT-E110",8,"red"], ["C3","SEAL-110",240,"green"], ["C4","—",0,"empty"],
    ["D1","BIO-200",86,"green"], ["D2","BIO-1000",32,"green"], ["D3","FLT-AIR",47,"orange"], ["D4","PMP-OIL",18,"orange"],
    ["E1","PMP-VAC",3,"green"], ["E2","GLV-XL",124,"green"], ["E3","—",0,"empty"], ["E4","—",0,"empty"],
  ];
  const tones = {
    green: { bg: "#E0F1E8", fg: "var(--green)", b: "#A7D9C0" },
    orange: { bg: "#FFEDE4", fg: "var(--orange)", b: "#F5C8AE" },
    red: { bg: "#FBE5E5", fg: "var(--red)", b: "#E8A8A8" },
    empty: { bg: "var(--surface-2)", fg: "var(--muted)", b: "var(--line)" },
  };
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Төв агуулах · Зохион байгуулалт</span>
        <span className="mono muted right" style={{fontSize: 11}}>WH-01 · 1200 м² · 5 КОРИДОР × 4 ТАВИУР</span>
      </div>
      <div className="card-body">
        <div style={{display:"grid", gridTemplateColumns: "60px repeat(4, 1fr)", gap: 8}}>
          <div></div>
          {[1,2,3,4].map(c => <div key={c} className="mono" style={{fontSize: 10.5, color: "var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", textAlign:"center"}}>Тавиур {c}</div>)}
          {["A","B","C","D","E"].map(row => (
            <React.Fragment key={row}>
              <div className="mono" style={{fontSize: 11, color:"var(--muted)", display:"grid", placeItems:"center", fontWeight: 600}}>Коридор {row}</div>
              {cells.filter(c => c[0].startsWith(row)).map(c => {
                const t = tones[c[3]];
                return (
                  <div key={c[0]} style={{
                    background: t.bg, border: `1px solid ${t.b}`,
                    borderRadius: 6, padding: "12px 10px",
                    minHeight: 80,
                  }}>
                    <div className="mono" style={{fontSize: 9.5, color: t.fg, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight: 600}}>{c[0]}</div>
                    <div style={{fontFamily:"var(--font-mono)", fontSize: 12, fontWeight: 600, marginTop: 2}}>{c[1]}</div>
                    {c[3] !== "empty" && <div className="mono" style={{fontSize: 11, color: t.fg, marginTop: 4}}>{c[2]} ширхэг</div>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div className="row" style={{gap: 16, marginTop: 16, fontSize: 12, flexWrap:"wrap"}}>
          <div className="row" style={{gap: 6}}><span style={{width: 10, height: 10, background: "#E0F1E8", border:"1px solid #A7D9C0", borderRadius: 2}}/> Хэвийн нөөц</div>
          <div className="row" style={{gap: 6}}><span style={{width: 10, height: 10, background: "#FFEDE4", border:"1px solid #F5C8AE", borderRadius: 2}}/> Бага нөөц</div>
          <div className="row" style={{gap: 6}}><span style={{width: 10, height: 10, background: "#FBE5E5", border:"1px solid #E8A8A8", borderRadius: 2}}/> Критик</div>
          <div className="row" style={{gap: 6}}><span style={{width: 10, height: 10, background: "var(--surface-2)", border:"1px solid var(--line)", borderRadius: 2}}/> Хоосон</div>
        </div>
      </div>
    </div>
  );
}

window.Inventory = Inventory;
