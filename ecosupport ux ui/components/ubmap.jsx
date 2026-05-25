// Stylized map of Ulaanbaatar — abstract district polygons + roads
function UBMap({ technicians = [], orders = [], compact = false, selectedTech, onSelectTech }) {
  // Coordinate space: 0..1000 wide, 0..600 tall
  // Tuul river runs roughly horizontally across the south
  const districts = [
    { id: "BZD", name: "Баянзүрх",        d: "M 580 140 L 920 120 L 980 320 L 720 380 L 560 320 Z", c: "#EEEAE0" },
    { id: "SBD", name: "Сүхбаатар",       d: "M 420 100 L 580 140 L 560 320 L 470 280 L 380 220 Z", c: "#E9E5DA" },
    { id: "CHD", name: "Чингэлтэй",       d: "M 380 220 L 470 280 L 460 360 L 350 380 L 280 280 Z", c: "#EEEAE0" },
    { id: "BGD", name: "Баянгол",         d: "M 220 180 L 380 220 L 280 280 L 200 320 L 130 240 Z", c: "#E9E5DA" },
    { id: "SHD", name: "Сонгинохайрхан",  d: "M 60 100 L 220 180 L 130 240 L 80 360 L 20 300 Z",     c: "#EEEAE0" },
    { id: "HUD", name: "Хан-Уул",         d: "M 200 320 L 460 360 L 720 380 L 760 520 L 280 560 L 120 460 Z", c: "#E5E1D5" },
  ];

  // Roads
  const roads = [
    "M 0 240 L 200 220 L 400 240 L 620 220 L 880 240 L 1000 230",        // Peace Ave (Энхтайвны өргөн чөлөө)
    "M 460 60 L 470 280 L 480 460 L 500 580",                              // Чингисийн өргөн чөлөө
    "M 100 80 L 280 280 L 460 360 L 720 380 L 920 320",                   // Ring road
    "M 0 460 L 280 480 L 580 470 L 880 480 L 1000 470",                   // Tuul south
    "M 220 180 L 580 140 L 880 200",
  ];

  // Tuul river
  const river = "M 0 510 C 200 500, 360 540, 500 510 S 800 480, 1000 510 L 1000 540 C 800 530, 600 580, 400 540 S 200 540, 0 560 Z";

  // Pin positions (translate lat/lng to canvas)
  const project = (lat, lng) => {
    // UB rough bounds: lat 47.85..47.96, lng 106.78..107.00
    const x = ((lng - 106.78) / (107.00 - 106.78)) * 1000;
    const y = ((47.96 - lat) / (47.96 - 47.85)) * 600;
    return [x, y];
  };

  return (
    <div className="map-pane" style={{ position:"absolute", inset: 0 }}>
      <svg className="map-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E0DCD0" strokeWidth="0.5"/>
          </pattern>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#D8D3C5" strokeWidth="1"/>
          </pattern>
        </defs>

        <rect width="1000" height="600" fill="#EFEDE6"/>
        <rect width="1000" height="600" fill="url(#grid)"/>

        {/* mountains pattern (north) */}
        <path d="M 0 0 L 1000 0 L 1000 100 L 800 90 L 600 110 L 400 80 L 200 105 L 0 95 Z" fill="url(#hatch)" opacity="0.5"/>

        {/* districts */}
        {districts.map(d => (
          <g key={d.id}>
            <path d={d.d} fill={d.c} stroke="#C8C3B3" strokeWidth="1"/>
            <text x={pathCenter(d.d).x} y={pathCenter(d.d).y}
                  fontFamily="Geist Mono, monospace" fontSize="11"
                  textAnchor="middle" fill="#7E7B71" letterSpacing="0.5">
              {d.name.toUpperCase()}
            </text>
          </g>
        ))}

        {/* river */}
        <path d={river} fill="#D6E2E8" stroke="#B7C7CE" strokeWidth="1"/>
        <text x="780" y="555" fontFamily="Geist Mono, monospace" fontSize="9"
              fill="#7B8D94" fontStyle="italic">Туул гол</text>

        {/* roads */}
        {roads.map((r, i) => (
          <path key={i} d={r} stroke="#FFF" strokeWidth={i<2?"6":"4"} fill="none" strokeLinecap="round"/>
        ))}
        {roads.map((r, i) => (
          <path key={"o"+i} d={r} stroke="#BFB9A9" strokeWidth={i<2?"1.2":"0.8"} fill="none" strokeDasharray={i<2?"":"4 3"} strokeLinecap="round"/>
        ))}

        {/* center marker */}
        <g transform="translate(500, 290)">
          <rect x="-22" y="-8" width="44" height="16" fill="#111315" rx="2"/>
          <text x="0" y="3" fontFamily="Geist Mono, monospace" fontSize="9" fill="white" textAnchor="middle" letterSpacing="1">СҮХБААТАР Т.</text>
        </g>

        {/* zone rings */}
        <circle cx="500" cy="290" r="170" fill="none" stroke="#C8C3B3" strokeWidth="0.8" strokeDasharray="3 4"/>
        <circle cx="500" cy="290" r="320" fill="none" stroke="#C8C3B3" strokeWidth="0.8" strokeDasharray="3 4"/>
      </svg>

      {/* Pins */}
      {technicians.map(t => {
        const [x,y] = project(t.lat, t.lng);
        const tone = t.status === "busy" ? "orange" : t.status === "idle" ? "green" : "gray";
        const initials = (t.name.split(" ")[1]?.[0] || "") + (t.name.split(" ")[2]?.[0] || "");
        const sel = selectedTech === t.id;
        return (
          <div
            key={t.id}
            className={`pin ${tone}`}
            style={{
              left: `${x/10}%`, top: `${y/6}%`,
              zIndex: sel ? 10 : 1,
              transform: `translate(-50%, -100%) ${sel ? "scale(1.06)" : ""}`,
            }}
            onClick={() => onSelectTech?.(t.id)}
          >
            <div className="pin-bubble" style={sel ? { borderColor: "var(--ink)", boxShadow: "0 0 0 2px var(--orange)" } : null}>
              <span className="pico">{initials}</span>
              <span>{t.id}</span>
              {t.job && <span style={{color:"var(--muted)"}}>· {t.job}</span>}
            </div>
            <span className="stem"/>
          </div>
        );
      })}

      {/* Order pins (waiting) */}
      {orders.map(o => {
        // Distribute waiting orders deterministically across the map by id
        const seed = parseInt(o.id.split("-")[1]) % 100;
        const x = 200 + (seed * 7.3) % 600;
        const y = 180 + (seed * 4.1) % 280;
        return (
          <div key={o.id} className="pin red"
            style={{ left: `${x/10}%`, top: `${y/6}%` }}>
            <div className="pin-bubble" style={{borderColor:"var(--red)"}}>
              <span className="pico" style={{background:"var(--red)"}}>!</span>
              <span>{o.id}</span>
            </div>
            <span className="stem" style={{background:"var(--red)"}}/>
          </div>
        );
      })}

      {/* Toolbar */}
      <div className="map-overlay map-toolbar">
        <button className="icon-btn" title="Томруулах">{I.zoomIn}</button>
        <button className="icon-btn" title="Багасгах">{I.zoomOut}</button>
        <button className="icon-btn" title="Байршил">{I.locate}</button>
        <button className="icon-btn" title="Давхарга">{I.layers}</button>
      </div>

      {/* Stats */}
      {!compact && (
        <div className="map-overlay map-stats">
          <div className="map-stat"><span className="l">Онлайн</span><span className="v">{technicians.filter(t=>t.status!=="off").length}</span></div>
          <div className="map-stat"><span className="l">Сул</span><span className="v" style={{color:"var(--green)"}}>{technicians.filter(t=>t.status==="idle").length}</span></div>
          <div className="map-stat"><span className="l">Ажил дээр</span><span className="v" style={{color:"var(--orange)"}}>{technicians.filter(t=>t.status==="busy").length}</span></div>
        </div>
      )}

      {/* Legend */}
      <div className="map-overlay map-legend">
        <h5>Тэмдэглэгээ</h5>
        <div className="legend-row"><span className="legend-pin" style={{background:"var(--orange)"}}/> Ажил гүйцэтгэж байгаа</div>
        <div className="legend-row"><span className="legend-pin" style={{background:"var(--green)"}}/> Сул байгаа</div>
        <div className="legend-row"><span className="legend-pin" style={{background:"var(--red)"}}/> Хуваарилагдаагүй захиалга</div>
        <div className="legend-row"><span className="legend-pin" style={{background:"var(--muted)"}}/> Ээлжээс гарсан</div>
      </div>
    </div>
  );
}

// rough centroid finder for our hand-built paths
function pathCenter(d) {
  const nums = d.match(/-?\d+(\.\d+)?/g).map(Number);
  let xs = [], ys = [];
  for (let i = 0; i < nums.length; i += 2) { xs.push(nums[i]); ys.push(nums[i+1]); }
  return {
    x: xs.reduce((a,b)=>a+b,0) / xs.length,
    y: ys.reduce((a,b)=>a+b,0) / ys.length,
  };
}

window.UBMap = UBMap;
