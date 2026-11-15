import { useEffect, useMemo, useState } from 'react';
import Spacecraft3D from './Spacecraft3D';
import MissionOrbitScene from './MissionOrbitScene';
import {
  DEFAULT_OBSERVATION, INSTRUMENTS, RADIOS, STORAGE,
  SCIENCE_GOAL, OBSERVATION_BUDGET_USD, OBSERVATION_DAYS,
  OBSERVATION_PAYOUT_USD, observationPreview, simulateObservation,
  type ObservationChoices, type ObservationConfig, type Capacity,
} from './lib/observationMission';
import type { SubsystemDesign } from './lib/subsystemDesign';
import type { Vehicle } from './lib/engineering';
import type {LauncherId} from './lib/launchLogistics';

const SAVE_KEY='space-race-observation-one-v1';
type Run = {config:ObservationConfig; day:number; phase:'operations'|'debrief'};
type MissionSave = {choices:ObservationChoices;run:Run|null};

function readMission():MissionSave {
  try {
    const raw=JSON.parse(localStorage.getItem(SAVE_KEY)??'null') as MissionSave|null;
    if(!raw||!raw.choices)return {choices:DEFAULT_OBSERVATION,run:null};
    const choices={...DEFAULT_OBSERVATION,...raw.choices};
    return {choices,run:raw.run?.config&&Number.isInteger(raw.run.day)?raw.run:null};
  }catch{return {choices:DEFAULT_OBSERVATION,run:null};}
}
function usd(n:number){return '$'+(n/1e6).toFixed(1)+'M';}
function num(n:number, digits=1){return Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:digits}):'—';}

function CapacityBar({cap}:{cap:Capacity}){
  const over=cap.used>cap.limit+1e-8;
  const ratio=cap.limit>0?Math.max(0,cap.used/cap.limit):cap.used>0?1.5:0;
  const color=over?'over':ratio>.88?'tight':'healthy';
  return <div className={'ob-capacity '+color}>
    <div className="ob-capacity-top"><strong>{cap.name}</strong>
      <span>{num(cap.used,2)} / {num(cap.limit,2)} {cap.unit}</span>
    </div>
    <div className="ob-capacity-track" role="meter" aria-label={cap.name}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100,ratio*100))}
      aria-valuetext={num(cap.used,2)+' of '+num(cap.limit,2)+' '+cap.unit+(over?' above capacity':'')}>
      <div className="ob-capacity-fill" style={{width:Math.min(100,ratio*100)+'%'}}/>
      <div className="ob-capacity-limit"/>
    </div>
    <div className="ob-capacity-foot"><small>{cap.context}</small><b>{over?'OVER LIMIT':ratio>.88?'LOW MARGIN':'WITHIN CAPACITY'}</b></div>
  </div>;
}
function SelectOption<T extends string>({label,value,onChange,options}:{
 label:string;value:T;onChange:(v:T)=>void;options:{value:T;label:string}[];
}){
  return <label className="ob-control">{label}
    <select value={value} onChange={e=>onChange(e.currentTarget.value as T)}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>;
}
function PercentBars({days}:{days:ReturnType<typeof simulateObservation>['days']}){
  const max=Math.max(1,...days.map(d=>d.generatedMb));
  return <div className="ob-data-chart" role="img" aria-label="Seven daily bars showing generated and downlinked observation data">
    {days.map(d=><div key={d.day} className="ob-data-day">
      <div className="ob-bar-pair">
        <span className="ob-bar-col produced" title={'Generated '+num(d.generatedMb,0)+' Mb'}
          style={{height:Math.max(2,d.generatedMb/max*100)+'%'}}/>
        <span className="ob-bar-col delivered" title={'Delivered '+num(d.deliveredMb,0)+' Mb'}
          style={{height:Math.max(2,d.deliveredMb/max*100)+'%'}}/>
      </div>
      <small>D{d.day}</small>
    </div>)}
  </div>;
}

export default function EarthObservationMission({
  spacecraft,launcher,cash,completedWithEngine,technologyDiscount=0,lockedTechnologies=[],
  launchService='custom',rocketProgramLevel=0,orbitalAssemblyUnlocked=false,priorServiceFlights=0,
  otherMissionActive=false,
  onEditSpacecraft,onEditLauncher,onStart,onComplete,
}:{
  spacecraft:SubsystemDesign;
  launcher:Vehicle;
  cash:number;
  completedWithEngine:number;
  onEditSpacecraft:()=>void;
  onEditLauncher:()=>void;
  technologyDiscount?:number;
  lockedTechnologies?:readonly string[];
  launchService?:LauncherId;rocketProgramLevel?:number;
  orbitalAssemblyUnlocked?:boolean;priorServiceFlights?:number;otherMissionActive?:boolean;
  onStart:(costUsd:number)=>void;
  onComplete:(result:{success:boolean;missionCostUsd:number;payoutUsd:number;
    wetMassKg:number;returnedScience:number})=>void;
}){
  const [state,setState]=useState<MissionSave>(readMission);
  const {choices,run}=state;
  useEffect(()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(state))}catch{/* optional storage */}},[state]);

  const config:ObservationConfig=useMemo(()=>({
    choices,spacecraft,launcher,completedWithEngine,technologyDiscount,
    launchService,rocketProgramLevel,orbitalAssemblyUnlocked,priorServiceFlights,
  }),[choices,spacecraft,launcher,completedWithEngine,technologyDiscount,
    launchService,rocketProgramLevel,orbitalAssemblyUnlocked,priorServiceFlights]);
  const current=useMemo(()=>{
    try{return {simulation:simulateObservation(config),error:''}}
    catch(error){return {simulation:null,error:error instanceof Error?error.message:'Invalid design'}}
  },[config]);
  const snapshot=useMemo(()=>{
    if(!run)return null;
    try{return simulateObservation(run.config)}catch{return null}
  },[run]);
  const forecast=current.simulation;
  const preview=forecast?.preview;
  const activeInstrument=INSTRUMENTS[choices.instrument];
  const budgetOK=!!preview&&preview.missionCostUsd<=OBSERVATION_BUDGET_USD&&preview.missionCostUsd<=cash;
  const canStart=!!preview&&preview.launchReady&&budgetOK&&lockedTechnologies.length===0&&!otherMissionActive;
  function choicesChange<K extends keyof ObservationChoices>(key:K,val:ObservationChoices[K]){
    setState(p=>({...p,choices:{...p.choices,[key]:val}}));
  }

  function start(){
    if(!canStart||!preview)return;
    onStart(preview.missionCostUsd);
    setState(p=>({...p,run:{config,day:0,phase:'operations'}}));
  }
  function advance(days:number){
    if(!run||run.phase!=='operations'||!snapshot)return;
    const nextDay=Math.min(OBSERVATION_DAYS,run.day+days);
    const finished=nextDay===OBSERVATION_DAYS;
    setState(p=>({...p,run:p.run?
      {...p.run,day:nextDay,phase:finished?'debrief':'operations'}:null}));
    if(finished)onComplete({success:snapshot.successful,
      missionCostUsd:snapshot.preview.missionCostUsd,
      payoutUsd:snapshot.successful?OBSERVATION_PAYOUT_USD:0,
      wetMassKg:snapshot.preview.massKg,
      returnedScience:snapshot.scienceReturned});
  }

  const missionStatus=run?.phase==='operations'?'OPERATIONS':
    run?.phase==='debrief'?'DEBRIEF':'DESIGN';
  return <section className="ob-mission" aria-label="Earth Observation One campaign">
    <div className="panel ob-hero">
      <div className="eyebrow">CAMPAIGN MISSION 01 · EARTH OBSERVATION</div>
      <div className="ob-hero-title">
        <div><h2>Earth Observation One</h2>
          <p>Launch a spacecraft into low Earth orbit. Operate its instrument for seven days and <strong>return at least {SCIENCE_GOAL} science points to Earth</strong>. Captured images don't count until they are downlinked.</p></div>
        <span className="ob-phase">{missionStatus} · {run?.day??0}/{OBSERVATION_DAYS} DAYS</span>
      </div>
      <div className="ob-brief-facts">
        <span><strong>{usd(OBSERVATION_BUDGET_USD)}</strong> BRIEF BUDGET</span>
        <span><strong>{usd(OBSERVATION_PAYOUT_USD)}</strong> SUCCESS PAYOUT</span>
        <span><strong>{OBSERVATION_DAYS} DAYS</strong> OPERATIONS</span>
        <span><strong>{SCIENCE_GOAL} PTS</strong> SCIENCE TARGET</span>
      </div>
    </div>

    {!run&&<>
      <div className="ob-mission-grid">
        <div className="panel ob-options">
          <div className="eyebrow">01 / SCIENCE AND OPERATIONS</div>
          <h3>Choose your payload and support systems</h3>
          <p className="ob-subtitle">Each selection changes mass, electric load, heat, cost, data volume or downlink ability.</p>
          <SelectOption label="Science instrument" value={choices.instrument}
            onChange={v=>choicesChange('instrument',v)}
            options={Object.entries(INSTRUMENTS).map(([id,v])=>({value:id as ObservationChoices['instrument'],
              label:v.name+' · '+v.massKg+' kg · '+v.powerW+' W'}))}/>
          <div className="ob-instrument-note">{activeInstrument.detail} · {activeInstrument.dataMbps} Mb/s imagery · {activeInstrument.sciencePerHour} science pts/active hour</div>
          <SelectOption label="Communications / antenna" value={choices.radio}
            onChange={v=>choicesChange('radio',v)}
            options={Object.entries(RADIOS).map(([id,v])=>({value:id as ObservationChoices['radio'],
              label:v.name+' · '+v.rateMbps+' Mb/s · '+v.powerW+' W'}))}/>
          <SelectOption label="Onboard data recorder" value={choices.storage}
            onChange={v=>choicesChange('storage',v)}
            options={Object.entries(STORAGE).map(([id,v])=>({value:id as ObservationChoices['storage'],
              label:v.name+' · '+num(v.capacityMb/8000,0)+' GB'}))}/>
          <SelectOption label="Instrument operating duty cycle" value={String(choices.dutyFraction)}
            onChange={v=>choicesChange('dutyFraction',Number(v))}
            options={[.25,.5,.75,1].map(n=>({value:String(n),label:(n*100)+'% of sunlit time'}))}/>
          <SelectOption label="Target Earth orbit" value={String(choices.orbitAltitudeKm)}
            onChange={v=>choicesChange('orbitAltitudeKm',Number(v) as 400|700)}
            options={[{value:'400',label:'400 km · closer Earth view'},{value:'700',label:'700 km · longer station access'}]}/>
          <SelectOption label="Reserved launch payload slot" value={String(choices.launchSlotKg)}
            onChange={v=>choicesChange('launchSlotKg',Number(v) as 140|220|500)}
            options={[{value:'140',label:'140 kg · compact'},
              {value:'220',label:'220 kg · standard'},
              {value:'500',label:'500 kg · expanded'}]}/>
          <label className="ob-control">Additional radiator area
            <span><input type="range" min={0} max={3} step={.1}
              value={choices.radiatorExtraAreaM2}
              onChange={e=>choicesChange('radiatorExtraAreaM2',Number(e.target.value))}/>
              <strong>{choices.radiatorExtraAreaM2.toFixed(1)} m²</strong></span>
          </label>
          <label className="ob-control">Additional battery pack capacity
            <span><input type="range" min={0} max={1500} step={50}
              value={choices.batteryExtraWh}
              onChange={e=>choicesChange('batteryExtraWh',Number(e.target.value))}/>
              <strong>{num(choices.batteryExtraWh,0)} Wh</strong></span>
          </label>
          <p className="ob-assumption">Illustrative instrument, ground contact, radio, storage, cost and game-science values. Earth orbit calculations use NASA/JPL Earth parameters. Changing the mission does not fake an electric engine's launch capability: in-space thrusters are inactive during normal imaging.</p>
        </div>
        <div className="panel ob-model">
          <div className="eyebrow">02 / SHARED SPACECRAFT DESIGN</div>
          <h3>What you'll actually launch</h3>
          <p className="ob-subtitle">This is the same spacecraft you edit in Engineering Lab. The mission substitutes the selected instrument for its generic payload mass slot.</p>
          {preview&&<Spacecraft3D design={{...spacecraft,payloadMassKg:0,payloadInstrumentId:choices.instrument,distanceAu:1}}
            analysis={preview.missionResult}/>}
          <div className="ob-link-actions">
            <button className="secondary-button" onClick={onEditSpacecraft}>Edit propulsion, solar and thermal →</button>
            <button className="secondary-button" onClick={onEditLauncher}>Open Rocket Fleet / choose launch service →</button>
          </div>
          {preview&&<div className="guided-launch-invoice">
            <div className="eyebrow">PAID SATELLITE TRANSPORT / ROCKET FLEET</div>
            <strong>{preview.launchManifest.vehicleLabel}</strong>
            <span>Selected launch quote: {usd(preview.launchManifest.launchCostUsd)} for
              {preview.launchManifest.flightsRequired} flight(s) · {num(preview.massKg,1)} kg
              wet satellite · reserved {choices.launchSlotKg} kg deployment slot</span>
            <p>The reserved smallsat slot is a game limit. External service
              launch Δv/TWR are contract-level assumptions, not a propagated Falcon
              ascent or a verified flight offer. Choosing a heavier spacecraft
              cannot exceed either your slot or the launcher's physical capacity.</p>
          </div>}
        </div>
      </div>
      <div className="panel ob-review">
        <div className="ob-section-header"><div className="eyebrow">03 / LIVE ENGINEERING REVIEW</div><h3>Resource and capacity margins</h3></div>
        {preview&&<>
          <div className="ob-capacity-grid">{preview.capacities.map(c=><CapacityBar key={c.name} cap={c}/>)}</div>
          <div className="ob-forecast">
            <div><span>Projected science returned</span><strong>{num(forecast!.scienceReturned,1)} / {SCIENCE_GOAL} pts</strong></div>
            <div><span>Science lost to storage overflow</span><strong>{num(forecast!.totalDataLostMb/8000,2)} GB</strong></div>
            <div><span>Power / thermal / eclipse efficiency</span><strong>{Math.round(preview.effectPower*100)}% / {Math.round(preview.effectThermal*100)}% / {Math.round(preview.effectEclipse*100)}%</strong></div>
            <div><span>Program balance</span><strong>{usd(cash)} available</strong></div>
          </div>
          <div className="ob-research-economics">
            <div className="eyebrow">SPACECRAFT TECHNOLOGY / PROCUREMENT ECONOMICS</div>
            <div><span>Installed spacecraft bus, propulsion and power hardware</span>
              <strong>{usd(preview.spacecraftProcurement.beforeDiscountUsd)}</strong></div>
            <div><span>Manufacturing learning curve savings</span>
              <strong>{'-'+usd(preview.spacecraftProcurement.discountUsd)}</strong></div>
            <div className="total"><span>Hardware procurement after research</span>
              <strong>{usd(preview.spacecraftProcurement.afterDiscountUsd)}</strong></div>
            <p>Includes illustrative procurement for flight hardware. The mission total also includes
              your launch rocket, scientific payload, radio, storage and mission upgrades.
              These are game financial estimates, not supplier quotes.</p>
          </div>
          <div className="ob-risk-review">
            <div><span>ENGINEERING RISK REVIEW</span>
              <strong>{preview.riskReview.level.toUpperCase()}</strong></div>
            {preview.riskReview.drivers.length?
              <p>{preview.riskReview.drivers.join(' · ')}</p>:
              <p>Capacity margins are positive in this simple check. Deployment, redundancy, pointing, weather and schedule risks are not yet quantified.</p>}
            <small>Risk is qualitative, not an actual flight failure probability or official NASA TRL assessment.</small>
          </div>
          {lockedTechnologies.length>0&&<p className="ob-research-lock" role="status">
            RESEARCH REQUIRED: {lockedTechnologies.length} selected spacecraft technology unlock(s) are missing. Research them in Research &amp; Roadmap or enable Dev Mode for demonstration.
          </p>}
          <div className="ob-warning-list" aria-label="Engineering review findings">
            {preview.warnings.length===0?
              <p className="ob-good">All first-order capacity checks are within modeled limits.</p>:
              preview.warnings.map((w,i)=><p key={i}><b>!</b> {w}</p>)}
            {forecast&&!forecast.successful&&preview.launchReady&&
              <p><b>!</b> The mission can launch but is projected to miss its science goal. Upgrade power/thermal/downlink or choose a less demanding payload.</p>}
          </div>
          <div className="ob-action">
            <div><strong>Ready for seven-day observation campaign?</strong>
              <small>{canStart
                ? forecast?.successful?'Predicted science objective achievable with selected assumptions.':'You can launch, but the forecast warns of a likely science failure.'
                : lockedTechnologies.length>0
                  ?'Unlock selected technology in Research & Roadmap or enable Dev Mode to proceed.'
                  :'Resolve launch capacity, budget or available cash before launch.'}</small></div>
            <button className="launch-button" onClick={start} disabled={!canStart}>Launch Earth Observation One <span>↗</span></button>
          </div>
        </>}
        {!preview&&<p role="alert">Invalid spacecraft configuration: {current.error}. Go to Engineering Lab and restore physical values.</p>}
      </div>
    </>}

    {run&&snapshot&&<>
      <div className="panel ob-operations">
        <div className="eyebrow">04 / FLIGHT OPERATIONS · {'DAYS 1–7'}</div>
        <h3>{run.phase==='debrief'?'Mission complete — engineering debrief':'Satellite in orbit — collecting and returning science'}</h3>
        <MissionOrbitScene altitudeKm={run.config.choices.orbitAltitudeKm}
          completedDays={run.day} finished={run.phase==='debrief'}
          downlinkAvailable={snapshot.preview.downlinkMbPerDay>0}/>
        <div className="ob-progress-strip">
          {Array.from({length:OBSERVATION_DAYS},(_,i)=><div key={i}
            className={'ob-day-tile '+(i<run.day?'done':'')}
            aria-label={'Day '+(i+1)+(i<run.day?' completed':' pending')}>DAY {i+1}</div>)}
        </div>
        <div className="ob-operations-grid">
          <div className="ob-live-stats">
            <div><span>Science received on Earth</span><strong>{num(snapshot.days.slice(0,run.day).reduce((n,d)=>n+d.returnedScience,0),1)} / {SCIENCE_GOAL} pts</strong></div>
            <div><span>Images downlinked</span><strong>{num(snapshot.days.slice(0,run.day).reduce((n,d)=>n+d.deliveredMb,0)/8000,2)} GB</strong></div>
            <div><span>Onboard buffer</span><strong>{num(run.day?snapshot.days[run.day-1].bufferedMb/8000:0,2)} GB</strong></div>
            <div><span>Science-data losses</span><strong>{num(snapshot.days.slice(0,run.day).reduce((n,d)=>n+d.lostMb,0)/8000,2)} GB</strong></div>
          </div>
          <div><div className="eyebrow">GENERATED VS RETURNED DATA / EACH DAY</div>
            <PercentBars days={snapshot.days.slice(0,run.day)}/><div className="ob-legend"><span>● Generated</span><span>● Downlinked</span></div>
          </div>
        </div>
        {run.day>0&&<p className="ob-day-note" role="status">
          Day {run.day}: instrument operated {num(snapshot.days[run.day-1].activeHours,1)} hours;
          generated {num(snapshot.days[run.day-1].generatedMb,0)} Mb,
          downlinked {num(snapshot.days[run.day-1].deliveredMb,0)} Mb and
          returned {num(snapshot.days[run.day-1].returnedScience,1)} science points.
        </p>}
        {run.phase==='operations'&&<div className="ob-actions-row">
          <button type="button" className="secondary-button" onClick={()=>advance(1)}>Advance one day →</button>
          <button type="button" className="launch-button" onClick={()=>advance(OBSERVATION_DAYS)}>Finish seven-day simulation <span>↗</span></button>
        </div>}
        {run.phase==='debrief'&&<div className="ob-debrief">
          <h3>{snapshot.successful?'Mission successful · Science returned':'Mission unsuccessful · Review the trade-offs'}</h3>
          <p>{snapshot.successful?
            'You launched a viable spacecraft and returned enough science within budget. You earned the contract payout.':
            'The mission missed one or more objectives. The engineering findings below explain what limited performance.'}</p>
          <div className="ob-forecast">
            <div><span>Science on Earth</span><strong>{num(snapshot.scienceReturned,1)} / {SCIENCE_GOAL} pts</strong></div>
            <div><span>Contract settlement</span><strong>{snapshot.successful?'+'+usd(OBSERVATION_PAYOUT_USD-snapshot.preview.missionCostUsd):'-'+usd(snapshot.preview.missionCostUsd)}</strong></div>
            <div><span>Mission score</span><strong>{Math.round(Math.min(100,snapshot.scienceReturned/SCIENCE_GOAL*75)+(snapshot.successful?25:0))} / 100</strong></div>
          </div>
          <div className="ob-warning-list">
            {snapshot.reasons.length===0?<p className="ob-good">Mission objectives met. Your current configuration is a repeatable successful design.</p>:
              snapshot.reasons.map((reason,i)=><p key={i}><b>!</b> {reason}</p>)}
          </div>
          <button type="button" className="launch-button" onClick={()=>setState(p=>({...p,run:null}))}>
            Redesign and try again ↗
          </button>
        </div>}
      </div>
    </>}
    {run&&!snapshot&&<div className="panel ob-review" role="alert">
      An earlier mission snapshot cannot be read with the current model.
      <button type="button" className="secondary-button" onClick={()=>setState(p=>({...p,run:null}))}>Return to design</button>
    </div>}
  </section>;
}
