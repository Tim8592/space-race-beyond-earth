import SubsystemLab from './SubsystemLab';
import OrbitalLab from './OrbitalLab';
import MissionLibrary from './MissionLibrary';
import { useEffect, useMemo, useState } from 'react';
import {
  calculateVehicleMetrics,
  ENGINES,
  estimateBuildCostUsd,
  INITIAL_VEHICLE,
  type EngineId,
  type Vehicle,
} from './lib/engineering';
import { circularOrbitPeriodMinutes, circularOrbitSpeedKmS } from './lib/nasaData';

type MissionId = 'pathfinder' | 'cargo' | 'station';
type Contract = {
  id: MissionId;
  label: string;
  kicker: string;
  description: string;
  altitudeKm: number;
  requiredPayloadKg: number;
  requiredDeltaVms: number;
  payoutUsd: number;
  durationDays: number;
};

const CONTRACTS: Contract[] = [
  {
    id: 'pathfinder',
    label: 'Pathfinder',
    kicker: '01 / STARTER',
    description: 'Deploy a small science spacecraft into low Earth orbit.',
    altitudeKm: 300,
    requiredPayloadKg: 500,
    requiredDeltaVms: 9000,
    payoutUsd: 85_000_000,
    durationDays: 14,
  },
  {
    id: 'cargo',
    label: 'Orbital Resupply',
    kicker: '02 / LOGISTICS',
    description: 'Deliver a useful payload to a 400 km operational orbit.',
    altitudeKm: 400,
    requiredPayloadKg: 2000,
    requiredDeltaVms: 9350,
    payoutUsd: 135_000_000,
    durationDays: 18,
  },
  {
    id: 'station',
    label: 'Station Expansion',
    kicker: '03 / HEAVY LIFT',
    description: 'Transport a larger station module to a higher orbit.',
    altitudeKm: 500,
    requiredPayloadKg: 5000,
    requiredDeltaVms: 9700,
    payoutUsd: 225_000_000,
    durationDays: 24,
  },
];

const INITIAL_CASH = 350_000_000;
const STORAGE_KEY = 'space-race-v01-save';
const minimumTwr = 1.15;

type HistoryItem = {
  id: number;
  day: number;
  contract: string;
  craft: string;
  success: boolean;
  cost: number;
  payout: number;
  deliveredKg: number;
};

type Game = {
  cash: number;
  day: number;
  completed: number;
  launched: number;
  deliveredKg: number;
  revenue: number;
  engineBuildCounts: Record<EngineId, number>;
  history: HistoryItem[];
  blueprints: Vehicle[];
};

const DEFAULT_GAME: Game = {
  cash: INITIAL_CASH,
  day: 1,
  completed: 0,
  launched: 0,
  deliveredKg: 0,
  revenue: 0,
  engineBuildCounts: { kerolox: 0, methalox: 0, hydrolox: 0 },
  history: [],
  blueprints: [],
};

type Snapshot = { game: Game; vehicle: Vehicle; missionId: MissionId };
function loadSave(): Snapshot {
  const fallback = { game: DEFAULT_GAME, vehicle: INITIAL_VEHICLE, missionId: 'cargo' as MissionId };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as Snapshot;
    if (
      !parsed?.game ||
      !Number.isFinite(parsed.game.cash) ||
      !Number.isFinite(parsed.game.day) ||
      !parsed.vehicle ||
      !ENGINES[parsed.vehicle.engineId] ||
      !CONTRACTS.some((mission) => mission.id === parsed.missionId)
    ) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function usd(amount: number) {
  return '$' + (amount / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M';
}
function integer(value: number) {
  return Number.isFinite(value) ? Math.round(value).toLocaleString('en-US') : '—';
}
function decimal(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}
function CheckIcon({ good }: { good: boolean }) {
  return <span className={good ? 'check yes' : 'check no'} aria-hidden="true">{good ? '✓' : '!'}</span>;
}
function Field({
  title, value, unit, min, max, step, onChange,
}: {
  title: string; value: number; unit: string; min: number; max: number; step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span className="field-header"><span>{title}</span><span className="field-current">{integer(value)} <small>{unit}</small></span></span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="field-limits"><span>{integer(min)} kg</span><span>{integer(max)} kg</span></span>
    </label>
  );
}

export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot>(loadSave);
  const { game, vehicle, missionId } = snapshot;
  const [message, setMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [activeView,setActiveView] = useState<'missions'|'systems'|'orbits'|'library'|'research'>('missions');
  const contract = CONTRACTS.find((item) => item.id === missionId) ?? CONTRACTS[0];
  const metrics = useMemo(() => calculateVehicleMetrics(vehicle), [vehicle]);
  const buildCost = estimateBuildCostUsd(vehicle, game.engineBuildCounts[vehicle.engineId] ?? 0);
  const valid = [metrics.deltaVms, metrics.liftoffTwr, buildCost].every(Number.isFinite);
  const payloadOK = valid && vehicle.payloadMassKg >= contract.requiredPayloadKg;
  const deltaVOK = valid && metrics.deltaVms >= contract.requiredDeltaVms;
  const thrustOK = valid && metrics.liftoffTwr >= minimumTwr;
  const sufficientCash = game.cash >= buildCost;
  const ready = payloadOK && deltaVOK && thrustOK;
  const successfulLaunches = game.completed;
  const latest = game.history[0];

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* private browser mode */ }
  }, [snapshot]);

  function updateVehicle(patch: Partial<Vehicle>) {
    setSnapshot((previous) => ({ ...previous, vehicle: { ...previous.vehicle, ...patch } }));
    setMessage(null);
  }
  function chooseContract(id: MissionId) {
    setSnapshot((previous) => ({ ...previous, missionId: id }));
    setMessage(null);
  }
  function saveBlueprint() {
    if (!vehicle.name.trim()) return;
    setSnapshot((previous) => ({
      ...previous,
      game: {
        ...previous.game,
        blueprints: [...previous.game.blueprints.filter((item) => item.name !== vehicle.name), { ...vehicle }].slice(-10),
      },
    }));
    setMessage(`Blueprint “${vehicle.name}” saved locally. You can reload it at any time.`);
  }
  function launch() {
    if (!valid || !sufficientCash) return;
    const success = ready;
    const event: HistoryItem = {
      id: Date.now(),
      day: game.day,
      contract: contract.label,
      craft: vehicle.name || 'Unnamed vehicle',
      success,
      cost: buildCost,
      payout: success ? contract.payoutUsd : 0,
      deliveredKg: success ? vehicle.payloadMassKg : 0,
    };
    setSnapshot((previous) => ({
      ...previous,
      game: {
        ...previous.game,
        cash: previous.game.cash - buildCost + event.payout,
        day: previous.game.day + contract.durationDays,
        completed: previous.game.completed + Number(success),
        launched: previous.game.launched + 1,
        deliveredKg: previous.game.deliveredKg + event.deliveredKg,
        revenue: previous.game.revenue + event.payout,
        engineBuildCounts: {
          ...previous.game.engineBuildCounts,
          [vehicle.engineId]: (previous.game.engineBuildCounts[vehicle.engineId] ?? 0) + 1,
        },
        history: [event, ...previous.game.history].slice(0, 12),
      },
    }));
    setMessage(success
      ? `${contract.label} complete. ${integer(vehicle.payloadMassKg)} kg delivered; ${usd(contract.payoutUsd)} contract revenue received.`
      : `Mission unsuccessful. Your design did not meet every requirement. ${usd(buildCost)} was spent on the attempt.`);
  }
  function reset() {
    if (!window.confirm('Start over? This clears your locally saved campaign and blueprints.')) return;
    setSnapshot({ game: DEFAULT_GAME, vehicle: INITIAL_VEHICLE, missionId: 'cargo' });
    setMessage('Campaign restarted.');
  }
  function passWeek() {
    setSnapshot((previous) => ({ ...previous, game: { ...previous.game, day: previous.game.day + 7 } }));
    setMessage('Seven simulated days passed. Research and recurring income are planned, not implemented yet.');
  }
  const orbitSpeed = circularOrbitSpeedKmS(contract.altitudeKm);
  const orbitPeriod = circularOrbitPeriodMinutes(contract.altitudeKm);
  const angle = (game.day * 31 * Math.PI) / 180;
  const satelliteX = 310 + 131 * Math.cos(angle);
  const satelliteY = 183 + 131 * Math.sin(angle);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand"><span className="brand-symbol"><span className="brand-orbit" /></span><div><strong>SPACE RACE</strong><small>BEYOND EARTH</small></div></div>
          <nav aria-label="Primary" className="game-tabs" role="tablist">
              {([
                ['missions','Mission Control'],['systems','Spacecraft Builder'],['orbits','Orbital Map'],['library','Mission Library'],['research','Research & Roadmap'],
              ] as const).map(([id,label])=><button key={id} type="button" role="tab" aria-selected={activeView===id} className={activeView===id?'current':''} onClick={()=>setActiveView(id)}>{label}</button>)}
            </nav>
          <div className="prototype-pill"><span className="live-dot" /> PROTOTYPE <span className="version">V0.5</span></div>
        </div>
      </header>

      <main className="main-content">
        <section className={'intro '+(activeView==='missions'?'':'view-hidden')}>
          <div><div className="eyebrow"><span className="small-diamond" /> YOUR SPACE PROGRAM STARTS HERE</div><h1>Build the future.<br /><em>Beyond Earth.</em></h1><p>Design capable spacecraft, accept orbital contracts, and turn engineering decisions into a thriving space economy.</p></div>
          <div className="intro-right"><span>CAMPAIGN / EARTH ERA</span><div className="day-marker">DAY <strong>{game.day.toString().padStart(3, '0')}</strong></div><button className="ghost-button" onClick={passWeek}>Advance 7 days <span>→</span></button></div>
        </section>

        <section className={'kpi-grid '+(activeView==='missions'?'':'view-hidden')} aria-label="Campaign overview">
          <div className="kpi"><span>AVAILABLE CAPITAL</span><strong>{usd(game.cash)}</strong><small className={game.cash < 0 ? 'danger-text' : ''}>Starting fund: {usd(INITIAL_CASH)}</small></div>
          <div className="kpi"><span>SUCCESSFUL MISSIONS</span><strong>{integer(successfulLaunches)} <i>/ {integer(game.launched)}</i></strong><small>Successful / attempted</small></div>
          <div className="kpi"><span>CARGO DELIVERED</span><strong>{integer(game.deliveredKg)} <i>kg</i></strong><small>Into Earth orbit</small></div>
          <div className="kpi"><span>TOTAL CONTRACT REVENUE</span><strong>{usd(game.revenue)}</strong><small>From completed missions</small></div>
        </section>

        <div className={'control-layout '+(activeView==='missions'?'':'view-hidden')} id="mission-control">
          <div className="left-column">
            <section className="panel" id="builder">
              <div className="panel-heading"><div><div className="eyebrow">01 / DESIGN LAB</div><h2>Spacecraft Builder</h2><p>Configure your launch vehicle and evaluate its performance.</p></div><div className="panel-glyph">◈</div></div>
              <div className="builder-name"><label htmlFor="craft-name">VEHICLE NAME</label><input id="craft-name" value={vehicle.name} maxLength={40} onChange={(event) => updateVehicle({ name: event.target.value })}/></div>
              <div className="section-label">PROPULSION SYSTEM <span>SELECT ONE</span></div>
              <div className="engine-grid">
                {(Object.keys(ENGINES) as EngineId[]).map((id) => {
                  const engine = ENGINES[id];
                  return <button key={id} className={'engine-card ' + (id === vehicle.engineId ? 'selected' : '')} onClick={() => updateVehicle({ engineId: id })} aria-pressed={id === vehicle.engineId}>
                    <span className="engine-select">{id === vehicle.engineId ? '●' : '○'}</span><strong>{engine.label}</strong><small>{integer(engine.ispSeconds)} s Isp</small><span className="engine-subtitle">{engine.subtitle}</span>
                  </button>;
                })}
              </div>
              <div className="section-label top-space">MASS CONFIGURATION <span>ADJUST PARAMETERS</span></div>
              <Field title="Dry mass" value={vehicle.dryMassKg} unit="kg" min={5000} max={35000} step={500} onChange={(value) => updateVehicle({ dryMassKg: value })}/>
              <Field title="Propellant mass" value={vehicle.propellantMassKg} unit="kg" min={80000} max={450000} step={5000} onChange={(value) => updateVehicle({ propellantMassKg: value })}/>
              <Field title="Payload mass" value={vehicle.payloadMassKg} unit="kg" min={500} max={15000} step={500} onChange={(value) => updateVehicle({ payloadMassKg: value })}/>
              <div className="blueprint-bar"><button className="secondary-button" onClick={saveBlueprint}>+ Save blueprint</button>{game.blueprints.length > 0 && <select aria-label="Load saved blueprint" value="" onChange={(event) => {const selected = game.blueprints.find((item) => item.name === event.target.value); if(selected) updateVehicle({ ...selected });}}><option value="">Load saved design…</option>{game.blueprints.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>}</div>
            </section>

             

            <section className="panel metrics-panel">
              <div className="panel-heading"><div><div className="eyebrow">02 / PERFORMANCE</div><h2>Engineering Analysis</h2><p>Live estimates using the ideal rocket equation.</p></div><span className="formula">Δv = Isp · g₀ · ln(m₀/mf)</span></div>
              <div className="metrics-grid"><div><span>AVAILABLE ΔV</span><strong>{integer(metrics.deltaVms)} <small>m/s</small></strong></div><div><span>LIFTOFF THRUST / WEIGHT</span><strong>{decimal(metrics.liftoffTwr, 2)} <small>TWR</small></strong></div><div><span>INITIAL MASS</span><strong>{integer(metrics.initialMassKg)} <small>kg</small></strong></div><div><span>SPECIFIC IMPULSE</span><strong>{integer(metrics.ispSeconds)} <small>s</small></strong></div></div>
              <div className="engineering-note"><span>ℹ</span><p><strong>Engineering simplification:</strong> One idealized stage, constant Isp and thrust. ΔV uses Tsiolkovsky; mission thresholds include a rough gameplay allowance for ascent losses. Not a real flight feasibility prediction.</p></div>
            </section>
          </div>

          <div className="right-column">
            <section className="panel mission-panel">
              <div className="panel-heading"><div><div className="eyebrow">03 / MISSION CONTROL</div><h2>Available Contracts</h2><p>Earn funding by delivering payload to orbit.</p></div><div className="panel-glyph">⌁</div></div>
              <div className="contract-list">{CONTRACTS.map((item) => <button key={item.id} className={'contract ' + (item.id === missionId ? 'selected' : '')} onClick={() => chooseContract(item.id)} aria-pressed={item.id === missionId}><div className="contract-dot">{item.id === missionId ? '●' : '○'}</div><div className="contract-main"><span>{item.kicker}</span><strong>{item.label}</strong><small>{item.description}</small></div><div className="contract-price">{usd(item.payoutUsd)}<small>REWARD</small></div></button>)}</div>
            </section>

            <section className="panel launch-panel">
              <div className="panel-heading compact-heading"><div><div className="eyebrow">04 / FLIGHT REVIEW</div><h2>Launch Readiness</h2></div><span className={'status-tag ' + (ready ? 'ready' : 'blocked')}>{ready ? '● DESIGN READY' : '● REVIEW REQUIRED'}</span></div>
              <div className="readiness-list"><div><span><CheckIcon good={payloadOK}/> Payload capacity</span><strong>{integer(vehicle.payloadMassKg)} / {integer(contract.requiredPayloadKg)} kg</strong></div><div><span><CheckIcon good={deltaVOK}/> ΔV capability</span><strong>{integer(metrics.deltaVms)} / {integer(contract.requiredDeltaVms)} m/s</strong></div><div><span><CheckIcon good={thrustOK}/> Initial thrust / weight</span><strong>{decimal(metrics.liftoffTwr, 2)} / {minimumTwr.toFixed(2)}</strong></div><div><span><CheckIcon good={sufficientCash}/> Budget available</span><strong>{usd(game.cash)} / {usd(buildCost)}</strong></div></div>
              <div className="financials"><div><span>EST. VEHICLE COST</span><strong>{usd(buildCost)}</strong></div><div><span>MISSION PAYOUT</span><strong className="green">+{usd(contract.payoutUsd)}</strong></div><div><span>EXPECTED MARGIN IF SUCCESSFUL</span><strong className={contract.payoutUsd >= buildCost ? 'green' : 'danger-text'}>{usd(contract.payoutUsd - buildCost)}</strong></div></div>
              <button className="launch-button" onClick={launch} disabled={!valid || !sufficientCash}>{ready ? 'Launch mission' : 'Attempt mission anyway'}<span>↗</span></button>
              {!ready && <p className="warning-caption">Attempting a mission below the requirements will spend the vehicle cost and fail. Adjust your design first.</p>}
              {message && <div className={'feedback ' + (latest?.success && message.includes('complete') ? 'positive' : '')} role="status">{message}</div>}
            </section>
          </div>
        </div>

        {activeView==='systems' && <div className="single-tab-page"><SubsystemLab /></div>}
        {activeView==='orbits' && <div className="single-tab-page"><OrbitalLab initialAltitudeKm={contract.altitudeKm} /></div>}
        {activeView==='library' && <div className="single-tab-page"><MissionLibrary onOpenMap={()=>setActiveView('orbits')}/></div>}
        <section className={'bottom-grid '+(activeView==='research'?'':'view-hidden')} id="roadmap"><div className="panel roadmap"><div className="eyebrow">BEYOND THE PROTOTYPE</div><h2>Your next frontier</h2><div className="roadmap-items"><div><span className="road-icon">◎</span><strong>Earth orbit</strong><small>Playable now</small></div><div className="roadmap-line"/><div className="muted"><span className="road-icon">◐</span><strong>Lunar economy</strong><small>Planned</small></div><div className="roadmap-line"/><div className="muted"><span className="road-icon">✧</span><strong>Mars transfers</strong><small>Planned</small></div><div className="roadmap-line"/><div className="muted"><span className="road-icon">✦</span><strong>Outer planets</strong><small>Vision</small></div></div><p>Next: technology research, spacecraft production learning curves, fuel depots, transfer windows, and a competing space program.</p></div><div className="panel history"><div className="eyebrow">FLIGHT LOG</div><h2>Recent missions</h2>{game.history.length === 0 ? <p>No launches yet. Build a spacecraft and accept your first contract.</p> : <div className="history-list">{game.history.slice(0, 4).map((item) => <div key={item.id}><span className={item.success ? 'success-dot' : 'failed-dot'}>●</span><div><strong>{item.contract}</strong><small>Day {item.day} · {item.craft}</small></div><strong className={item.success ? 'green' : 'danger-text'}>{item.success ? '+' + usd(item.payout - item.cost) : '-' + usd(item.cost)}</strong></div>)}</div>}</div></section>
        <footer><div><span>SPACE RACE: BEYOND EARTH</span> · NASA Space Apps Challenge 2026 · Independently created prototype</div><div><button onClick={() => setShowHelp(!showHelp)}>{showHelp ? 'Hide notes' : 'Model limitations & credits'}</button><button onClick={reset}>Reset campaign</button></div></footer>
        {showHelp && <div className="help-notes"><p><strong>Model limits:</strong> Only a simplified one-stage launcher and fictional contracts are implemented. Earth orbital speed and period use JPL's Earth gravitational parameter and NASA's Earth radius. Engine performance, budgets, mission thresholds, and manufacturing discounts are invented and must not be treated as real mission values. v0.3 includes idealized spacecraft subsystem calculations and Keplerian orbit visualization. It does not yet implement mission transfers, launch-window optimization, atmospheric flight, staging, nuclear reactor integration, or mission qualification.</p><p><strong>AI-assisted work:</strong> Initial source code, interface copy, and documentation were drafted with ChatGPT. See README.md and docs/ATTRIBUTION.md for disclosures. No NASA logos or mission insignia are used.</p></div>}
      </main>
    </div>
  );
}
