import { useEffect, useMemo, useState } from 'react';
import { planetAtDate, type PlanetId } from './lib/orbitalMechanics';

const ENDPOINT = 'http://127.0.0.1:8787';
const DAY = 86400000;
type Objective = 'departure' | 'total';
type Mode = 'manual' | 'optimize';

export type LambertResult = {
  solver: string;
  trajectoryModel: string;
  flightDays: number;
  departureVInfinityKmS: number;
  arrivalVInfinityKmS: number;
  departureC3Km2S2: number;
  propagatedTargetErrorKm: number;
  semimajorAxisAu: number;
  eccentricity: number;
  trajectoryAu: number[][];
  limitations: string[];
};

export type LambertSolution = LambertResult & {
  departureDate: string;
  arrivalDate: string;
  target: PlanetId;
};

type Candidate = {
  flightDays: number;
  departureDeltaVKmS: number;
  arrivalCaptureDeltaVKmS: number;
  totalDeltaVKmS: number;
  departureC3Km2S2: number;
  departureVInfinityKmS: number;
  arrivalVInfinityKmS: number;
  optimizedScoreKmS: number;
};
type OptimizationResponse = {
  model: string;
  objective: Objective;
  target: PlanetId;
  earthParkingAltitudeKm: number;
  targetParkingAltitudeKm: number;
  requestedCandidates: number;
  validCandidates: number;
  skippedCandidates: number;
  best: Candidate;
  ranked: Candidate[];
  bestTransfer: LambertResult;
  limitations: string[];
};

function velocityAtDate(id: PlanetId, date: Date): number[] {
  const before = planetAtDate(id, new Date(date.getTime() - DAY));
  const after = planetAtDate(id, new Date(date.getTime() + DAY));
  return [
    (after.xAu - before.xAu) / 2,
    (after.yAu - before.yAu) / 2,
    (after.zAu - before.zAu) / 2,
  ];
}

function dateAt(departureDate: string, days: number): Date {
  const start = new Date(departureDate + 'T12:00:00Z');
  if (!Number.isFinite(start.getTime())) throw new Error('Choose a valid departure date.');
  return new Date(start.getTime() + days * DAY);
}

function transferRequest(
  departureDate: string,
  target: PlanetId,
  days: number,
  samples = 160,
) {
  const depart = new Date(departureDate + 'T12:00:00Z');
  const arrive = dateAt(departureDate, days);
  if (!Number.isFinite(depart.getTime()) || depart.getUTCFullYear() < 1801 ||
    arrive.getUTCFullYear() >= 2050 || days < 3 || days > 3000) {
    throw new Error('Use a departure/arrival between 1801 and 2049 and a 3–3000-day flight.');
  }
  const earth = planetAtDate('earth', depart);
  const destination = planetAtDate(target, arrive);
  return {
    departurePositionAu: [earth.xAu, earth.yAu, earth.zAu],
    arrivalPositionAu: [destination.xAu, destination.yAu, destination.zAu],
    departureVelocityAuPerDay: velocityAtDate('earth', depart),
    arrivalVelocityAuPerDay: velocityAtDate(target, arrive),
    flightDays: days,
    // Zero-revolution, prograde orbit family: let Orekit select the long/short arc.
    prograde: true,
    samples,
  };
}

function asSolution(
  result: LambertResult,
  date: string,
  target: PlanetId,
): LambertSolution {
  return {
    ...result, departureDate: date,
    arrivalDate: dateAt(date, result.flightDays).toISOString().slice(0, 10),
    target,
  };
}

const PRESETS: Record<'venus'|'mars'|'jupiter', {start:number;end:number;step:number;capture:number}> = {
  venus: { start: 50, end: 450, step: 10, capture: 300 },
  mars: { start: 100, end: 850, step: 10, capture: 300 },
  jupiter: { start: 400, end: 2200, step: 20, capture: 100000 },
};

function durationRange(min: number, max: number, step: number): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step) ||
    min < 3 || max > 3000 || max <= min || step < 1 || (max - min) / step > 150) {
    throw new Error('Choose a valid 3–3000 day range with at most 151 sampled durations. Increase the step if needed.');
  }
  const result: number[] = [];
  for (let t = min; t <= max + 1e-7; t += step) result.push(Math.round(t * 100) / 100);
  if (result.length > 200) throw new Error('Too many transfer candidates');
  return result;
}

async function postJSON<T>(path: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Orekit is offline. Restart Start Orekit.command to load the new optimizer service.');
  }
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Orekit transfer solver error.');
  return data;
}

function Curve({ranked, best, objective}:{
  ranked:Candidate[]; best:Candidate; objective:Objective;
}) {
  const data = useMemo(()=>ranked.filter(p=>Number.isFinite(p.optimizedScoreKmS))
    .slice().sort((a,b)=>a.flightDays-b.flightDays),[ranked]);
  if (data.length<2) return null;
  const minX=data[0].flightDays;
  const maxX=data[data.length-1].flightDays;
  const values=data.map(p=>p.optimizedScoreKmS);
  const minY=Math.min(...values);
  const maxY=Math.max(...values);
  const padY=Math.max(.2,(maxY-minY)*.1);
  const lowY=Math.max(0,minY-padY);
  const highY=maxY+padY;
  const xp=(x:number)=>45+(x-minX)/(maxX-minX)*650;
  const yp=(y:number)=>192-(y-lowY)/(highY-lowY)*155;
  const line=data.map((p,i)=>`${i===0?'M':'L'} ${xp(p.flightDays).toFixed(2)} ${yp(p.optimizedScoreKmS).toFixed(2)}`).join(' ');
  return <div className="optimization-chart">
    <div className="eyebrow">{objective==='departure'?'LEO departure burn':'LEO departure + destination circular capture'} vs. flight duration</div>
    <svg viewBox="0 0 730 225" role="img"
      aria-label="Optimization plot of impulsive delta V versus flight duration">
      <line x1="45" y1="192" x2="695" y2="192" stroke="#7a9eb5"/>
      <line x1="45" y1="37" x2="45" y2="192" stroke="#7a9eb5"/>
      <path d={line} stroke="#80c3f5" strokeWidth="2.5" fill="none"/>
      <circle cx={xp(best.flightDays)} cy={yp(best.optimizedScoreKmS)} r="6" fill="#ffcd81" stroke="#fff1d3" strokeWidth="2"/>
      <text x="45" y="24" fontSize="12" fill="#c9ddef">{highY.toFixed(2)} km/s</text>
      <text x="45" y="211" fontSize="12" fill="#9ebacc">{minX} d</text>
      <text x="695" y="211" textAnchor="end" fontSize="12" fill="#9ebacc">{maxX} d</text>
      <text x="695" y="24" textAnchor="end" fontSize="12" fill="#f5ca8d">Best {best.flightDays} d · {best.optimizedScoreKmS.toFixed(3)} km/s</text>
    </svg>
  </div>;
}

export default function TransferPlanner({onSolved}:{onSolved:(solution:LambertSolution)=>void}) {
  const [date,setDate] = useState('2027-02-01');
  const [target,setTarget] = useState<'venus'|'mars'|'jupiter'>('mars');
  const [flightDays,setFlightDays] = useState(260);
  const [mode,setMode] = useState<Mode>('manual');
  const [objective,setObjective] = useState<Objective>('total');
  const [minDays,setMinDays] = useState(100);
  const [maxDays,setMaxDays] = useState(850);
  const [stepDays,setStepDays] = useState(10);
  const [earthAltitudeKm,setEarthAltitudeKm] = useState(400);
  const [arrivalAltitudeKm,setArrivalAltitudeKm] = useState(300);
  const [working,setWorking] = useState(false);
  const [online,setOnline] = useState(false);
  const [message,setMessage] = useState('Checking local Orekit transfer service…');
  const [result,setResult] = useState<LambertSolution|null>(null);
  const [optResult,setOptResult] = useState<OptimizationResponse|null>(null);

  useEffect(()=>{
    let mounted=true;
    fetch(ENDPOINT+'/health').then(r=>{
      if(!r.ok)throw new Error('offline');
      if(mounted){setOnline(true);setMessage('Orekit service online — manual and optimization modes available.');}
    }).catch(()=>{
      if(mounted){setOnline(false);setMessage('Orekit backend offline. Start Orekit.command to calculate transfers.');}
    });
    return ()=>{mounted=false};
  },[]);

  function chooseTarget(next:'venus'|'mars'|'jupiter') {
    const defaults = PRESETS[next];
    setTarget(next);setResult(null);setOptResult(null);
    setMinDays(defaults.start);setMaxDays(defaults.end);setStepDays(defaults.step);
    setArrivalAltitudeKm(defaults.capture);
  }

  function publish(solution:LambertSolution) {
    setResult(solution);setFlightDays(solution.flightDays);onSolved(solution);
  }

  async function solve(days=flightDays) {
    setWorking(true);setMessage('Solving transfer with Orekit…');
    try {
      const request=transferRequest(date,target,days);
      const data=await postJSON<LambertResult>('/api/lambert',request);
      if(!Array.isArray(data.trajectoryAu) || data.trajectoryAu.length<8)throw new Error('Invalid Orekit result');
      publish(asSolution(data,date,target));
      setOnline(true);setMessage('Impulsive transfer solved. Inspect velocity requirements and plotted orbit.');
    } catch(error) {
      setMessage(error instanceof Error?error.message:'Unknown Orekit error');
    }finally{setWorking(false)}
  }

  async function optimize() {
    setWorking(true);setOptResult(null);
    setMessage('Sampling flight durations at the fixed departure date…');
    try {
      const coarseDays=durationRange(minDays,maxDays,stepDays);
      const shared={target,objective,earthParkingAltitudeKm:earthAltitudeKm,targetParkingAltitudeKm:arrivalAltitudeKm};
      const coarse=await postJSON<OptimizationResponse>('/api/optimize',{
        ...shared,candidates:coarseDays.map(d=>transferRequest(date,target,d,8)),
      });
      setMessage(`Sampled ${coarse.validCandidates} valid trajectories. Refining around the best duration…`);
      // One-day refinement around the coarse sampled minimum. The coarse
      // optimum is included in the fine grid, so refining cannot worsen it.
      const refinedStart=Math.max(minDays,Math.floor(coarse.best.flightDays-2*stepDays));
      const refinedEnd=Math.min(maxDays,Math.ceil(coarse.best.flightDays+2*stepDays));
      const refineDays=durationRange(refinedStart,refinedEnd,1);
      const finer=await postJSON<OptimizationResponse>('/api/optimize',{
        ...shared,candidates:refineDays.map(d=>transferRequest(date,target,d,8)),
      });
      const best=finer.best.optimizedScoreKmS <= coarse.best.optimizedScoreKmS ? finer : coarse;
      // Show every sampled result; combine overlapping durations (one-day
      // refined points replace coarse scores at the same duration).
      const merged=new Map<number,Candidate>();
      coarse.ranked.forEach(s=>merged.set(s.flightDays,s));
      finer.ranked.forEach(s=>merged.set(s.flightDays,s));
      const all=Array.from(merged.values()).sort((a,b)=>a.flightDays-b.flightDays);
      const final={...best,ranked:all,requestedCandidates:coarse.requestedCandidates+finer.requestedCandidates,
        validCandidates:coarse.validCandidates+finer.validCandidates,
        skippedCandidates:coarse.skippedCandidates+finer.skippedCandidates};
      setOptResult(final);
      publish(asSolution(best.bestTransfer,date,target));
      setOnline(true);
      setMessage(`Lowest sampled ${objective==='total'?'ideal combined':'ideal departure'} Δv: ${best.best.optimizedScoreKmS.toFixed(3)} km/s at ${best.best.flightDays} days. ${final.validCandidates} solutions evaluated.`);
    } catch(error) {
      setMessage(error instanceof Error?error.message:'Optimization failed');
    }finally{setWorking(false)}
  }

  const rankedBest=optResult?.ranked.slice().sort((a,b)=>a.optimizedScoreKmS-b.optimizedScoreKmS).slice(0,5) ?? [];
  return <section className="transfer-panel" aria-label="Orekit transfer planning and optimization">
    <div className="transfer-header">
      <div><div className="eyebrow">TRAJECTORY ENGINE / OREKIT 13.1.9</div>
        <h3>Earth → planetary transfer</h3>
        <p>Specify a flight duration, or hold the departure date fixed and find the lowest sampled ideal delta-V transfer.</p>
      </div>
      <span className={'transfer-engine-status '+(online?'online':'offline')}>{online?'● ENGINE ONLINE':'○ JAVA ENGINE OFFLINE'}</span>
    </div>
    <div className="orbit-tab-row" role="tablist" aria-label="Transfer planning mode">
      <button role="tab" aria-selected={mode==='manual'} className={mode==='manual'?'selected':''} onClick={()=>setMode('manual')}>Manual duration</button>
      <button role="tab" aria-selected={mode==='optimize'} className={mode==='optimize'?'selected':''} onClick={()=>setMode('optimize')}>Optimize minimum Δv</button>
    </div>
    <div className="transfer-inputs">
      <label>Destination
        <select value={target} onChange={e=>chooseTarget(e.target.value as 'venus'|'mars'|'jupiter')}>
          <option value="venus">Venus</option><option value="mars">Mars</option><option value="jupiter">Jupiter</option>
        </select>
      </label>
      <label>Departure date (fixed, UTC)
        <input type="date" min="2026-11-14" max="2040-12-31" value={date}
          onChange={e=>{setDate(e.target.value);setResult(null);setOptResult(null);}}/>
      </label>
      {mode==='manual' ? <>
        <label>Flight duration
          <input type="number" min="3" max="3000" step="5" value={flightDays}
            onChange={e=>{const n=e.currentTarget.valueAsNumber;if(Number.isFinite(n))setFlightDays(Math.min(3000,Math.max(3,n)));setResult(null)}}/>
          <small>days (3–3000)</small>
        </label>
        <button type="button" className="launch-button" disabled={working} onClick={()=>solve()}>{working?'Computing…':'Solve with Orekit'} <span>↗</span></button>
      </> : <>
        <label>Objective
          <select value={objective} onChange={e=>{setObjective(e.target.value as Objective);setOptResult(null);}}>
            <option value="total">Minimum departure + capture Δv</option>
            <option value="departure">Minimum Earth departure Δv</option>
          </select>
        </label>
      </>}
    </div>
    {mode==='optimize'&&<>
      <div className="transfer-opt-inputs">
        <label>Minimum flight time (days)
          <input type="number" min="3" max="3000" value={minDays} onChange={e=>{const n=e.currentTarget.valueAsNumber;if(Number.isFinite(n))setMinDays(n)}}/>
        </label>
        <label>Maximum flight time (days)
          <input type="number" min="3" max="3000" value={maxDays} onChange={e=>{const n=e.currentTarget.valueAsNumber;if(Number.isFinite(n))setMaxDays(n)}}/>
        </label>
        <label>Coarse step (days)
          <input type="number" min="1" max="100" value={stepDays} onChange={e=>{const n=e.currentTarget.valueAsNumber;if(Number.isFinite(n))setStepDays(n)}}/>
        </label>
        <label>Earth parking altitude (km)
          <input type="number" min="160" max="100000" step="50" value={earthAltitudeKm}
            onChange={e=>{const n=e.currentTarget.valueAsNumber;if(Number.isFinite(n))setEarthAltitudeKm(n)}}/>
        </label>
        <label>{target==='jupiter'?'Jupiter capture-orbit altitude (km)':'Target circular orbit altitude (km)'}
          <input type="number" min="150" max="1000000" step="100" value={arrivalAltitudeKm}
            onChange={e=>{const n=e.currentTarget.valueAsNumber;if(Number.isFinite(n))setArrivalAltitudeKm(n)}}/>
        </label>
        <button type="button" className="launch-button" disabled={working} onClick={optimize}>
          {working?'Searching transfers…':'Find lowest Δv'} <span>↗</span>
        </button>
      </div>
      <p className="transfer-range-note">
        Orekit evaluates zero-revolution prograde Lambert transfers at each sampled duration, then refines the best coarse result at one-day intervals. Only the <strong>flight duration</strong> varies; the departure date is fixed. A minimum over this sampled range is not a guaranteed global minimum.
      </p>
    </>}
    <p className={'transfer-message '+(online?'online':'')} role="status">{message}</p>
    {mode==='optimize'&&optResult&&<>
      <div className="transfer-opt-highlight">
        <div><span>Lowest sampled {objective==='departure'?'departure':'total'} Δv</span>
          <strong>{optResult.best.optimizedScoreKmS.toFixed(3)} <small>km/s</small></strong>
          <small>Flight: {optResult.best.flightDays} days · arrival {dateAt(date,optResult.best.flightDays).toISOString().slice(0,10)}</small>
        </div>
        <div><span>Earth departure burn</span><strong>{optResult.best.departureDeltaVKmS.toFixed(3)} <small>km/s</small></strong></div>
        <div><span>Ideal target capture</span><strong>{optResult.best.arrivalCaptureDeltaVKmS.toFixed(3)} <small>km/s</small></strong></div>
      </div>
      <Curve ranked={optResult.ranked} best={optResult.best} objective={objective}/>
      <div className="transfer-ranked">
        <div className="eyebrow">TOP SAMPLED FLIGHT DURATIONS · CLICK TO PLOT</div>
        <div className="transfer-ranked-list">
          {rankedBest.map(candidate=><button key={candidate.flightDays} type="button"
            disabled={working} onClick={()=>solve(candidate.flightDays)}>
            <strong>{candidate.flightDays} days</strong>
            <span>{candidate.optimizedScoreKmS.toFixed(3)} km/s</span>
          </button>)}
        </div>
      </div>
      <p className="transfer-range-note">Evaluated {optResult.validCandidates} valid solutions ({optResult.skippedCandidates} invalid geometries skipped). Cost depends on your selected departure and target parking-orbit altitudes. A flyby could omit capture altogether; atmospheric aerobraking and gravity assists are not included.</p>
    </>}
    {result&&<div className="transfer-stats">
      <div><span>Departure v∞</span><strong>{result.departureVInfinityKmS.toFixed(2)} km/s</strong></div>
      <div><span>Arrival v∞</span><strong>{result.arrivalVInfinityKmS.toFixed(2)} km/s</strong></div>
      <div><span>Departure C3</span><strong>{result.departureC3Km2S2.toFixed(2)} km²/s²</strong></div>
      <div><span>Flight</span><strong>{result.flightDays} days</strong></div>
      <div><span>Arrival date</span><strong>{result.arrivalDate}</strong></div>
      <div><span>Propagated endpoint difference</span><strong>{result.propagatedTargetErrorKm.toFixed(3)} km</strong></div>
    </div>}
    <p className="transfer-disclaimer">
      <b>Model boundaries:</b> Orekit IodLambert + KeplerianPropagator use Sun-centered two-body dynamics and JPL approximate states.
      Estimated ideal injection and circular-capture burns use JPL planetary gravities/reference radii with patched-conic assumptions, so they are <b>not complete mission Δv</b>.
      They exclude ascent, injection geometry/plane changes, gravity assists, aerobraking, station-keeping and multi-burn trajectories.
      Ion/Hall finite-thrust trajectories require a different optimizer; this feature computes impulsive maneuvers only.
      <a href="https://ssd.jpl.nasa.gov/astro_par.html" target="_blank" rel="noreferrer"> JPL gravity data ↗</a>
      <a href="https://www.orekit.org/" target="_blank" rel="noreferrer"> Orekit ↗</a>
    </p>
  </section>;
}
