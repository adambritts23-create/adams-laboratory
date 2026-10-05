import React from "react";

const pKa1 = 6.35;
const pKa2 = 10.33;

function carbonateFractions(pH) {
  const H = Math.pow(10, -pH);
  const Ka1 = Math.pow(10, -pKa1);
  const Ka2 = Math.pow(10, -pKa2);
  const denom = H * H + Ka1 * H + Ka1 * Ka2;
  return {
    co2: (H * H) / denom,
    hco3: (Ka1 * H) / denom,
    co3: (Ka1 * Ka2) / denom,
  };
}

function uraniumModel(pH, totalU, totalCarbonate, ammonia, temp) {
  const cf = carbonateFractions(pH);
  const co3 = Math.max(1e-12, totalCarbonate * cf.co3);
  const oh = Math.pow(10, pH - 14);

  // Simplified conditional stability model for demonstration only.
  const betaC1 = Math.pow(10, 9.7);
  const betaC2 = Math.pow(10, 16.9);
  const betaC3 = Math.pow(10, 21.6);
  const betaOH1 = Math.pow(10, 5.2);
  const betaOH2 = Math.pow(10, 10.3);

  const weights = {
    uranyl: 1,
    monoCarbonate: betaC1 * co3,
    diCarbonate: betaC2 * co3 * co3,
    triCarbonate: betaC3 * co3 * co3 * co3,
    hydroxo1: betaOH1 * oh,
    hydroxo2: betaOH2 * oh * oh,
  };

  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  const frac = Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, v / sum])
  );

  const dissolvedU = totalU;
  const carbonateProtection = frac.diCarbonate + frac.triCarbonate;

  const aucWindow = Math.exp(-Math.pow((pH - 8.2) / 1.25, 2));
  const tempBonus = 1 + (temp - 60) / 180;
  const aucFavorability = clamp(
    100 * aucWindow * Math.min(1.4, totalCarbonate / 1.8) * tempBonus,
    0,
    100
  );

  const aduRisk = clamp(
    100 * sigmoid((pH - 6.3) * 1.8) * (1 - clamp(carbonateProtection, 0, 0.95)) * (0.5 + ammonia / 3),
    0,
    100
  );

  const carbonateLossRisk = clamp(100 * (cf.co2 + 0.5 * cf.hco3) * sigmoid((5.8 - pH) * 1.3), 0, 100);

  const ionicStrength = Math.max(
    0.01,
    0.5 * (
      ammonia * 1 +
      totalCarbonate * (cf.hco3 * 1 + cf.co3 * 4) +
      (totalU / 238) * 0.001 * 4
    )
  );

  return { frac, cf, aucFavorability, aduRisk, carbonateLossRisk, ionicStrength, dissolvedU };
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export default function AdamsLaboratoryMVP() {
  const [pH, setPH] = React.useState(8.2);
  const [temp, setTemp] = React.useState(60);
  const [uranium, setUranium] = React.useState(120);
  const [carbonate, setCarbonate] = React.useState(2.5);
  const [ammonia, setAmmonia] = React.useState(1.0);

  const state = uraniumModel(pH, uranium, carbonate, ammonia, temp);
  const auc = state.aucFavorability;
  const adu = state.aduRisk;
  const co2 = state.carbonateLossRisk;

  const dominant = Object.entries(state.frac).sort((a, b) => b[1] - a[1])[0][0];

  const aiExplanation = makeExplanation(pH, auc, adu, co2, dominant);

  const chartData = Array.from({ length: 57 }, (_, i) => {
    const x = 1 + (i * 13) / 56;
    return { pH: x, ...uraniumModel(x, uranium, carbonate, ammonia, temp).frac };
  });

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Adam Britts Laboratory</h1>
          <p style={styles.subtitle}>Uranium carbonate speciation · AUC/ADU precipitation MVP</p>
        </div>
        <div style={styles.badge}>Live local simulation</div>
      </header>

      <main style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Process Inputs</h2>
          <Slider label="pH" value={pH} min={1} max={14} step={0.1} onChange={setPH} />
          <Slider label="Temperature °C" value={temp} min={20} max={90} step={1} onChange={setTemp} />
          <Slider label="Uranium g/L" value={uranium} min={10} max={300} step={5} onChange={setUranium} />
          <Slider label="Total carbonate mol/L" value={carbonate} min={0.01} max={5} step={0.05} onChange={setCarbonate} />
          <Slider label="Ammonia mol/L" value={ammonia} min={0} max={4} step={0.05} onChange={setAmmonia} />

          <div style={styles.resultBox}>
            <SmallLabel>Auto ionic strength</SmallLabel>
            <div style={styles.bigNumber}>{state.ionicStrength.toFixed(2)} mol/L</div>
          </div>
        </section>

        <section style={styles.cardCenter}>
          <h2 style={styles.cardTitle}>Reaction Vessel</h2>
          <Beaker auc={auc} adu={adu} pH={pH} />
          <div style={styles.metricsGrid}>
            <Metric label="AUC favorability" value={`${auc.toFixed(0)}%`} color="#86efac" />
            <Metric label="ADU risk" value={`${adu.toFixed(0)}%`} color="#fdba74" />
            <Metric label="CO₂ loss risk" value={`${co2.toFixed(0)}%`} color="#fca5a5" />
            <Metric label="Dominant dissolved U" value={prettySpecies(dominant)} color="#67e8f9" />
          </div>
        </section>

        <section style={styles.sideColumn}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>AI Process Interpretation</h2>
            <div style={styles.aiBox}>{aiExplanation}</div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Uranium Species Fractions</h2>
            <FractionPlot data={chartData} currentPH={pH} />
            <Legend />
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        Demonstration model only — the next version should replace these simplified equations with a validated thermodynamic database.
      </footer>
    </div>
  );
}

function makeExplanation(pH, auc, adu, co2, dominant) {
  if (co2 > 65) {
    return "The solution is too acidic for efficient carbonate use. Much of the carbonate inventory would be tied up as carbonic acid/CO₂, so carbonate loss risk is high before AUC precipitation becomes favorable.";
  }
  if (auc > 70 && adu < 45) {
    return "This is close to the desired AUC precipitation window. Carbonate is high enough to stabilize uranyl carbonate chemistry while the pH is in the mildly alkaline region.";
  }
  if (adu > 65) {
    return "ADU-type precipitation risk is high. The model interprets this as uranyl hydrolysis becoming competitive, especially if ammonia raises pH faster than carbonate can complex uranium.";
  }
  if (dominant === "triCarbonate" || dominant === "diCarbonate") {
    return "Dissolved uranyl carbonate complexes dominate. Uranium may remain soluble unless supersaturation toward AUC is reached.";
  }
  if (pH < 6) {
    return "The system is still acidic. Free uranyl is more important and carbonate is not yet efficiently available as CO₃²⁻.";
  }
  return "The system is in a mixed transition region. Small changes in pH, carbonate, temperature, or addition order could shift it toward AUC precipitation or ADU-type hydrolysis.";
}

function prettySpecies(key) {
  const names = {
    uranyl: "UO₂²⁺",
    monoCarbonate: "UO₂CO₃",
    diCarbonate: "UO₂(CO₃)₂²⁻",
    triCarbonate: "UO₂(CO₃)₃⁴⁻",
    hydroxo1: "UO₂OH⁺",
    hydroxo2: "UO₂(OH)₂",
  };
  return names[key] || key;
}

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={styles.sliderLabel}>
        <span>{label}</span>
        <span style={{ color: "#86efac", fontWeight: 700 }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

function Beaker({ auc, adu, pH }) {
  const liquid = adu > 65 ? ["#f97316", "#facc15"] : auc > 65 ? ["#4ade80", "#bef264"] : ["#a3e635", "#fde68a"];
  return (
    <div style={styles.beakerWrap}>
      <div style={styles.beakerGlass}>
        <div
          style={{
            ...styles.liquid,
            height: `${clamp(45 + pH * 3, 45, 88)}%`,
            background: `linear-gradient(to top, ${liquid[0]}, ${liquid[1]})`,
          }}
        />
        {auc > 60 && <div style={styles.precipitate} />}
        {adu > 60 && <div style={{ ...styles.precipitate, background: "#fb923c", height: 50 }} />}
        <div style={styles.glow} />
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={styles.metric}>
      <SmallLabel>{label}</SmallLabel>
      <div style={{ color, fontSize: 24, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function SmallLabel({ children }) {
  return <div style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 5 }}>{children}</div>;
}

function FractionPlot({ data, currentPH }) {
  const species = [
    ["uranyl", "#facc15"],
    ["diCarbonate", "#22c55e"],
    ["triCarbonate", "#06b6d4"],
    ["hydroxo1", "#a78bfa"],
    ["hydroxo2", "#fb7185"],
  ];

  const w = 420;
  const h = 250;
  const pad = 32;

  function xScale(pH) {
    return pad + ((pH - 1) / 13) * (w - 2 * pad);
  }
  function yScale(v) {
    return h - pad - v * (h - 2 * pad);
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={styles.svg}>
      <rect x="0" y="0" width={w} height={h} fill="#09090b" rx="14" />
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#52525b" />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#52525b" />
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line x1={pad} x2={w - pad} y1={yScale(v)} y2={yScale(v)} stroke="#27272a" />
          <text x={6} y={yScale(v) + 4} fill="#a1a1aa" fontSize="11">{v}</text>
        </g>
      ))}
      {[1, 4, 7, 10, 14].map((v) => (
        <text key={v} x={xScale(v) - 6} y={h - 9} fill="#a1a1aa" fontSize="11">{v}</text>
      ))}
      {species.map(([key, color]) => (
        <polyline
          key={key}
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={data.map((d) => `${xScale(d.pH)},${yScale(d[key])}`).join(" ")}
        />
      ))}
      <line x1={xScale(currentPH)} x2={xScale(currentPH)} y1={pad} y2={h - pad} stroke="#e4e4e7" strokeDasharray="5 5" />
      <text x={w / 2 - 10} y={h - 8} fill="#d4d4d8" fontSize="12">pH</text>
      <text x={5} y={20} fill="#d4d4d8" fontSize="12">fraction</text>
    </svg>
  );
}

function Legend() {
  const items = [
    ["UO₂²⁺", "#facc15"],
    ["UO₂(CO₃)₂²⁻", "#22c55e"],
    ["UO₂(CO₃)₃⁴⁻", "#06b6d4"],
    ["UO₂OH⁺", "#a78bfa"],
    ["UO₂(OH)₂", "#fb7185"],
  ];
  return (
    <div style={styles.legend}>
      {items.map(([name, color]) => (
        <div key={name} style={styles.legendItem}>
          <span style={{ ...styles.swatch, background: color }} /> {name}
        </div>
      ))}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#09090b", color: "white", padding: 30, fontFamily: "Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title: { color: "#86efac", fontSize: 44, margin: 0, letterSpacing: -1 },
  subtitle: { color: "#a1a1aa", marginTop: 8 },
  badge: { background: "#052e16", color: "#bbf7d0", border: "1px solid #166534", padding: "12px 16px", borderRadius: 999, fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1.1fr 1.4fr", gap: 24 },
  card: { background: "#18181b", border: "1px solid #27272a", padding: 24, borderRadius: 22, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" },
  cardCenter: { background: "#18181b", border: "1px solid #27272a", padding: 24, borderRadius: 22, textAlign: "center" },
  sideColumn: { display: "flex", flexDirection: "column", gap: 24 },
  cardTitle: { color: "#bbf7d0", marginTop: 0 },
  sliderLabel: { display: "flex", justifyContent: "space-between", color: "#e4e4e7", fontSize: 14, marginBottom: 8 },
  resultBox: { background: "#09090b", padding: 18, borderRadius: 16, border: "1px solid #27272a" },
  bigNumber: { color: "#67e8f9", fontSize: 32, fontWeight: 800 },
  beakerWrap: { display: "flex", justifyContent: "center" },
  beakerGlass: { width: 210, height: 380, border: "5px solid #d4d4d8", borderTop: "5px solid #f4f4f5", borderRadius: "20px 20px 70px 70px", position: "relative", overflow: "hidden", background: "#09090b", boxShadow: "0 0 50px rgba(132,204,22,0.25)" },
  liquid: { position: "absolute", bottom: 0, left: 0, right: 0, transition: "all 0.45s ease" },
  precipitate: { position: "absolute", bottom: 0, left: 0, right: 0, height: 38, background: "#fef9c3", opacity: 0.85, filter: "blur(1px)" },
  glow: { position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 65%, rgba(255,255,255,0.28), transparent 40%)" },
  metricsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22 },
  metric: { background: "#09090b", border: "1px solid #27272a", padding: 14, borderRadius: 14, textAlign: "left" },
  aiBox: { background: "#09090b", border: "1px solid #27272a", padding: 18, borderRadius: 16, color: "#d4d4d8", lineHeight: 1.6, fontSize: 17 },
  svg: { width: "100%", height: 260, display: "block" },
  legend: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 },
  legendItem: { color: "#d4d4d8", fontSize: 13 },
  swatch: { display: "inline-block", width: 12, height: 12, borderRadius: 3, marginRight: 5 },
  footer: { color: "#71717a", marginTop: 22, fontSize: 13 },
};
