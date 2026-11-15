import { useEffect, useMemo, useState } from 'react';
import TransferPlanner, {type LambertSolution} from './TransferPlanner';
import FieldHelp from './components/FieldHelp';
import {
  EARTH_RADIUS_KM, PLANETS, earthOrbitAtTime, planetAtDate,
  type PlanetId,
} from './lib/orbitalMechanics';

const W = 780;
const H = 480;
const CX = W / 2;
const CY = H / 2;
const BASE_DATE = Date.parse('2026-11-14T12:00:00Z');
const MS_PER_DAY = 86400000;

function formatted(n: number, decimals = 2): string {
  return n.toLocaleString('en-US',{maximumFractionDigits:decimals});
}

export default function OrbitalLab({
  initialAltitudeKm=400,initialEccentricity=.25,initialMode='earth',
  initialDayOffset=0,initialTarget='mars',onTransferSolved,
}:{
  initialAltitudeKm?:number;initialEccentricity?:number;
  initialMode?:'earth'|'heliocentric';initialDayOffset?:number;initialTarget?:PlanetId;
  onTransferSolved?:(transfer:LambertSolution)=>void;
}) {
  const [mode,setMode] = useState<'earth'|'heliocentric'>(initialMode);
  const [perigeeKm,setPerigeeKm] = useState(Math.max(180,Math.min(1500,initialAltitudeKm)));
  const [eccentricity,setEccentricity] = useState(Math.max(0,Math.min(.8,initialEccentricity)));
  const [periapsisAngle,setPeriapsisAngle] = useState(20);
  const [elapsedMinutes,setElapsedMinutes] = useState(0);
  const [dayOffset,setDayOffset] = useState(Math.max(0,Math.min(3200,initialDayOffset)));
  const [outerView,setOuterView] = useState(initialTarget==='jupiter');
  const [selectedPlanet,setSelectedPlanet] = useState<PlanetId>(initialTarget);
  const [running,setRunning] = useState(false);
  const [transfer,setTransfer] = useState<LambertSolution|null>(null);

  const earthState = useMemo(
    () => earthOrbitAtTime(perigeeKm,eccentricity,elapsedMinutes,periapsisAngle),
    [perigeeKm,eccentricity,elapsedMinutes,periapsisAngle],
  );
  const apogeeRadius = EARTH_RADIUS_KM + earthState.apogeeAltitudeKm;
  const earthScale = Math.min(220 / apogeeRadius, 220 / EARTH_RADIUS_KM);
  const earthPath = useMemo(()=>{
    return Array.from({length:241},(_,i)=>{
      const state=earthOrbitAtTime(perigeeKm,eccentricity,earthState.periodMinutes*i/240,periapsisAngle);
      return `${i===0?'M':'L'} ${(CX+state.xKm*earthScale).toFixed(2)} ${(CY-state.yKm*earthScale).toFixed(2)}`;
    }).join(' ')+' Z';
  },[perigeeKm,eccentricity,periapsisAngle,earthState.periodMinutes,earthScale]);

  const utcDate = useMemo(()=>new Date(BASE_DATE+dayOffset*MS_PER_DAY),[dayOffset]);
  const planetIds: PlanetId[] = outerView ? ['venus','earth','mars','jupiter'] : ['venus','earth','mars'];
  const planetScale = outerView ? 39 : 124; // px/AU; projected J2000 ecliptic XY
  const planets = useMemo(()=>planetIds.map(id=>({
    id,
    location:planetAtDate(id,utcDate),
  })),[utcDate,outerView]);
  const solarPaths = useMemo(()=>{
    return planetIds.map(id=>{
      const base=PLANETS[id].base[0];
      const periodDays = 365.2568983*Math.pow(base,1.5);
      const pts=Array.from({length:201},(_,i)=>{
        const d=new Date(utcDate.getTime()+periodDays*i/200*MS_PER_DAY);
        const p=planetAtDate(id,d);
        return `${i===0?'M':'L'} ${(CX+p.xAu*planetScale).toFixed(2)} ${(CY-p.yAu*planetScale).toFixed(2)}`;
      });
      return { id, d:pts.join(' ')+' Z' };
    });
  },[outerView,utcDate,planetScale]);

  useEffect(()=>{
    if(!running)return;
    const timer=window.setInterval(()=>{
      if(mode==='earth'){
        setElapsedMinutes(t=>t+2);
      }else{
        setDayOffset(t=>(t+2)%3200);
      }
    },90);
    return ()=>window.clearInterval(timer);
  },[running,mode]);

  const transferPath = useMemo(() => transfer ? transfer.trajectoryAu.filter(p=>p.length>=2&&p.every(Number.isFinite))
    .map((p,i)=>`${i===0?'M':'L'} ${(CX+p[0]*planetScale).toFixed(2)} ${(CY-p[1]*planetScale).toFixed(2)}`).join(' ') : '',
    [transfer,planetScale]);
  const selectedInfo=planetAtDate(selectedPlanet,utcDate);
  const spacecraftX=CX+earthState.xKm*earthScale;
  const spacecraftY=CY-earthState.yKm*earthScale;
  const colors:Record<PlanetId,string>={
    venus:'#f4d28f',earth:'#80baff',mars:'#ed916f',jupiter:'#d6b58c'
  };
  const earthRadiusPixels=EARTH_RADIUS_KM*earthScale;

  return (
    <section className="panel orbital-lab" id="orbital-lab">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">ORBITAL MECHANICS / INTERACTIVE</div>
          <h2>Orbital Map & Simulation</h2>
          <p>Propagate real Keplerian orbits. Adjust the elements, advance time and inspect orbital positions.</p>
        </div>
        <span className="sys-model-label">TWO-BODY · OPTIONAL OREKIT</span>
      </div>
      <div className="orbit-tab-row" role="tablist" aria-label="Map coordinate system">
        <button type="button" className={mode==='earth'?'selected':''} aria-selected={mode==='earth'} role="tab" onClick={()=>{setMode('earth');setRunning(false);}}>Earth satellite orbit</button>
        <button type="button" className={mode==='heliocentric'?'selected':''} aria-selected={mode==='heliocentric'} role="tab" onClick={()=>{setMode('heliocentric');setRunning(false);}}>Planet positions</button>
      </div>

      <div className="orbit-toolbar">
        <button className="secondary-button" onClick={()=>setRunning(v=>!v)}>{running?'❚❚ Pause':'▶ Play'}</button>
        <button className="secondary-button" onClick={()=>{setRunning(false);mode==='earth'?setElapsedMinutes(0):setDayOffset(0);}}>Reset time</button>
        <span className="orbit-current-time">{mode==='earth'? `T + ${formatted(elapsedMinutes,0)} min`:utcDate.toISOString().slice(0,10)+' UTC'}</span>
      </div>
      <div className="orbit-simulator-grid">
        <div className="orbit-large-map">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={mode==='earth'?'Calculated elliptical Earth satellite orbit':'Calculated approximate JPL planetary positions'}>
            <defs>
              <radialGradient id="simEarth"><stop offset="0%" stopColor="#52a8d9"/><stop offset="100%" stopColor="#103757"/></radialGradient>
              <radialGradient id="simSun"><stop offset="0%" stopColor="#fff5a5"/><stop offset="70%" stopColor="#ffbc64"/><stop offset="100%" stopColor="#aa5c28"/></radialGradient>
              <pattern id="simGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" stroke="#6d8caa" strokeOpacity=".12" fill="none"/></pattern>
            </defs>
            <rect width={W} height={H} fill="#081527"/>
            <rect width={W} height={H} fill="url(#simGrid)"/>
            <line x1={CX} y1="0" x2={CX} y2={H} stroke="#6d8caa" strokeOpacity=".2"/>
            <line x1="0" y1={CY} x2={W} y2={CY} stroke="#6d8caa" strokeOpacity=".2"/>
            {mode==='earth' ? <>
              <path d={earthPath} fill="none" stroke="#7fc0f9" strokeWidth="2.5"/>
              <circle cx={CX} cy={CY} r={earthRadiusPixels} fill="url(#simEarth)" stroke="#71b0e2" strokeWidth="1.5"/>
              <text x={CX} y={CY+4} fill="#e1f3ff" fontSize="12" textAnchor="middle" letterSpacing="2">EARTH</text>
              <line x1={CX} y1={CY} x2={spacecraftX} y2={spacecraftY} stroke="#97aec5" strokeDasharray="5 5" strokeOpacity=".7"/>
              <circle cx={spacecraftX} cy={spacecraftY} r="8" fill="#f6c278" stroke="#fff5da" strokeWidth="2"/>
              <text x="22" y="32" fontSize="13" fill="#b6d4e9">EARTH CENTER AT FOCUS</text>
            </> : <>
              {solarPaths.map(path=><path key={path.id} d={path.d} fill="none" stroke={colors[path.id]} strokeWidth="1.5" strokeOpacity=".65"/>)}
              {transferPath && <path d={transferPath} fill="none" stroke="#ffc274" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".96"/>}
              {transfer && transfer.trajectoryAu.length>0 && <>
                <circle cx={CX+transfer.trajectoryAu[0][0]*planetScale} cy={CY-transfer.trajectoryAu[0][1]*planetScale} r="5" fill="#e7f6ff"/>
                <circle cx={CX+transfer.trajectoryAu[transfer.trajectoryAu.length-1][0]*planetScale}
                  cy={CY-transfer.trajectoryAu[transfer.trajectoryAu.length-1][1]*planetScale} r="5" fill="#ffbc88"/>
              </>}
              <circle cx={CX} cy={CY} r="12" fill="url(#simSun)"/>
              <text x={CX+18} y={CY+4} fill="#eacb7c" fontSize="11">SUN</text>
              {planets.map(({id,location})=><g
                key={id}
                role="button" tabIndex={0}
                aria-label={`Inspect ${PLANETS[id].label}`}
                onClick={()=>setSelectedPlanet(id)}
                onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setSelectedPlanet(id)}}
                style={{cursor:'pointer'}}
              >
                <circle cx={CX+location.xAu*planetScale} cy={CY-location.yAu*planetScale} r={selectedPlanet===id?10:7} fill={colors[id]} stroke="#ffffff" strokeWidth={selectedPlanet===id?2:0.5}/>
                <text x={CX+location.xAu*planetScale+10} y={CY-location.yAu*planetScale-11} fill="#e5ecf5" fontSize="12">{id==='earth'?'Earth*':PLANETS[id].label}</text>
              </g>)}
              <text x="22" y="32" fontSize="12" fill="#b6d4e9">J2000 ECLIPTIC XY · {outerView?'OUTER':'INNER'} VIEW</text>
            </>}
            <text x="22" y={H-18} fontSize="12" fill="#87a5c0">{mode==='earth'?'Two-body, no drag/J2/perturbations; proportional scale':transfer?'Orekit Lambert conic + JPL approximate planet positions':'JPL Table 1 approximate elements; no solved transfer'}</text>
          </svg>
        </div>
        <div className="orbit-controls">
          {mode==='earth'?<>
            <label>Perigee altitude <FieldHelp term="Perigee altitude"/> <strong>{formatted(perigeeKm,0)} km</strong><input type="range" min="180" max="10000" step="20" value={perigeeKm} onChange={e=>{setPerigeeKm(Number(e.target.value));setElapsedMinutes(0);}}/></label>
            <label>Eccentricity <FieldHelp term="Eccentricity"/> <strong>{eccentricity.toFixed(2)}</strong><input type="range" min="0" max="0.8" step="0.01" value={eccentricity} onChange={e=>{setEccentricity(Number(e.target.value));setElapsedMinutes(0);}}/></label>
            <label>Periapsis orientation <FieldHelp term="Periapsis orientation"/> <strong>{formatted(periapsisAngle,0)}°</strong><input type="range" min="0" max="360" step="5" value={periapsisAngle} onChange={e=>setPeriapsisAngle(Number(e.target.value))}/></label>
            <label>Elapsed time (one period) <FieldHelp term="Elapsed time (one period)"/> <strong>{formatted((elapsedMinutes%earthState.periodMinutes+earthState.periodMinutes)%earthState.periodMinutes,0)} min</strong><input type="range" min="0" max={earthState.periodMinutes} step="0.5" value={(elapsedMinutes%earthState.periodMinutes+earthState.periodMinutes)%earthState.periodMinutes} onChange={e=>{setElapsedMinutes(Number(e.target.value));setRunning(false);}}/></label>
            <div className="orbit-data-grid">
              <div><span>Period</span><strong>{formatted(earthState.periodMinutes,1)} min</strong></div>
              <div><span>Speed now</span><strong>{formatted(earthState.speedKmS,3)} km/s</strong></div>
              <div><span>Perigee</span><strong>{formatted(earthState.perigeeAltitudeKm,0)} km</strong></div>
              <div><span>Apogee</span><strong>{formatted(earthState.apogeeAltitudeKm,0)} km</strong></div>
              <div><span>Semimajor axis</span><strong>{formatted(earthState.semimajorAxisKm,0)} km</strong></div>
              <div><span>Radius now</span><strong>{formatted(earthState.radiusKm,0)} km</strong></div>
            </div>
          </>:<>
            <label>Display scale <FieldHelp term="Display scale"/>
              <select value={outerView?'outer':'inner'} onChange={e=>setOuterView(e.target.value==='outer')}><option value="inner">Inner solar system (Venus–Mars)</option><option value="outer">Through Jupiter</option></select>
            </label>
            <label>Simulation date <FieldHelp term="Simulation date"/> <strong>{utcDate.toISOString().slice(0,10)}</strong><input type="range" min="0" max="3200" step="1" value={dayOffset} onChange={e=>{setDayOffset(Number(e.target.value));setRunning(false);}}/></label>
            <label>Inspect planet <FieldHelp term="Inspect planet"/>
              <select value={selectedPlanet} onChange={e=>setSelectedPlanet(e.target.value as PlanetId)}>{Object.entries(PLANETS).map(([id,p])=><option key={id} value={id}>{p.label}</option>)}</select>
            </label>
            <div className="orbit-data-grid">
              <div><span>Heliocentric distance</span><strong>{formatted(selectedInfo.distanceAu,4)} AU</strong></div>
              <div><span>Ecliptic X</span><strong>{formatted(selectedInfo.xAu,3)} AU</strong></div>
              <div><span>Ecliptic Y</span><strong>{formatted(selectedInfo.yAu,3)} AU</strong></div>
              <div><span>Ecliptic Z</span><strong>{formatted(selectedInfo.zAu,3)} AU</strong></div>
            </div>
          </>}
        </div>
      </div>
      {mode==='heliocentric' && <TransferPlanner
        initialDate={utcDate.toISOString().slice(0,10)}
        initialTarget={initialTarget==='jupiter'?'jupiter':initialTarget==='venus'?'venus':'mars'}
        onSolved={s=>{
        onTransferSolved?.(s);
        setTransfer(s);
        setSelectedPlanet(s.target);
        setOuterView(s.target==='jupiter');
        setRunning(false);
        const days = Math.round((Date.parse(s.departureDate+'T12:00:00Z')-BASE_DATE)/MS_PER_DAY);
        setDayOffset(Math.max(0,days));
      }}/>}
      <p className="sys-subnote">
        Calculated positions, not a decorative orbit. Earth view uses Newtonian two-body gravity and Kepler's equation; solar view uses JPL's published approximate elements valid from 1800–2050, with UTC substituted for TDB for interactive display.
        {' '}<a href="https://ssd.jpl.nasa.gov/planets/approx_pos.html" target="_blank" rel="noreferrer">JPL equations and validity ↗</a>
        {' '}*Earth marker is technically the Earth–Moon barycenter. A solved Orekit Lambert arc represents an idealized impulsive Sun-centered two-body transfer between approximate planet positions. It is not a finite-thrust trajectory, launch-window optimizer, gravity-assist solution or spacecraft feasibility assessment. Transfer arcs remain fixed to the selected dates while you move the map time slider.
      </p>
    </section>
  );
}
