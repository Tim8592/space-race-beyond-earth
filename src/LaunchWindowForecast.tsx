import {useEffect,useMemo,useState} from 'react';
import {approximateDepartureWindows,tryOrekitDepartureWindows,
  type WindowForecast,type WindowPoint} from './lib/launchWindowForecast';
import {type MissionOptions,type MissionReview,type OrbitTarget,
  dateForGameDay} from './lib/campaignMissions';
type Props={
 target:OrbitTarget;day:number;options:MissionOptions;
 review:MissionReview;netDailyUsd:number;cashUsd:number;
 onOpenOrbital:()=>void;
};
const usd=(n:number)=>'$'+(n/1e6).toLocaleString('en-US',{maximumFractionDigits:2})+'M';
const kmps=(n:number)=>(n/1000).toFixed(3)+' km/s';
const W=760,H=256,LEFT=58,RIGHT=734,TOP=37,BOTTOM=209;
export default function LaunchWindowForecast({target,day,options,review,netDailyUsd,
 cashUsd,onOpenOrbital}:Props){
 const baseline=useMemo(()=>approximateDepartureWindows(target,day,options),
   [target,day,options]);
 const [refined,setRefined]=useState<WindowForecast|null>(null);
 const [checking,setChecking]=useState(false);
 const [selectedDate,setSelectedDate]=useState<string|null>(null);
 const canRefine=target==='mars'||target==='jupiter';
 useEffect(()=>{
   if(!canRefine||!baseline)return;
   const controller=new AbortController();
   setRefined(null);setChecking(true);
   tryOrekitDepartureWindows(target,day,options,review.route.flightDays,
     controller.signal).then(r=>{if(!controller.signal.aborted)setRefined(r)});
   return ()=>{controller.abort();setChecking(false)};
 },[target,day,options,review.route.flightDays]);
 const forecast=refined??baseline;
 const points=forecast?.points??[];
 const selected=points.find(p=>p.date===selectedDate)??forecast?.best??null;
 const minY=Math.min(...points.map(p=>p.requiredDeltaVms),review.totalDeltaVms);
 const maxY=Math.max(...points.map(p=>p.requiredDeltaVms),review.totalDeltaVms);
 const spread=Math.max(800,(maxY-minY)*.2);
 const lo=Math.max(0,minY-spread),hi=maxY+spread;
 const earliest=points[0]?.day??day,last=points.at(-1)?.day??day+1;
 const x=(p:WindowPoint)=>LEFT+(p.day-earliest)/Math.max(1,last-earliest)*(RIGHT-LEFT);
 const y=(v:number)=>BOTTOM-(v-lo)/Math.max(1,hi-lo)*(BOTTOM-TOP);
 const path=points.map((p,i)=>(i===0?'M':'L')+' '+x(p).toFixed(2)+' '+y(p.requiredDeltaVms).toFixed(2)).join(' ');
 const daysWait=(selected?.day??day)-day;
 const treasuryAtDeparture=cashUsd+daysWait*netDailyUsd;
 if(!forecast)return <div className="panel flight-window-forecast" aria-label="Flight review and future transfer energy">
   <div className="eyebrow">FLIGHT REVIEW / CURRENT AND FUTURE Δv</div>
   <h3>Launch-date comparison</h3>
   <p>Current modeled injection/capture requirement: <strong>{kmps(review.requiredDeltaVms)}</strong>.
     This mission uses {review.route.source}; its simplified model contains
     no defensible date-dependent departure-energy prediction.
     Changing a lunar or Earth ellipse date without a solved target ephemeris
     would not establish a lower-Δv launch window.</p>
   <button type="button" className="secondary-button" onClick={onOpenOrbital}>Open Orbital Map for orbital analysis ↗</button>
 </div>;
 return <div className="panel flight-window-forecast" aria-label="Flight review and future transfer energy">
   <div className="flight-window-head">
     <div><div className="eyebrow">FLIGHT REVIEW / DEPARTURE DATE VS REQUIRED Δv</div>
       <h3>When is the cheapest transfer?</h3>
       <p>For this project's unchanged spacecraft, target and modeled transfer duration,
         compare today's energy requirement with sampled future departure dates.
         A dashed horizontal line shows <strong>your installed propulsion capacity</strong>.
         A lower curve means less required Δv, not automatically greater profit.</p></div>
     <span className={'flight-window-source '+(refined?'orekit':'approx')}>
       {refined?'OREKIT LAMBERT · SAMPLED REAL CONICS':
         checking?'Checking Orekit departure dates…':'FALLBACK · GAME HOHMANN PHASE APPROXIMATION'}
     </span>
   </div>
   <div className="flight-window-summary">
     <div><small>DEPART TODAY · {dateForGameDay(day)}</small>
       <strong>{kmps(forecast.current.requiredDeltaVms)}</strong></div>
     <div><small>LOWEST SAMPLED DATE</small><strong>{forecast.best.date}</strong>
       <span>{kmps(forecast.best.requiredDeltaVms)} required</span></div>
     <div><small>POTENTIAL Δv SAVINGS</small>
       <strong>{Math.max(0,(forecast.current.requiredDeltaVms-forecast.best.requiredDeltaVms)/1000).toFixed(3)} km/s</strong>
       <span>Only a sampled minimum, not a global trajectory optimum</span></div>
     <div><small>INSTALLED SPACECRAFT + KICK STAGE</small>
       <strong>{kmps(review.totalDeltaVms)}</strong>
       <span>{review.totalDeltaVms>=forecast.best.requiredDeltaVms?'Best sampled window within modeled capacity':'Insufficient capacity even at sampled minimum'}</span></div>
   </div>
   <div className="flight-window-graph">
     <svg viewBox={`0 0 ${W} ${H}`} role="img"
       aria-label={'Launch date versus required delta V; sampled minimum '+forecast.best.date+
         ', '+Math.round(forecast.best.requiredDeltaVms)+' meters per second'}>
       <rect width={W} height={H} rx="7" fill="#091c2e"/>
       {[0,.25,.5,.75,1].map((u,i)=>{
         const v=lo+(hi-lo)*u;
         return <g key={i}><line x1={LEFT} y1={y(v)} x2={RIGHT} y2={y(v)}
           stroke="#31556a" opacity=".55" strokeDasharray="2 5"/>
           <text x={LEFT-10} y={y(v)+4} textAnchor="end" fill="#a9c5d7"
             fontSize="10">{(v/1000).toFixed(1)}</text></g>;
       })}
       <line x1={LEFT} y1={BOTTOM} x2={RIGHT} y2={BOTTOM} stroke="#6e8ba6"/>
       <line x1={LEFT} y1={TOP} x2={LEFT} y2={BOTTOM} stroke="#6e8ba6"/>
       <text x={LEFT} y="23" fill="#b6d3e6" fontSize="10">Δv required (km/s), includes 5% game margin</text>
       <line x1={LEFT} y1={y(review.totalDeltaVms)} x2={RIGHT}
         y2={y(review.totalDeltaVms)} stroke="#69dbb3" strokeWidth="1.5"
         strokeDasharray="8 5"/>
       <text x={RIGHT-4} y={Math.max(17,y(review.totalDeltaVms)-7)}
         textAnchor="end" fill="#8de6c9" fontSize="10">AVAILABLE Δv</text>
       <path d={path} fill="none" stroke="#82bff1" strokeWidth="2.8"
         strokeLinecap="round" strokeLinejoin="round"/>
       {points.map((p,i)=><g key={p.date} onClick={()=>setSelectedDate(p.date)}
         style={{cursor:'pointer'}}>
          <circle cx={x(p)} cy={y(p.requiredDeltaVms)} r={i===0?5:3.5}
            fill={p.date===selected?.date?'#ffe1a1':i===0?'#eab17a':'#7ab7e0'}
            stroke={p.date===selected?.date?'#fff5d6':'none'} strokeWidth="1.5"/>
          <circle cx={x(p)} cy={y(p.requiredDeltaVms)} r="9" fill="transparent"/>
         </g>)}
       <line x1={x(forecast.best)} y1={y(forecast.best.requiredDeltaVms)}
         x2={x(forecast.best)} y2={BOTTOM} stroke="#f9c17d" strokeDasharray="4 4"/>
       <text x={Math.min(RIGHT-16,x(forecast.best)+7)}
         y={Math.max(45,y(forecast.best.requiredDeltaVms)-13)}
         fill="#fbe1ac" fontSize="10">MIN Δv</text>
       <text x={LEFT} y={BOTTOM+19} fill="#aecad9" fontSize="10">{forecast.current.date}</text>
       <text x={RIGHT} y={BOTTOM+19} fill="#aecad9" textAnchor="end"
         fontSize="10">{points.at(-1)?.date}</text>
       <text x={W/2} y={H-9} fill="#aecad9" textAnchor="middle"
         fontSize="10">Future launch date → {points.length} samples, 28 game days apart</text>
     </svg>
   </div>
   <div className="flight-window-months" aria-label="Departure window date comparison choices">
     {points.map(p=><button key={p.date} type="button"
       aria-pressed={p.date===selected?.date}
       className={p.date===selected?.date?'selected':''}
       onClick={()=>setSelectedDate(p.date)}>
       <small>{p.date.slice(0,7)}</small><strong>{(p.requiredDeltaVms/1000).toFixed(2)}</strong>
       </button>)}
   </div>
   {selected&&<div className="flight-window-selected">
      <div><small>INSPECTED DEPARTURE</small><strong>{selected.date}</strong>
        <span>{daysWait===0?'Launch window today':'Wait '+daysWait+' game days'}</span></div>
      <div><small>REQUIRED (INCLUDING 5% MARGIN)</small><strong>{kmps(selected.requiredDeltaVms)}</strong></div>
      <div><small>INSTALLED ENERGY MARGIN</small>
        <strong className={review.totalDeltaVms>=selected.requiredDeltaVms?'good':'danger-text'}>
         {kmps(review.totalDeltaVms-selected.requiredDeltaVms)}</strong></div>
      <div><small>TREASURY IF WAITING (NO NEW MISSIONS)</small><strong>{usd(treasuryAtDeparture)}</strong>
        <span>{netDailyUsd<0?'Includes '+usd(Math.abs(daysWait*netDailyUsd))+' modeled net burn':
          'Includes ongoing net orbital/lunar revenue'}</span></div>
   </div>}
   <p className="rocket-fleet-disclaimer">{refined?
     'Orekit locally solved each departure with an impulsive heliocentric two-body Lambert arc at a fixed transfer duration, using JPL approximate planet positions. Departure burn is from a 400 km-class circular parking orbit; Mars includes simplified capture; Jupiter flyby excludes it. No guarantee of global Δv minimum. Finite low-thrust, launch ascent, plane changes and gravity assists are absent.':
     'The offline curve uses a GAME Hohmann phase-angle surcharge, NOT a physically optimized transfer, validated launch date or real Lambert rendezvous. Start Orekit and restart this page for a more credible date scan. The future scan does not spend money or advance the calendar.'}
     {' '}Changing propulsion, payload or booster changes the installed Δv reference; changing
     target and transfer duration updates the forecast. Waiting can cost significant
     operating cash before a future lower-energy opportunity.</p>
   <button className="secondary-button" type="button" onClick={onOpenOrbital}>
      Open Orbital Map and detailed planetary transfer optimizer ↗</button>
 </div>;
}
