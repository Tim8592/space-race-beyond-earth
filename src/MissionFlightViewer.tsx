import {useEffect,useMemo,useState} from 'react';
import type {CampaignRun} from './CampaignMissions';
import {flightEta,flightProgress} from './lib/flightProgress';
import {tryOrekitFlightPath} from './missionFlightTrajectory';

type Props={run:CampaignRun;nowMs:number};
const W=640,H=340;
type Point={x:number;y:number};
function fitTrajectory(trajectory:number[][]):Point[]{
 const points=trajectory.filter(p=>p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1]));
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
 const scale=Math.min(490/Math.max(.01,xmax-xmin),240/Math.max(.01,ymax-ymin));
 return points.map(p=>({x:W/2+(p[0]-(xmin+xmax)/2)*scale,
   y:H/2-(p[1]-(ymin+ymax)/2)*scale}));
}
function fallbackPath(target:CampaignRun['target']):Point[]{
 return Array.from({length:151},(_,i)=>{
  const t=i/150;
  if(target==='ellipse'||target==='lunar'){
   const e=target==='lunar'?.79:.36;
   const theta=2*Math.PI*(.03+t*.86);
   const radius=90*(1-e*e)/(1+e*Math.cos(theta));
   return {x:245+Math.cos(theta)*radius*2.15,y:170-Math.sin(theta)*radius};
  }
  const p0={x:65,y:223},p1={x:190,y:38},p2={x:405,y:275},p3={x:575,y:104};
  return {x:(1-t)**3*p0.x+3*(1-t)**2*t*p1.x+3*(1-t)*t*t*p2.x+t**3*p3.x,
    y:(1-t)**3*p0.y+3*(1-t)**2*t*p1.y+3*(1-t)*t*t*p2.y+t**3*p3.y};
 });
}
export default function MissionFlightViewer({run,nowMs}:Props){
 const status=flightProgress(run.startedAtMs??nowMs,nowMs,run.viewerDurationMs);
 const [onlinePath,setOnlinePath]=useState<number[][]|null>(null);
 const [checking,setChecking]=useState(false);
 const target=run.target;
 const isPlanetary=target==='mars'||target==='jupiter';
 const saved=run.orekitTrajectoryAu??null;
 useEffect(()=>{
  if(!isPlanetary||saved?.length)return;
  const controller=new AbortController();
  setChecking(true);
  tryOrekitFlightPath(run.departureDate,target,Math.round(run.route.flightDays),
    controller.signal).then(result=>{
      if(!controller.signal.aborted)setOnlinePath(result?.trajectoryAu??null);
  }).finally(()=>{if(!controller.signal.aborted)setChecking(false)});
  return ()=>controller.abort();
 },[isPlanetary,saved,run.departureDate,run.route.flightDays,target]);
 const orekit=isPlanetary&&(saved?.length??0)>=8?saved:
   isPlanetary&&onlinePath?.length?onlinePath:null;
 const points=useMemo(()=>orekit?fitTrajectory(orekit):fallbackPath(target),
   [orekit,target]);
 const path=points.map((p,i)=>(i===0?'M':'L')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');
 const at=Math.min(points.length-1,status.fraction*(points.length-1));
 const p0=points[Math.floor(at)],p1=points[Math.min(points.length-1,Math.ceil(at))];
 const k=at-Math.floor(at);
 const ship={x:p0.x+(p1.x-p0.x)*k,y:p0.y+(p1.y-p0.y)*k};
 const start=points[0],end=points[points.length-1];
 const targetName=target==='lunar'?'MOON':target==='ellipse'?'HIGH EARTH ORBIT':
   target==='mars'?'MARS':target==='jupiter'?'JUPITER':'ASTEROID SURVEY';
 const fallbackMessage=target==='lunar'||target==='ellipse'
    ?'Orekit elliptical viewer not available — using an illustrative Earth-orbit transfer animation.'
    :target==='asteroid'
    ?'Orekit trajectory unavailable for synthetic asteroid — showing an illustrative survey transfer.'
    :checking?'Checking local Orekit Lambert service…'
    :'Orekit trajectory viewer not available — showing a simplified, non-propagated transfer.';
 return <div className="mission-flight-viewer" aria-label="Timed mission-specific spacecraft animation">
   <div className="mission-flight-title"><div>
     <div className="eyebrow">FLIGHT DIRECTORATE / LIVE SIMULATION</div>
     <h3>{run.title}</h3><p>{targetName} · {status.ready?'Simulated flight complete — ready for debrief':'Simulated flight underway'}</p>
   </div><strong>{Math.round(status.fraction*100)}%</strong></div>
   <div className="mission-flight-scene">
     <svg viewBox={`0 0 ${W} ${H}`} role="img"
       aria-label={orekit?'Orekit computed Sun-centred Lambert trajectory and simulated spacecraft progress':'Simplified mission-specific flight animation with current spacecraft progress'}>
       <defs><radialGradient id="mission-globe"><stop offset="0" stopColor="#b2d9fa"/>
         <stop offset="1" stopColor="#315c9d"/></radialGradient></defs>
       <rect width={W} height={H} fill="#071424" rx="8"/>
       {Array.from({length:60},(_,i)=><circle key={i} cx={9+(i*159)%627} cy={14+(i*113)%320}
          r={i%5===0?1.2:.5} fill="#c2e1ff" opacity=".4"/>)}
       {target==='lunar'&&<circle cx="555" cy="105" r="37" fill="#858d9c" stroke="#bbcbd5" opacity=".7"/>}
       {(target==='lunar'||target==='ellipse')&&<circle cx="245" cy="170" r="29"
          fill="url(#mission-globe)" stroke="#9ccff0"/>}
       {(target==='mars'||target==='jupiter'||target==='asteroid')&&<>
          <circle cx={start.x} cy={start.y} r="12" fill="url(#mission-globe)" stroke="#bde5ff"/>
          <circle cx={end.x} cy={end.y} r={target==='jupiter'?25:15}
            fill={target==='jupiter'?'#cbb087':target==='mars'?'#e1a07f':'#a8acb2'}
            stroke="#fae0bb"/>
        </>}
       <path d={path} fill="none" stroke="#688ba2" strokeWidth="2" strokeDasharray="5 7" opacity=".9"/>
       <path d={points.slice(0,Math.max(2,Math.ceil(status.fraction*(points.length-1))+1))
         .map((p,i)=>(i===0?'M':'L')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ')}
         fill="none" stroke="#f5c47e" strokeWidth="3"/>
       <circle cx={ship.x} cy={ship.y} r="8" fill="#ffe7b9" stroke="#f6b568" strokeWidth="2"/>
       <path d={`M ${ship.x-7} ${ship.y} h 14 M ${ship.x} ${ship.y-7} v 14`}
         stroke="#4b6c82" strokeWidth="2"/>
       <text x="19" y="25" fontSize="11" fill="#bcd4e7">
         {orekit?'OREKIT LAMBERT / CALCULATED CONIC':'ILLUSTRATIVE / NOT SOLVED EPHEMERIS'}
       </text>
       <text x="19" y={H-19} fontSize="11" fill="#c2d5e4">
         REAL PLAYBACK {flightEta(status.remainingMs)} LEFT · MODELED CRUISE {run.durationDays} GAME DAYS
       </text>
     </svg>
   </div>
   <p className="mission-flight-model-note">{orekit?
     'Orekit 13.1.9 calculated an impulsive Sun-centred Lambert trajectory from JPL approximate planet positions. The moving spacecraft position is accelerated playback, not an actual thrust or navigation simulation.':
     fallbackMessage}</p>
   <div className="mission-flight-timeline"><div className="mission-flight-rail">
       <span style={{width:(status.fraction*100).toFixed(1)+'%'}}/>
     </div><div><strong>{Math.round(status.fraction*100)}% complete</strong>
     <span>Estimated real time remaining: {flightEta(status.remainingMs)}</span></div></div>
 </div>;
}
