import type {Vehicle} from './lib/engineering';
import type {TechnologyId} from './lib/technologyTree';
import {FLEET_UPGRADES,LAUNCHERS,CANADIAN_ROCKET_GENERATIONS,ORBITAL_ASSEMBLY_UPGRADE_USD,
  canadianProgramReadiness,flightService,type LauncherId} from './lib/launchLogistics';

type Props={
 vehicle:Vehicle;cash:number;day:number;devMode:boolean;
 service:LauncherId;tier:number;canadianSuccesses:number;
 researched:readonly TechnologyId[];
 priorFlights:Record<LauncherId,number>;assemblyUnlocked:boolean;
 onServiceChange:(id:LauncherId)=>void;onFleetUpgrade:()=>void;
 onUnlockAssembly:()=>void;onGoResearch:()=>void;
};
const usd=(value:number)=>'$'+(value/1e6).toLocaleString('en-US',{maximumFractionDigits:2})+'M';
const fmt=(v:number)=>v.toLocaleString('en-US',{maximumFractionDigits:0});
export default function RocketFleet({vehicle,cash,day,devMode,service,tier,priorFlights,
  canadianSuccesses,researched,assemblyUnlocked,onServiceChange,onFleetUpgrade,
  onUnlockAssembly,onGoResearch}:Props){
 const choices:LauncherId[]=['custom','falcon9','falconHeavy','starship'];
 const next=FLEET_UPGRADES[tier];
 const state=canadianProgramReadiness({tier,day,canadianSuccesses,researchUnlocked:researched,devMode});
 const canUpgrade=!!next&&state.ready&&cash>=next.costUsd;
 const canadian=CANADIAN_ROCKET_GENERATIONS[tier];
 const selectedQuote=flightService({service,vehicle,tier,
   priorFlights:priorFlights[service]??0,canadianSuccesses});
 const domestic=flightService({service:'custom',vehicle,tier,
   priorFlights:priorFlights.custom??0,canadianSuccesses});
 const foreign=flightService({service:'falcon9',vehicle,tier,
   priorFlights:priorFlights.falcon9??0,canadianSuccesses});
 const previousCanadianSuccesses=canadianSuccesses>0?
   flightService({service:'custom',vehicle,tier,
     priorFlights:priorFlights.custom??0,canadianSuccesses:0}).costUsd:domestic.costUsd;
 return <section className="rocket-fleet-page" aria-label="Preset Canadian launch development and commercial SpaceX services">
   <div className="panel rocket-fleet-intro">
     <div className="eyebrow">LAUNCH DEVELOPMENT / PRESET VEHICLES, NOT EDITABLE CAPACITY</div>
     <h2>Choose between sovereign launch and commercial lift.</h2>
     <p>Canadian rocket generations are unlocked by research, money, the advancing game
       calendar and successful <strong>Canadian missions</strong>. You cannot type in a
       payload limit or engine mass. SpaceX gets you substantial mass-to-orbit capability
       immediately, but choosing it does not generate Canadian flight heritage or
       improve domestic rocket manufacturing. All rocket costs are game estimates.</p>
   </div>
   <div className="panel rocket-fleet-stats">
      <div><small>CANADIAN ROCKET GENERATION</small><strong>{tier+1} / 4</strong></div>
      <div><small>SELECTED LAUNCH CAPACITY</small><strong>{fmt(selectedQuote.capacityKg)} kg</strong></div>
      <div><small>PRICE / ACTUAL LAUNCH</small><strong>{usd(selectedQuote.costUsd)}</strong></div>
      <div><small>CANADIAN MISSIONS COMPLETED</small><strong>{canadianSuccesses}</strong></div>
   </div>
   <div className="rocket-sovereign-choice">
     <div className="panel rocket-sovereign-compare">
       <div className="eyebrow">CANADIAN DEVELOPMENT RETURN</div>
       <h3>Build Canada's rocket industry</h3>
       <p>Lower early payload capacity, domestic R&D and manufacturing costs.
         Successful sovereign launches improve this fleet's price and accelerate
         future vehicle generations.</p>
       <div className="rocket-return-stats">
         <span>Current vehicle <strong>{canadian.name}</strong></span>
         <span>Available lift <strong>{fmt(domestic.capacityKg)} kg</strong></span>
         <span>Today's launch invoice <strong>{usd(domestic.costUsd)}</strong></span>
         <span>Savings from Canadian mission experience <strong>{usd(previousCanadianSuccesses-domestic.costUsd)}/flight</strong></span>
         <span>Domestic industrial development <strong>+1 credit per completed Canadian mission</strong></span>
       </div>
     </div>
     <div className="panel rocket-sovereign-compare commercial">
       <div className="eyebrow">INTERNATIONAL PROCUREMENT / NO CANADIAN FLIGHT CREDIT</div>
       <h3>Buy SpaceX launch capacity</h3>
       <p>Commercial-style service has much greater immediate capacity per invoice.
         Its launches do <strong>not</strong> contribute to domestic fleet experience
         and receive none of the Canadian mission cost-learning discount.</p>
       <div className="rocket-return-stats">
         <span>Baseline service <strong>Falcon 9 (model)</strong></span>
         <span>Available lift <strong>{fmt(foreign.capacityKg)} kg</strong></span>
         <span>Illustrative invoice <strong>{usd(foreign.costUsd)}</strong></span>
         <span>Canadian industrial credits <strong>0</strong></span>
         <span>Canadian rocket-generation acceleration <strong>None</strong></span>
       </div>
     </div>
   </div>
   <div className="rocket-fleet-grid">
     {choices.map(id=>{
       const quote=flightService({service:id,vehicle,tier,
         priorFlights:priorFlights[id]??0,canadianSuccesses});
       const isDomestic=id==='custom';
       return <button type="button" key={id} aria-pressed={service===id}
         className={'rocket-fleet-option '+(service===id?'selected':'')}
         onClick={()=>onServiceChange(id)}>
         <span className="eyebrow">{isDomestic?'CANADA / SOVEREIGN DEVELOPMENT':
           id==='starship'?'FUTURE SPACE X / SIMULATION ONLY':'SPACE X / BUY LAUNCH SERVICE'}</span>
         <strong>{quote.label}</strong>
         <span>LEO manifest: {fmt(quote.capacityKg)} kg</span>
         <b>{usd(quote.costUsd)} / launch</b>
         <small>{isDomestic?canadian.programDescription:LAUNCHERS[id].description}</small>
         <span className="rocket-service-credit">{isDomestic?
           '+ Canadian flight development if mission succeeds':
           'No Canadian rocket R&D or experience awarded'}</span>
         {service===id&&<span className="rocket-service-selected">✓ CURRENT MANIFEST SERVICE</span>}
       </button>;
     })}
   </div>
   <div className="rocket-fleet-panels">
     <div className="panel rocket-custom-builder">
       <div className="eyebrow">UNLOCK LADDER / REAL COMPANIES, GAME READINESS</div>
       <h3>Four preset Canadian rocket generations</h3>
       <p>Each new generation requires the preceding one, qualifying spacecraft
         research, calendar maturation and an industrial investment.
         The stated payloads are announced targets or game allocations,
         not established flight capability.</p>
       <div className="canadian-rocket-ladder">
         {CANADIAN_ROCKET_GENERATIONS.map((rocket,i)=>
           <div className={'canadian-rocket-step '+(i<tier?'complete':i===tier?'current':'future')} key={rocket.level}>
             <div className="canadian-rocket-step-number">{i<tier?'✓':String(i+1).padStart(2,'0')}</div>
             <div>
               <div className="eyebrow">{i<tier?'DEVELOPED':i===tier?'IN PROGRAM':'R&D STAGE '+i}</div>
               <h4>{rocket.name}</h4>
               <small>{rocket.company}</small>
               <p>{rocket.reference}</p>
               <div><strong>{fmt(rocket.leoCapacityKg)} kg modeled LEO</strong>
                 <span>{usd(rocket.baseCostUsd)} baseline game invoice</span></div>
               <a href={rocket.sourceUrl} target="_blank" rel="noreferrer">Company / project source ↗</a>
             </div>
           </div>)}
       </div>
       <div className="rocket-canada-context">
         <h4>Canadian spaceport and launch developers</h4>
         <p>Additional real infrastructure: <strong>Maritime Launch Services</strong>
           operates Spaceport Nova Scotia near Canso; it is a launch-site
           operator, not the manufacturer of these rockets. NordSpace is also
           developing the Atlantic Spaceport Complex in Newfoundland.
           Canada Rocket Company received Canadian federal prototype
           development support. None of this means routine Canadian orbital
           launches were available in 2026.</p>
         <a href="https://maritimelaunch.com/launch/spaceport-nova-scotia" target="_blank" rel="noreferrer">Spaceport Nova Scotia source ↗</a>
       </div>
     </div>
     <div className="panel rocket-development">
       <div className="eyebrow">R&D → FLIGHT EXPERIENCE → PAY FOR NEXT GENERATION</div>
       <h3>Canadian launch technology program</h3>
       <p>Progress is earned, not typed into a box. A qualifying Canadian mission
         subtracts days from upcoming program readiness thresholds.
         SpaceX missions advance the general calendar, but do not generate
         Canadian flight experience or reduce domestic launch costs.</p>
       {next?<div className="rocket-upgrade">
         <h4>Next: {CANADIAN_ROCKET_GENERATIONS[tier+1].name}</h4>
         <div className="rocket-gate-list">
           <div className={state.researchReady?'passed':'missing'}>
             <span>{state.researchReady?'✓':'○'} Engineering research</span>
             <strong>{state.requiredTechnology?.replaceAll('-',' ')}</strong>
           </div>
           <div className={state.timeReady?'passed':'missing'}>
             <span>{state.timeReady?'✓':'○'} Game technology maturity</span>
             <strong>{state.timeReady?'Matured':state.daysUntilReady+' more game days'}</strong>
           </div>
           <div className={state.heritageReady?'passed':'missing'}>
             <span>{state.heritageReady?'✓':'○'} Completed Canadian missions</span>
             <strong>{canadianSuccesses} / {next.minCanadianMissions}</strong>
           </div>
           <div className={cash>=next.costUsd?'passed':'missing'}>
             <span>{cash>=next.costUsd?'✓':'○'} Industrial capital</span>
             <strong>{usd(next.costUsd)}</strong>
           </div>
         </div>
         <p>{next.description}</p>
         {!state.researchReady&&<button type="button" className="secondary-button"
           onClick={onGoResearch}>Go to interactive Launch research branch ↗</button>}
         <button type="button" className="launch-button" onClick={onFleetUpgrade}
           disabled={!canUpgrade}>
           {canUpgrade?'Commission next Canadian rocket generation ↗':
            'Complete the required R&D, experience and capital first'}
         </button>
         <small>Game date Day {day}. Domestic mission successes reduce remaining maturity
           by {next.acceleratedDaysPerSuccess} days each, and improve Canadian prices.</small>
       </div>:<div className="rocket-upgrade">
         <h4>✓ Advanced Canadian launcher generation unlocked</h4>
         <p>All generations developed. Further Canadian mission successes
           continue lowering future modeled domestic launch invoices.</p>
       </div>}
       <div className="rocket-upgrade">
         <h4>Orbital docking and spacecraft assembly</h4>
         <p>Install paid docking infrastructure so hardware from several
           smaller rocket flights can assemble into one heavy deep-space vehicle.</p>
         <strong>One-time facility: {usd(ORBITAL_ASSEMBLY_UPGRADE_USD)}</strong>
         <button type="button" className="secondary-button"
           disabled={assemblyUnlocked||cash<ORBITAL_ASSEMBLY_UPGRADE_USD}
           onClick={onUnlockAssembly}>{assemblyUnlocked?'✓ Orbital assembly operational':
             cash<ORBITAL_ASSEMBLY_UPGRADE_USD?'Insufficient funds':'Commission orbital assembly facility'}</button>
       </div>
     </div>
   </div>
   <p className="panel rocket-fleet-disclaimer">**Development status:** Canadian rockets shown are actual
     development names and published future payload targets, while flight unlock
     milestones, launch fees, cost reductions, rocket reliability and operational
     readiness are fictional. No Canadian orbital service here is represented
     as operational in 2026. Falcon 9's $74M published standard price is
     for a specified GTO service, not a universal 2026 LEO fare;
     Starship's listed flight service is speculative.</p>
 </section>;
}
