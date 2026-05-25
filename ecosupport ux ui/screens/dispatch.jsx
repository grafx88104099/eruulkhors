function Dispatch() {
  const [selectedTech, setSelectedTech] = React.useState("TX-014");
  const orders = window.PCDATA.orders;
  const techs = window.PCDATA.technicians;
  const waiting = orders.filter(o => o.status === "Хүлээгдэж буй" || o.status === "Хуваарилагдсан");
  const tech = techs.find(t => t.id === selectedTech);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0, 1fr) 340px", height: "calc(100vh - 52px)", overflow: "hidden", width: "100%" }}>
      {/* Left rail — queue */}
      <aside className="rail" style={{ borderLeft: 0, borderRight: "1px solid var(--line)", minWidth: 0 }}>
        <div className="rail-head">
          <div className="row" style={{justifyContent:"space-between", marginBottom:8}}>
            <div className="card-title">Дамжуулалтын дараалал</div>
            <Pill tone="orange" dot>{waiting.length}</Pill>
          </div>
          <div className="row" style={{gap:4}}>
            <span className="chip on">Бүгд</span>
            <span className="chip">Яаралтай</span>
            <span className="chip">SLA</span>
            <span className="chip">Дүүргээр</span>
          </div>
          <div className="search-input" style={{marginTop:8}}>
            <span style={{width:14,height:14,color:"var(--muted)"}}>{I.search}</span>
            <input placeholder="ID, хэрэглэгч, хаяг хайх..." />
          </div>
        </div>
        <div className="rail-body">
          <div className="card-title" style={{padding:"4px 4px 8px"}}>ЯАРАЛТАЙ · 2</div>
          {waiting.filter(o=>o.priority==="Яаралтай").map(o => <JobCard key={o.id} order={o} />)}
          <div className="card-title" style={{padding:"12px 4px 8px"}}>ХЭВИЙН · {waiting.filter(o=>o.priority!=="Яаралтай").length}</div>
          {waiting.filter(o=>o.priority!=="Яаралтай").map(o => <JobCard key={o.id} order={o} />)}
        </div>
      </aside>

      {/* Center — map */}
      <section style={{ position: "relative", padding: 14, background: "var(--paper)", minWidth: 0, overflow: "hidden" }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <h2 style={{margin:0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em"}}>Ачилт удирдлага</h2>
          <Pill tone="green" dot>СҮЛЖЭЭ ИДЭВХТЭЙ</Pill>
          <span className="mono muted" style={{fontSize:11}}>· Газрын зургийн өгөгдөл шинэчлэгдэв 14:42:08</span>
          <div className="right row gap-12">
            <div className="row" style={{gap:4}}>
              <span className="chip on">Газрын зураг</span>
              <span className="chip">Зам</span>
              <span className="chip">Тооцоо</span>
            </div>
            <button className="btn">Чиглэл оптимизаци</button>
            <button className="btn primary">Auto-Assign</button>
          </div>
        </div>
        <div style={{ position: "relative", height: "calc(100% - 50px)" }}>
          <UBMap
            technicians={techs}
            orders={waiting.filter(o=>!o.tech)}
            selectedTech={selectedTech}
            onSelectTech={setSelectedTech}
          />
        </div>
      </section>

      {/* Right rail — tech detail + assignment */}
      <aside className="rail">
        {tech && <TechPanel tech={tech} orders={orders} />}
      </aside>
    </div>
  );
}

function JobCard({ order }) {
  const techs = window.PCDATA.technicians;
  const tech = techs.find(t => t.id === order.tech);
  return (
    <div className={`job-card ${order.priority==="Яаралтай"?"priority":""} ${order.tech?"assigned":""}`}>
      <div className="job-card-head">
        <span className="job-id">{order.id}</span>
        <Pill tone={order.priority==="Яаралтай"?"orange":""} dot={order.priority==="Яаралтай"}>{order.service}</Pill>
        <span className="right mono" style={{fontSize:11, color: order.eta!=="—"?"var(--orange)":"var(--muted)"}}>ETA {order.eta}</span>
      </div>
      <div className="job-title">{order.customer}</div>
      <div className="job-meta">
        <span>{order.district}</span>
        <span>· {order.tank}</span>
        <span>· {order.price.toLocaleString()}₮</span>
      </div>
      <div className="row" style={{marginTop:8, gap:6}}>
        {tech ? (
          <Pill tone="blue">→ {tech.name}</Pill>
        ) : (
          <button className="btn sm primary">Хуваарилах</button>
        )}
        <button className="btn sm ghost" style={{marginLeft:"auto"}}>Дэлгэрэнгүй →</button>
      </div>
    </div>
  );
}

function TechPanel({ tech, orders }) {
  const myJob = orders.find(o => o.id === tech.job);
  return (
    <>
      <div className="rail-head">
        <div className="row" style={{justifyContent:"space-between"}}>
          <div className="card-title">Гүйцэтгэгчийн мэдээлэл</div>
          <button className="icon-btn" style={{width:24,height:24}}>{I.more}</button>
        </div>
        <div style={{ display:"flex", gap: 12, marginTop: 12 }}>
          <div className="avatar" style={{width:48, height:48, fontSize:14, background:"#E8E6DD", color:"var(--ink)", borderRadius: 8}}>
            {tech.name.split(" ")[1]?.[0]}{tech.name.split(" ")[2]?.[0]||""}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:15, fontWeight:600, letterSpacing:"-0.01em"}}>{tech.name}</div>
            <div className="mono muted" style={{fontSize:11.5}}>{tech.id} · {tech.role}</div>
            <div className="row" style={{gap:6, marginTop:6}}>
              <Pill tone={tech.status==="busy"?"orange":tech.status==="idle"?"green":"ghost"} dot>
                {tech.status==="busy"?"Ажил дээр":tech.status==="idle"?"Сул":"Ээлжээс гарсан"}
              </Pill>
              <Pill>★ 4.92</Pill>
            </div>
          </div>
        </div>
      </div>

      <div className="rail-body">
        <div className="card-title" style={{padding:"0 0 8px"}}>МАШИН & БАЙРШИЛ</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10, marginBottom: 14 }}>
          <Stat label="Машины №" value={tech.vehicle} />
          <Stat label="Сүүлд харсан" value="1 мин" />
          <Stat label="Хурд" value="32 км/ц" mono />
          <Stat label="Зайны зөрүү" value="2.4 км" mono />
        </div>

        {myJob && (
          <>
            <div className="card-title" style={{padding:"0 0 8px"}}>ОДОО ХИЙГДЭЖ БУЙ</div>
            <div className="job-card priority" style={{marginBottom:14}}>
              <div className="job-card-head">
                <span className="job-id">{myJob.id}</span>
                <Pill tone="blue" dot>{myJob.status}</Pill>
                <span className="right mono" style={{fontSize:11}}>{myJob.tank}</span>
              </div>
              <div className="job-title">{myJob.customer}</div>
              <div className="job-meta">{myJob.district} · {myJob.service}</div>
              <div style={{ marginTop: 10, display:"grid", gridTemplateColumns: "1fr 1fr 1fr", gap:6, fontFamily:"var(--font-mono)", fontSize: 10.5}}>
                <Step done label="Зам" t="12:40"/>
                <Step done label="Эхэлсэн" t="13:05"/>
                <Step now  label="Гүйцэтгэл" t="—"/>
              </div>
            </div>
          </>
        )}

        <div className="card-title" style={{padding:"0 0 8px"}}>ӨНӨӨДРИЙН ХУВААРЬ · 5</div>
        {[
          { t: "08:30", c: "Ц. Дашням",        s: "Суулгалт", st: "done" },
          { t: "12:00", c: "Алтанбулаг ХХК",  s: "Соруулга", st: "now" },
          { t: "14:30", c: "Б. Цэцэгмаа",     s: "Соруулга", st: "next" },
          { t: "16:00", c: "Хүлэг Констракшн", s: "Үзлэг",    st: "next" },
          { t: "18:00", c: "Г. Оргил",          s: "Засвар",   st: "next" },
        ].map((s,i)=>(
          <div key={i} className="row" style={{padding: "8px 0", borderBottom: "1px solid var(--line)"}}>
            <span className="mono" style={{width:46, fontSize:11.5, color:"var(--muted)"}}>{s.t}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12.5, fontWeight: 500}}>{s.c}</div>
              <div className="muted" style={{fontSize:11}}>{s.s}</div>
            </div>
            <Pill tone={s.st==="done"?"green":s.st==="now"?"orange":""} dot={s.st!=="next"}>
              {s.st==="done"?"Дуусгасан":s.st==="now"?"Идэвхтэй":"Хүлээгдэж буй"}
            </Pill>
          </div>
        ))}

        <div className="row" style={{marginTop:14, gap:8}}>
          <button className="btn" style={{flex:1}}>Дуудлага</button>
          <button className="btn" style={{flex:1}}>Чат</button>
          <button className="btn primary" style={{flex:1}}>Захиалга оноох</button>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, mono }) {
  return (
    <div style={{ background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius: 5, padding: "8px 10px" }}>
      <div className="mono" style={{fontSize: 10, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--muted)"}}>{label}</div>
      <div style={{ fontFamily: mono ? "var(--font-mono)" : "inherit", fontSize: 13, fontWeight: 500, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Step({ done, now, label, t }) {
  return (
    <div style={{
      padding: "6px 8px",
      background: done ? "var(--green-soft)" : now ? "var(--orange-soft)" : "var(--surface-2)",
      color: done ? "var(--green)" : now ? "var(--orange)" : "var(--muted)",
      border: "1px solid " + (done ? "transparent" : now ? "transparent" : "var(--line)"),
      borderRadius: 4,
      textAlign:"center",
    }}>
      <div style={{textTransform:"uppercase", letterSpacing:"0.06em"}}>{label}</div>
      <div style={{fontWeight:600, marginTop:2}}>{t}</div>
    </div>
  );
}

window.Dispatch = Dispatch;
