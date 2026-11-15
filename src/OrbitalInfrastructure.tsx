import {useMemo,useState} from 'react';
import MissionFlightViewer from './MissionFlightViewer';
import {flightProgress,flightEta} from './lib/flightProgress';
import {ORBITAL_SERVICE_MODULES} from './lib/orbitalServiceModules';
import {networkEconomics,networkSatellites,planNetworkDeployment,
  ORBITAL_NETWORK_STAGES,type OrbitalNetworkLevels,type OrbitalNetworkKind,
  type NetworkDeploymentRun} from './lib/orbitalNetworks';
import type {SubsystemDesign} from './lib/subsystemDesign';
import type {Vehicle} from './lib/engineering';
import type {LauncherId} from './lib/launchLogistics';
import type {TechnologyId} from './lib/technologyTree';
type Props={
 levels:OrbitalNetworkLevels;activeRun:NetworkDeploymentRun|null;
 design:SubsystemDesign;cash:number;day:number;nowMs:number;unlocked:boolean;
 launcher:Vehicle;service:LauncherId;tier:number;assemblyUnlocked:boolean;
 priorFlights:number;canadianSuccesses:number;productionDiscount:number;
 researched:readonly TechnologyId[];devMode:boolean;
 otherFlightActive:boolean;onDispatch:(kind:OrbitalNetworkKind)=>void;
 onComplete:()=>void;onGoToLab:()=>void;onGoToFleet:()=>void;
 onGoToMission:()=>void;onGoToResearch:()=>void;
};
const money=(n:number)=>'$'+(n/1e6).toLocaleString('en-US',{maximumFractionDigits:2})+'M';
export default function OrbitalInfrastructure(p:Props){
 const [selected,setSelected]=useState<OrbitalNetworkKind>('compute');
 const [viewerOpen,setViewerOpen]=useState(true);
 const economics=networkEconomics(p.levels);
 const stage=ORBITAL_NETWORK_STAGES[selected][p.levels[selected]];
 const review=useMemo(()=>planNetworkDeployment({
   kind:selected,levels:p.levels,design:p.design,launcher:p.launcher,
   service:p.service,tier:p.tier,assemblyUnlocked:p.assemblyUnlocked,
   priorServiceFlights:p.priorFlights,canadianSuccesses:p.canadianSuccesses,
   productionDiscount:p.productionDiscount,researched:p.researched,devMode:p.devMode}),
   [selected,p.levels,p.design,p.launcher,
     p.service,p.tier,p.assemblyUnlocked,p.priorFlights,p.canadianSuccesses,
     p.productionDiscount,p.researched,p.devMode]);
 const progress=p.activeRun?flightProgress(p.activeRun.startedAtMs,p.nowMs,p.activeRun.viewerDurationMs):null;
 const satellites=networkSatellites(selected,p.levels[selected]);
 const totalProjected=review?.totalCostUsd??0;
 const canLaunch=!!review?.feasible&&p.unlocked&&!p.otherFlightActive&&!p.activeRun&&p.cash>=totalProjected;
 return <section className="orbital-infrastructure-page" aria-label="Orbital passive income and satellite infrastructure">
  <div className="panel orbital-business-hero">
   <div className="eyebrow">ORBITAL ECONOMY / DEPLOYED HARDWARE EARNS CASH</div>
   <h2>Commercial Satellite Networks</h2>
   <p>Operate two complementary Canadian orbital infrastructure businesses: a hosted
     compute fleet and a hybrid communications/relay network. Real Galaxia
     <a href="https://gx.space/news-press-releases/galaxia-introduces-onyx-edge" target="_blank" rel="noreferrer"> Onyx Edge / VSaS</a>,
     <a href="https://gx.space/news-press-releases/galaxia-unveils-osprey-advancing-canadian-built-space-technology-for-defence-applications" target="_blank" rel="noreferrer"> OSPREY / Halifax Class</a>
     and Canadian <a href="https://www.kepler.space/" target="_blank" rel="noreferrer">Kepler</a>
     inspire the concepts. <strong>Every satellite is designed, massed, power-checked,
     thermally qualified within the game model, manufactured and physically launched.</strong>
     Revenue and maintenance start only when deployment completes.</p>
   {!p.unlocked&&<p className="orbital-lock-note">Complete Earth Observation One to establish
     orbital fleet operations. <button type="button" className="secondary-button"
       onClick={p.onGoToMission}>Open first satellite mission ↗</button></p>}
  </div>
  <div className="orbital-business-stats">
    <div className="panel"><small>OPERATIONAL SATELLITES</small>
       <strong>{economics.operationalSatellites}</strong><span>Already launched and commissioned</span></div>
    <div className="panel"><small>RECURRING REVENUE / GAME DAY</small>
       <strong>+{money(economics.grossDailyUsd)}</strong><span>Imagined subscription/compute sales</span></div>
    <div className="panel"><small>NETWORK OPERATING COST / DAY</small>
       <strong>−{money(economics.expensesDailyUsd)}</strong><span>Ground stations, maintenance, replacements</span></div>
    <div className="panel"><small>NET BUSINESS CONTRIBUTION / DAY</small>
       <strong>{money(economics.grossDailyUsd-economics.expensesDailyUsd)}</strong>
       <span>Agency baseline overhead is separate</span></div>
  </div>
  <div className="orbital-business-selector" role="tablist" aria-label="Choose orbital business">
   <button type="button" role="tab" aria-selected={selected==='compute'}
     className={selected==='compute'?'selected':''} onClick={()=>setSelected('compute')}>
      <strong>Orbital Compute</strong><small>Open workloads · Galaxia Onyx Edge / VSaS-inspired</small>
    </button>
   <button type="button" role="tab" aria-selected={selected==='relay'}
     className={selected==='relay'?'selected':''} onClick={()=>setSelected('relay')}>
      <strong>Canadian Orbit Network</strong><small>RF / optical relay · Canadian network alternative</small>
    </button>
  </div>
  <div className="orbital-business-columns">
   <div className="panel orbital-network-map">
      <div className="eyebrow">EARTH ORBIT · CONCEPTUAL NETWORK DISTRIBUTION</div>
      <h3>{selected==='compute'?'Distributed computing in low Earth orbit':'Canadian communications relays'}</h3>
      <p>Blue nodes represent commissioned spacecraft. Unfilled nodes represent
        the next required launch batch. Diagram is schematic—not validated coverage,
        orbital phasing, regulatory spectrum allocation or collision risk.</p>
      <svg viewBox="0 0 570 350" role="img"
        aria-label={satellites+' deployed '+selected+' satellites and modeled planned constellation'}>
         <defs><radialGradient id="orbitalInfraEarth"><stop offset="0%" stopColor="#53a9d9"/>
          <stop offset="100%" stopColor="#103958"/></radialGradient></defs>
         <rect width="570" height="350" rx="8" fill="#0a192e"/>
         {[1,1.3,1.58].map((v,i)=><ellipse key={i} cx="270" cy="178" rx={155*v} ry={88*v}
            fill="none" stroke="#476883" strokeDasharray="5 9" opacity=".6"
            transform={`rotate(${(i-1)*31} 270 178)`}/>)}
         <circle cx="270" cy="178" r="72" fill="url(#orbitalInfraEarth)" stroke="#71b9ea"/>
         <path d="M 212 160 q 21 -57 62 -27 t 40 62 q-53 21 -81-12z"
           fill="#539b82" opacity=".65"/>
         {Array.from({length:Math.max(6,Math.min(18,satellites+(stage?.additionalSatellites??0)))},(_,i)=>{
           const active=i<satellites,total=Math.max(6,satellites+(stage?.additionalSatellites??0));
           const angle=2*Math.PI*i/total,inc=1+(i%3)*.15;
           const x=270+Math.cos(angle)*155*inc,y=178+Math.sin(angle)*88*inc;
           return <g key={i}><circle cx={x} cy={y} r="6" fill={active?'#89e9d1':'#1a364f'}
             stroke={active?'#eafbe7':'#9ab9cf'} strokeWidth="2"/>
             {active&&<path d={`M ${x-12} ${y} h 24 M ${x} ${y-10} v 20`}
               stroke="#7cbbfa" strokeWidth="2" />}</g>;
         })}
         <text x="20" y="30" fill="#bed8ec" fontSize="12">{satellites} DEPLOYED · {selected.toUpperCase()} BUSINESS</text>
         <text x="20" y="332" fill="#aec6d7" fontSize="10">Conic network schematic · service coverage is NOT modeled</text>
      </svg>
      <div className="orbital-business-stage-list">
        {ORBITAL_NETWORK_STAGES[selected].map((s,i)=><div key={i}
          className={i<p.levels[selected]?'done':i===p.levels[selected]?'next':''}>
          <b>{i<p.levels[selected]?'✓':'0'+(i+1)}</b>
          <span><strong>{s.name}</strong><small>+{s.additionalSatellites} satellites ·
            {money(s.grossDailyUsd)}/d gross · −{money(s.operationsDailyUsd)}/d upkeep</small></span>
        </div>)}
      </div>
    </div>
    <div className="panel orbital-business-invest">
      {p.activeRun?<div className="network-active-deployment">
         <div className="eyebrow">ACTIVE CONSTELLATION DELIVERY / IN ORBITAL INSERTION</div>
         <h3>{p.activeRun.title}</h3>
         {viewerOpen?<><MissionFlightViewer run={p.activeRun} nowMs={p.nowMs}/>
           <button className="secondary-button" type="button"
             onClick={()=>setViewerOpen(false)}>Minimize flight viewer ↗</button></>:
          <div className="campaign-viewer-minimized">
            <strong>{Math.round((progress?.fraction??0)*100)}% complete</strong>
            <span>ETA {flightEta(progress?.remainingMs??0)}</span>
            <button className="secondary-button" type="button"
              onClick={()=>setViewerOpen(true)}>Reopen propagated orbit ↗</button>
          </div>}
         <p>Already paid {money(p.activeRun.costUsd)} for {p.activeRun.satelliteCount}
           spacecraft, {p.activeRun.launchCount} rocket launch(es), ground equipment
           and any orbital assembly. Business revenue has not started.</p>
         <button className="launch-button" type="button" disabled={!progress?.ready}
           onClick={p.onComplete}>{progress?.ready?'Commission network and start income ↗':
           'Constellation deploying · ETA '+flightEta(progress?.remainingMs??0)}</button>
       </div>:stage&&review?<div>
         <div className="eyebrow">NEXT NETWORK DEPLOYMENT / STAGE {stage.level}</div>
         <h3>{stage.name}</h3>
         <p>{stage.description}</p>
         <div className="orbital-module-info">
           <strong>Required installed module: {ORBITAL_SERVICE_MODULES[selected].name}</strong>
           <span>Each node: {ORBITAL_SERVICE_MODULES[selected].massKg} kg payload ·
             {ORBITAL_SERVICE_MODULES[selected].activePowerW} W electric ·
             {ORBITAL_SERVICE_MODULES[selected].heatDissipationW} W modeled waste heat ·
             {ORBITAL_SERVICE_MODULES[selected].downlinkMbps} Mb/s theoretical data rate</span>
         </div>
         <div className="moon-base-numbers">
           <div><small>Additional spacecraft to launch</small><strong>{stage.additionalSatellites}</strong></div>
           <div><small>Total spacecraft wet mass</small><strong>{review.totalWetKg.toFixed(1)} kg</strong></div>
           <div><small>Solar / other electric supply</small><strong>{Math.round(review.powerAvailableW)} W</strong></div>
           <div><small>Business + bus demand incl reserve</small><strong>{Math.round(review.powerNeededW)} W</strong></div>
           <div><small>Radiator capacity / modeled heat</small><strong>{Math.round(review.thermalCapacityW)} / {Math.round(review.heatProducedW)} W</strong></div>
           <div><small>Rocket service · launches</small><strong>{review.manifest.vehicleLabel} · {review.manifest.flightsRequired}</strong></div>
           <div><small>Spacecraft hardware invoice</small><strong>{money(review.hardwareUsd)}</strong></div>
           <div><small>Launch & docking invoices</small><strong>{money(review.manifest.launchCostUsd+review.manifest.assemblyCostUsd)}</strong></div>
           <div><small>Ground service equipment</small><strong>{money(review.groundInfrastructureUsd)}</strong></div>
           <div><small>ALL-IN deployment cost</small><strong>{money(review.totalCostUsd)}</strong></div>
           <div><small>New gross / game day</small><strong>+{money(stage.grossDailyUsd)}</strong></div>
           <div><small>New upkeep / game day</small><strong>−{money(stage.operationsDailyUsd)}</strong></div>
           <div><small>Simple payback · launch included</small><strong>{review.simplePaybackDays} game days</strong></div>
         </div>
         <h4>Engineering and launch readiness</h4>
         <div className="orbital-checks">{review.checks.map(c=><div key={c.name}
            className={c.passed?'passed':'blocked'}>
           <b>{c.passed?'✓':'!'} {c.name}</b><span>{c.description}</span>
         </div>)}</div>
         <div className="orbital-business-actions">
           <button className="secondary-button" type="button"
             onClick={p.onGoToResearch}>Research Infrastructure branch / cash + RP ↗</button>
           <button className="secondary-button" type="button"
             onClick={p.onGoToLab}>Engineer service module / radiator ↗</button>
           <button className="secondary-button" type="button"
             onClick={p.onGoToFleet}>Change rocket and orbital assembly ↗</button>
           <button className="launch-button" type="button" disabled={!canLaunch}
             onClick={()=>p.onDispatch(selected)}>{!p.unlocked?'Complete Earth Observation One':
               p.otherFlightActive?'Another mission is already in flight':
               !review.feasible?'Resolve flight and spacecraft checks':
               p.cash<review.totalCostUsd?'Insufficient capital to buy and launch':'Fund, launch and deploy '+stage.additionalSatellites+' spacecraft ↗'}</button>
         </div>
      </div>:<div className="orbital-network-finished">
        <h3>Constellation complete</h3><p>All three infrastructure generations deployed.
          These satellites continue earning projected service revenue net of upkeep as the game clock advances.</p>
      </div>}
    </div>
  </div>
  <p className="research-legal">Game finances, service uptime, coverage, module heat production,
    hardware mass and downlink speeds are educational assumptions; the source companies
    did not provide the modeled technical or business figures. There are no real
    Galaxia/Kepler customer contracts in this game. No passive income is credited
    until a paid spacecraft launch, completed orbital delivery and commissioning.</p>
 </section>;
}
