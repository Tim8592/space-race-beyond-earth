import {useEffect,useMemo,useState} from 'react';
import type {CampaignRun} from './CampaignMissions';
import {flightEta,flightProgress} from './lib/flightProgress';
import {EARTH} from './lib/nasaData';
import {earthOrbitAtTime,planetAtDate} from './lib/orbitalMechanics';
import {earthKeplerTrack,hohmannTrack,lunarKeplerTrack,
  moonMeanPositionKm,pointAtFraction,type PhysicalPoint} from './lib/flightDirectoratePhysics';
import {tryOrekitFlightPath,tryOrekitEarthOrbitPath,type EarthOrekitOrbit} from './missionFlightTrajectory';

/**
 * Accurate model geometry is always drawn in actual distance units.
 * Orekit: Keplerian Earth orbit / impulsive Sun-centered Lambert, if running.
 * Without Java: exactly solved Keplerian two-body trajectories for Earth
 * and a first-order lunar transfer, or an ideal Hohmann orbit about the Sun.
 * This component NEVER substitutes a hand-drawn cubic animation for physics.
 */
type FlightPlayable={
  title:string;target:CampaignRun['target'];
  durationDays:number;departureDate:string;
  startedAtMs:number;viewerDurationMs:number;
  route:{flightDays:number};
  orekitTrajectoryAu?:number[][];
  options?:{perigeeKm?:number;eccentricity?:number};
};
type Props={run:FlightPlayable;nowMs:number};
const W=640,H=340,AU_KM=149597870.7,DAY_MS=86400000;
const finite=(v:number)=>Number.isFinite(v);
const numeric=(value:number,decimals=1)=>value.toLocaleString('en-US',{maximumFractionDigits:decimals});
const svgPath=(points:readonly {x:number;y:number}[])=>points.map((p,i)=>
  (i===0?'M ':'L ')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');
function interpolate(points:readonly PhysicalPoint[],fraction:number):PhysicalPoint{
 return pointAtFraction(points,fraction);
}
function dateAt(departure:Date,days:number){
 return new Date(departure.getTime()+days*DAY_MS);
}
const targetLabel=(target:FlightPlayable['target'])=>
 target==='lunar'?'MOON':target==='ellipse'?'EARTH ORBIT':
 target==='mars'?'MARS':target==='jupiter'?'JUPITER':'SYNTHETIC ASTEROID';
function vectorDistance(a:PhysicalPoint,b:PhysicalPoint){
 return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
}
function project(source:PhysicalPoint,scale:number,zoom:number){
 return {x:W/2+source[0]*scale*zoom,y:H/2-source[1]*scale*zoom};
}
export default function MissionFlightViewer({run,nowMs}:Props){
 const status=flightProgress(run.startedAtMs??nowMs,nowMs,run.viewerDurationMs);
 const target=run.target;
 const isEarth=target==='ellipse'||target==='lunar';
 const isPlanet=target==='mars'||target==='jupiter';
 const departure=useMemo(()=>new Date(run.departureDate+'T12:00:00Z'),[run.departureDate]);
 const [zoom,setZoom]=useState(1);
 const [planetSolve,setPlanetSolve]=useState<{key:string;points:number[][]}|null>(null);
 const [earthSolve,setEarthSolve]=useState<{key:string;solution:EarthOrekitOrbit}|null>(null);
 const [checking,setChecking]=useState(false);
 const perigee=target==='ellipse'?Math.max(180,Math.min(1500,run.options?.perigeeKm??400)):400;
 const eccentricity=target==='ellipse'?Math.max(0,Math.min(.8,run.options?.eccentricity??.58)):0;
 const browserModel=useMemo(()=>{
   if(target==='ellipse')return earthKeplerTrack({perigeeAltitudeKm:perigee,eccentricity});
   if(target==='lunar')return lunarKeplerTrack(departure);
   return hohmannTrack(departure,target);
 },[departure,target,perigee,eccentricity]);
 const orbitRequest=useMemo(()=>{
   if(!isEarth)return null;
   const lunar=target==='lunar';
   const rp=EARTH.equatorialRadiusKm+400,ra=384400;
   const e=lunar?(ra-rp)/(ra+rp):eccentricity;
   const begin=browserModel.points[0];
   const angle=lunar?Math.atan2(begin[1],begin[0])*180/Math.PI:0;
   return {perigeeAltitudeKm:lunar?400:perigee,eccentricity:e,
     argumentPeriapsisDeg:angle,halfOrbit:lunar,samples:181};
 },[isEarth,target,eccentricity,perigee,browserModel]);
 const earthKey=orbitRequest?JSON.stringify(orbitRequest):'';
 useEffect(()=>{
   if(!orbitRequest)return;
   const controller=new AbortController();
   setEarthSolve(null);
   tryOrekitEarthOrbitPath(orbitRequest,controller.signal).then(solution=>{
     if(!controller.signal.aborted&&solution)
       setEarthSolve({key:JSON.stringify(orbitRequest),solution});
   });
   return ()=>controller.abort();
 },[earthKey]);
 const planetKey=isPlanet?
   run.departureDate+'|'+target+'|'+Math.round(run.route.flightDays):'';
 const saved=run.orekitTrajectoryAu;
 useEffect(()=>{
   if(!isPlanet||saved?.length)return;
   const controller=new AbortController();setChecking(true);
   tryOrekitFlightPath(run.departureDate,target,Math.round(run.route.flightDays),
     controller.signal).then(result=>{
       if(!controller.signal.aborted&&result)setPlanetSolve({key:planetKey,points:result.trajectoryAu});
   }).finally(()=>{if(!controller.signal.aborted)setChecking(false)});
   return ()=>controller.abort();
 },[planetKey,isPlanet,saved,run.departureDate,run.route.flightDays,target]);
 const validPoints=(points:unknown):points is number[][]=>Array.isArray(points)&&
   points.length>=8&&points.every(p=>Array.isArray(p)&&p.length>=3&&p.every(finite));
 const orekitPlanet=isPlanet&&validPoints(saved)?saved:
   isPlanet&&planetSolve?.key===planetKey&&validPoints(planetSolve.points)?planetSolve.points:null;
 const orekitEarth=isEarth&&earthSolve?.key===earthKey?earthSolve.solution:null;
 const points:PhysicalPoint[]=orekitPlanet?
   orekitPlanet.map(p=>[p[0],p[1],p[2]] as PhysicalPoint):
   orekitEarth?orekitEarth.trajectoryKm.map(p=>[p[0],p[1],p[2]] as PhysicalPoint):
   browserModel.points;
 const source=orekitPlanet?'Orekit Lambert / Sun two-body':
   orekitEarth?'Orekit KeplerianPropagator / Earth two-body':
   target==='ellipse'?'Browser Kepler / Earth two-body':
   target==='lunar'?'Browser Kepler / lunar-distance transfer':
   'Browser Kepler / ideal Sun-centered Hohmann';
 const elapsedGameDays=status.fraction*run.route.flightDays;
 const utc=dateAt(departure,elapsedGameDays);
 const orbitPeriodMinutes=orekitEarth?.periodMinutes??browserModel.orbitPeriodMinutes??0;
 const orbitalFraction=target==='ellipse'&&orbitPeriodMinutes>0?
   ((elapsedGameDays*1440/ orbitPeriodMinutes)%1+1)%1:0;
 const along=target==='ellipse'?orbitalFraction:
   orekitPlanet?status.fraction:
   Math.min(1,elapsedGameDays/Math.max(.001,browserModel.modeledFlightDays));
 const ship=interpolate(points,along);
 const central=browserModel.centralBody;
 const isSun=central==='sun';
 const outerRadius=isSun?browserModel.destinationRadius:
   Math.max(browserModel.destinationRadius,EARTH.equatorialRadiusKm+perigee);
 const scale=Math.min((W-110)/(2*outerRadius),(H-82)/(2*outerRadius));
 const pixels=points.map(p=>project(p,scale,zoom));
 const vessel=project(ship,scale,zoom);
 const origin=project([0,0,0],scale,zoom);
 const completedPath=svgPath(pixels.slice(0,Math.max(2,
   Math.min(pixels.length,Math.ceil(along*(pixels.length-1))+1))));
 const simulatedTarget:PhysicalPoint|null=isPlanet?
   (()=>{
     try{const b=planetAtDate(target,utc);return [b.xAu,b.yAu,b.zAu]}catch{return null}
   })():target==='lunar'?moonMeanPositionKm(utc):target==='asteroid'?
     [1.35*Math.cos(2*Math.PI*elapsedGameDays/(365.25*1.35**1.5)+.8),
      1.35*Math.sin(2*Math.PI*elapsedGameDays/(365.25*1.35**1.5)+.8),0]:null;
 const targetMarker=simulatedTarget?project(simulatedTarget,scale,zoom):null;
 const sunEarth=isSun?(()=>{
   try{const p=planetAtDate('earth',utc);return project([p.xAu,p.yAu,p.zAu],scale,zoom)}
   catch{return null}
 })():null;
 const miss=simulatedTarget?vectorDistance(ship,simulatedTarget):null;
 const rangeText=miss===null?null:isSun?
   numeric(miss*AU_KM/1e6,1)+' million km':
   numeric(miss,0)+' km';
 const currentRadius=Math.hypot(ship[0],ship[1],ship[2]);
 const velocity=target==='ellipse'?earthOrbitAtTime(perigee,eccentricity,elapsedGameDays*1440).speedKmS:
   target==='lunar'?earthOrbitAtTime(400,(384400-(EARTH.equatorialRadiusKm+400))/
      (384400+(EARTH.equatorialRadiusKm+400)),
      Math.min(browserModel.modeledFlightDays,elapsedGameDays)*1440).speedKmS:NaN;
 const sourceDisclaimer=orekitPlanet?
   'Orekit solves an impulsive heliocentric Lambert transfer between approximate JPL departure/arrival planet positions. Body motion and spacecraft position use the same accelerated mission clock; no launch-ascent, finite thrust, gravity assists or planetary capture are modeled.':
   orekitEarth?
   'Orekit KeplerianPropagator computes the Earth-centered two-body trajectory from orbital elements. This is not a high-fidelity numerical n-body mission simulation.':
   browserModel.caveat;
 const n=Math.max(0,Math.min(100,Math.round(status.fraction*100)));
 const trailLabel=target==='ellipse'?'Last part of propagated orbital revolution':'Propagated two-body spacecraft trajectory';
 return <div className="mission-flight-viewer" aria-label="Time-scaled physics-propagated spacecraft flight viewer">
   <div className="mission-flight-title"><div>
     <div className="eyebrow">FLIGHT DIRECTORATE / LIVE SIMULATION</div>
     <h3>{run.title}</h3><p>{targetLabel(target)} · {status.ready?'Simulation complete — debrief available':
       'Real orbital mechanics · accelerated mission clock'}</p>
   </div><strong>{n}%</strong></div>
   <div className="flight-physics-head">
     <div><small>PROPAGATOR</small><strong>{source}</strong></div>
     <div><small>UTC / SIMULATED</small><strong>{utc.toISOString().slice(0,16).replace('T',' ')}</strong></div>
     <div><small>MISSION TIME</small><strong>+{numeric(elapsedGameDays,2)} / {numeric(run.route.flightDays)} days</strong></div>
   </div>
   <div className="mission-flight-scene">
     <div className="flight-zoom-controls">
       <button type="button" aria-label="Zoom flight trajectory out" disabled={zoom<=.7}
         onClick={()=>setZoom(v=>Math.max(.7,Math.round((v-.25)*100)/100))}>−</button>
       <button type="button" onClick={()=>setZoom(1)}>Fit</button>
       <button type="button" aria-label="Zoom flight trajectory in" disabled={zoom>=3}
         onClick={()=>setZoom(v=>Math.min(3,Math.round((v+.25)*100)/100))}>+</button>
     </div>
     <svg viewBox={`0 0 ${W} ${H}`} role="img"
       aria-label={source+' calculated trajectory, true-distance scale, accelerated mission-time spacecraft position'}>
       <defs><radialGradient id="mission-globe"><stop offset="0" stopColor="#b2d9fa"/>
         <stop offset="1" stopColor="#315c9d"/></radialGradient></defs>
       <rect width={W} height={H} fill="#071424" rx="8"/>
       {Array.from({length:60},(_,i)=><circle key={i} cx={9+(i*159)%627} cy={14+(i*113)%320}
          r={i%5===0?1.2:.5} fill="#c2e1ff" opacity=".4"/>)}
       {isSun&&[1,browserModel.destinationRadius].map((r,i)=><circle key={i}
         cx={origin.x} cy={origin.y} r={r*scale*zoom}
         stroke={i===0?'#427698':'#705c42'} strokeWidth="1"
         strokeDasharray={i===0?'4 6':'3 7'} fill="none"/>)}
       {!isSun&&target==='lunar'&&<circle cx={origin.x} cy={origin.y}
         r={384400*scale*zoom} stroke="#607b93" strokeDasharray="4 7" fill="none"/>}
       <path d={svgPath(pixels)} fill="none" stroke="#6b91a9" strokeWidth="2"
         strokeDasharray={target==='ellipse'?'4 6':'none'} strokeLinejoin="round"/>
       <path d={completedPath} fill="none" stroke="#f6c682" strokeWidth="3"
         strokeLinecap="round" strokeLinejoin="round"/>
       {isSun?<><circle cx={origin.x} cy={origin.y} r={Math.max(2,.00465*scale*zoom)}
         fill="#fbd798" stroke="#fff0c0"/>
         <text x={origin.x+10} y={origin.y-9} fill="#f8d7a1" fontSize="11">SUN</text></>:
         <><circle cx={origin.x} cy={origin.y}
           r={Math.max(3,EARTH.equatorialRadiusKm*scale*zoom)}
           fill="url(#mission-globe)" stroke="#aacff2"/>
           <text x={origin.x+8} y={origin.y+20} fontSize="10" fill="#b9d7ed">EARTH</text></>}
       {sunEarth&&<><circle cx={sunEarth.x} cy={sunEarth.y} r="5" fill="#68aee3" stroke="#d3edff"/>
          <text x={sunEarth.x+9} y={sunEarth.y+15} fill="#a7cfe8" fontSize="10">EARTH</text></>}
       {targetMarker&&<><circle cx={targetMarker.x} cy={targetMarker.y}
         r={target==='jupiter'?8:target==='mars'?5:4}
         fill={target==='mars'?'#e9a27a':target==='jupiter'?'#d5b48a':'#a7a8b4'}
         stroke="#ffdbb0" strokeWidth="1.1"/>
         <text x={targetMarker.x+10} y={targetMarker.y-9} fontSize="10"
           fill="#f4d7af">{targetLabel(target)}</text></>}
       <circle cx={vessel.x} cy={vessel.y} r="7"
         fill="#ffe7b9" stroke="#f6b568" strokeWidth="2"/>
       <path d={`M ${vessel.x-7} ${vessel.y} h 14 M ${vessel.x} ${vessel.y-7} v 14`}
         stroke="#496b84" strokeWidth="1.7"/>
       <text x="18" y="25" fontSize="10" fill="#c2deeb">
         {orekitPlanet?'OREKIT / HELIOCENTRIC LAMBERT':
           orekitEarth?'OREKIT / EARTH KEPLERIAN':
           isEarth?'BROWSER / EARTH KEPLERIAN':
           'BROWSER / SOLAR KEPLERIAN'}
       </text>
       <text x="18" y={H-19} fill="#bbd6e9" fontSize="10">
         DISTANCE UNITS: {isSun?'AU':'KM'} · ORBIT GEOMETRY SCALED PROPORTIONALLY
       </text>
     </svg>
   </div>
   <div className="flight-physics-metrics">
     <div><small>CENTRAL BODY</small><strong>{isSun?'Sun':'Earth'}</strong></div>
     <div><small>DISTANCE FROM {isSun?'SUN':'EARTH'}</small>
       <strong>{isSun?numeric(currentRadius,3)+' AU':numeric(currentRadius,0)+' km'}</strong></div>
     {finite(velocity)?<div><small>INSTANTANEOUS TWO-BODY SPEED</small>
       <strong>{numeric(velocity,2)} km/s</strong></div>:
       <div><small>PROPAGATED COAST</small><strong>{numeric(browserModel.modeledFlightDays,1)} days (baseline)</strong></div>}
     {rangeText&&<div><small>{target==='lunar'?'APPROX. MOON OFFSET':'DISTANCE TO MOVING TARGET'}</small>
       <strong>{rangeText}</strong></div>}
   </div>
   <p className="mission-flight-model-note"><strong>Model:</strong> {sourceDisclaimer}
     {' '}{checking?'Checking optional local Orekit solver… ':''}
     {' '}The 105-second viewer accelerates a physically calculated coast; body symbols
     may be enlarged for visibility. {target==='ellipse'?trailLabel+'. ':''}
     For lunar cargo, landing is a separate simplified game event after transfer,
     not a solved powered descent.</p>
   <div className="mission-flight-timeline"><div className="mission-flight-rail">
       <span style={{width:(status.fraction*100).toFixed(1)+'%'}}/>
     </div><div><strong>{n}% complete</strong>
     <span>Estimated real time remaining: {flightEta(status.remainingMs)}</span></div></div>
 </div>;
}
