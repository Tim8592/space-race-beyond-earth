import SubsystemLab, {readSubsystemDesign} from './SubsystemLab';
import EarthObservationMission from './EarthObservationMission';
import {DEFAULT_OBSERVATION,simulateObservation,SCIENCE_GOAL,
  type ObservationChoices} from './lib/observationMission';
import type { SubsystemDesign } from './lib/subsystemDesign';
import OrbitalLab from './OrbitalLab';
import MissionLibrary from './MissionLibrary';
import LearningLab from './LearningLab';
import ResearchLab from './ResearchLab';
import MoonBase from './MoonBase';
import {advanceProgramDay,dailyEconomics,MOON_BASE_LEVELS,RESEARCH_POINTS_START,
  researchPointsCost} from './lib/programEconomy';
import {flightProgress,DEFAULT_FLIGHT_VIEWER_MS,flightEta} from './lib/flightProgress';
import References from './References';
import {GAME_DAY_DURATION_MS,todayGameDay} from './lib/campaignClock';
import CampaignMissions,{type CampaignRun,type CampaignDebrief} from './CampaignMissions';
import {dateForGameDay,orbitalRoute,reviewCampaignMission,unlockedStage,DEFAULT_MISSION_OPTIONS,
  type CampaignDefinition,type MissionOptions,type SolvedCampaignTransfer} from './lib/campaignMissions';
import {resolveCampaignSelection} from './lib/campaignSelection';
import type {LambertSolution} from './TransferPlanner';
import {canResearch,TECHNOLOGIES, type TechnologyId,hasTechnology,
  THRUSTER_RESEARCH,POWER_RESEARCH,INSTRUMENT_RESEARCH,researchDiscount} from './lib/technologyTree';
import FieldHelp from './components/FieldHelp';
import { descriptionFor } from './lib/fieldHelp';
import { useEffect, useMemo, useState } from 'react';
import {
  calculateVehicleMetrics,
  ENGINES,
  estimateBuildCostUsd,
  INITIAL_VEHICLE,
  type EngineId,
  type Vehicle,
} from './lib/engineering';
import { circularOrbitPeriodMinutes, circularOrbitSpeedKmS } from './lib/nasaData';

type MissionId = 'pathfinder' | 'cargo' | 'station';
type Contract = {
  id: MissionId;
  label: string;
  kicker: string;
  description: string;
  altitudeKm: number;
  requiredPayloadKg: number;
  requiredDeltaVms: number;
  payoutUsd: number;
  durationDays: number;
};

const CONTRACTS: Contract[] = [
  {
    id: 'pathfinder',
    label: 'Pathfinder',
    kicker: '01 / STARTER',
    description: 'Deploy a small science spacecraft into low Earth orbit.',
    altitudeKm: 300,
    requiredPayloadKg: 500,
    requiredDeltaVms: 9000,
    payoutUsd: 85_000_000,
    durationDays: 14,
  },
  {
    id: 'cargo',
    label: 'Orbital Resupply',
    kicker: '02 / LOGISTICS',
    description: 'Deliver a useful payload to a 400 km operational orbit.',
    altitudeKm: 400,
    requiredPayloadKg: 2000,
    requiredDeltaVms: 9350,
    payoutUsd: 135_000_000,
    durationDays: 18,
  },
  {
    id: 'station',
    label: 'Station Expansion',
    kicker: '03 / HEAVY LIFT',
    description: 'Transport a larger station module to a higher orbit.',
    altitudeKm: 500,
    requiredPayloadKg: 5000,
    requiredDeltaVms: 9700,
    payoutUsd: 225_000_000,
    durationDays: 24,
  },
];

const INITIAL_CASH = 350_000_000;
const STORAGE_KEY = 'space-race-v01-save';
const minimumTwr = 1.15;

type HistoryItem = {
  id: number;
  day: number;
  contract: string;
  craft: string;
  success: boolean;
  cost: number;
  payout: number;
  deliveredKg: number;
};

type Game = {
  cash: number;
  day: number;
  completed: number;
  launched: number;
  deliveredKg: number;
  revenue: number;
  engineBuildCounts: Record<EngineId, number>;
  history: HistoryItem[];
  blueprints: Vehicle[];
  researchUnlocked: TechnologyId[];
  researchSpentUsd: number;
  researchPoints:number;moonBaseLevel:number;
  operatingSpentUsd:number;passiveRevenueUsd:number;
  devMode: boolean;
  storyCompleted: string[];
  activeStoryRun: CampaignRun|null;
  lastStoryDebrief: CampaignDebrief|null;
};

const DEFAULT_GAME: Game = {
  cash: INITIAL_CASH,
  day: todayGameDay(),
  completed: 0,
  launched: 0,
  deliveredKg: 0,
  revenue: 0,
  engineBuildCounts: { kerolox: 0, methalox: 0, hydrolox: 0 },
  history: [],
  blueprints: [],
  researchUnlocked: [],
  researchSpentUsd: 0,
  researchPoints: RESEARCH_POINTS_START,moonBaseLevel:0,
  operatingSpentUsd:0,passiveRevenueUsd:0,
  devMode: false,
  storyCompleted: [],
  activeStoryRun: null,
  lastStoryDebrief: null,
};

type Snapshot = { game: Game; vehicle: Vehicle; missionId: MissionId };
function loadSave(): Snapshot {
  const fallback = { game: DEFAULT_GAME, vehicle: INITIAL_VEHICLE, missionId: 'cargo' as MissionId };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as Snapshot;
    if (
      !parsed?.game ||
      !Number.isFinite(parsed.game.cash) ||
      !Number.isFinite(parsed.game.day) ||
      !parsed.vehicle ||
      !ENGINES[parsed.vehicle.engineId] ||
      !CONTRACTS.some((mission) => mission.id === parsed.missionId)
    ) return fallback;
    return {...parsed,game:{
      ...DEFAULT_GAME,...parsed.game,
      researchUnlocked:Array.isArray(parsed.game.researchUnlocked)
        ?parsed.game.researchUnlocked.filter(id=>TECHNOLOGIES.some(t=>t.id===id)):[],
      researchSpentUsd:Number.isFinite(parsed.game.researchSpentUsd)?parsed.game.researchSpentUsd:0,
      researchPoints:Number.isFinite(parsed.game.researchPoints)?
        Math.max(0,parsed.game.researchPoints):RESEARCH_POINTS_START,
      moonBaseLevel:Number.isInteger(parsed.game.moonBaseLevel)?
        Math.min(3,Math.max(0,parsed.game.moonBaseLevel)):0,
      operatingSpentUsd:Number.isFinite(parsed.game.operatingSpentUsd)?parsed.game.operatingSpentUsd:0,
      passiveRevenueUsd:Number.isFinite(parsed.game.passiveRevenueUsd)?parsed.game.passiveRevenueUsd:0,
      devMode:parsed.game.devMode===true,
      storyCompleted:Array.isArray(parsed.game.storyCompleted)
        ?parsed.game.storyCompleted.filter(id=>typeof id==='string'):
        parsed.game.history.some(h=>h.contract==='Earth Observation One'&&h.success)?['observation']:[],
      activeStoryRun:parsed.game.activeStoryRun?.id&&
        Number.isFinite(parsed.game.activeStoryRun.costUsd)?parsed.game.activeStoryRun:null,
      lastStoryDebrief:parsed.game.lastStoryDebrief?.id?parsed.game.lastStoryDebrief:null,
    }};
  } catch {
    return fallback;
  }
}

function usd(amount: number) {
  return '$' + (amount / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M';
}
function integer(value: number) {
  return Number.isFinite(value) ? Math.round(value).toLocaleString('en-US') : '—';
}
function decimal(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}
function CheckIcon({ good }: { good: boolean }) {
  return <span className={good ? 'check yes' : 'check no'} aria-hidden="true">{good ? '✓' : '!'}</span>;
}
function Field({
  title, value, unit, min, max, step, onChange,
}: {
  title: string; value: number; unit: string; min: number; max: number; step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span className="field-header"><span>{title}<FieldHelp term={title}/></span><span className="field-current">{integer(value)} <small>{unit}</small></span></span>
      <input
        type="range" title={descriptionFor(title)} min={min} max={max} step={step} value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="field-limits"><span>{integer(min)} kg</span><span>{integer(max)} kg</span></span>
    </label>
  );
}

function readObservationChoices():ObservationChoices{
  try{
    const saved=JSON.parse(localStorage.getItem('space-race-observation-one-v1')??'null') as
      {choices?:Partial<ObservationChoices>}|null;
    return {...DEFAULT_OBSERVATION,...saved?.choices};
  }catch{return DEFAULT_OBSERVATION}
}
export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot>(loadSave);
  const { game, vehicle, missionId } = snapshot;
  const effectiveUnlocks=game.researchUnlocked;
  const missionTechnologyDiscount=researchDiscount(effectiveUnlocks,game.devMode);
  const [message, setMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [activeView,setActiveView] = useState<'missions'|'systems'|'orbits'|'library'|'learning'|'research'|'sources'|'moon'>('missions');
  const [campaignMode,setCampaignMode]=useState<'observation'|'contracts'|'progression'>('observation');
  const [orbitalSelection,setOrbitalSelection]=useState<{
    mode:'earth'|'heliocentric';day:number;target:'mars'|'jupiter';
    perigee:number;eccentricity:number;}|null>(null);
  const [lastSolvedTransfer,setLastSolvedTransfer]=useState<LambertSolution|null>(null);
  const [observationResetKey,setObservationResetKey]=useState(0);
  const [secondsToNextDay,setSecondsToNextDay]=useState(Math.ceil(GAME_DAY_DURATION_MS/1000));
  const [flightNowMs,setFlightNowMs]=useState(Date.now());
  const [flightViewerOpen,setFlightViewerOpen]=useState(true);
  const [spacecraftDesign,setSpacecraftDesign]=useState<SubsystemDesign>(readSubsystemDesign);
  const [labObservationChoices,setLabObservationChoices]=useState<ObservationChoices>(readObservationChoices);
  const [selectedCampaignId,setSelectedCampaignId]=useState(()=>{
    try{return localStorage.getItem('space-race-selected-campaign-mission-v1')||'lunar'}
    catch{return 'lunar'}
  });
  const [campaignOptions,setCampaignOptions]=useState<MissionOptions>(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem('space-race-mission-workshop-v1')??'null') as Partial<MissionOptions>|null;
      return {...DEFAULT_MISSION_OPTIONS,...saved};
    }catch{return DEFAULT_MISSION_OPTIONS}
  });
  const unlockedCampaignStage=unlockedStage(game.storyCompleted,game.devMode);
  const campaignSelection=useMemo(()=>resolveCampaignSelection(game.day,unlockedCampaignStage,
    game.storyCompleted,selectedCampaignId),
    [game.day,unlockedCampaignStage,game.storyCompleted,selectedCampaignId]);
  const contract = CONTRACTS.find((item) => item.id === missionId) ?? CONTRACTS[0];
  const metrics = useMemo(() => calculateVehicleMetrics(vehicle), [vehicle]);
  const buildCost = estimateBuildCostUsd(vehicle, game.engineBuildCounts[vehicle.engineId] ?? 0);
  const valid = [metrics.deltaVms, metrics.liftoffTwr, buildCost].every(Number.isFinite);
  const payloadOK = valid && vehicle.payloadMassKg >= contract.requiredPayloadKg;
  const deltaVOK = valid && metrics.deltaVms >= contract.requiredDeltaVms;
  const thrustOK = valid && metrics.liftoffTwr >= minimumTwr;
  const sufficientCash = game.cash >= buildCost;
  const ready = payloadOK && deltaVOK && thrustOK;
  const successfulLaunches = game.completed;
  const latest = game.history[0];
  const dailyBudget=dailyEconomics(game.researchUnlocked,game.moonBaseLevel,!!game.activeStoryRun);
  const activeFlightProgress=game.activeStoryRun?
    flightProgress(game.activeStoryRun.startedAtMs??flightNowMs,flightNowMs,
      game.activeStoryRun.viewerDurationMs??DEFAULT_FLIGHT_VIEWER_MS):null;
  function openFlightViewer(){
    setFlightViewerOpen(true);
    setCampaignMode('progression');
    setActiveView('missions');
  }

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* private browser mode */ }
  }, [snapshot]);
  // A day ticks every two real minutes while visible; daily cash flows settle each tick.
  useEffect(()=>{
    let previous=Date.now(), accumulated=0;
    const handle=window.setInterval(()=>{
      const now=Date.now();
      const delta=Math.max(0,Math.min(now-previous,2000));
      previous=now;
      if(document.visibilityState!=='visible')return;
      accumulated+=delta;
      const days=Math.floor((accumulated+1e-7)/GAME_DAY_DURATION_MS);
      if(days>0){
        accumulated-=days*GAME_DAY_DURATION_MS;
        setSnapshot(old=>({...old,game:advanceProgramDay(old.game,days)}));
      }
      setSecondsToNextDay(Math.max(1,Math.ceil((GAME_DAY_DURATION_MS-accumulated)/1000)));
      setFlightNowMs(now);
    },500);
    return ()=>window.clearInterval(handle);
  },[]);
  useEffect(() => {
    try { localStorage.setItem('space-race-systems-lab-v1',JSON.stringify(spacecraftDesign)); }
    catch { /* optional browser persistence */ }
  },[spacecraftDesign]);
  useEffect(()=>{
    try{
      localStorage.setItem('space-race-selected-campaign-mission-v1',selectedCampaignId);
      localStorage.setItem('space-race-mission-workshop-v1',JSON.stringify(campaignOptions));
    }catch{/* storage optional */}
  },[selectedCampaignId,campaignOptions]);

  function investResearch(id:TechnologyId){
    const tech=TECHNOLOGIES.find(t=>t.id===id);
    if(!tech||game.devMode||!canResearch(id,game.researchUnlocked,game.cash,game.researchPoints))return;
    setSnapshot(previous=>{
      if(!canResearch(id,previous.game.researchUnlocked,previous.game.cash,previous.game.researchPoints))return previous;
      return {...previous,game:{...previous.game,
        cash:previous.game.cash-tech.researchUsd,
        researchPoints:previous.game.researchPoints-researchPointsCost(tech.researchUsd),
        researchSpentUsd:previous.game.researchSpentUsd+tech.researchUsd,
        researchUnlocked:[...previous.game.researchUnlocked,id],
      }};
    });
    setMessage(tech.label+' researched using cash and '+researchPointsCost(tech.researchUsd)+' RP.');
  }
  function investMoonBase(){
    setSnapshot(previous=>{
      const g=previous.game,next=MOON_BASE_LEVELS[g.moonBaseLevel];
      if(!next||!g.storyCompleted.includes('lunar')||g.cash<next.investmentUsd)return previous;
      return {...previous,game:{...g,cash:g.cash-next.investmentUsd,moonBaseLevel:g.moonBaseLevel+1}};
    });
    setMessage('Lunar base investment funded. Gross income and upkeep now settle each game day.');
  }
  function toggleDevMode(){
    setSnapshot(previous=>({...previous,game:{...previous.game,devMode:!previous.game.devMode}}));
  }
  const lockedLabParts=[
    THRUSTER_RESEARCH[spacecraftDesign.thrusterId],
    THRUSTER_RESEARCH[spacecraftDesign.secondaryThrusterId],
    POWER_RESEARCH[spacecraftDesign.powerSourceId],
    INSTRUMENT_RESEARCH[spacecraftDesign.payloadInstrumentId],
  ].filter((id):id is TechnologyId=>!!id&&!hasTechnology(id,game.researchUnlocked,game.devMode));

  function updateVehicle(patch: Partial<Vehicle>) {
    setSnapshot((previous) => ({ ...previous, vehicle: { ...previous.vehicle, ...patch } }));
    setMessage(null);
  }
  function chooseContract(id: MissionId) {
    setSnapshot((previous) => ({ ...previous, missionId: id }));
    setMessage(null);
  }
  function saveBlueprint() {
    if (!vehicle.name.trim()) return;
    setSnapshot((previous) => ({
      ...previous,
      game: {
        ...previous.game,
        blueprints: [...previous.game.blueprints.filter((item) => item.name !== vehicle.name), { ...vehicle }].slice(-10),
      },
    }));
    setMessage(`Blueprint “${vehicle.name}” saved locally. You can reload it at any time.`);
  }
  function launch() {
    if (!valid || !sufficientCash) return;
    const success = ready;
    const event: HistoryItem = {
      id: Date.now(),
      day: game.day,
      contract: contract.label,
      craft: vehicle.name || 'Unnamed vehicle',
      success,
      cost: buildCost,
      payout: success ? contract.payoutUsd : 0,
      deliveredKg: success ? vehicle.payloadMassKg : 0,
    };
    setSnapshot((previous) => ({
      ...previous,
      game: {
        ...advanceProgramDay(previous.game,contract.durationDays),
        cash:advanceProgramDay(previous.game,contract.durationDays).cash-buildCost+event.payout,
        researchPoints:advanceProgramDay(previous.game,contract.durationDays).researchPoints+(success?2:0),
        day:previous.game.day+contract.durationDays,
        completed: previous.game.completed + Number(success),
        launched: previous.game.launched + 1,
        deliveredKg: previous.game.deliveredKg + event.deliveredKg,
        revenue: previous.game.revenue + event.payout,
        engineBuildCounts: {
          ...previous.game.engineBuildCounts,
          [vehicle.engineId]: (previous.game.engineBuildCounts[vehicle.engineId] ?? 0) + 1,
        },
        history: [event, ...previous.game.history].slice(0, 12),
      },
    }));
    setMessage(success
      ? `${contract.label} complete. ${integer(vehicle.payloadMassKg)} kg delivered; ${usd(contract.payoutUsd)} contract revenue received.`
      : `Mission unsuccessful. Your design did not meet every requirement. ${usd(buildCost)} was spent on the attempt.`);
  }
  function startCampaignMission(run:CampaignRun){
    setSnapshot(previous=>{
      if(previous.game.activeStoryRun||previous.game.storyCompleted.includes(run.id)||
        previous.game.cash<run.costUsd||run.launchedDay!==previous.game.day)return previous;
      return {...previous,game:{...previous.game,
        cash:previous.game.cash-run.costUsd,
        launched:previous.game.launched+1,
        engineBuildCounts:{...previous.game.engineBuildCounts,
          [previous.vehicle.engineId]:
            (previous.game.engineBuildCounts[previous.vehicle.engineId]??0)+1},
        activeStoryRun:{...run,startedAtMs:Date.now(),
          viewerDurationMs:DEFAULT_FLIGHT_VIEWER_MS,
          orekitTrajectoryAu:lastSolvedTransfer?.departureDate===run.departureDate&&
            lastSolvedTransfer.target===run.target&&lastSolvedTransfer.trajectoryAu?.length>=8?
              lastSolvedTransfer.trajectoryAu:undefined},lastStoryDebrief:null,
      }};
    });
    setFlightViewerOpen(true);setFlightNowMs(Date.now());
    setMessage('Flight launched. You can leave the viewer and monitor its progress elsewhere.');
  }
  function finishCampaignMission(){
    setSnapshot(previous=>{
      const run=previous.game.activeStoryRun;
      if(!run||!flightProgress(run.startedAtMs??0,Date.now(),
        run.viewerDurationMs??DEFAULT_FLIGHT_VIEWER_MS).ready)return previous;
      const event:HistoryItem={
        id:Date.now(),day:run.launchedDay,contract:run.title,
        craft:previous.vehicle.name+' / exploration probe',
        success:true,cost:run.costUsd,payout:run.payoutUsd,
        deliveredKg:run.payloadKg,
      };
      const advanced=advanceProgramDay(previous.game,run.durationDays);
      return {...previous,game:{...advanced,
        cash:advanced.cash+run.payoutUsd,
        researchPoints:advanced.researchPoints+5+
          (run.target==='jupiter'?12:run.target==='mars'?9:run.target==='asteroid'?7:4),
        day:advanced.day,
        completed:previous.game.completed+1,
        deliveredKg:previous.game.deliveredKg+run.payloadKg,
        revenue:previous.game.revenue+run.payoutUsd,
        history:[event,...previous.game.history].slice(0,12),
        storyCompleted:[...new Set([...previous.game.storyCompleted,run.id])],
        activeStoryRun:null,
        lastStoryDebrief:{id:run.id,title:run.title,
          day:advanced.day,success:true,special:run.special,
          costUsd:run.costUsd,payoutUsd:run.payoutUsd,durationDays:run.durationDays,
          deltaVms:run.deltaVms,neededDeltaVms:run.requiredDeltaVms,
          scienceKg:run.scienceKg,
          busPropellantBurnedKg:run.busPropellantBurnedKg,
          busPropellantRemainingKg:run.busPropellantRemainingKg},
      }};
    });
    setMessage('Mission completed; agency contract revenue received and new campaign milestones may be available.');
  }
  function openMissionOrbit(definition:CampaignDefinition,options:MissionOptions){
    setOrbitalSelection({mode:definition.target==='mars'||definition.target==='jupiter'||
      definition.target==='asteroid'?'heliocentric':'earth',
      day:game.day,target:definition.target==='jupiter'?'jupiter':'mars',
      perigee:options.perigeeKm,eccentricity:definition.target==='ellipse'?options.eccentricity:
        definition.target==='lunar'?orbitalRoute('lunar',game.day,options).eccentricity:0.25});
    setActiveView('orbits');
  }
  const missionSolved: SolvedCampaignTransfer|null=lastSolvedTransfer&&
    (lastSolvedTransfer.target==='mars'||lastSolvedTransfer.target==='jupiter')?
    {target:lastSolvedTransfer.target,departureDate:lastSolvedTransfer.departureDate,
      flightDays:lastSolvedTransfer.flightDays,
      departureVInfinityKmS:lastSolvedTransfer.departureVInfinityKmS,
      arrivalVInfinityKmS:lastSolvedTransfer.arrivalVInfinityKmS,
      eccentricity:lastSolvedTransfer.eccentricity}:null;

  const observationLabForecast=useMemo(()=>{
    try{return simulateObservation({
      choices:labObservationChoices,spacecraft:spacecraftDesign,launcher:vehicle,
      completedWithEngine:game.engineBuildCounts[vehicle.engineId]??0,
      technologyDiscount:missionTechnologyDiscount,
    });}catch{return null}
  },[labObservationChoices,spacecraftDesign,vehicle,game.engineBuildCounts,missionTechnologyDiscount]);
  const selectedCampaignReview=useMemo(()=>{
    try{return reviewCampaignMission({
      definition:campaignSelection.selected,day:game.day,options:campaignOptions,
      spacecraft:spacecraftDesign,launcher:vehicle,capitalUsd:game.cash,
      productionDiscount:missionTechnologyDiscount,
      completedWithLauncherEngine:game.engineBuildCounts[vehicle.engineId]??0,
      solvedTransfer:missionSolved,
    });}catch{return null}
  },[campaignSelection.selected,game.day,campaignOptions,spacecraftDesign,vehicle,
    game.cash,game.engineBuildCounts,missionTechnologyDiscount,lastSolvedTransfer]);
  function startEarthObservation(costUsd:number){
    setSnapshot(previous=>({...previous,game:{
      ...previous.game,
      cash:previous.game.cash-costUsd,
      launched:previous.game.launched+1,
      engineBuildCounts:{...previous.game.engineBuildCounts,
        [previous.vehicle.engineId]:(previous.game.engineBuildCounts[previous.vehicle.engineId]??0)+1},
    }}));
  }
  function completeEarthObservation(outcome:{
    success:boolean; missionCostUsd:number; payoutUsd:number;
    wetMassKg:number; returnedScience:number;
  }){
    const {success,missionCostUsd,payoutUsd,wetMassKg,returnedScience}=outcome;
    setSnapshot(previous=>{
      const event:HistoryItem={
        id:Date.now(),
        day:previous.game.day,
        contract:'Earth Observation One',
        craft:previous.vehicle.name+' / scientific spacecraft',
        success,
        cost:missionCostUsd,
        payout:payoutUsd,
        deliveredKg:wetMassKg,
      };
      return {...previous,game:{
        ...previous.game,
        ...advanceProgramDay(previous.game,7),
        cash:advanceProgramDay(previous.game,7).cash+payoutUsd,
        researchPoints:advanceProgramDay(previous.game,7).researchPoints+(success?7:2),
        day:previous.game.day+7,
        completed:previous.game.completed+Number(success),
        deliveredKg:previous.game.deliveredKg+wetMassKg,
        revenue:previous.game.revenue+payoutUsd,
        storyCompleted:success?
          [...new Set([...previous.game.storyCompleted,'observation'])]:
          previous.game.storyCompleted,
        history:[event,...previous.game.history].slice(0,12),
      }};
    });
    setMessage(success
      ? 'Earth Observation One returned '+returnedScience.toFixed(1)+' science points. Contract paid out.'
      : 'Earth Observation One completed without enough returned science. The mission cost was charged.');
  }
  function reset() {
    if (!window.confirm('Start over? This clears your locally saved campaign and blueprints.')) return;
    setSnapshot({ game: {...DEFAULT_GAME,day:todayGameDay()}, vehicle: INITIAL_VEHICLE, missionId: 'cargo' });
    setSelectedCampaignId('lunar');
    setCampaignOptions({...DEFAULT_MISSION_OPTIONS});
    try {localStorage.removeItem('space-race-observation-one-v1');
      localStorage.removeItem('space-race-mission-workshop-v1')}catch{/* optional storage */}
    setLastSolvedTransfer(null);
    setObservationResetKey(k=>k+1);
    setMessage('Campaign restarted, including the Earth Observation One mission.');
  }
  const orbitSpeed = circularOrbitSpeedKmS(contract.altitudeKm);
  const orbitPeriod = circularOrbitPeriodMinutes(contract.altitudeKm);
  const angle = (game.day * 31 * Math.PI) / 180;
  const satelliteX = 310 + 131 * Math.cos(angle);
  const satelliteY = 183 + 131 * Math.sin(angle);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand"><span className="brand-symbol"><span className="brand-orbit" /></span><div><strong>SPACE RACE</strong><small>BEYOND EARTH</small></div></div>
          <nav aria-label="Primary" className="game-tabs" role="tablist">
              {([
                ['missions','Play Campaign'],['moon','Moon Base'],['systems','Engineering Lab'],['orbits','Orbital Map'],['library','Mission Library'],['learning','Learn Physics'],['research','Research & Roadmap'],['sources','Sources & Data'],
              ] as const).map(([id,label])=><button key={id} type="button" role="tab" aria-selected={activeView===id} className={activeView===id?'current':''} onClick={()=>{
                  if(id==='systems')setLabObservationChoices(readObservationChoices());
                  setActiveView(id);
                }}>{label}</button>)}
            </nav>
          <div className="prototype-pill"><span className="live-dot" /> PROTOTYPE <span className="version">V1.4</span>{game.devMode&&<span className="dev-indicator"> · DEV UNLOCKED</span>}</div>
        </div>
      </header>

      <main className="main-content">
        <section className="agency-finance-bar" aria-label="Recurring agency finances and research points">
          <div><small>AVAILABLE CASH</small><strong>{usd(game.cash)}</strong></div>
          <div><small>RESEARCH POINTS</small><strong>{game.researchPoints} RP</strong></div>
          <div><small>DAILY OPERATING COST</small><strong>−{usd(dailyBudget.expensesUsd)}/d</strong></div>
          <div><small>MOON REVENUE</small><strong>+{usd(dailyBudget.revenueUsd)}/d</strong></div>
          <div className={dailyBudget.netUsd>=0?'positive':'negative'}>
            <small>NET / GAME DAY</small><strong>{dailyBudget.netUsd>=0?'+':''}{usd(dailyBudget.netUsd)}/d</strong>
          </div>
          {game.cash<0&&<div className="finance-distress">CASH DEFICIT · new investments blocked</div>}
        </section>
        {game.activeStoryRun&&activeFlightProgress&&<button type="button"
          className="flight-progress-pill" onClick={openFlightViewer}
          aria-label="Open active flight progress">
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="20" fill="none" stroke="#344963" strokeWidth="5"/>
            <circle cx="26" cy="26" r="20" fill="none" stroke="#f3bd7b" strokeWidth="5"
              transform="rotate(-90 26 26)"
              strokeDasharray={String(125.66*activeFlightProgress.fraction)+' 125.66'}/>
            <text x="26" y="30" fill="#f6e7d0" textAnchor="middle" fontSize="11" fontWeight="800">{Math.round(activeFlightProgress.fraction*100)}%</text>
          </svg>
          <span><strong>{game.activeStoryRun.title}</strong>
            <small>{activeFlightProgress.ready?'READY FOR DEBRIEF':
              'ETA '+flightEta(activeFlightProgress.remainingMs)+' · open viewer'}</small></span>
        </button>}
        <section className={'intro '+(activeView==='missions'&&campaignMode==='contracts'?'':'view-hidden')}>
          <div><div className="eyebrow"><span className="small-diamond" /> YOUR SPACE PROGRAM STARTS HERE</div><h1>Build the future.<br /><em>Beyond Earth.</em></h1><p>Design capable spacecraft, accept orbital contracts, and turn engineering decisions into a thriving space economy.</p></div>
          <div className="intro-right"><span>CAMPAIGN / EARTH ERA</span><div className="day-marker">DAY <strong>{game.day.toString().padStart(3, '0')}</strong></div><span className="game-clock-caption">{dateForGameDay(game.day)} · next day {secondsToNextDay}s · auto</span></div>
        </section>

        <section className={'kpi-grid '+(activeView==='missions'?'':'view-hidden')} aria-label="Campaign overview">
          <div className="kpi"><span>AVAILABLE CAPITAL</span><strong>{usd(game.cash)}</strong><small className={game.cash < 0 ? 'danger-text' : ''}>Starting fund: {usd(INITIAL_CASH)}</small></div>
          <div className="kpi"><span>SUCCESSFUL MISSIONS</span><strong>{integer(successfulLaunches)} <i>/ {integer(game.launched)}</i></strong><small>Successful / attempted</small></div>
          <div className="kpi"><span>CARGO DELIVERED</span><strong>{integer(game.deliveredKg)} <i>kg</i></strong><small>Into Earth orbit</small></div>
          <div className="kpi"><span>TOTAL CONTRACT REVENUE</span><strong>{usd(game.revenue)}</strong><small>From completed missions</small></div>
        </section>

        {activeView==='missions'&&<div className="campaign-live-clock" role="status">
          <strong>LIVE AGENCY CLOCK</strong> · {dateForGameDay(game.day)}
          <span>1 game day / 2 minutes · next day in {secondsToNextDay}s · pauses when hidden</span>
        </div>}
        {activeView==='missions'&&<div className="campaign-switch" role="tablist" aria-label="Campaign mission mode">
          <button type="button" role="tab" aria-selected={campaignMode==='observation'}
            className={campaignMode==='observation'?'selected':''}
            onClick={()=>setCampaignMode('observation')}>Earth Observation One · Guided mission</button>
          <button type="button" role="tab" aria-selected={campaignMode==='progression'}
            className={campaignMode==='progression'?'selected':''}
            onClick={()=>setCampaignMode('progression')}>Explore Further · {game.storyCompleted.includes('observation')?'Missions unlocked':'Complete first mission to unlock'}</button>
          <button type="button" role="tab" aria-selected={campaignMode==='contracts'}
            className={campaignMode==='contracts'?'selected':''}
            onClick={()=>setCampaignMode('contracts')}>Orbital Contracts · Classic mode</button>
        </div>}
        {activeView==='missions'&&campaignMode==='observation'&&
          <EarthObservationMission key={observationResetKey} spacecraft={spacecraftDesign} launcher={vehicle}
            cash={game.cash} completedWithEngine={game.engineBuildCounts[vehicle.engineId]??0}
            onEditSpacecraft={()=>{setLabObservationChoices(readObservationChoices());setActiveView('systems')}}
            onEditLauncher={()=>{setActiveView('missions');setCampaignMode('contracts')}}
            onStart={startEarthObservation}
            technologyDiscount={missionTechnologyDiscount}
            lockedTechnologies={lockedLabParts}
            onComplete={completeEarthObservation}/>}
        {activeView==='missions'&&campaignMode==='progression'&&
          <CampaignMissions nowMs={flightNowMs} viewerOpen={flightViewerOpen}
            onViewerOpenChange={setFlightViewerOpen}
            selected={campaignSelection.selected}
            agencyOffers={campaignSelection.agency} scheduled={campaignSelection.special}
            onSelectedIdChange={setSelectedCampaignId}
            options={campaignOptions} onOptionsChange={setCampaignOptions}
            day={game.day} cash={game.cash}
            completed={game.storyCompleted} devMode={game.devMode}
            spacecraft={spacecraftDesign} launcher={vehicle}
            productionDiscount={missionTechnologyDiscount}
            completedWithLauncherEngine={game.engineBuildCounts[vehicle.engineId]??0}
            lockedTechnologies={lockedLabParts}
            run={game.activeStoryRun} debrief={game.lastStoryDebrief}
            solvedTransfer={missionSolved}
            onStart={startCampaignMission} onFinish={finishCampaignMission}
            onGoToLab={()=>setActiveView('systems')}
            onGoToRocket={()=>{setCampaignMode('contracts');setActiveView('missions')}}
            onViewOrbital={openMissionOrbit}/>}
        <div className={'control-layout '+(activeView==='missions'&&campaignMode==='contracts'?'':'view-hidden')} id="mission-control">
          <div className="left-column">
            <section className="panel" id="builder">
              <div className="panel-heading"><div><div className="eyebrow">01 / LAUNCH VEHICLE DESIGN</div><h2>Launch Rocket Builder</h2><p>Configure the launch rocket that carries your spacecraft. This mass and engine selection also feed the guided Earth Observation mission.</p></div><div className="panel-glyph">◈</div></div>
              <div className="builder-name"><label htmlFor="craft-name">VEHICLE NAME</label><input id="craft-name" value={vehicle.name} maxLength={40} onChange={(event) => updateVehicle({ name: event.target.value })}/></div>
              <div className="section-label">PROPULSION SYSTEM <span>SELECT ONE</span></div>
              <div className="engine-grid">
                {(Object.keys(ENGINES) as EngineId[]).map((id) => {
                  const engine = ENGINES[id];
                  return <button key={id} className={'engine-card ' + (id === vehicle.engineId ? 'selected' : '')} onClick={() => updateVehicle({ engineId: id })} aria-pressed={id === vehicle.engineId}>
                    <span className="engine-select">{id === vehicle.engineId ? '●' : '○'}</span><strong>{engine.label}</strong><small>{integer(engine.ispSeconds)} s Isp</small><span className="engine-subtitle">{engine.subtitle}</span>
                  </button>;
                })}
              </div>
              <div className="section-label top-space">MASS CONFIGURATION <span>ADJUST PARAMETERS</span></div>
              <Field title="Dry mass" value={vehicle.dryMassKg} unit="kg" min={5000} max={35000} step={500} onChange={(value) => updateVehicle({ dryMassKg: value })}/>
              <Field title="Propellant mass" value={vehicle.propellantMassKg} unit="kg" min={80000} max={450000} step={5000} onChange={(value) => updateVehicle({ propellantMassKg: value })}/>
              <Field title="Payload mass" value={vehicle.payloadMassKg} unit="kg" min={500} max={15000} step={500} onChange={(value) => updateVehicle({ payloadMassKg: value })}/>
              <div className="blueprint-bar"><button className="secondary-button" onClick={saveBlueprint}>+ Save blueprint</button>{game.blueprints.length > 0 && <select aria-label="Load saved blueprint" value="" onChange={(event) => {const selected = game.blueprints.find((item) => item.name === event.target.value); if(selected) updateVehicle({ ...selected });}}><option value="">Load saved design…</option>{game.blueprints.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>}</div>
            </section>

             

            <section className="panel metrics-panel">
              <div className="panel-heading"><div><div className="eyebrow">02 / PERFORMANCE</div><h2>Engineering Analysis</h2><p>Live estimates using the ideal rocket equation.</p></div><span className="formula">Δv = Isp · g₀ · ln(m₀/mf)</span></div>
              <div className="metrics-grid"><div><span>AVAILABLE ΔV</span><strong>{integer(metrics.deltaVms)} <small>m/s</small></strong></div><div><span>LIFTOFF THRUST / WEIGHT</span><strong>{decimal(metrics.liftoffTwr, 2)} <small>TWR</small></strong></div><div><span>INITIAL MASS</span><strong>{integer(metrics.initialMassKg)} <small>kg</small></strong></div><div><span>SPECIFIC IMPULSE</span><strong>{integer(metrics.ispSeconds)} <small>s</small></strong></div></div>
              <div className="engineering-note"><span>ℹ</span><p><strong>Engineering simplification:</strong> One idealized stage, constant Isp and thrust. ΔV uses Tsiolkovsky; mission thresholds include a rough gameplay allowance for ascent losses. Not a real flight feasibility prediction.</p></div>
            </section>
          </div>

          <div className="right-column">
            <section className="panel mission-panel">
              <div className="panel-heading"><div><div className="eyebrow">03 / MISSION CONTROL</div><h2>Available Contracts</h2><p>Earn funding by delivering payload to orbit.</p></div><div className="panel-glyph">⌁</div></div>
              <div className="contract-list">{CONTRACTS.map((item) => <button key={item.id} className={'contract ' + (item.id === missionId ? 'selected' : '')} onClick={() => chooseContract(item.id)} aria-pressed={item.id === missionId}><div className="contract-dot">{item.id === missionId ? '●' : '○'}</div><div className="contract-main"><span>{item.kicker}</span><strong>{item.label}</strong><small>{item.description}</small></div><div className="contract-price">{usd(item.payoutUsd)}<small>REWARD</small></div></button>)}</div>
            </section>

            <section className="panel launch-panel">
              <div className="panel-heading compact-heading"><div><div className="eyebrow">04 / FLIGHT REVIEW</div><h2>Launch Readiness</h2></div><span className={'status-tag ' + (ready ? 'ready' : 'blocked')}>{ready ? '● DESIGN READY' : '● REVIEW REQUIRED'}</span></div>
              <div className="readiness-list"><div><span><CheckIcon good={payloadOK}/> Payload capacity</span><strong>{integer(vehicle.payloadMassKg)} / {integer(contract.requiredPayloadKg)} kg</strong></div><div><span><CheckIcon good={deltaVOK}/> ΔV capability</span><strong>{integer(metrics.deltaVms)} / {integer(contract.requiredDeltaVms)} m/s</strong></div><div><span><CheckIcon good={thrustOK}/> Initial thrust / weight</span><strong>{decimal(metrics.liftoffTwr, 2)} / {minimumTwr.toFixed(2)}</strong></div><div><span><CheckIcon good={sufficientCash}/> Budget available</span><strong>{usd(game.cash)} / {usd(buildCost)}</strong></div></div>
              <div className="financials"><div><span>EST. VEHICLE COST</span><strong>{usd(buildCost)}</strong></div><div><span>MISSION PAYOUT</span><strong className="green">+{usd(contract.payoutUsd)}</strong></div><div><span>EXPECTED MARGIN IF SUCCESSFUL</span><strong className={contract.payoutUsd >= buildCost ? 'green' : 'danger-text'}>{usd(contract.payoutUsd - buildCost)}</strong></div></div>
              <button className="launch-button" onClick={launch} disabled={!valid || !sufficientCash}>{ready ? 'Launch mission' : 'Attempt mission anyway'}<span>↗</span></button>
              {!ready && <p className="warning-caption">Attempting a mission below the requirements will spend the vehicle cost and fail. Adjust your design first.</p>}
              {message && <div className={'feedback ' + (latest?.success && message.includes('complete') ? 'positive' : '')} role="status">{message}</div>}
            </section>
          </div>
        </div>

        {activeView==='systems' && <div className="single-tab-page">
          <div className="lab-back"><span>ENGINEERING LAB · linked to {
            campaignMode==='observation'&&!game.storyCompleted.includes('observation')?
              'Earth Observation One':campaignSelection.selected.title}</span>
            <button className="secondary-button" onClick={()=>{
              setActiveView('missions');
            }}>{campaignMode==='observation'&&!game.storyCompleted.includes('observation')?
              'Return to mission design →':'Return to selected mission →'}</button>
          </div>
          <SubsystemLab design={spacecraftDesign} onDesignChange={setSpacecraftDesign}
            mission={campaignMode==='observation'&&!game.storyCompleted.includes('observation')?
              undefined:{definition:campaignSelection.selected,review:selectedCampaignReview,
              stageUnlocked:unlockedCampaignStage,completed:game.storyCompleted.includes(campaignSelection.selected.id),
              lockedTechnologyCount:lockedLabParts.length,
              activeFlight:!!game.activeStoryRun,gameDay:game.day}}
            observation={campaignMode==='observation'&&!game.storyCompleted.includes('observation')?
              {forecast:observationLabForecast,requiredScience:SCIENCE_GOAL,cash:game.cash,
               lockedTechnologyCount:lockedLabParts.length}:undefined}
            onReturnToMission={()=>{setActiveView('missions')}}
            unlockedTechnologies={effectiveUnlocks} devMode={game.devMode}/>
        </div>}
        {activeView==='orbits' && <div className="single-tab-page">
          {orbitalSelection&&<div className="campaign-orbit-return panel">
            <div><div className="eyebrow">MISSION TRAJECTORY WORKSHOP</div>
              <p>The selected departure is <strong>{dateForGameDay(orbitalSelection.day)}</strong>.
                For Mars and Jupiter, solve or optimize an Orekit Lambert arc below to feed its
                impulsive departure/arrival energy back into the live campaign feasibility review.
                For Earth ellipse missions, the orbital elements use the same two-body Kepler model.</p>
            </div>
            <button className="secondary-button" onClick={()=>{setActiveView('missions');setCampaignMode('progression')}}>
              Return to mission review →
            </button>
          </div>}
          <OrbitalLab key={orbitalSelection?orbitalSelection.day+'-'+orbitalSelection.mode:'default'}
            initialMode={orbitalSelection?.mode??'earth'}
            initialDayOffset={(orbitalSelection?.day??1)-1}
            initialTarget={orbitalSelection?.target??'mars'}
            initialAltitudeKm={orbitalSelection?.perigee??contract.altitudeKm}
            initialEccentricity={orbitalSelection?.eccentricity??.25}
            onTransferSolved={setLastSolvedTransfer}/>
        </div>}
        {activeView==='moon'&&<MoonBase cash={game.cash} level={game.moonBaseLevel}
          unlocked={game.storyCompleted.includes('lunar')} devMode={game.devMode}
          onInvest={investMoonBase}
          onExploreCampaign={()=>{
            setSelectedCampaignId('lunar');setCampaignMode('progression');setActiveView('missions');
          }}/>}
        {activeView==='sources' && <div className="single-tab-page"><References/></div>}
        {activeView==='library' && <div className="single-tab-page"><MissionLibrary onOpenMap={()=>setActiveView('orbits')}/></div>}
        {activeView==='learning' && <div className="single-tab-page">
          <LearningLab onOpenBuilder={()=>setActiveView('systems')} onOpenOrbital={()=>setActiveView('orbits')}/>
        </div>}
        {activeView==='research'&&<ResearchLab cash={game.cash} researchPoints={game.researchPoints}
          unlocked={game.researchUnlocked} devMode={game.devMode}
          onToggleDevMode={toggleDevMode} onResearch={investResearch}/>}
        <section className={'bottom-grid '+(activeView==='research'?'':'view-hidden')} id="roadmap"><div className="panel roadmap">
          <div className="eyebrow">RESEARCH PORTFOLIO / LIVE PROGRESSION</div>
          <h2>Agency capabilities</h2>
          <div className="research-portfolio-stats">
            <div><span>Permanently researched</span><strong>{game.researchUnlocked.length} / {TECHNOLOGIES.length}</strong></div>
            <div><span>Total R&amp;D invested</span><strong>{usd(game.researchSpentUsd)}</strong></div>
            <div><span>Manufacturing savings</span><strong>{(missionTechnologyDiscount*100).toFixed(0)}%</strong></div>
          </div>
          <p>{game.devMode
            ?'Developer demo is active: all implemented research hardware can be inspected, but research investments and future missions are not completed automatically.'
            :'Contracts fund research into new science, propulsion, energy and thermal systems. Hardware prices and R&D expenditures are educational game assumptions.'}</p>
        </div><div className="panel history"><div className="eyebrow">FLIGHT LOG</div><h2>Recent missions</h2>{game.history.length === 0 ? <p>No launches yet. Build a spacecraft and accept your first contract.</p> : <div className="history-list">{game.history.slice(0, 4).map((item) => <div key={item.id}><span className={item.success ? 'success-dot' : 'failed-dot'}>●</span><div><strong>{item.contract}</strong><small>Day {item.day} · {item.craft}</small></div><strong className={item.success ? 'green' : 'danger-text'}>{item.success ? '+' + usd(item.payout - item.cost) : '-' + usd(item.cost)}</strong></div>)}</div>}</div></section>
        <footer><div><span>SPACE RACE: BEYOND EARTH</span> · NASA Space Apps Challenge 2026 · Independently created prototype</div><div><button onClick={() => setShowHelp(!showHelp)}>{showHelp ? 'Hide notes' : 'Model limitations & credits'}</button><button onClick={reset}>Reset campaign</button></div></footer>
        {showHelp && <div className="help-notes"><p><strong>Model limits:</strong> Only a simplified one-stage launcher and fictional contracts are implemented. Earth orbital speed and period use JPL's Earth gravitational parameter and NASA's Earth radius. Engine performance, budgets, mission thresholds, and manufacturing discounts are invented and must not be treated as real mission values. The in-space spacecraft lab includes approximate subsystem sizing, and the optional Orekit backend computes idealized impulsive planetary transfers. Historical mission tracks require a JPL Horizons connection. None of these models validate full mission feasibility, finite thrust, ascent, detailed shielding or actual flight hardware.</p><p><strong>AI-assisted work:</strong> Initial source code, interface copy, and documentation were drafted with ChatGPT. See README.md and docs/ATTRIBUTION.md for disclosures. No NASA logos or mission insignia are used.</p></div>}
      </main>
    </div>
  );
}
