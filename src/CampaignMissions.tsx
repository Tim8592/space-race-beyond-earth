import {useEffect,useMemo,useState} from 'react';
import {earthOrbitAtTime} from './lib/orbitalMechanics';
import {dateForGameDay,DEFAULT_MISSION_OPTIONS,BOOSTERS,EXTERNAL_MODULES,
  STORY_MISSIONS,reviewCampaignMission,nextSpecialOffer,specialOfferStatus,
  unlockedStage,type CampaignDefinition,type MissionOptions,type MissionReview,
  type SolvedCampaignTransfer} from './lib/campaignMissions';
import type {Vehicle} from './lib/engineering';
import type {SubsystemDesign} from './lib/subsystemDesign';

const OPTIONS_KEY='space-race-mission-workshop-v1';
export type CampaignRun={
  id:string;title:string;special:boolean;durationDays:number;
  launchedDay:number;departureDate:string;
  costUsd:number;payoutUsd:number;payloadKg:number;
  target:CampaignDefinition['target'];options:MissionOptions;
  route:MissionReview['route'];scienceKg:number;
  deltaVms:number;requiredDeltaVms:number;
};
export type CampaignDebrief={
  id:string;title:string;day:number;success:boolean;special:boolean;
  costUsd:number;payoutUsd:number;durationDays:number;deltaVms:number;
  neededDeltaVms:number;scienceKg:number;
};
function readOptions():MissionOptions{
  try{
    const raw=JSON.parse(localStorage.getItem(OPTIONS_KEY)??'null') as Partial<MissionOptions>|null;
    return raw?{...DEFAULT_MISSION_OPTIONS,...raw}:DEFAULT_MISSION_OPTIONS;
  }catch{return DEFAULT_MISSION_OPTIONS}
}
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
  solvedTransfer,onStart,onFinish,onGoToLab,onGoToRocket,onViewOrbital,onAdvance,
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
  onAdvance:()=>void;
}){
  const stage=unlockedStage(completed,devMode);
  const firstAvailable=STORY_MISSIONS.find(m=>stage>=m.stage&&!completed.includes(m.id))??STORY_MISSIONS[0];
  const [selectedId,setSelectedId]=useState<string>(firstAvailable.id);
  const [options,setOptions]=useState<MissionOptions>(readOptions);
  useEffect(()=>{try{localStorage.setItem(OPTIONS_KEY,JSON.stringify(options))}catch{/* private browser */}},[options]);
  const scheduled=nextSpecialOffer(day,stage);
  const selected=STORY_MISSIONS.find(m=>m.id===selectedId)??(
    scheduled?.id===selectedId?scheduled:null)??firstAvailable;
  const stageIsLocked=!selected.special&&stage<selected.stage;
  const completedMission=completed.includes(selected.id);
  const status=scheduled&&selected.id===scheduled.id?specialOfferStatus(scheduled,day):null;
  const draft=useMemo(()=>{
    try{return {review:reviewCampaignMission({
      definition:selected,day,options,spacecraft,launcher,capitalUsd:cash,
      productionDiscount,completedWithLauncherEngine,solvedTransfer,
    }),error:''};}
    catch(e){return {review:null,error:e instanceof Error?e.message:String(e)}}
  },[selected,day,options,spacecraft,launcher,cash,productionDiscount,
    completedWithLauncherEngine,solvedTransfer]);
  const review=draft.review;
  const canStart=stage>=selected.stage&&!completedMission&&
    review?.feasible===true&&!run&&lockedTechnologies.length===0&&
    (status===null||status==='open');
  const change=<K extends keyof MissionOptions>(key:K,val:MissionOptions[K])=>{
    setOptions(prev=>({...prev,[key]:val}));
  };
  function launch(){
    if(!canStart||!review)return;
    onStart({id:selected.id,title:selected.title,special:!!selected.special,
      durationDays:selected.durationDays,launchedDay:day,departureDate:dateForGameDay(day),
      costUsd:review.costUsd,payoutUsd:selected.payoutUsd,payloadKg:review.hardwareWetKg,
      scienceKg:review.scienceMassKg,target:selected.target,options:{...options},
      route:review.route,deltaVms:review.totalDeltaVms,requiredDeltaVms:review.requiredDeltaVms});
  }
  const activeMission=run?(
    STORY_MISSIONS.find(m=>m.id===run.id)??(scheduled?.id===run.id?scheduled:null)??{
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
        <span>MISSION PROGRESSION <strong>{completed.filter(id=>id!=='observation'&&!id.startsWith('special-')).length} / {STORY_MISSIONS.length}</strong></span>
        <span>GAME DATE <strong>{dateForGameDay(day)}</strong></span>
        <span>ACTIVE MISSION <strong>{run?run.title:'Mission design'}</strong></span>
      </div>
    </div>
    <div className="campaign-cards">
      {STORY_MISSIONS.map(m=><button type="button" key={m.id}
        className={'campaign-stage-card '+(selected.id===m.id?'selected ':'')+
          (stage<m.stage?'locked ':'')+(completed.includes(m.id)?'done':'')}
        onClick={()=>setSelectedId(m.id)} aria-pressed={selected.id===m.id}>
        <span className="campaign-stage-count">0{m.stage}</span>
        <div><small>{completed.includes(m.id)?'✓ COMPLETED':
          stage<m.stage?'LOCKED · COMPLETE PREVIOUS MISSION':devMode?'DEV ACCESS ENABLED':'AVAILABLE'}</small>
          <strong>{m.title}</strong><span>{m.location}</span></div>
      </button>)}
    </div>
    <div className="campaign-special-container">
      <div><div className="eyebrow">DYNAMIC OPPORTUNITIES / LIMITED TIME</div>
        <h3>Time-sensitive contracts</h3>
        <p>These offers are generated deterministically from the game calendar, not from real-world clock time.
          Special high-apogee contracts expire if you wait beyond the deadline.</p></div>
      {!scheduled?<div className="campaign-special-locked">Complete Earth Observation One to access special contracts.</div>:
      <button type="button" className={'campaign-special-offer '+(selected.id===scheduled.id?'selected':'')}
        onClick={()=>setSelectedId(scheduled.id)}>
        <strong>{scheduled.title}</strong><span>{specialOfferStatus(scheduled,day)==='open'
          ?'WINDOW OPEN · '+Math.max(0,scheduled.windowEndDay!-day)+' DAYS REMAIN'
          :specialOfferStatus(scheduled,day)==='upcoming'
          ?'OPENS IN '+(scheduled.windowStartDay!-day)+' DAYS':'WINDOW EXPIRED · NEXT OFFER IN THE NEXT CYCLE'}</span>
        <small>{usd(scheduled.payoutUsd)} reward · Required apogee {num(scheduled.ellipticalApogeeKm!)} km</small>
      </button>}
    </div>
    {run&&liveReview?<div className="panel campaign-flight">
      <div className="eyebrow">FLIGHT OPERATIONS / CONTRACT IN PROGRESS</div>
      <h2>{run.title}</h2>
      <p>Launch accepted on Day {run.launchedDay}. Engineering feasibility was checked at departure,
        and the mission’s {run.durationDays}-day operations are simulated as a single simplified
        flight period. This view visualizes the modeled transfer, not a finite-thrust flight solution.</p>
      <OrbitScene definition={activeMission} review={liveReview} progress={run.durationDays}/>
      <div className="campaign-flight-stats"><div><span>MISSION COST PAID</span><strong>{usd(run.costUsd)}</strong></div>
        <div><span>CONTRACT REWARD</span><strong>{usd(run.payoutUsd)}</strong></div>
        <div><span>EXPECTED SCIENCE / PAYLOAD</span><strong>{num(run.scienceKg)} kg</strong></div></div>
      <button type="button" className="launch-button" onClick={onFinish}>Complete flight and mission debrief ↗</button>
    </div>:<>
      {debrief&&<div className="panel campaign-debrief">
        <div className="eyebrow">FLIGHT DEBRIEF / LAST MISSION</div>
        <h3>{debrief.title} · {debrief.success?'Completed':'Unsuccessful'}</h3>
        <p>Mission finished on Day {debrief.day}. The campaign advanced {debrief.durationDays} days.
          {debrief.success?' Your delivered mission hardware met the model requirements and unlocked the next stage.':' Review the engineering constraints before another attempt.'}</p>
        <div><strong>Contract result</strong><span>{usd(debrief.payoutUsd-debrief.costUsd)} modeled net campaign cash</span></div>
      </div>}
      {stageIsLocked&&<div className="campaign-locked-overlay">
        <strong>Complete the preceding campaign missions to unlock {selected.title}.</strong>
        <p>Developer Mode makes the implemented mission playable for demonstration, without marking prior stages as permanently complete.</p>
      </div>}
      <div className="campaign-workshop">
        <div className="panel campaign-workshop-controls">
          <div className="eyebrow">{selected.special?'SPECIAL CONTRACT':'CAMPAIGN MILESTONE 0'+selected.stage}</div>
          <h2>{selected.title}</h2>
          <p>{selected.summary}</p>
          {selected.special&&<p className="campaign-time-tag">Bid window Days {selected.windowStartDay}–{selected.windowEndDay}. {status==='open'
            ?(selected.windowEndDay!-day)+' in-game days left to launch.':status==='upcoming'
            ?'Offer not yet open.':'The offer has expired.'}</p>}
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
            <button type="button" className="secondary-button" onClick={onGoToRocket}>Launch Rocket Builder ↗</button>
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
            {lockedTechnologies.length>0&&<p className="campaign-model-warning" role="status">
              Research required: {lockedTechnologies.join(', ')}. Unlock your installed spacecraft parts in Research &amp; Roadmap or temporarily enable Dev Mode.
            </p>}
          </>:<p role="alert">Cannot analyze the selected design: {draft.error}. Restore valid spacecraft parameters in Engineering Lab.</p>}
        </div>
      </div>
    </>}
    <div className="campaign-time-footer">
      <p><strong>Time matters:</strong> advancing game days may close an offer. A successful mission
        advances the calendar by its flight duration. Special contracts use an in-game
        procurement deadline, not a claimed ephemeris-accurate planetary launch window.</p>
      <button type="button" className="secondary-button" onClick={onAdvance} disabled={!!run}>
        Advance 7 days / wait for opportunities →
      </button>
    </div>
  </section>;
}
