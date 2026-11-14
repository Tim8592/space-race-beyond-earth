import { useEffect, useState } from 'react';
import { planetAtDate, type PlanetId } from './lib/orbitalMechanics';

const ENDPOINT = 'http://127.0.0.1:8787';
const DAY = 86400000;

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

function velocityAtDate(id:PlanetId,date:Date):number[] {
  const before=planetAtDate(id,new Date(date.getTime()-DAY));
  const after=planetAtDate(id,new Date(date.getTime()+DAY));
  return [
    (after.xAu-before.xAu)/2,
    (after.yAu-before.yAu)/2,
    (after.zAu-before.zAu)/2,
  ];
}

export default function TransferPlanner({onSolved}:{onSolved:(solution:LambertSolution)=>void}) {
  const [date,setDate] = useState('2027-02-01');
  const [target,setTarget] = useState<PlanetId>('mars');
  const [flightDays,setFlightDays] = useState(260);
  const [working,setWorking] = useState(false);
  const [online,setOnline] = useState(false);
  const [message,setMessage] = useState('Checking local Orekit transfer service…');
  const [result,setResult] = useState<LambertSolution|null>(null);
  useEffect(()=>{
    let mounted=true;
    fetch(ENDPOINT+'/health').then(r=>{
      if(!r.ok)throw new Error('offline');
      if(mounted){setOnline(true);setMessage('Orekit service online — ready to solve.');}
    }).catch(()=>{
      if(mounted){setOnline(false);setMessage('Orekit backend offline. You can still explore planetary orbits. Run Start Orekit.command to enable transfer solving.');}
    });
    return ()=>{mounted=false;};
  },[]);

  async function solve() {
    setWorking(true); setMessage('Solving transfer with Orekit…');
    try {
      const dep=new Date(date+'T12:00:00Z');
      const arrival=new Date(dep.getTime()+flightDays*DAY);
      if(!Number.isFinite(dep.getTime()) || arrival.getUTCFullYear()>2050) {
        throw new Error('Choose a valid departure date with arrival before 2051.');
      }
      const e=planetAtDate('earth',dep);
      const targetPos=planetAtDate(target,arrival);
      const prograde=(e.xAu*targetPos.yAu-e.yAu*targetPos.xAu)>=0;
      const response=await fetch(ENDPOINT+'/api/lambert',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          departurePositionAu:[e.xAu,e.yAu,e.zAu],
          arrivalPositionAu:[targetPos.xAu,targetPos.yAu,targetPos.zAu],
          departureVelocityAuPerDay:velocityAtDate('earth',dep),
          arrivalVelocityAuPerDay:velocityAtDate(target,arrival),
          flightDays,
          prograde,
          samples:160,
        }),
      });
      const data=await response.json() as LambertResult&{error?:string};
      if(!response.ok)throw new Error(data.error||'Transfer solver error');
      if(!Array.isArray(data.trajectoryAu)||data.trajectoryAu.length<8)throw new Error('Invalid Orekit response');
      const solved={...data,departureDate:date,arrivalDate:arrival.toISOString().slice(0,10),target};
      setResult(solved);onSolved(solved);setOnline(true);
      setMessage('Impulsive two-body transfer solved. Check v-infinity and modeled limitations.');
    } catch(error) {
      const reason=error instanceof Error?error.message:'Unknown problem';
      setMessage(reason.includes('Failed to fetch')?
        'Orekit is not running. Double-click Start Orekit.command on your Mac, then try again.':
        reason);
    }finally{setWorking(false)}
  }
  return <section className="transfer-panel" aria-label="Orekit transfer planning">
    <div className="transfer-header">
      <div><div className="eyebrow">TRAJECTORY ENGINE / OREKIT 13.1.9</div>
        <h3>Earth → planetary transfer</h3>
        <p>Specify departure and flight duration. Orekit computes an impulsive Lambert arc and its relative encounter speeds.</p>
      </div>
      <span className={'transfer-engine-status '+(online?'online':'offline')}>{online?'● ENGINE ONLINE':'○ JAVA ENGINE OFFLINE'}</span>
    </div>
    <div className="transfer-inputs">
      <label>Destination
        <select value={target} onChange={e=>{setTarget(e.target.value as PlanetId);setResult(null);}}>
          <option value="venus">Venus</option><option value="mars">Mars</option><option value="jupiter">Jupiter</option>
        </select>
      </label>
      <label>Departure date (UTC)
        <input type="date" min="2026-11-14" max="2040-12-31" value={date} onChange={e=>{setDate(e.target.value);setResult(null);}}/>
      </label>
      <label>Flight duration
        <input type="number" min="3" max="3000" step="5" value={flightDays}
          onChange={e=>{const n=e.currentTarget.valueAsNumber;if(Number.isFinite(n))setFlightDays(Math.min(3000,Math.max(3,n)));setResult(null);}}/>
        <small>days (3–3000)</small>
      </label>
      <button type="button" className="launch-button" disabled={working} onClick={solve}>{working?'Computing…':'Solve with Orekit'} <span>↗</span></button>
    </div>
    <p className={'transfer-message '+(online?'online':'')}>{message}</p>
    {result&&<div className="transfer-stats">
      <div><span>Departure v∞</span><strong>{result.departureVInfinityKmS.toFixed(2)} km/s</strong></div>
      <div><span>Arrival v∞</span><strong>{result.arrivalVInfinityKmS.toFixed(2)} km/s</strong></div>
      <div><span>Departure C3</span><strong>{result.departureC3Km2S2.toFixed(2)} km²/s²</strong></div>
      <div><span>Flight</span><strong>{result.flightDays} days</strong></div>
      <div><span>Arrival date</span><strong>{result.arrivalDate}</strong></div>
      <div><span>Propagated endpoint difference</span><strong>{result.propagatedTargetErrorKm.toFixed(3)} km</strong></div>
    </div>}
    <p className="transfer-disclaimer">
      <b>Physics scope:</b> Orekit IodLambert + KeplerianPropagator use Sun-centered two-body dynamics and JPL approximate planetary states.
      The line is a mathematically calculated transfer, not a thrusting trajectory. C3 and v∞ are <b>not</b> spacecraft launch/capture delta-V.
      No gravity assists, finite-thrust trajectory, eclipses, propulsion life, launch site or deep-space power constraints.
      See <a href="https://www.orekit.org/" target="_blank" rel="noreferrer">Orekit ↗</a> and the project's transfer-service README.
    </p>
  </section>;
}
