import {useMemo} from 'react';
import CampaignOrbitMap from './CampaignOrbitMap';
import MissionFlightViewer from './MissionFlightViewer';
import type {LauncherId,LaunchBatch} from './lib/launchLogistics';
import {flightProgress,flightEta,DEFAULT_FLIGHT_VIEWER_MS} from './lib/flightProgress';
import {earthOrbitAtTime} from './lib/orbitalMechanics';
import {dateForGameDay,BOOSTERS,EXTERNAL_MODULES,
  STORY_MISSIONS,NASA_CUBESAT_REFERENCE,reviewCampaignMission,specialOfferStatus,
  unlockedStage,type CampaignDefinition,type MissionOptions,type MissionReview,
  type SolvedCampaignTransfer} from './lib/campaignMissions';
import {AGENCY_MILESTONES,agencyMissionDefinitions,agencyOfferPhase} from './lib/realWorldMissions';
import type {Vehicle} from './lib/engineering';
import type {SubsystemDesign} from './lib/subsystemDesign';

export type CampaignRun={
  id:string;title:string;special:boolean;durationDays:number;
  launchedDay:number;departureDate:string;
  costUsd:number;payoutUsd:number;payloadKg:number;
  target:CampaignDefinition['target'];options:MissionOptions;
  route:MissionReview['route'];scienceKg:number;
  deltaVms:number;requiredDeltaVms:number;
  launchService:LauncherId;launchCount:number;
  launchCostsUsd:number;orbitalAssemblyCostsUsd:number;
  spacecraftProcurementUsd:number;
  launchInvoices:LaunchBatch[];
  busPropellantBurnedKg?:number;busPropellantRemainingKg?:number;
  startedAtMs?:number;viewerDurationMs?:number;orekitTrajectoryAu?:number[][];
};
export type CampaignAssemblyProject={
  draft:CampaignRun;launchesCompleted:number;startedDay:number;
};
export type CampaignDebrief={
  id:string;title:string;day:number;success:boolean;special:boolean;
  costUsd:number;payoutUsd:number;durationDays:number;deltaVms:number;
  neededDeltaVms:number;scienceKg:number;
  busPropellantBurnedKg?:number;busPropellantRemainingKg?:number;
};
const num=(n:number,nDigits=0)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:nDigits}):'—';
const usd=(n:number)=>'$'+(n/1e6).toFixed(1)+'M';
function OrbitScene({definition,review,progress=0}:{
  definition:CampaignDefinition;review:MissionReview;progress?:number;
}){
  const ellipse=definition.target==='ellipse'||definition.target==='lunar';
  const points=useMemo(()=>{
    if(!ellipse)return '';
    const perigee=definition.target==='ellipse'?
      (review.route.perigeeKm??400):400;
    const eccentricity=review.route.eccentricity;
    const rp=6378.137+perigee;
    const a=rp/(1-eccentricity);
    const rmax=a*(1+eccentricity);
    const scale=134/rmax;
    const lunarShape=eccentricity>=.95;
    const period=lunarShape?0:earthOrbitAtTime(perigee,eccentricity,0).periodMinutes;
    return Array.from({length:160},(_,i)=>{
      const angle=2*Math.PI*i/159;
      // Lunar transfer extends beyond the UI solver's intentionally restricted
      // e<.95 interactive range; conic geometry still follows r=a(1-e cos E).
      const x=lunarShape?a*(Math.cos(angle)-eccentricity):
        earthOrbitAtTime(perigee,eccentricity,period*i/159).xKm;
      const y=lunarShape?a*Math.sqrt(1-eccentricity**2)*Math.sin(angle):
        earthOrbitAtTime(perigee,eccentricity,period*i/159).yKm;
      return (i===0?'M':'L')+' '+(186+x*scale).toFixed(2)+' '+(174-y*scale).toFixed(2);
    }).join(' ')+' Z';
  },[definition.target,review.route.eccentricity,review.route.perigeeKm,ellipse]);
  const path=ellipse?points:'M 85 205 C 153 65, 256 85, 375 145';
  return <div className="campaign-orbit-visual">
    <div className="eyebrow">SHARED ORBITAL MODEL · {review.route.source.toUpperCase()}</div>
    <svg viewBox="0 0 490 320" role="img"
      aria-label={ellipse?'Keplerian elliptical Earth orbit with satellite animation':'Schematic planetary transfer trajectory, not an Orekit trajectory'}>
      <defs><radialGradient id="campaignPlanet"><stop offset="0%" stopColor="#3992c7"/><stop offset="100%" stopColor="#153d72"/></radialGradient></defs>
      <rect width="490" height="320" rx="8" fill="#081729"/>
      {Array.from({length:26},(_,i)=><circle key={i} cx={22+((i*89)%449)} cy={16+((i*113)%285)}
        fill="#94bfd7" opacity=".55" r={i%4===0?1.4:.7}/>)}
      {ellipse?
        <><circle cx="186" cy="174" r="23" fill="url(#campaignPlanet)" stroke="#76bded" strokeWidth="1.5"/>
          <text x="146" y="215" fill="#a4d2e9" fontSize="11">EARTH / FOCUS</text></>:
        <><circle cx="85" cy="205" r="14" fill="url(#campaignPlanet)" stroke="#7dc0f7"/>
          <circle cx="375" cy="145" r={definition.target==='jupiter'?24:13}
            fill={definition.target==='jupiter'?'#c79c6c':'#d77965'}/>
          <text x="56" y="236" fill="#a4d2e9" fontSize="11">EARTH</text>
          <text x="375" y="185" textAnchor="middle" fill="#f1cfa6" fontSize="11">
            {definition.target==='mars'?'MARS':definition.target==='jupiter'?'JUPITER':'SURVEY TARGET'}</text>
          <path d="M 38 275 Q 200 15 446 250" fill="none" stroke="#43607e" strokeWidth="1" strokeDasharray="7 9"/></>}
      <path d={path} fill="none" stroke="#e0b978" strokeWidth="2.5"
        strokeDasharray="4 4"/>
      <circle cx={ellipse?186:85} cy={ellipse?174:205} r="4" fill="#80c6d7" opacity=".8"/>
      <g><circle r="7" fill="#f6ce8a" stroke="#fff4d5" strokeWidth="2"/>
        <path d="M -3 -3 L 3 3 M -3 3 L 3 -3" stroke="#264963" strokeWidth="1"/>
        <animateMotion dur={ellipse?'12s':'9s'} repeatCount="indefinite" path={path}
          keyPoints="0;1" keyTimes="0;1" calcMode="linear"/>
      </g>
      <text x="20" y="28" fontSize="11" fill="#9ec3d8">DAY {num(progress)} / {num(definition.durationDays)} · DEPARTURE {review.route.source==='Orekit Lambert'?'SOLVED':'ESTIMATED'}</text>
      <text x="20" y="302" fontSize="10" fill="#95b6c9">
        {ellipse?'Kepler/vis-viva focus geometry · velocity animation is illustrative':
          'Approximate geometry · not a finite-thrust / high-fidelity flight track'}</text>
    </svg>
    <div className="campaign-orbit-values"><div><small>REQUIRED TRANSFER</small><strong>{num(review.requiredDeltaVms)} m/s</strong></div>
      <div><small>AVAILABLE IDEAL ΔV</small><strong>{num(review.totalDeltaVms)} m/s</strong></div>
      <div><small>MODEL FLIGHT TIME</small><strong>{num(review.route.flightDays)} days</strong></div></div>
  </div>;
}
function Check({label,actual,needed,passed,detail}:MissionReview['checks'][number]){
  return <div className={'campaign-system-check '+(passed?'pass':'fail')}
    title={detail}>
    <span className="campaign-check-icon">{passed?'✓':'!'}</span>
    <div><strong>{label}</strong><small>{detail}</small></div>
    <div><b>{actual}</b><small>Target: {needed}</small></div>
  </div>;
}
function OptionCheck({label,checked,onChange,note}:{label:string;checked:boolean;onChange:(checked:boolean)=>void;note:string}){
  return <label className="campaign-module-option">
    <input type="checkbox" checked={checked} onChange={e=>onChange(e.currentTarget.checked)}/>
    <span><b>{label}</b><small>{note}</small></span>
  </label>;
}
export default function CampaignMissions({
  day,cash,completed,devMode,spacecraft,launcher,productionDiscount,
  completedWithLauncherEngine=0,lockedTechnologies=[],run,debrief,
  solvedTransfer,onStart,onFinish,onGoToLab,onGoToRocket,onViewOrbital,
  selected,onSelectedIdChange,options,onOptionsChange,agencyOffers,scheduled,
  nowMs,viewerOpen,onViewerOpenChange,
  launchService,rocketProgramLevel,orbitalAssemblyUnlocked,priorServiceFlights,logisticsInProgress,
  canadianSuccesses,nasaNeoOffer,weatherReserveHours,
  assembly,onLaunchAssemblyFlight,onFinalizeAssembly,onCancelAssembly,
}:{
  day:number;cash:number;completed:readonly string[];devMode:boolean;
  lockedTechnologies?:readonly string[];
  completedWithLauncherEngine?:number;
  spacecraft:SubsystemDesign;launcher:Vehicle;productionDiscount:number;
  run:CampaignRun|null;debrief:CampaignDebrief|null;
  solvedTransfer?:SolvedCampaignTransfer|null;
  onStart:(run:CampaignRun)=>void;onFinish:()=>void;
  onGoToLab:()=>void;onGoToRocket:()=>void;
  onViewOrbital:(definition:CampaignDefinition,options:MissionOptions)=>void;
  selected:CampaignDefinition;onSelectedIdChange:(id:string)=>void;
  options:MissionOptions;onOptionsChange:(next:MissionOptions)=>void;
  agencyOffers:readonly CampaignDefinition[];scheduled:CampaignDefinition|null;
  nowMs:number;viewerOpen:boolean;onViewerOpenChange:(open:boolean)=>void;
  assembly:CampaignAssemblyProject|null;
  onLaunchAssemblyFlight:()=>void;onFinalizeAssembly:()=>void;
  onCancelAssembly:()=>void;
  launchService:LauncherId;rocketProgramLevel:number;
  orbitalAssemblyUnlocked:boolean;priorServiceFlights:number;logisticsInProgress:boolean;
  canadianSuccesses:number;
  nasaNeoOffer:CampaignDefinition|null;weatherReserveHours:number;
}){
  const stage=unlockedStage(completed,devMode);
  const originalAgency=useMemo(()=>agencyMissionDefinitions(),[]);
  const selectedId=selected.id;
  const stageIsLocked=stage<selected.stage;
  const completedMission=completed.includes(selected.id);
  const status=selected.special?specialOfferStatus(selected,day):null;
  const draft=useMemo(()=>{
    try{return {review:reviewCampaignMission({
      definition:selected,day,options,spacecraft,launcher,capitalUsd:cash,
      productionDiscount,completedWithLauncherEngine,solvedTransfer,
      launchService,rocketProgramLevel,orbitalAssemblyUnlocked,priorServiceFlights,
      canadianSuccesses,weatherReserveHours,
    }),error:''};}
    catch(e){return {review:null,error:e instanceof Error?e.message:String(e)}}
  },[selected,day,options,spacecraft,launcher,cash,productionDiscount,
    completedWithLauncherEngine,solvedTransfer,launchService,rocketProgramLevel,
    orbitalAssemblyUnlocked,priorServiceFlights,canadianSuccesses,weatherReserveHours]);
  const review=draft.review;
  const canStart=stage>=selected.stage&&!completedMission&&
    review?.feasible===true&&!run&&!assembly&&!logisticsInProgress&&lockedTechnologies.length===0&&
    (status===null||status==='open');
  const change=<K extends keyof MissionOptions>(key:K,val:MissionOptions[K])=>{
    onOptionsChange({...options,[key]:val});
  };
  function launch(){
    if(!canStart||!review)return;
    onStart({id:selected.id,title:selected.title,special:!!selected.special,
      durationDays:selected.durationDays,launchedDay:day,departureDate:dateForGameDay(day),
      costUsd:review.costUsd,payoutUsd:selected.payoutUsd,payloadKg:review.hardwareWetKg,
      launchService,launchCount:review.launchManifest.flightsRequired,
      launchCostsUsd:review.launchManifest.launchCostUsd,
      orbitalAssemblyCostsUsd:review.launchManifest.assemblyCostUsd,
      spacecraftProcurementUsd:review.spacecraftProcurementUsd,
      launchInvoices:review.launchManifest.flights,
      scienceKg:review.scienceMassKg,target:selected.target,options:{...options},
      route:review.route,deltaVms:review.totalDeltaVms,requiredDeltaVms:review.requiredDeltaVms,
      busPropellantBurnedKg:review.busPropellantBurnedKg,
      busPropellantRemainingKg:review.busPropellantRemainingKg});
  }
  const flightStatus=run?flightProgress(run.startedAtMs??nowMs,nowMs,
    run.viewerDurationMs??DEFAULT_FLIGHT_VIEWER_MS):null;
  const activeMission=run?(
    STORY_MISSIONS.find(m=>m.id===run.id)??agencyOffers.find(m=>m.id===run.id)??(nasaNeoOffer?.id===run.id?nasaNeoOffer:null)??(scheduled?.id===run.id?scheduled:null)??{
      ...selected,id:run.id,title:run.title,target:run.target,durationDays:run.durationDays,
    }):selected;
  const liveReview=run?({
    ...review,
    route:run.route,
    requiredDeltaVms:run.requiredDeltaVms,totalDeltaVms:run.deltaVms,
  } as MissionReview):review;
  return <section className="campaign-progression" aria-label="Progressive space exploration missions">
    <div className="panel campaign-progression-intro">
      <div className="eyebrow">CAMPAIGN / NEW FLIGHT DIRECTORATE</div>
      <h2>From Earth orbit to the outer planets</h2>
      <p>Every successful milestone opens the next playable mission. You must size a spacecraft
        for its payload, launch rocket, mission electrical demand, radiator heat rejection,
        and realistic first-order transfer energy. Special contracts appear for a limited
        number of <b>in-game days</b>; their requirements and rewards vary with your progress.</p>
      <div className="campaign-stage-info">
        <span>MISSION PROGRESSION <strong>{STORY_MISSIONS.filter(m=>completed.includes(m.id)).length} / {STORY_MISSIONS.length}</strong></span>
        <span>GAME DATE <strong>{dateForGameDay(day)}</strong></span>
        <span>ACTIVE MISSION <strong>{run?run.title:'Mission design'}</strong></span>
      </div>
    </div>
    <CampaignOrbitMap day={day} selected={selected} stage={stage} completed={completed}
      story={STORY_MISSIONS} agency={nasaNeoOffer?[...agencyOffers,nasaNeoOffer]:agencyOffers} special={scheduled}
      onSelect={onSelectedIdChange}/>
    <div className="campaign-cards">
      {STORY_MISSIONS.map(m=><button type="button" key={m.id}
        className={'campaign-stage-card '+(selected.id===m.id?'selected ':'')+
          (stage<m.stage?'locked ':'')+(completed.includes(m.id)?'done':'')}
        onClick={()=>onSelectedIdChange(m.id)} aria-pressed={selected.id===m.id}>
        <span className="campaign-stage-count">0{m.stage}</span>
        <div><small>{completed.includes(m.id)?'✓ COMPLETED':
          stage<m.stage?'LOCKED · COMPLETE PREVIOUS MISSION':devMode?'DEV ACCESS ENABLED':'AVAILABLE'}</small>
          <strong>{m.title}</strong>{stage>=m.stage&&<span>{m.location}</span>}</div>
      </button>)}
    </div>
    {nasaNeoOffer&&<div className="panel nasa-campaign-watch">
      <div className="eyebrow">LIVE NASA NEOWS / REAL ASTEROID DATA, FICTIONAL CONTRACT</div>
      <h3>Rapid asteroid observation request</h3>
      <p>Track a real NASA-listed Earth close approach with an Earth-orbit telescope.
        This mission DOES NOT travel to the asteroid. Real target name/date,
        fictional launch requirements and customer reward.</p>
      <button type="button" className={'campaign-special-offer '+(selected.id===nasaNeoOffer.id?'selected':'')}
        onClick={()=>onSelectedIdChange(nasaNeoOffer.id)}>
        <strong>{nasaNeoOffer.title}</strong>
        <span>{completed.includes(nasaNeoOffer.id)?'✓ COMPLETED':
          day>(nasaNeoOffer.windowEndDay??0)?'WINDOW CLOSED':
          'REQUEST OPEN · '+Math.max(0,(nasaNeoOffer.windowEndDay??day)-day)+' GAME DAYS LEFT'}</span>
        <small>{usd(nasaNeoOffer.payoutUsd)} fictional reward · NASA observation scenario</small>
      </button>
    </div>}
    {weatherReserveHours>0&&<div className="panel nasa-weather-campaign-note">
      <div className="eyebrow">NASA DONKI / OPERATIONAL INTELLIGENCE</div>
      <strong>Recent observed space weather: +{weatherReserveHours} h battery contingency</strong>
      <p>Applies to Earth-orbit and lunar mission readiness when real and game dates
        overlap. Increase battery capacity or reserve module. This is a gameplay
        contingency, not a forecast or measured radiation dose.</p>
    </div>}
    <div className="campaign-special-container">
      <div><div className="eyebrow">DYNAMIC OPPORTUNITIES / LIMITED TIME</div>
        <h3>Time-sensitive contracts</h3>
        <p>These offers are generated deterministically from the game calendar, not from real-world clock time.
          Special high-apogee contracts expire if you wait beyond the deadline.</p></div>
      {!scheduled?<div className="campaign-special-locked">Complete Earth Observation One to access special contracts.</div>:
      <button type="button" className={'campaign-special-offer '+(selected.id===scheduled.id?'selected':'')}
        onClick={()=>onSelectedIdChange(scheduled.id)}>
        <strong>{scheduled.title}</strong><span>{specialOfferStatus(scheduled,day)==='open'
          ?'WINDOW OPEN · '+Math.max(0,scheduled.windowEndDay!-day)+' DAYS REMAIN'
          :specialOfferStatus(scheduled,day)==='upcoming'
          ?'OPENS IN '+(scheduled.windowStartDay!-day)+' DAYS':'WINDOW EXPIRED · NEXT OFFER IN THE NEXT CYCLE'}</span>
        <small>{usd(scheduled.payoutUsd)} reward · Required apogee {num(scheduled.ellipticalApogeeKm!)} km</small>
      </button>}
    </div>
    <div className="panel campaign-agency-calendar">
      <div className="eyebrow">REAL NASA MILESTONES / FICTIONAL PLAYER CONTRACTS</div>
      <h3>Future mission opportunities</h3>
      <p>Challenges inspired by NASA's published future events. Player flights are fictional,
         separate spacecraft. Game offer dates are not NASA procurement periods or
         validated planetary launch windows. Missed proposal windows become lower-paying follow-on contracts.</p>
      <div className="campaign-agency-grid">
        {AGENCY_MILESTONES.map((m,i)=>{
          const offer=agencyOffers[i], timing=agencyOfferPhase(originalAgency[i],day);
          return <button type="button" key={m.id}
            className={'campaign-agency-offer '+(selected.id===offer.id?'selected':'')}
            onClick={()=>onSelectedIdChange(offer.id)} aria-pressed={selected.id===offer.id}>
            {stage<offer.stage?<>
              <strong>{offer.title}</strong>
              <span>LOCKED · Complete earlier mission chapters</span>
            </>:<>
              <small>{m.realMission} · {m.event}</small>
              <strong>{offer.title}</strong>
              <span>{timing==='open'?'OPEN · '+(offer.windowEndDay!-day)+' GAME DAYS LEFT':
                timing==='upcoming'?'OPENS '+m.windowStart:'FOLLOW-ON AVAILABLE · REDUCED REWARD'}</span>
              <small>Game design opportunity: {m.windowStart} – {m.windowEnd}</small>
            </>}
          </button>;
        })}
      </div>
      <p className="campaign-agency-links">NASA mission sources: {AGENCY_MILESTONES.map((m,i)=>
        <span key={m.id}><a href={m.sourceUrl} target="_blank" rel="noreferrer">{m.realMission} ({m.event})</a>{i!==AGENCY_MILESTONES.length-1?' · ':''}</span>)}</p>
    </div>
    {assembly&&<div className="panel campaign-assembly-progress" aria-label="Multi-rocket orbital spacecraft assembly">
      <div className="eyebrow">ORBITAL LOGISTICS / SHIP THE SPACECRAFT IN PARTS</div>
      <h2>{assembly.draft.title} — orbital assembly campaign</h2>
      <p>The spacecraft and kick-stage components have been purchased once.
        Each rocket must now actually deliver its assigned hardware to an Earth
        parking orbit. Its launch invoice is paid separately. Only when every
        flight has arrived can your purchased docking facility integrate the
        spacecraft and begin the mission timer.</p>
      <div className="campaign-assembly-meter"><div style={{
        width:(100*assembly.launchesCompleted/assembly.draft.launchCount).toFixed(1)+'%'}}/></div>
      <div className="rocket-assembly-items">
        {assembly.draft.launchInvoices.map((f,i)=><div key={f.flight}
          className={i<assembly.launchesCompleted?'launched':''}>
          <span>{i<assembly.launchesCompleted?'✓ Delivered to parking orbit':'○ Awaiting flight'}
            {' '}· Rocket {f.flight} · {num(f.massKg,1)} kg</span>
          <strong>{usd(f.serviceCostUsd)}</strong>
        </div>)}
      </div>
      {assembly.launchesCompleted<assembly.draft.launchCount?<>
        <p>Next launcher will deliver batch {assembly.launchesCompleted+1} of
          {assembly.draft.launchCount} aboard {assembly.draft.launchService}.</p>
        <button className="launch-button" type="button"
          disabled={cash<assembly.draft.launchInvoices[assembly.launchesCompleted].serviceCostUsd}
          onClick={onLaunchAssemblyFlight}>Launch and dock hardware batch
          {' '}{assembly.launchesCompleted+1}/{assembly.draft.launchCount} ↗</button>
      </>:<>
        <p>All rocket deliveries are logged at the rendezvous point.
          Charge {usd(assembly.draft.orbitalAssemblyCostsUsd)} for
          mechanical docking, propellant connection and final spacecraft integration.</p>
        <button className="launch-button" type="button"
          disabled={cash<assembly.draft.orbitalAssemblyCostsUsd}
          onClick={onFinalizeAssembly}>Assemble spacecraft and begin transfer flight ↗</button>
      </>}
      <button className="secondary-button" type="button" onClick={onCancelAssembly}>
        Cancel assembly project (launch/hardware spending is non-refundable)
      </button>
    </div>}
    {run&&liveReview?<div className="panel campaign-flight">
      <div className="eyebrow">FLIGHT OPERATIONS / CONTRACT IN PROGRESS</div>
      <h2>{run.title}</h2>
      <p>Launch accepted on Day {run.launchedDay} for {activeMission.location}.
        This fast-playback simulates the mission with a real countdown, while the actual
        modeled flight has {run.durationDays} game days. Leave the viewer whenever you wish:
        progress continues, and the persistent circular indicator reopens it.</p>
      {viewerOpen?<><MissionFlightViewer run={run} nowMs={nowMs}/>
        <button type="button" className="secondary-button"
          onClick={()=>onViewerOpenChange(false)}>Exit flight viewer · keep mission running ↗</button></>:
        <div className="campaign-viewer-minimized">
          <strong>Flight viewer minimized · {Math.round((flightStatus?.fraction??0)*100)}%</strong>
          <span>ETA {flightEta(flightStatus?.remainingMs??0)}</span>
          <button type="button" className="secondary-button"
            onClick={()=>onViewerOpenChange(true)}>Reopen flight viewer ↗</button>
        </div>}
      <div className="campaign-flight-stats"><div><span>MISSION COST PAID</span><strong>{usd(run.costUsd)}</strong></div>
        <div><span>ROCKET FLIGHTS PAID</span><strong>{run.launchCount??1} · {run.launchService??'legacy rocket'}</strong></div>
        <div><span>CONTRACT REWARD</span><strong>{usd(run.payoutUsd)}</strong></div>
        <div><span>EXPECTED SCIENCE / PAYLOAD</span><strong>{num(run.scienceKg)} kg</strong></div>
        {run.busPropellantBurnedKg!==undefined&&<div>
          <span>MODELED PROPELLANT CONSUMED</span><strong>{num(run.busPropellantBurnedKg,2)} kg</strong>
        </div>}
        {run.busPropellantRemainingKg!==undefined&&<div>
          <span>PROPELLANT STILL ONBOARD</span><strong>{num(run.busPropellantRemainingKg,2)} kg</strong>
        </div>}</div>
      <button type="button" className="launch-button" disabled={!flightStatus?.ready}
        onClick={onFinish}>{flightStatus?.ready?'Complete flight and mission debrief ↗':
        'Flight underway · ETA '+flightEta(flightStatus?.remainingMs??0)}</button>
    </div>:<>
      {debrief&&<div className="panel campaign-debrief">
        <div className="eyebrow">FLIGHT DEBRIEF / LAST MISSION</div>
        <h3>{debrief.title} · {debrief.success?'Completed':'Unsuccessful'}</h3>
        <p>Mission finished on Day {debrief.day}. The campaign advanced {debrief.durationDays} days.
          {debrief.success?' Your delivered mission hardware met the model requirements and unlocked the next stage.':' Review the engineering constraints before another attempt.'}</p>
        <div><strong>Contract result</strong><span>{usd(debrief.payoutUsd-debrief.costUsd)} modeled net campaign cash</span></div>
        {debrief.busPropellantBurnedKg!==undefined&&<div>
          <strong>Modeled onboard propellant usage</strong>
          <span>{num(debrief.busPropellantBurnedKg,2)} kg consumed · {num(debrief.busPropellantRemainingKg??0,2)} kg left</span>
        </div>}
      </div>}
      {stageIsLocked&&<div className="campaign-locked-overlay">
        <strong>Complete the preceding campaign missions to unlock {selected.title}.</strong>
        <p>Future missions reveal their trajectory and engineering constraints only after unlocking. Developer Mode previews implemented missions without crediting completed stages.</p>
      </div>}
      {!stageIsLocked&&<div className="campaign-workshop">
        <div className="panel campaign-workshop-controls">
          <div className="eyebrow">{selected.special?'SPECIAL CONTRACT':'CAMPAIGN MILESTONE 0'+selected.stage}</div>
          <h2>{selected.title}</h2>
          <p>{selected.summary}</p>
          {selected.special&&<p className="campaign-time-tag">
            {selected.windowStartDay!==undefined&&selected.windowEndDay!==undefined?
              <>Game bid window {dateForGameDay(selected.windowStartDay)}–{dateForGameDay(selected.windowEndDay)}. {status==='open'
                ?(selected.windowEndDay-day)+' in-game days left to launch.':status==='upcoming'
                ?'Offer not yet open.':'Original game window expired.'}</>:
              'Follow-on contract: the original opportunity passed, but a separate customer mission remains available with reduced funding.'}
          </p>}
          <div className="campaign-contract-values">
            <div><small>MISSION FUNDING</small><strong>{usd(selected.payoutUsd)}</strong></div>
            <div><small>EXPECTED FLIGHT LENGTH</small><strong>{num(selected.durationDays)} days</strong></div>
            <div><small>SCIENCE/EXTERNAL PAYLOAD TARGET</small><strong>{num(selected.requiredScienceKg)} kg</strong></div>
          </div>
          <div className="eyebrow">TRANSFER ENERGY / HARDWARE MODULES</div>
          <label className="campaign-option-select">External kick stage
            <select aria-label="External kick stage" value={options.booster}
              onChange={e=>change('booster',e.currentTarget.value as MissionOptions['booster'])}>
              {Object.entries(BOOSTERS).map(([id,v])=><option key={id} value={id}>
                {v.name} · {num(v.dryKg+v.propKg)} kg wet · {usd(v.costUsd)}</option>)}
            </select>
          </label>
          <div className="campaign-external-modules">
            <OptionCheck label={EXTERNAL_MODULES.highGain.name} checked={options.highGain}
              note="38 kg / 65 W / $9M" onChange={v=>change('highGain',v)}/>
            <OptionCheck label={EXTERNAL_MODULES.radiationShield.name} checked={options.radiationShield}
              note="95 kg / 12 W / $18M" onChange={v=>change('radiationShield',v)}/>
            <OptionCheck label={EXTERNAL_MODULES.reserveBattery.name} checked={options.reserveBattery}
              note="35 kg / 4 W / $4M; adds 6 kWh nameplate reserve" onChange={v=>change('reserveBattery',v)}/>
          </div>
          <label className="campaign-option-select">CubeSat rideshare / secondary dispenser
             <select aria-label="CubeSat dispenser configuration" value={options.cubesatUnits??0}
               onChange={e=>change('cubesatUnits',Number(e.currentTarget.value) as MissionOptions['cubesatUnits'])}>
               <option value={0}>No secondary CubeSat installed</option>
               {([1,3] as const).map(units=><option key={units} value={units}>
                 {NASA_CUBESAT_REFERENCE[units].label} · {num(NASA_CUBESAT_REFERENCE[units].massKg,2)} kg payload + {num(NASA_CUBESAT_REFERENCE[units].dispenserDryKg)} kg game dispenser
               </option>)}
             </select>
           </label>
           {selected.requiredCubeSatUnits&&<p className="campaign-model-warning">
             Required: {selected.requiredCubeSatUnits}U dispenser. NASA CubeSat 101 provides
             the dimensions and 1U mass reference; 3U mass extrapolation,
             dispenser hardware and prices are game assumptions.
           </p>}
           {selected.target==='ellipse'&&<div className="campaign-orbital-inputs">
            <div className="eyebrow">ELLIPTICAL EARTH ORBIT / ACTUAL KEPLER ELEMENTS</div>
            <label>Perigee altitude · {num(options.perigeeKm)} km
              <input type="range" aria-label="Mission perigee altitude" min="180" max="1500" step="20"
                value={options.perigeeKm} onChange={e=>change('perigeeKm',Number(e.target.value))}/>
            </label>
            <label>Eccentricity · {options.eccentricity.toFixed(2)}
              <input type="range" aria-label="Mission eccentricity" min="0" max=".8" step=".01"
                value={options.eccentricity} onChange={e=>change('eccentricity',Number(e.target.value))}/>
            </label>
          </div>}
          <div className="campaign-workshop-actions">
            <button type="button" className="secondary-button" onClick={onGoToLab}>Engineering Lab / installed equipment ↗</button>
            <button type="button" className="secondary-button" onClick={onGoToRocket}>Rocket Fleet / Launch Logistics ↗</button>
            <button type="button" className="secondary-button"
              onClick={()=>onViewOrbital(selected,options)}>Analyze this orbit in Orbital Map ↗</button>
          </div>
        </div>
        <div className="panel campaign-workshop-review">
          <div className="eyebrow">LIVE MODEL / TRANSFER + RESOURCE MARGINS</div>
          <h2>Flight engineering review</h2>
          {review?<><OrbitScene definition={selected} review={review}/>
            {review.route.phaseErrorDeg!==null&&<p className="campaign-phase">
              Approximate planetary phase mismatch: <strong>{num(review.route.phaseErrorDeg,1)}°</strong>.
              This is an alignment indicator, not a verified launch window.</p>}
            <p className="campaign-model-warning">{review.route.warning}</p>
            <div className="campaign-system-checks">
              {review.checks.map((c,i)=><Check key={i} {...c}/>)}
            </div>
            <div className="campaign-logistics-breakdown" aria-label="Paid launch services and orbital assembly plan">
              <div className="eyebrow">ACTUAL LAUNCH LOGISTICS · SEPARATE FROM SATELLITE DESIGN</div>
              <h3>{review.launchManifest.vehicleLabel}</h3>
              <p>Spacecraft/transfer vehicle wet mass: <strong>{num(review.hardwareWetKg,1)} kg</strong>.
                 Installed LEO capacity per rocket: <strong>{num(review.launchCapacityKg,0)} kg</strong>.
                 {review.launchManifest.flightsRequired>1?
                   ' Larger spacecraft are split into separately paid launches, assembled and fueled in orbit before departure.':
                   ' One launch can deliver the complete configured vehicle to Earth orbit.'}</p>
              <div className="campaign-logistics-costs">
                <div><span>Spacecraft + kick-stage procurement</span><strong>{usd(review.spacecraftProcurementUsd)}</strong></div>
                <div><span>{review.launchManifest.flightsRequired} × launch-service invoices</span>
                  <strong>{usd(review.launchManifest.launchCostUsd)}</strong></div>
                <div><span>Docking/assembly joins</span>
                  <strong>{usd(review.launchManifest.assemblyCostUsd)}</strong></div>
                <div><span>Modeled cost per delivered kg to LEO</span>
                  <strong>${num(review.launchManifest.actualCostPerKgUsd,0)}/kg</strong></div>
              </div>
              {review.launchManifest.flights.map(f=><div className="campaign-flight-manifest-row" key={f.flight}>
                <span>Rocket {f.flight}: {num(f.massKg,1)} / {num(f.capacityKg,1)} kg</span>
                <strong>{usd(f.serviceCostUsd)}</strong></div>)}
              {review.launchManifest.issue&&<p className="campaign-model-warning">
                {review.launchManifest.issue} Open Rocket Fleet to increase payload capability
                or purchase orbital docking infrastructure.</p>}
              <button type="button" className="secondary-button" onClick={onGoToRocket}>
                 Change rocket / upgrade flight economics ↗</button>
            </div>
            <div className="campaign-flight-stats">
              <div><span>MISSION PROCUREMENT & LAUNCH</span><strong>{usd(review.costUsd)}</strong></div>
              <div><span>AGENCY FUNDS</span><strong>{usd(cash)}</strong></div>
              <div><span>EXPECTED NET IF SUCCESS</span><strong>{usd(selected.payoutUsd-review.costUsd)}</strong></div>
            </div>
            {review.findings.length>0&&<div className="campaign-review-findings">
              <div className="eyebrow">ENGINEERING FINDINGS</div>
              {review.findings.map((finding,i)=><p key={i}>• {finding}</p>)}
            </div>}
            {completedMission?<div className="campaign-complete-label">Mission already completed; reward cannot be claimed twice.</div>:
              <button type="button" className="launch-button" disabled={!canStart}
                onClick={launch}>{review.feasible?'Accept contract and launch':'Resolve engineering constraints'} ↗</button>}
            {stageIsLocked&&<p className="campaign-model-warning">Complete preceding milestones or use Developer Mode before launching.</p>}
            {logisticsInProgress&&<p className="campaign-model-warning" role="status">
               A lunar cargo lander is already underway. Complete its delivery before launching another exploration mission.
             </p>}
             {lockedTechnologies.length>0&&<p className="campaign-model-warning" role="status">
              Research required: {lockedTechnologies.join(', ')}. Unlock your installed spacecraft parts in Research &amp; Roadmap or temporarily enable Dev Mode.
            </p>}
          </>:<p role="alert">Cannot analyze the selected design: {draft.error}. Restore valid spacecraft parameters in Engineering Lab.</p>}
        </div>
      </div>}
    </>}
    <div className="campaign-time-footer">
      <p><strong>Continuous campaign time:</strong> one game day passes every two real minutes
        while the game tab is visible. Hidden/closed tabs pause time; completing a
        mission advances by its modeled flight duration. These are fictional game
        deadlines, not confirmed interplanetary launch windows.</p>
    </div>
  </section>;
}
