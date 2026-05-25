function Orders() {
  const orders = window.PCDATA.orders;
  const techs = window.PCDATA.technicians;
  const [filter, setFilter] = React.useState("Бүгд");
  const [sel, setSel] = React.useState("ORD-2843");
  const filters = ["Бүгд", "Хүлээгдэж буй", "Хуваарилагдсан", "Зам дээр", "Гүйцэтгэж байна", "Дуусгасан"];

  const counts = { "Бүгд": orders.length };
  filters.slice(1).forEach(f => counts[f] = orders.filter(o => o.status === f).length);

  const list = filter === "Бүгд" ? orders : orders.filter(o => o.status === filter);
  const selOrder = orders.find(o => o.id === sel);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Захиалга удирдлага</h1>
          <div className="page-sub">Нийт {orders.length} захиалга · Сүүлийн 7 хоног · Шүүлтүүр идэвхтэй: 0</div>
        </div>
        <div className="row gap-12">
          <button className="btn"><span style={{width:14,height:14}}>{I.download}</span>CSV экспорт</button>
          <button className="btn"><span style={{width:14,height:14}}>{I.filter}</span>Шүүлтүүр</button>
          <button className="btn accent"><span style={{width:14,height:14}}>{I.plus}</span>Захиалга үүсгэх</button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="card" style={{marginBottom: 14}}>
        <div style={{padding:"10px 12px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
          {filters.map(f => (
            <span key={f} className={`chip ${f===filter?"on":""}`} onClick={()=>setFilter(f)}>
              {f} <span className="mono" style={{fontSize:10, opacity: 0.7}}>{counts[f]}</span>
            </span>
          ))}
          <div className="divider-v"/>
          <span className="chip">Дүүрэг: Бүгд</span>
          <span className="chip">Үйлчилгээ: Бүгд</span>
          <span className="chip">Огноо: 7 хоног</span>
          <div className="search-input" style={{marginLeft:"auto", maxWidth: 280}}>
            <span style={{width:14,height:14,color:"var(--muted)"}}>{I.search}</span>
            <input placeholder="ID, утас, хаяг, гэрээний дугаар..." />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px" }}>
          <div style={{ borderRight: "1px solid var(--line)", overflow: "auto", minWidth: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width:30}}><input type="checkbox"/></th>
                  <th>ID</th>
                  <th>Хэрэглэгч / Хаяг</th>
                  <th>Үйлчилгээ</th>
                  <th>Гүйцэтгэгч</th>
                  <th>Төлөв</th>
                  <th className="num">ETA</th>
                  <th className="num" style={{textAlign:"right"}}>Дүн</th>
                  <th style={{width:30}}></th>
                </tr>
              </thead>
              <tbody>
                {list.map(o => {
                  const tech = techs.find(t => t.id === o.tech);
                  return (
                    <tr key={o.id} onClick={()=>setSel(o.id)} style={{cursor:"pointer", background: o.id===sel ? "var(--surface-2)":""}}>
                      <td onClick={(e)=>e.stopPropagation()}><input type="checkbox"/></td>
                      <td className="id">{o.id}</td>
                      <td>
                        <div style={{fontWeight:500}}>{o.customer}</div>
                        <div className="muted" style={{fontSize:11}}>{o.district} дүүрэг</div>
                      </td>
                      <td>
                        <div>{o.service}</div>
                        <div className="mono muted" style={{fontSize:11}}>{o.tank}</div>
                      </td>
                      <td>{tech ? <span className="mono" style={{fontSize:11.5}}>{tech.id} · {tech.name.split(" ").slice(-1)[0]}</span> : <span className="muted">—</span>}</td>
                      <td><StatusPill status={o.status} priority={o.priority}/></td>
                      <td className="num muted">{o.eta}</td>
                      <td className="num" style={{textAlign:"right", fontWeight:500, whiteSpace:"nowrap"}}>{o.price.toLocaleString()}₮</td>
                      <td><button className="icon-btn" style={{width:24,height:24,border:0}}>{I.more}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detail rail */}
          {selOrder && <OrderDetail order={selOrder}/>}
        </div>
      </div>
    </div>
  );
}

function OrderDetail({ order }) {
  const tech = window.PCDATA.technicians.find(t => t.id === order.tech);
  return (
    <div style={{ padding: 14, overflow:"auto", maxHeight: "calc(100vh - 220px)" }}>
      <div className="row" style={{justifyContent:"space-between", marginBottom: 10}}>
        <span className="mono muted" style={{fontSize:11}}>{order.id}</span>
        <Pill tone="orange">⚡ {order.priority}</Pill>
      </div>
      <h3 style={{margin:"0 0 4px", fontSize: 17, fontWeight:600, letterSpacing:"-0.01em"}}>{order.customer}</h3>
      <div className="muted" style={{fontSize:12, marginBottom: 14}}>{order.district} дүүрэг · 14-р хороо · 24 байр</div>

      <div className="row" style={{gap:6, marginBottom:14}}>
        <button className="btn sm primary" style={{flex:1}}>Хуваарилах</button>
        <button className="btn sm" style={{flex:1}}>Засах</button>
        <button className="btn sm">{I.more}</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8, marginBottom: 14 }}>
        <Stat label="Үйлчилгээ" value={order.service} />
        <Stat label="Тангийн хэмжээ" value={order.tank} mono />
        <Stat label="Зайны үнэ" value="32,400₮" mono />
        <Stat label="Бүс" value="Гадна дүүрэг" />
      </div>

      <div className="card-title" style={{padding:"0 0 6px"}}>ҮНИЙН ЗАДАРГАА</div>
      <table className="matrix" style={{marginBottom: 14}}>
        <tbody>
          <tr><td>Үндсэн үнэ</td><td>240,000</td></tr>
          <tr><td>Зайн нэмэгдэл (12 км)</td><td>30,000</td></tr>
          <tr><td>Яаралтай 50%</td><td>+135,000</td></tr>
          <tr><td>НӨАТ 10%</td><td>40,500</td></tr>
          <tr style={{borderTop:"1px solid var(--ink)"}}><td style={{fontWeight:600}}>Нийт</td><td style={{fontWeight:600, color:"var(--ink)"}}>{order.price.toLocaleString()}₮</td></tr>
        </tbody>
      </table>

      <div className="card-title" style={{padding:"0 0 6px"}}>ХОЛБОГДОХ</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8, marginBottom: 14 }}>
        <Stat label="Утас" value="+976 9911 4280" mono />
        <Stat label="И-мэйл" value="info@altbulag.mn" />
      </div>

      <div className="card-title" style={{padding:"0 0 6px"}}>ТЭМДЭГЛЭЛ</div>
      <div style={{
        background:"var(--amber-soft)", color:"var(--amber)",
        border:"1px solid transparent", borderRadius: 5,
        padding:"8px 10px", fontSize: 12.5, marginBottom: 14
      }}>
        ⚠ Гэрийн нохой байгаа. Эзэн 12:00 цагт байх боломжтой.
      </div>

      {tech && (
        <>
          <div className="card-title" style={{padding:"0 0 6px"}}>ХУВААРИЛАГДСАН</div>
          <div style={{display:"flex", gap:10, alignItems:"center", padding:"8px 10px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius: 5}}>
            <div className="avatar" style={{background:"#E8E6DD",color:"var(--ink)"}}>
              {tech.name.split(" ")[1]?.[0]}{tech.name.split(" ")[2]?.[0]||""}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12.5, fontWeight:500}}>{tech.name}</div>
              <div className="mono muted" style={{fontSize:11}}>{tech.id} · {tech.vehicle}</div>
            </div>
            <button className="btn sm">Дуудлага</button>
          </div>
        </>
      )}
    </div>
  );
}

window.Orders = Orders;
