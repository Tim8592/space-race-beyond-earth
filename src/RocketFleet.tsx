import {calculateVehicleMetrics,ENGINES,type Vehicle} from './lib/engineering';
import {FLEET_UPGRADES,LAUNCHERS,ORBITAL_ASSEMBLY_UPGRADE_USD,
  flightService,customLeoCapacityKg,type LauncherId} from './lib/launchLogistics';
type Props={vehicle:Vehicle;cash:number;service:LauncherId;tier:number;
  priorFlights:Record<LauncherId,number>;assemblyUnlocked:boolean;
  onUpdateVehicle:(patch:Partial<Vehicle>)=>void;
  onServiceChange:(id:LauncherId)=>void;onFleetUpgrade:()=>void;onUnlockAssembly:()=>void};
const usd=(value:number)=>'$'+(value/1e6).toLocaleString('en-US',{maximumFractionDigits:2})+'M';
const fmt=(v:number)=>v.toLocaleString('en-US',{maximumFractionDigits:0});
export default function RocketFleet({vehicle,cash,service,tier,priorFlights,assemblyUnlocked,
  onUpdateVehicle,onServiceChange,onFleetUpgrade,onUnlockAssembly}:Props){
 const choices:LauncherId[]=['custom','falcon9','falconHeavy','starship'];
 const next=FLEET_UPGRADES[tier];
 const metrics=calculateVehicleMetrics(vehicle);
 const chosen=flightService({service,vehicle,tier,priorFlights:priorFlights[service]??0});
 return <section className="rocket-fleet-page" aria-label="Dedicated launch rocket builder and service economics">
  <div className="panel rocket-fleet-intro">
    <div className="eyebrow">LAUNCH SYSTEMS / SEPARATE FROM SPACECRAFT DESIGN</div>
    <h2>Rocket Fleet & Orbital Logistics</h2>
    <p>A rocket gets your spacecraft and fuel to Earth orbit; it is not the satellite itself.
      Choose a launch vehicle, evaluate capacity and cost per flight, then develop recovery
      and assembly technologies. Large spacecraft are divided into independent launches
      with real docking hardware and an extra integration cost.</p>
  </div>
  <div className="panel rocket-fleet-stats">
   <div><small>ROCKET PROGRAM GENERATION</small><strong>{tier} / 3</strong></div>
   <div><small>SELECTED PAYLOAD TO LEO</small><strong>{fmt(chosen.capacityKg)} kg</strong></div>
   <div><small>NEXT LAUNCH SERVICE COST</small><strong>{usd(chosen.costUsd)}</strong></div>
   <div><small>FLIGHTS LOGGED FOR THIS SERVICE</small><strong>{priorFlights[service]??0}</strong></div>
  </div>
  <div className="rocket-fleet-grid">
   {choices.map(id=>{
    const quote=flightService({service:id,vehicle,tier,priorFlights:priorFlights[id]??0});
    return <button type="button" key={id}
      className={'rocket-fleet-option '+(service===id?'selected':'')+(quote.available?'':' locked')}
      onClick={()=>{if(quote.available)onServiceChange(id)}}
      disabled={!quote.available} aria-pressed={service===id}>
       <span className="eyebrow">{id==='custom'?'PLAYER-DESIGNED ROCKET':LAUNCHERS[id].source==='reference'?'COMMERCIAL SERVICE · REFERENCE':'FUTURE/ILLUSTRATIVE SERVICE'}</span>
       <strong>{quote.label}</strong>
       <span>Manifest LEO capacity: {fmt(quote.capacityKg)} kg</span>
       <b>{usd(quote.costUsd)} per launch</b>
       <small>{id==='custom'?'Capacity from your rocket Δv, thrust, wet and dry mass; cost includes learning.':
          LAUNCHERS[id].description}</small>
       {!quote.available&&<em>Unlock Rocket Program generation {LAUNCHERS[id as Exclude<LauncherId,'custom'>].unlockTier}</em>}
      </button>;
   })}
  </div>
  <div className="rocket-fleet-panels">
   <div className="panel rocket-custom-builder">
     <div className="eyebrow">MAKE YOUR OWN / CHANGE THE ROCKET, NOT THE SATELLITE</div>
     <h3>Launch Rocket Builder</h3>
     <p>Size the original rocket in the same engineering model used by the classic orbital contracts. The spacecraft remains separately modeled in Engineering Lab.</p>
     <label>Vehicle name<input value={vehicle.name} maxLength={40}
       onChange={e=>onUpdateVehicle({name:e.target.value})}/></label>
     <label>Propulsion family<select value={vehicle.engineId}
       onChange={e=>onUpdateVehicle({engineId:e.target.value as Vehicle['engineId']})}>
       {Object.values(ENGINES).map(e=><option value={e.id} key={e.id}>{e.label} · {e.ispSeconds}s Isp · game engine</option>)}
     </select></label>
     {([['dryMassKg','Rocket dry structure and tanks',1000,150000,500],
        ['propellantMassKg','Ascent propellant',5000,900000,5000],
        ['payloadMassKg','Payload bay design limit',500,100000,500]] as const).map(([key,label,min,max,step])=>
       <label key={key}>{label} · {fmt(vehicle[key])} kg<input type="number" min={min} max={max}
         step={step} value={vehicle[key]} onChange={e=>onUpdateVehicle({[key]:Number(e.target.value)})}/></label>)}
     <div className="rocket-fleet-metrics">
       <div><span>Modeled rocket Δv</span><b>{fmt(metrics.deltaVms)} m/s</b></div>
       <div><span>Lift-off thrust / weight</span><b>{metrics.liftoffTwr.toFixed(2)}</b></div>
       <div><span>Feasible LEO payload</span><b>{fmt(customLeoCapacityKg(vehicle))} kg</b></div>
     </div>
   </div>
   <div className="panel rocket-development">
     <div className="eyebrow">INVEST IN LONG-TERM COST REDUCTION</div>
     <h3>Launch system development</h3>
     <p>Engineering upgrades reduce the actual service charge for every future launch.
       Repeat flights earn additional capped learning savings. Improvements are paid for upfront.</p>
     {next?<div className="rocket-upgrade">
       <h4>{next.name}</h4><p>{next.description}</p>
       <strong>{usd(next.costUsd)} · launch multiplier {Math.round(next.costFactor*100)}%</strong>
       <button className="launch-button" type="button" onClick={onFleetUpgrade} disabled={cash<next.costUsd}>
         {cash<next.costUsd?'Insufficient funds':'Fund rocket technology upgrade'}</button>
     </div>:<div className="rocket-upgrade">All three notional fleet generations developed. Real cost reduction remains a game estimate.</div>}
     <div className="rocket-upgrade">
       <h4>Orbital docking & assembly infrastructure</h4>
       <p>Multi-launch missions need separation, rendezvous, structural joins and docking kit mass.
         Without this facility, a spacecraft heavier than one rocket’s payload bay is unlaunchable.</p>
       <strong>One-time infrastructure: {usd(ORBITAL_ASSEMBLY_UPGRADE_USD)}</strong>
       <button type="button" className="secondary-button"
         disabled={assemblyUnlocked||cash<ORBITAL_ASSEMBLY_UPGRADE_USD}
         onClick={onUnlockAssembly}>{assemblyUnlocked?'✓ Orbital assembly operational':
           cash<ORBITAL_ASSEMBLY_UPGRADE_USD?'Insufficient funds':'Commission orbital assembly facility'}</button>
     </div>
     <p className="rocket-fleet-disclaimer">Source boundary: published Falcon 9 standard price ($74M for a specified GTO service) and published expendable maximum LEO payload are reference context only. Reusable LEO capacities, Falcon Heavy scenario cost, Starship service price, cost declines and in-orbit assembly process are fictional game estimates; they are not SpaceX quotes or guaranteed flight services.</p>
   </div>
  </div>
 </section>;
}
