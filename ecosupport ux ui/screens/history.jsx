function History() {
  const events = window.PCDATA.history_events;
  const orders = window.PCDATA.orders;
  const [sel, setSel] = React.useState("ORD-2839");
  const order = orders.find(o => o.id === sel);
  const tech = window.PCDATA.technicians.find(t => t.id === order?.tech);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Үйлчилгээний түүх</h1>
          <div className="page-sub">Бүх амжилттай дууссан үйлчилгээний бүртгэл · Барааны баталгаа · Гүйцэтгэгчдийн нотолгоо</div>
        </div>
        <div className="row gap-12">
          <button className="btn"><span style={{width:14,height:14}}>{I.download}</span>PDF тайлан</button>
          <button className="btn"><span style={{width:14,height:14}}>{I.filter}</span>Шүүх</button>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns: "320px 1fr", gap: 14}}>
        {/* Left list */}
        <div className="card" style={{height:"fit-content"}}>
          <div className="card-head">
            <span className="card-title">Дууссан үйлчилгээ</span>
            <span className="right mono muted" style={{fontSize:11}}>184 БҮРТГЭЛ</span>
          </div>
          <div style={{padding: 8, borderBottom:"1px solid var(--line)"}}>
            <div className="search-input">
              <span style={{width:14,height:14,color:"var(--muted)"}}>{I.search}</span>
              <input placeholder="ID, хаяг, тоног төхөөрөмж..." />
            </div>
          </div>
          <div style={{maxHeight: 540, overflow: "auto"}}>
            {orders.filter(o=>o.status==="Дуусгасан" || o.status==="Гүйцэтгэж байна").map(o => (
              <div key={o.id} onClick={()=>setSel(o.id)}
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--line)",
                  cursor: "pointer",
                  background: sel===o.id ? "var(--surface-2)" : "",
                  borderLeft: sel===o.id ? "3px solid var(--orange)" : "3px solid transparent",
                  paddingLeft: sel===o.id ? 11 : 14,
                }}>
                <div className="row" style={{justifyContent:"space-between", marginBottom: 2}}>
                  <span className="mono" style={{fontSize:11, color:"var(--muted)"}}>{o.id}</span>
                  <Pill tone="green" dot>{o.service}</Pill>
                </div>
                <div style={{fontSize:13, fontWeight:500}}>{o.customer}</div>
                <div className="muted" style={{fontSize:11.5, marginTop: 2}}>{o.district} · {o.created.split(" ")[0]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {order && (
          <div className="card">
            <div className="card-head" style={{padding:"14px 18px"}}>
              <div>
                <div className="row" style={{gap: 8, marginBottom: 4}}>
                  <span className="mono muted" style={{fontSize:11}}>{order.id}</span>
                  <Pill tone="green" dot>{order.status}</Pill>
                  <Pill>★ 5.0 · Хэрэглэгчийн үнэлгээ</Pill>
                </div>
                <h2 style={{margin:0, fontSize: 19, fontWeight: 600, letterSpacing:"-0.02em"}}>{order.customer}</h2>
                <div className="muted" style={{fontSize: 12.5, marginTop: 2}}>{order.district} дүүрэг · 14-р хороо · {order.service} · {order.tank}</div>
              </div>
              <div className="right row gap-12">
                <button className="btn">Гэрээ татах</button>
                <button className="btn">Нэхэмжлэх илгээх</button>
                <button className="btn primary">Дахин үйлчилгээ авах</button>
              </div>
            </div>

            <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", borderBottom:"1px solid var(--line)"}}>
              <Mt l="Үйлчилгээний огноо" v={order.created.split(" ")[0]} />
              <Mt l="Үргэлжилсэн хугацаа" v="1ц 27мин" mono />
              <Mt l="Гүйцэтгэгч" v={tech ? tech.name : "—"} />
              <Mt l="Нийт төлбөр" v={order.price.toLocaleString()+"₮"} mono accent />
            </div>

            <div style={{display:"grid", gridTemplateColumns:"1.2fr 1fr", gap: 0}}>
              {/* Timeline */}
              <div style={{padding: "16px 20px", borderRight: "1px solid var(--line)"}}>
                <div className="card-title" style={{padding:"0 0 10px"}}>ҮЙЛ ЯВЦЫН ТҮҮХ</div>
                <div className="timeline">
                  {events.map((e, i) => (
                    <div className="tl-row" key={i}>
                      <div className={`tl-dot ${e.state}`}/>
                      <div className="tl-time">{e.time} · 2026.05.09</div>
                      <div className="tl-title">{e.title}</div>
                      <div className="tl-meta">{e.meta}</div>
                    </div>
                  ))}
                </div>

                <div className="card-title" style={{padding:"16px 0 8px"}}>ХЯНАЛТЫН ХУУДАС · 8/8</div>
                <div className="col" style={{gap: 4}}>
                  {[
                    "Аюулгүй байдлын зааварчилгаа уншсан",
                    "Гүний усны төвшин шалгасан (3.2м)",
                    "Тангийн хэмжээ баталгаажсан (3 м³)",
                    "Нягтаршилтын тест хийсэн",
                    "Газардуулга суурилуулсан",
                    "Хучилт ба ландшафт сэргээсэн",
                    "Хэрэглэгчид зааварчилгаа өгсөн",
                    "Хог хаягдал цэвэрлэсэн",
                  ].map((t,i)=>(
                    <div key={i} className="row" style={{padding:"4px 0", fontSize: 12.5}}>
                      <span style={{
                        width: 14, height: 14, background:"var(--green)",
                        borderRadius: 3, color:"white", display:"grid",
                        placeItems:"center", fontSize: 9, fontWeight: 700,
                      }}>✓</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right col: photos, signature, warranty */}
              <div style={{padding: "16px 20px"}}>
                <div className="card-title" style={{padding:"0 0 10px"}}>ЗУРАГ НОТОЛГОО · 8</div>
                <div className="photo-grid">
                  {["Өмнө","Тэг","Суулгац","Холболт","Шалгалт","Хучилт","Дараа","Нэхэмжлэх"].map((p,i)=>(
                    <div key={p} className="photo">{p}</div>
                  ))}
                </div>

                <div className="card-title" style={{padding:"16px 0 10px"}}>ХЭРЭГЛЭГЧИЙН ГАРЫН ҮСЭГ</div>
                <div style={{
                  border:"1px solid var(--line)", borderRadius: 5,
                  padding: 14, background:"var(--surface-2)",
                  display:"flex", alignItems:"center", justifyContent:"space-between"
                }}>
                  <svg width="140" height="50" viewBox="0 0 140 50" fill="none" stroke="var(--ink)" strokeWidth="1.4" strokeLinecap="round">
                    <path d="M5 35 C 15 10, 25 5, 35 25 S 45 40, 55 25 C 60 18, 70 22, 78 30 C 85 36, 92 28, 100 22 L 110 30 M 80 38 L 130 38" />
                  </svg>
                  <div className="col" style={{alignItems:"flex-end", gap: 2}}>
                    <span className="mono muted" style={{fontSize:11}}>2026.05.09 · 14:32:14</span>
                    <span style={{fontSize:12.5, fontWeight:500}}>Ц. Дашням</span>
                    <Pill tone="green" dot>Баталгаажсан</Pill>
                  </div>
                </div>

                <div className="card-title" style={{padding:"16px 0 10px"}}>БАТАЛГААТ ХУГАЦАА</div>
                <div style={{
                  border:"1px solid var(--line)", borderRadius: 5,
                  padding: 14,
                  display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12,
                }}>
                  <div>
                    <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em"}}>Эхлэл</div>
                    <div style={{fontFamily:"var(--font-mono)", fontSize:14, fontWeight:500}}>2026.05.09</div>
                  </div>
                  <div>
                    <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em"}}>Дуусах</div>
                    <div style={{fontFamily:"var(--font-mono)", fontSize:14, fontWeight:500}}>2031.05.08</div>
                  </div>
                  <div style={{gridColumn:"span 2"}}>
                    <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom: 4}}>5 жил баталгаа</div>
                    <div style={{height: 6, background:"var(--surface-2)", borderRadius: 3, overflow:"hidden"}}>
                      <div style={{width:"2%", height:"100%", background:"var(--green)"}}/>
                    </div>
                    <div className="muted mono" style={{fontSize:11, marginTop: 4}}>1,825 хоног үлдсэн · 0.1% ашигласан</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Mt({ l, v, mono, accent }) {
  return (
    <div style={{padding: "12px 18px", borderRight: "1px solid var(--line)"}}>
      <div className="mono" style={{fontSize: 10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em"}}>{l}</div>
      <div style={{
        marginTop: 4,
        fontFamily: mono ? "var(--font-mono)" : "inherit",
        fontSize: 16, fontWeight: 600,
        color: accent ? "var(--orange)" : "var(--ink)",
        letterSpacing: "-0.01em",
      }}>{v}</div>
    </div>
  );
}

window.History = History;
