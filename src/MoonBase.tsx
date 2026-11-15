import {useState} from 'react';
import {MOON_BASE_LEVELS,lunarEconomics} from './lib/programEconomy';
import {planMoonShipment,type LauncherId,type MoonCargoRun} from './lib/launchLogistics';
import {flightProgress,flightEta} from './lib/flightProgress';
import type {Vehicle} from './lib/engineering';
import MissionFlightViewer from './MissionFlightViewer';
type Props={
  cash:number;level:number;unlocked:boolean;devMode:boolean;
  cargoDeliveredLevel:number;cargoRun:MoonCargoRun|null;nowMs:number;
  rocketService:LauncherId;rocketTier:number;orbitalAssemblyUnlocked:boolean;
  rocketFlights:Record<LauncherId,number>;vehicle:Vehicle;otherFlightActive:boolean;
  canadianSuccesses:number;
  onInvest:()=>void;onExploreCampaign:()=>void;
  onDispatchCargo:()=>void;onCompleteCargo:()=>void;onOpenRocketFleet:()=>void;
};
const fmt=(usd:number)=>'$'+(usd/1e6).toLocaleString('en-US',{maximumFractionDigits:2})+'M';
const sites=[
  {name:'Shackleton Relay',lat:-89.9,lon:0,label:'SOUTH POLAR'},
  {name:'Malapert Data Hub',lat:-85.5,lon:0,label:'LINK STATION'},
  {name:'Industrial Plateau',lat:-82,lon:25,label:'RESOURCE SURVEY'}
] as const;
export default function MoonBase({cash,level,unlocked,devMode,onInvest,onExploreCampaign,
  cargoDeliveredLevel,cargoRun,nowMs,rocketService,rocketTier,orbitalAssemblyUnlocked,
  rocketFlights,vehicle,otherFlightActive,canadianSuccesses,onDispatchCargo,onCompleteCargo,onOpenRocketFleet}:Props){
  const [zoom,setZoom]=useState(1.5);
  const income=lunarEconomics(level);
  const next=MOON_BASE_LEVELS[level];
  const shipment=next?planMoonShipment({stageIndex:level,service:rocketService,
    vehicle,tier:rocketTier,assemblyUnlocked:orbitalAssemblyUnlocked,
    priorFlights:rocketFlights[rocketService]??0,canadianSuccesses}):null;
  const delivered=cargoDeliveredLevel>level;
  const canBuild=unlocked&&!!next&&delivered&&cash>=next.investmentUsd;
  const cargoProgress=cargoRun?flightProgress(cargoRun.startedAtMs,nowMs,
    cargoRun.viewerDurationMs):null;
  const canDispatch=unlocked&&!!next&&!delivered&&!cargoRun&&!otherFlightActive&&
    !!shipment?.manifest.feasible&&cash>=shipment.totalCostUsd;
  const cx=340,cy=214;
  const scale=zoom;
  return <section className="moon-base-page" aria-label="Moon base investment and lunar zoom map">
    <div className="panel moon-base-intro">
      <div className="eyebrow">LUNAR ECONOMIC DEVELOPMENT / INDEPENDENT INVESTMENT</div>
      <h2>Moon Base Directorate</h2>
      <p>Develop a lunar communications and logistics network by first purchasing real spacecraft
        hardware, loading a fueled translunar lander into one or more separately paid launchers,
        flying that payload to the lunar surface, and only then funding construction. Every
        operational stage earns fictional commercial revenue and requires ongoing maintenance. The Moon is a separate close-up environment; this is not real NASA project revenue.</p>
      {!unlocked&&<div className="moon-base-lock">
        <strong>Moon Base financing locked</strong>
        <span>Complete Lunar Relay Pathfinder to establish your Moon presence.
          {devMode?' Dev Mode permits demonstration access; logistics transport is still mandatory.':''}</span>
        <button type="button" className="secondary-button" onClick={onExploreCampaign}>Open Lunar Relay mission ↗</button>
      </div>}
    </div>
    <div className="moon-base-body">
      <div className="panel moon-base-surface">
        <div className="campaign-map-header">
          <div><div className="eyebrow">LUNAR SURFACE / CONCEPTUAL SOUTH POLE</div>
            <h3>Surface investment map</h3>
            <p>Crater and facility layout schematic · zoom controls are for exploration, not precision cartography</p></div>
          <div className="campaign-map-zoom">
            <button type="button" aria-label="Zoom out lunar map" onClick={()=>setZoom(v=>Math.max(1,Math.round(v/1.3*100)/100))} disabled={zoom<=1}>−</button>
            <button type="button" onClick={()=>setZoom(1.5)}>Fit</button>
            <button type="button" aria-label="Zoom in lunar map" onClick={()=>setZoom(v=>Math.min(3.5,Math.round(v*1.3*100)/100))} disabled={zoom>=3.5}>+</button>
          </div>
        </div>
        <svg viewBox="0 0 680 428" role="img" aria-label="Zoomed-in stylized lunar south-polar terrain and stage-by-stage facilities">
          <defs>
            <radialGradient id="moonSurfaceGradient"><stop offset="0%" stopColor="#a6a9ad"/>
              <stop offset="80%" stopColor="#626d7b"/><stop offset="100%" stopColor="#293849"/></radialGradient>
          </defs>
          <rect width="680" height="428" rx="8" fill="#0b1728"/>
          <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(-${cx} -${cy})`}>
            <circle cx={cx} cy={cy} r="175" fill="url(#moonSurfaceGradient)" stroke="#a9b5c6" strokeWidth="3"/>
            {Array.from({length:35},(_,i)=>{
              const angle=i*2.39996,rad=10+((i*43)%153);
              const x=cx+Math.cos(angle)*rad,y=cy+Math.sin(angle)*rad*.85;
              const r=3+(i*11)%21;
              return <g key={i}><ellipse cx={x} cy={y} rx={r} ry={r*.6}
                fill="#465567" opacity=".45" stroke="#d1d3d4" strokeWidth="1"/></g>;
            })}
            <path d="M 294 349 Q 347 281 319 208 T 393 114" fill="none"
              stroke="#ffc880" strokeDasharray="6 6" strokeWidth="2.5"/>
            {sites.map((site,i)=>{
              const x=320+i*38,y=298-i*84;
              const funded=level>i;
              return <g key={site.name}>
                <circle cx={x} cy={y} r={funded?11:7} fill={funded?'#e9c184':'#8fa2b2'}
                  stroke="#f0f4fa" strokeWidth="1.5"/>
                {funded&&<g>
                  <rect x={x-11} y={y-16} width="22" height="14" rx="3" fill="#8bd4d2" stroke="#f5d8ac"/>
                  <path d={`M ${x-11} ${y-9} h -22 M ${x+11} ${y-9} h 22`}
                    stroke="#83bdf9" strokeWidth="6"/>
                </g>}
                <text x={x+16} y={y-5} fontSize="10" fill="#ffffff" fontWeight="700">{site.name}</text>
                <text x={x+16} y={y+8} fontSize="8" fill="#d7e1ef">
                  {funded?'OPERATING':unlocked?'PROPOSED':'LOCKED'} · {site.label}
                </text>
              </g>;
            })}
          </g>
          <text x="17" y="29" fill="#cfdfec" fontSize="11">LUNAR CLOSE-UP · {zoom.toFixed(2)}×</text>
          <text x="17" y="405" fill="#c0cedb" fontSize="10">Illustrative sites and infrastructure · not verified landing coordinates</text>
        </svg>
      </div>
      <aside className="panel moon-base-economy">
        <div className="eyebrow">CASH FLOW / ALL ACTIVE BASE MODULES</div>
        <h3>{level===0?'No facilities operating':MOON_BASE_LEVELS[level-1].name}</h3>
        <div className="moon-base-numbers">
          <div><small>Installed Moon stages</small><strong>{level} / 3</strong></div>
          <div><small>Gross income / game day</small><strong>{fmt(income.grossDailyUsd)}</strong></div>
          <div><small>Lunar operations / game day</small><strong>−{fmt(income.expensesDailyUsd)}</strong></div>
          <div><small>Moon net contribution / day</small><strong>{fmt(income.grossDailyUsd-income.expensesDailyUsd)}</strong></div>
        </div>
        {cargoRun&&<div className="moon-cargo-flight">
           <div className="eyebrow">ACTIVE CARGO TRANSFER / IN FLIGHT</div>
           <MissionFlightViewer run={cargoRun} nowMs={nowMs}/>
           <p>Carrying {cargoRun.payloadKg.toLocaleString('en-US')} kg of actual
             lunar equipment, supported by {cargoRun.landerPropellantKg.toFixed(0)} kg
             of chemical transfer/descent fuel. {cargoRun.flightsRequired} rocket launches
             were paid at dispatch. Construction revenue remains zero until landing and funding.</p>
           <button type="button" className="launch-button" disabled={!cargoProgress?.ready}
             onClick={onCompleteCargo}>{cargoProgress?.ready?
             'Confirm lunar landing & cargo receipt ↗':
             'Cargo in transit · ETA '+flightEta(cargoProgress?.remainingMs??0)}</button>
         </div>}
        {next?<div className="moon-next-investment">
          <div className="eyebrow">NEXT INVESTMENT / STAGE {next.level}</div>
          <h4>{next.name}</h4>
          <p>{next.description}. All projected values are fictional space-economy assumptions.
             Infrastructure is unavailable until a lander physically delivers the required
             module inventory and you pay the construction cost.</p>
          <div className="moon-cargo-steps">
            <div className={unlocked?'done':''}><b>01</b> Lunar pathfinder authorization {unlocked?'✓':'LOCKED'}</div>
            <div className={delivered?'done':''}><b>02</b> Hardware launches & landing {delivered?'✓ DELIVERED':cargoRun?'IN FLIGHT':'NOT DELIVERED'}</div>
            <div className={level>=3?'done':''}><b>03</b> Fund surface construction {delivered?'READY WHEN FINANCED':'WAITING ON CARGO'}</div>
          </div>
          <div><span>Capital required</span><strong>{fmt(next.investmentUsd)}</strong></div>
          <div><span>Additional daily gross</span><strong>+{fmt(next.dailyRevenueUsd)}</strong></div>
          <div><span>Additional daily upkeep</span><strong>−{fmt(next.dailyOperationsUsd)}</strong></div>
          <div><span>Simple investment payback</span>
            <strong>{Math.ceil(next.investmentUsd/
              (next.dailyRevenueUsd-next.dailyOperationsUsd))} game days</strong>
          </div>
          {shipment&&!delivered&&<div className="moon-cargo-manifest" aria-label="Required lunar cargo and rocket launch manifest">
             <div className="eyebrow">REQUIRED REAL SURFACE PAYLOAD / NEXT BUILDING</div>
             <h4>{shipment.blueprint.name}</h4>
             {shipment.blueprint.components.map(c=><div key={c.name}>
               <span>{c.name}</span><strong>{c.massKg.toLocaleString('en-US')} kg</strong>
             </div>)}
             <div><span>Surface payload mass</span><strong>{shipment.payloadKg.toLocaleString('en-US')} kg</strong></div>
             <div><span>Chemical lander dry hardware</span><strong>{shipment.landerDryKg.toFixed(0)} kg</strong></div>
             <div><span>Transfer + lunar descent propellant</span><strong>{shipment.propellantKg.toFixed(0)} kg</strong></div>
             <div><span>Total LEO manifest</span><strong>{shipment.leoManifestKg.toFixed(0)} kg</strong></div>
             <div><span>Selected rocket / flights required</span>
               <strong>{shipment.manifest.vehicleLabel} · {shipment.manifest.flightsRequired}</strong></div>
             {shipment.manifest.flights.map(f=><div key={f.flight}>
               <span>Flight {f.flight} · {f.massKg.toFixed(0)} / {f.capacityKg.toFixed(0)} kg</span>
               <strong>{fmt(f.serviceCostUsd)}</strong></div>)}
             <div><span>Orbital docking & assembly</span>
               <strong>{fmt(shipment.manifest.assemblyCostUsd)}</strong></div>
             <div><span>Equipment procurement</span><strong>{fmt(shipment.blueprint.hardwareCostUsd)}</strong></div>
             <div className="total"><span>Transportation + cargo invoice</span>
               <strong>{fmt(shipment.totalCostUsd)}</strong></div>
             <p className="rocket-fleet-disclaimer">Mass budget: TLI, lunar orbit insertion,
               descent and allowance totaling 5,550 m/s at assumed 345s Isp.
               Fuel mass is computed from the rocket equation with installed dry lander
               hardware. No surface cargo materializes without this manifest,
               and multi-flight docking is required when capacity is insufficient.
               This is a gameplay mass ledger, not a validated lunar guidance design.</p>
             {shipment.manifest.issue&&<p className="campaign-model-warning">{shipment.manifest.issue}</p>}
             <button className="secondary-button" type="button" onClick={onOpenRocketFleet}>
               Change launch vehicle / upgrade orbital docking ↗</button>
             <button className="launch-button" type="button" disabled={!canDispatch}
                onClick={onDispatchCargo}>{cargoRun?'Cargo flight underway':
                  !unlocked?'Lunar pathfinder required':
                  !shipment.manifest.feasible?'Resolve rocket and assembly requirements':
                  cash<shipment.totalCostUsd?'Insufficient cash for shipment':'Dispatch '+shipment.manifest.flightsRequired+' rocket launch(es) to Moon ↗'}</button>
           </div>}
          <button type="button" className="launch-button" disabled={!canBuild} onClick={onInvest}>
            {!unlocked?'Lunar Pathfinder required':!delivered?'Deliver lunar hardware before constructing':
              cash<next.investmentUsd?'Insufficient construction capital':'Construct '+next.name+' ↗'}
          </button>
        </div>:<p className="moon-base-complete">All three lunar development stages funded. Recurring base revenue continues as in-game days advance.</p>}
      </aside>
    </div>
  </section>;
}
