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
import OrbitalInfrastructure from './OrbitalInfrastructure';
import SpacecraftLibrary from './SpacecraftLibrary';
import {EMPTY_ORBITAL_NETWORKS,planNetworkDeployment,
  type OrbitalNetworkLevels,type OrbitalNetworkKind,type NetworkDeploymentRun}
  from './lib/orbitalNetworks';
import {DEFAULT_SUBSYSTEM_DESIGN} from './lib/subsystemDesign';
import {saveSpacecraftBlueprint,cloneSpacecraftDesign,safeBlueprints,duplicateSpacecraftBlueprint,
  markSpacecraftDeployed,type SpacecraftBlueprint} from './lib/spacecraftBlueprints';
import RocketFleet from './RocketFleet';
import NASAMissionIntelligence from './NASAMissionIntelligence';
import {loadNASAMissionIntelligence} from './lib/nasaMissionClient';
import {readNASAMissionCache,nasaWeatherBrief,makeNeoObservationOffer,
  type NASAMissionSnapshot,type NeoObservationOffer,type NearEarthApproach}
  from './lib/nasaMissionIntelligence';
import {FLEET_UPGRADES,ORBITAL_ASSEMBLY_UPGRADE_USD,planMoonShipment,
  planLaunchManifest,flightService,canadianProgramReadiness,CANADIAN_RESEARCH_BONUS_RP,
  type LauncherId,type MoonCargoRun} from './lib/launchLogistics';
import {advanceProgramDay,dailyEconomics,MOON_BASE_LEVELS,RESEARCH_POINTS_START,
  researchPointsCost} from './lib/programEconomy';
import {flightProgress,DEFAULT_FLIGHT_VIEWER_MS,flightEta} from './lib/flightProgress';
import References from './References';
import {GAME_DAY_DURATION_MS,todayGameDay} from './lib/campaignClock';
import CampaignMissions,{type CampaignRun,type CampaignDebrief,type CampaignAssemblyProject} from './CampaignMissions';
import {dateForGameDay,orbitalRoute,reviewCampaignMission,unlockedStage,DEFAULT_MISSION_OPTIONS,
  type CampaignDefinition,type MissionOptions,type SolvedCampaignTransfer} from './lib/campaignMissions';
import {resolveCampaignSelection} from './lib/campaignSelection';
import {CSA_DATA_PROGRAMS} from './lib/csaScienceMissions';
import type {LambertSolution} from './TransferPlanner';
import {canResearch,TECHNOLOGIES, type TechnologyId,hasTechnology,
  THRUSTER_RESEARCH,POWER_RESEARCH,INSTRUMENT_RESEARCH,researchDiscount} from './lib/technologyTree';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  INITIAL_VEHICLE,
  ENGINES,
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
  rocketService:LauncherId;rocketProgramLevel:number;
  rocketFlightCounts:Record<LauncherId,number>;orbitalAssemblyUnlocked:boolean;
  canadianMissionSuccesses:number;observationLaunchService:LauncherId|null;
  neoOpportunity:NeoObservationOffer|null;
  networkLevels:OrbitalNetworkLevels;activeNetworkRun:NetworkDeploymentRun|null;
  spacecraftBlueprints:SpacecraftBlueprint[];
  moonCargoDeliveredLevel:number;activeMoonCargoRun:MoonCargoRun|null;
  activeAssemblyProject:CampaignAssemblyProject|null;
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
  rocketService:'custom',rocketProgramLevel:0,
  rocketFlightCounts:{custom:0,falcon9:0,falconHeavy:0,starship:0},
  orbitalAssemblyUnlocked:false,moonCargoDeliveredLevel:0,activeMoonCargoRun:null,
  canadianMissionSuccesses:0,observationLaunchService:null,
  neoOpportunity:null,
  networkLevels:{...EMPTY_ORBITAL_NETWORKS},activeNetworkRun:null,spacecraftBlueprints:[],
  activeAssemblyProject:null,
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
      rocketService:['custom','falcon9','falconHeavy','starship'].includes(parsed.game.rocketService)?
        parsed.game.rocketService:'custom',
      rocketProgramLevel:Number.isInteger(parsed.game.rocketProgramLevel)?
        Math.max(0,Math.min(3,parsed.game.rocketProgramLevel)):0,
      orbitalAssemblyUnlocked:parsed.game.orbitalAssemblyUnlocked===true,
      canadianMissionSuccesses:Number.isInteger(parsed.game.canadianMissionSuccesses)?
        Math.max(0,parsed.game.canadianMissionSuccesses):0,
      observationLaunchService:typeof parsed.game.observationLaunchService==='string'&&
        ['custom','falcon9','falconHeavy','starship'].includes(parsed.game.observationLaunchService)?
        parsed.game.observationLaunchService:null,
      networkLevels:{
        compute:Number.isInteger(parsed.game.networkLevels?.compute)?
          Math.max(0,Math.min(3,parsed.game.networkLevels.compute)):0,
        relay:Number.isInteger(parsed.game.networkLevels?.relay)?
          Math.max(0,Math.min(3,parsed.game.networkLevels.relay)):0,
      },
      activeNetworkRun:parsed.game.activeNetworkRun?.id&&
        Number.isFinite(parsed.game.activeNetworkRun.costUsd)?
        parsed.game.activeNetworkRun:null,
      spacecraftBlueprints:safeBlueprints(parsed.game.spacecraftBlueprints),
      neoOpportunity:parsed.game.neoOpportunity?.mission?.id&&
        parsed.game.neoOpportunity.sourceNeo?.id?parsed.game.neoOpportunity:null,
      rocketFlightCounts:Object.assign(
        {custom:0,falcon9:0,falconHeavy:0,starship:0},
        parsed.game.rocketFlightCounts??{}),
      moonCargoDeliveredLevel:Number.isInteger(parsed.game.moonCargoDeliveredLevel)?
        Math.max(parsed.game.moonBaseLevel??0,Math.min(3,parsed.game.moonCargoDeliveredLevel)):
        Math.max(0,parsed.game.moonBaseLevel??0),
      activeMoonCargoRun:parsed.game.activeMoonCargoRun?.id&&
        Number.isFinite(parsed.game.activeMoonCargoRun.costUsd)?
          parsed.game.activeMoonCargoRun:null,
      activeAssemblyProject:parsed.game.activeAssemblyProject?.draft?.id&&
        Array.isArray(parsed.game.activeAssemblyProject.draft.launchInvoices)?
        parsed.game.activeAssemblyProject:null,
      devMode:parsed.game.devMode===true,
      storyCompleted:Array.isArray(parsed.game.storyCompleted)
        ?parsed.game.storyCompleted.filter(id=>typeof id==='string'):
        parsed.game.history.some(h=>h.contract==='Earth Observation One'&&h.success)?['observation']:[],
      activeStoryRun:parsed.game.activeStoryRun?.id&&
        Number.isFinite(parsed.game.activeStoryRun.costUsd)?
          {...parsed.game.activeStoryRun,
            startedAtMs:Number.isFinite(parsed.game.activeStoryRun.startedAtMs)?
              parsed.game.activeStoryRun.startedAtMs:Date.now(),
            viewerDurationMs:Number.isFinite(parsed.game.activeStoryRun.viewerDurationMs)?
              parsed.game.activeStoryRun.viewerDurationMs:DEFAULT_FLIGHT_VIEWER_MS}:null,
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
function CheckIcon({ good }: { good: boolean }) {
  return <span className={good ? 'check yes' : 'check no'} aria-hidden="true">{good ? '✓' : '!'}</span>;
}
function readObservationChoices():ObservationChoices{
  try{
    const saved=JSON.parse(localStorage.getItem('space-race-observation-one-v1')??'null') as
      ({choices?:Partial<ObservationChoices>}|null);
    return {...DEFAULT_OBSERVATION,...saved?.choices};
  }catch{return {...DEFAULT_OBSERVATION};}
}
export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot>(loadSave);
  const { game, vehicle, missionId } = snapshot;
  const effectiveUnlocks=game.researchUnlocked;
  const missionTechnologyDiscount=researchDiscount(effectiveUnlocks,game.devMode);
  const [message, setMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [activeView,setActiveView] = useState<'missions'|'rockets'|'systems'|'orbits'|'library'|'learning'|'research'|'sources'|'moon'|'nasa'|'infrastructure'|'crafts'>('missions');
  const [campaignMode,setCampaignMode]=useState<'observation'|'contracts'|'progression'>('observation');
  const [researchFocus,setResearchFocus]=useState<'All'|'Launch'|'Infrastructure'>('All');
  const [orbitalSelection,setOrbitalSelection]=useState<{
    mode:'earth'|'heliocentric';day:number;target:'mars'|'jupiter';
    perigee:number;eccentricity:number;}|null>(null);
  const [lastSolvedTransfer,setLastSolvedTransfer]=useState<LambertSolution|null>(null);
  const [observationResetKey,setObservationResetKey]=useState(0);
  const [secondsToNextDay,setSecondsToNextDay]=useState(Math.ceil(GAME_DAY_DURATION_MS/1000));
  const [flightNowMs,setFlightNowMs]=useState(Date.now());
  const [nasaSnapshot,setNasaSnapshot]=useState<NASAMissionSnapshot|null>(readNASAMissionCache);
  const [nasaLoading,setNasaLoading]=useState(false);
  const [nasaError,setNasaError]=useState<string|null>(null);
  const nasaLoadingRef=useRef(false);
  const nasaWeather=nasaWeatherBrief(nasaSnapshot,dateForGameDay(game.day),new Date(flightNowMs));
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
    game.storyCompleted,selectedCampaignId,
    game.neoOpportunity?[game.neoOpportunity.mission]:[]),
    [game.day,unlockedCampaignStage,game.storyCompleted,selectedCampaignId,game.neoOpportunity]);
  const contract = CONTRACTS.find((item) => item.id === missionId) ?? CONTRACTS[0];
  const selectedServiceQuote=flightService({
    service:game.rocketService,vehicle,tier:game.rocketProgramLevel,
    priorFlights:game.rocketFlightCounts[game.rocketService]??0,
    canadianSuccesses:game.canadianMissionSuccesses});
  const buildCost=selectedServiceQuote.costUsd;
  const valid=Number.isFinite(buildCost)&&selectedServiceQuote.available;
  const payloadOK=valid&&selectedServiceQuote.capacityKg>=contract.requiredPayloadKg;
  const sufficientCash=game.cash>=buildCost;
  const ready=payloadOK&&sufficientCash&&
    !game.activeStoryRun&&!game.activeMoonCargoRun&&!game.activeAssemblyProject&&!game.activeNetworkRun;
  const successfulLaunches = game.completed;
  const latest = game.history[0];
  const dailyBudget=dailyEconomics(game.researchUnlocked,game.moonBaseLevel,
    !!(game.activeStoryRun||game.activeMoonCargoRun||game.activeAssemblyProject||game.activeNetworkRun),
    game.networkLevels);
  const activeFlightProgress=game.activeStoryRun?
    flightProgress(game.activeStoryRun.startedAtMs??flightNowMs,flightNowMs,
      game.activeStoryRun.viewerDurationMs??DEFAULT_FLIGHT_VIEWER_MS):null;
  const assemblyFraction=game.activeAssemblyProject?
    game.activeAssemblyProject.launchesCompleted/game.activeAssemblyProject.draft.launchCount:null;
  const networkProgress=game.activeNetworkRun?
    flightProgress(game.activeNetworkRun.startedAtMs,flightNowMs,
      game.activeNetworkRun.viewerDurationMs):null;
  const lunarProgress=game.activeMoonCargoRun?
    flightProgress(game.activeMoonCargoRun.startedAtMs,flightNowMs,
      game.activeMoonCargoRun.viewerDurationMs):null;
  async function updateNASAIntel(force=false){
    if(nasaLoadingRef.current)return;
    nasaLoadingRef.current=true;setNasaLoading(true);setNasaError(null);
    try{
      const result=await loadNASAMissionIntelligence({force});
      setNasaSnapshot(result);
    }catch(e){setNasaError(e instanceof Error?e.message:'NASA services unavailable. Offline game continues.')}
    finally{nasaLoadingRef.current=false;setNasaLoading(false);}
  }
  useEffect(()=>{
    if(activeView==='nasa'&&!nasaSnapshot&&!nasaLoading&&!nasaError)
      void updateNASAIntel();
  },[activeView,nasaSnapshot,nasaLoading,nasaError]);
  function chooseNASAObject(neo:NearEarthApproach){
    const offer=makeNeoObservationOffer(neo,game.day);
    setSnapshot(previous=>({...previous,game:{...previous.game,
      neoOpportunity:makeNeoObservationOffer(neo,previous.game.day)}}));
    setSelectedCampaignId(offer.id);
    setCampaignMode('progression');setActiveView('missions');
    setMessage('NASA close approach '+neo.name+' selected for an Earth-orbit observation scenario. No asteroid intercept is implied.');
  }
  function chooseCSAScienceMission(id:string){
    const program=CSA_DATA_PROGRAMS.find(x=>x.mission.id===id);
    if(!program)return;
    setSelectedCampaignId(program.mission.id);
    setCampaignMode('progression');setActiveView('missions');
    setMessage(program.realProgram+' source-data mission selected. Equip the required modeled science instrument and review electrical, thermal, launch and cash constraints.');
  }
  function openFlightViewer(){
    setFlightViewerOpen(true);
    if(game.activeNetworkRun)setActiveView('infrastructure');
    else if(game.activeMoonCargoRun)setActiveView('moon');
    else{setCampaignMode('progression');setActiveView('missions');}
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
  function buyFleetUpgrade(){
    setSnapshot(previous=>{
      const g=previous.game,next=FLEET_UPGRADES[g.rocketProgramLevel];
      if(!next||g.cash<next.costUsd)return previous;
      const gate=canadianProgramReadiness({
        tier:g.rocketProgramLevel,day:g.day,
        canadianSuccesses:g.canadianMissionSuccesses,
        researchUnlocked:g.researchUnlocked,devMode:g.devMode});
      if(!gate.ready)return previous;
      return {...previous,game:{...g,cash:g.cash-next.costUsd,
        rocketProgramLevel:g.rocketProgramLevel+1}};
    });
    setMessage('Canadian launch program advanced after research, testing and infrastructure funding.');
  }
  function buyOrbitalAssembly(){
    setSnapshot(previous=>{
      if(previous.game.orbitalAssemblyUnlocked||
        previous.game.cash<ORBITAL_ASSEMBLY_UPGRADE_USD)return previous;
      return {...previous,game:{...previous.game,
        cash:previous.game.cash-ORBITAL_ASSEMBLY_UPGRADE_USD,
        orbitalAssemblyUnlocked:true}};
    });
  }
  function saveWorkingSpacecraft(name:string,description:string){
    setSnapshot(old=>({...old,game:{...old.game,
      spacecraftBlueprints:saveSpacecraftBlueprint(old.game.spacecraftBlueprints,
        name,spacecraftDesign,old.game.day,description)}}));
    setMessage('Independent spacecraft blueprint saved. Future changes to the working model will not overwrite it.');
  }
  function newWorkingSpacecraft(){
    setSpacecraftDesign(cloneSpacecraftDesign(DEFAULT_SUBSYSTEM_DESIGN));
    setActiveView('systems');setMessage('New blank spacecraft loaded. Prior saved designs and flown configurations remain in the library.');
  }
  function loadWorkingSpacecraft(id:string){
    const found=game.spacecraftBlueprints.find(x=>x.id===id);
    if(!found)return;
    setSpacecraftDesign(cloneSpacecraftDesign(found.design));
    setActiveView('systems');
    setMessage('Loaded an independent working copy of '+found.name+'. Original saved version is unchanged.');
  }
  function duplicateWorkingSpacecraft(id:string){
    const found=game.spacecraftBlueprints.find(x=>x.id===id);
    if(!found)return;
    setSnapshot(old=>({...old,game:{...old.game,
      spacecraftBlueprints:duplicateSpacecraftBlueprint(old.game.spacecraftBlueprints,id,old.game.day)}}));
    setSpacecraftDesign(cloneSpacecraftDesign(found.design));setActiveView('systems');
    setMessage('Created independent duplicate of '+found.name+' and opened it for editing. Save another revision when finished.');
  }
  function renameWorkingSpacecraft(id:string,name:string){
    if(!name.trim())return;
    setSnapshot(old=>({...old,game:{...old.game,spacecraftBlueprints:
      old.game.spacecraftBlueprints.map(x=>x.id===id?{...x,name:name.trim().slice(0,80)}:x)}}));
  }
  function deleteWorkingSpacecraft(id:string){
    setSnapshot(old=>({...old,game:{...old.game,spacecraftBlueprints:
      old.game.spacecraftBlueprints.filter(x=>x.id!==id)}}));
  }
  function dispatchNetwork(kind:OrbitalNetworkKind){
    setSnapshot(previous=>{
      const g=previous.game;
      if(!g.storyCompleted.includes('observation')&&!g.devMode)return previous;
      if(g.activeStoryRun||g.activeMoonCargoRun||g.activeAssemblyProject||g.activeNetworkRun)
        return previous;
      const plan=planNetworkDeployment({kind,levels:g.networkLevels,
        design:spacecraftDesign,launcher:previous.vehicle,
        service:g.rocketService,tier:g.rocketProgramLevel,
        assemblyUnlocked:g.orbitalAssemblyUnlocked,
        priorServiceFlights:g.rocketFlightCounts[g.rocketService]??0,
        canadianSuccesses:g.canadianMissionSuccesses,
        productionDiscount:researchDiscount(g.researchUnlocked,g.devMode),
        researched:g.researchUnlocked,devMode:g.devMode});
      if(!plan?.feasible||g.cash<plan.totalCostUsd)return previous;
      const run:NetworkDeploymentRun={
        id:'orbital-network-'+kind+'-'+plan.stage.level,
        kind,stageIndex:g.networkLevels[kind],title:plan.stage.name,
        launchedDay:g.day,departureDate:dateForGameDay(g.day),
        startedAtMs:Date.now(),viewerDurationMs:DEFAULT_FLIGHT_VIEWER_MS,
        durationDays:6,target:'ellipse',route:{flightDays:6},
        costUsd:plan.totalCostUsd,launchCount:plan.manifest.flightsRequired,
        launchService:g.rocketService,satelliteCount:plan.stage.additionalSatellites,
        totalWetKg:plan.totalWetKg,moduleId:kind,
      };
      return {...previous,game:{...g,
        cash:g.cash-plan.totalCostUsd,activeNetworkRun:run,
        spacecraftBlueprints:markSpacecraftDeployed(g.spacecraftBlueprints,
          plan.stage.name+' · '+kind,spacecraftDesign,plan.stage.name,g.day),
        launched:g.launched+plan.manifest.flightsRequired,
        rocketFlightCounts:{...g.rocketFlightCounts,
          [g.rocketService]:(g.rocketFlightCounts[g.rocketService]??0)+
            plan.manifest.flightsRequired}}};
    });
    setFlightNowMs(Date.now());setActiveView('infrastructure');
    setMessage('Satellites, ground equipment and all independent rocket launch invoices charged. Revenue starts after orbital commissioning.');
  }
  function finishNetwork(){
    setSnapshot(previous=>{
      const g=previous.game,run=g.activeNetworkRun;
      if(!run||!flightProgress(run.startedAtMs,Date.now(),run.viewerDurationMs).ready||
        g.networkLevels[run.kind]!==run.stageIndex)return previous;
      const advanced=advanceProgramDay(g,run.durationDays);
      const event:HistoryItem={id:Date.now(),day:run.launchedDay,
        contract:run.title+' · operational infrastructure',
        craft:run.satelliteCount+' '+run.kind+' service satellites',
        cost:run.costUsd,payout:0,deliveredKg:run.totalWetKg,success:true};
      return {...previous,game:{...advanced,activeNetworkRun:null,
        networkLevels:{...g.networkLevels,[run.kind]:run.stageIndex+1},
        researchPoints:advanced.researchPoints+3+
          (run.launchService==='custom'?CANADIAN_RESEARCH_BONUS_RP:0),
        canadianMissionSuccesses:g.canadianMissionSuccesses+
          (run.launchService==='custom'?1:0),
        deliveredKg:g.deliveredKg+run.totalWetKg,completed:g.completed+1,
        history:[event,...g.history].slice(0,12)}};
    });
    setMessage('Orbital network commissioned. Subscription revenue and daily operating costs now accrue with the game clock.');
  }
  function startMoonCargo(){
    setSnapshot(previous=>{
      const g=previous.game,stage=g.moonBaseLevel;
      if((!g.storyCompleted.includes('lunar')&&!g.devMode)||
        g.activeMoonCargoRun||g.activeStoryRun||g.activeAssemblyProject||g.activeNetworkRun||
        g.moonCargoDeliveredLevel>stage||stage>=MOON_BASE_LEVELS.length)return previous;
      const logistics=planMoonShipment({stageIndex:stage,
        service:g.rocketService,vehicle:previous.vehicle,
        tier:g.rocketProgramLevel,assemblyUnlocked:g.orbitalAssemblyUnlocked,
        priorFlights:g.rocketFlightCounts[g.rocketService]??0,
        canadianSuccesses:g.canadianMissionSuccesses});
      if(!logistics.manifest.feasible||g.cash<logistics.totalCostUsd)return previous;
      const cargo:MoonCargoRun={id:'moon-cargo-stage-'+stage,title:logistics.blueprint.name,
        stageIndex:stage,target:'lunar',durationDays:8,
        launchedDay:g.day,departureDate:dateForGameDay(g.day),
        startedAtMs:Date.now(),viewerDurationMs:DEFAULT_FLIGHT_VIEWER_MS,
        route:{flightDays:8},service:g.rocketService,
        flightsRequired:logistics.manifest.flightsRequired,
        costUsd:logistics.totalCostUsd,payloadKg:logistics.payloadKg,
        landerPropellantKg:logistics.propellantKg,
        leoManifestKg:logistics.leoManifestKg};
      return {...previous,game:{...g,cash:g.cash-logistics.totalCostUsd,
        activeMoonCargoRun:cargo,
        launched:g.launched+logistics.manifest.flightsRequired,
        rocketFlightCounts:{...g.rocketFlightCounts,
          [g.rocketService]:(g.rocketFlightCounts[g.rocketService]??0)+logistics.manifest.flightsRequired}}};
    });
    setFlightNowMs(Date.now());
    setMessage('Lunar cargo launch manifests paid and dispatched. Land the shipment before construction can begin.');
  }
  function finishMoonCargo(){
    setSnapshot(previous=>{
      const g=previous.game,run=g.activeMoonCargoRun;
      if(!run||!flightProgress(run.startedAtMs,Date.now(),run.viewerDurationMs).ready)return previous;
      const advanced=advanceProgramDay(g,run.durationDays);
      const event:HistoryItem={
        id:Date.now(),day:run.launchedDay,contract:run.title+' · lunar cargo delivered',
        craft:run.service+' / lunar descent lander',success:true,cost:run.costUsd,payout:0,
        deliveredKg:run.payloadKg};
      return {...previous,game:{...advanced,
        activeMoonCargoRun:null,
        moonCargoDeliveredLevel:Math.max(g.moonCargoDeliveredLevel,run.stageIndex+1),
        completed:g.completed+1,deliveredKg:g.deliveredKg+run.payloadKg,
        researchPoints:advanced.researchPoints+2+
          (run.service==='custom'?CANADIAN_RESEARCH_BONUS_RP:0),
        canadianMissionSuccesses:g.canadianMissionSuccesses+(run.service==='custom'?1:0),
        history:[event,...g.history].slice(0,12)}};
    });
    setMessage('Lunar cargo delivered. The associated surface facility can now be constructed.');
  }
  function investMoonBase(){
    setSnapshot(previous=>{
      const g=previous.game,next=MOON_BASE_LEVELS[g.moonBaseLevel];
      if(!next||(!g.storyCompleted.includes('lunar')&&!g.devMode)||
        g.moonCargoDeliveredLevel<=g.moonBaseLevel||
        g.activeMoonCargoRun||g.cash<next.investmentUsd)return previous;
      return {...previous,game:{...g,cash:g.cash-next.investmentUsd,
        moonBaseLevel:g.moonBaseLevel+1}};
    });
    setMessage('Delivered lunar hardware constructed. Base income and upkeep begin with the next game day.');
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

  function chooseContract(id: MissionId) {
    setSnapshot((previous) => ({ ...previous, missionId: id }));
    setMessage(null);
  }
  function launch() {
    const quote=flightService({
      service:game.rocketService,vehicle,tier:game.rocketProgramLevel,
      priorFlights:game.rocketFlightCounts[game.rocketService]??0,
      canadianSuccesses:game.canadianMissionSuccesses,
    });
    if(!quote.available||quote.capacityKg<contract.requiredPayloadKg||
      game.cash<quote.costUsd||game.activeStoryRun||game.activeMoonCargoRun||game.activeNetworkRun||
      game.activeAssemblyProject)return;
    setSnapshot(previous=>{
      const g=previous.game;
      if(g.activeStoryRun||g.activeMoonCargoRun||g.activeAssemblyProject||g.activeNetworkRun)return previous;
      const selected=flightService({
        service:g.rocketService,vehicle:previous.vehicle,tier:g.rocketProgramLevel,
        priorFlights:g.rocketFlightCounts[g.rocketService]??0,
        canadianSuccesses:g.canadianMissionSuccesses,
      });
      if(!selected.available||selected.capacityKg<contract.requiredPayloadKg||
         g.cash<selected.costUsd)return previous;
      const success=true;
      const event:HistoryItem={
        id:Date.now(),day:g.day,contract:contract.label,
        craft:selected.label,success,cost:selected.costUsd,payout:contract.payoutUsd,
        deliveredKg:contract.requiredPayloadKg,
      };
      const advanced=advanceProgramDay(g,contract.durationDays);
      return {...previous,game:{...advanced,
        cash:advanced.cash-selected.costUsd+contract.payoutUsd,
        researchPoints:advanced.researchPoints+2+
          (g.rocketService==='custom'?CANADIAN_RESEARCH_BONUS_RP:0),
        canadianMissionSuccesses:g.canadianMissionSuccesses+(g.rocketService==='custom'?1:0),
        launched:g.launched+1,completed:g.completed+1,
        deliveredKg:g.deliveredKg+contract.requiredPayloadKg,
        revenue:g.revenue+contract.payoutUsd,
        rocketFlightCounts:{...g.rocketFlightCounts,
          [g.rocketService]:(g.rocketFlightCounts[g.rocketService]??0)+1},
        history:[event,...g.history].slice(0,12),
      }};
    });
    setMessage(contract.label+' delivered. Launcher invoice charged, customer payout received. '+
      (game.rocketService==='custom'?'Canadian rocket flight experience earned.':'No Canadian rocket development credit from external launch.'));
  }
  function startCampaignMission(run:CampaignRun){
    setSnapshot(previous=>{
      const g=previous.game;
      if(g.activeStoryRun||g.activeMoonCargoRun||g.activeAssemblyProject||g.activeNetworkRun||
         g.storyCompleted.includes(run.id)||
         g.cash<run.costUsd||run.launchedDay!==g.day||
         run.launchService!==g.rocketService)return previous;
      const manifest=planLaunchManifest({
        totalWetKg:run.payloadKg,service:g.rocketService,
        vehicle:previous.vehicle,tier:g.rocketProgramLevel,
        assemblyUnlocked:g.orbitalAssemblyUnlocked,
        priorFlights:g.rocketFlightCounts[g.rocketService]??0,
        canadianSuccesses:g.canadianMissionSuccesses,
      });
      if(!manifest.feasible||manifest.flightsRequired!==run.launchCount||
         manifest.flights.length!==run.launchInvoices.length)return previous;
      // MULTIPLE actual rocket deliveries must be paid and tracked one-by-one.
      // The new spacecraft is procured once at program start. A separate
      // orbital inventory is persisted and survives navigation/reload.
      if(run.launchCount>1){
        return {...previous,game:{...g,
          cash:g.cash-run.spacecraftProcurementUsd,
          spacecraftBlueprints:markSpacecraftDeployed(g.spacecraftBlueprints,
            run.title+' · flown build',spacecraftDesign,run.title,g.day),
          activeAssemblyProject:{draft:run,launchesCompleted:0,startedDay:g.day}}};
      }
      return {...previous,game:{...g,
        cash:g.cash-run.costUsd,
        launched:g.launched+1,
        rocketFlightCounts:{...g.rocketFlightCounts,
          [g.rocketService]:(g.rocketFlightCounts[g.rocketService]??0)+1},
        engineBuildCounts:{...g.engineBuildCounts,
          [previous.vehicle.engineId]:
            (g.engineBuildCounts[previous.vehicle.engineId]??0)+1},
        spacecraftBlueprints:markSpacecraftDeployed(g.spacecraftBlueprints,
          run.title+' · flown build',spacecraftDesign,run.title,g.day),
        activeStoryRun:{...run,startedAtMs:Date.now(),
          viewerDurationMs:DEFAULT_FLIGHT_VIEWER_MS,
          orekitTrajectoryAu:lastSolvedTransfer?.departureDate===run.departureDate&&
            lastSolvedTransfer.target===run.target&&lastSolvedTransfer.trajectoryAu?.length>=8?
              lastSolvedTransfer.trajectoryAu:undefined},lastStoryDebrief:null,
      }};
    });
    setFlightViewerOpen(true);setFlightNowMs(Date.now());
    setMessage(run.launchCount>1?
      'Spacecraft procured. Launch each independently priced batch, then perform the orbital assembly before departing.':
      'Launch service paid. Mission underway with persistent flight timer.');
  }
  function launchAssemblyFlight(){
    setSnapshot(previous=>{
      const g=previous.game,project=g.activeAssemblyProject;
      if(!project||g.activeStoryRun||g.activeMoonCargoRun||g.activeNetworkRun)return previous;
      const batch=project.draft.launchInvoices[project.launchesCompleted];
      if(!batch||g.cash<batch.serviceCostUsd)return previous;
      const service=project.draft.launchService;
      return {...previous,game:{...g,
        cash:g.cash-batch.serviceCostUsd,
        launched:g.launched+1,
        rocketFlightCounts:{...g.rocketFlightCounts,
          [service]:(g.rocketFlightCounts[service]??0)+1},
        activeAssemblyProject:{...project,launchesCompleted:project.launchesCompleted+1}}};
    });
    setMessage('Rocket shipment delivered into parking orbit and added to the spacecraft assembly inventory.');
  }
  function finalizeOrbitalAssembly(){
    setSnapshot(previous=>{
      const g=previous.game,project=g.activeAssemblyProject;
      if(!project||project.launchesCompleted!==project.draft.launchCount||
        g.cash<project.draft.orbitalAssemblyCostsUsd||g.activeStoryRun)return previous;
      const run=project.draft;
      return {...previous,game:{...g,
        cash:g.cash-run.orbitalAssemblyCostsUsd,
        engineBuildCounts:{...g.engineBuildCounts,
          [previous.vehicle.engineId]:
            (g.engineBuildCounts[previous.vehicle.engineId]??0)+1},
        activeAssemblyProject:null,
        activeStoryRun:{...run,startedAtMs:Date.now(),
          viewerDurationMs:DEFAULT_FLIGHT_VIEWER_MS,
          orekitTrajectoryAu:lastSolvedTransfer?.departureDate===run.departureDate&&
            lastSolvedTransfer.target===run.target&&lastSolvedTransfer.trajectoryAu?.length>=8?
              lastSolvedTransfer.trajectoryAu:undefined},lastStoryDebrief:null}};
    });
    setFlightViewerOpen(true);setFlightNowMs(Date.now());
    setMessage('All hardware launched and assembled. Orbital transfer mission started.');
  }
  function cancelOrbitalAssembly(){
    setSnapshot(previous=>({...previous,game:{...previous.game,activeAssemblyProject:null}}));
    setMessage('Assembly project cancelled. Hardware and previous rocket launch invoices are sunk costs.');
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
          (run.target==='jupiter'?12:run.target==='mars'?9:run.target==='asteroid'?7:4)+
          (run.launchService==='custom'?CANADIAN_RESEARCH_BONUS_RP:0),
        canadianMissionSuccesses:previous.game.canadianMissionSuccesses+
          (run.launchService==='custom'?1:0),
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
      launchService:game.rocketService,rocketProgramLevel:game.rocketProgramLevel,
      orbitalAssemblyUnlocked:game.orbitalAssemblyUnlocked,
      priorServiceFlights:game.rocketFlightCounts[game.rocketService]??0,
      canadianSuccesses:game.canadianMissionSuccesses,
      weatherReserveHours:nasaWeather.reserveHours,
    });}catch{return null}
  },[labObservationChoices,spacecraftDesign,vehicle,game.engineBuildCounts,missionTechnologyDiscount,
    game.rocketService,game.rocketProgramLevel,game.orbitalAssemblyUnlocked,game.rocketFlightCounts,game.canadianMissionSuccesses,nasaWeather.reserveHours]);
  const selectedCampaignReview=useMemo(()=>{
    try{return reviewCampaignMission({
      definition:campaignSelection.selected,day:game.day,options:campaignOptions,
      spacecraft:spacecraftDesign,launcher:vehicle,capitalUsd:game.cash,
      productionDiscount:missionTechnologyDiscount,
      completedWithLauncherEngine:game.engineBuildCounts[vehicle.engineId]??0,
      solvedTransfer:missionSolved,
      launchService:game.rocketService,rocketProgramLevel:game.rocketProgramLevel,
      orbitalAssemblyUnlocked:game.orbitalAssemblyUnlocked,
      priorServiceFlights:game.rocketFlightCounts[game.rocketService]??0,
      canadianSuccesses:game.canadianMissionSuccesses,
      weatherReserveHours:nasaWeather.reserveHours,
    });}catch{return null}
  },[campaignSelection.selected,game.day,campaignOptions,spacecraftDesign,vehicle,
    game.cash,game.engineBuildCounts,missionTechnologyDiscount,lastSolvedTransfer,
    game.rocketService,game.rocketProgramLevel,game.orbitalAssemblyUnlocked,game.rocketFlightCounts,game.canadianMissionSuccesses,nasaWeather.reserveHours]);
  function startEarthObservation(costUsd:number){
    setSnapshot(previous=>{
      const g=previous.game;
      if(g.cash<costUsd||g.activeStoryRun||g.activeMoonCargoRun||g.activeAssemblyProject||g.activeNetworkRun)return previous;
      return {...previous,game:{
      ...g,
      cash:g.cash-costUsd,
      launched:g.launched+1,
      observationLaunchService:g.rocketService,
      spacecraftBlueprints:markSpacecraftDeployed(g.spacecraftBlueprints,
        'Earth Observation One · flown',spacecraftDesign,'Earth Observation One',g.day),
      rocketFlightCounts:{...g.rocketFlightCounts,
        [g.rocketService]:(g.rocketFlightCounts[g.rocketService]??0)+1},
      engineBuildCounts:{...previous.game.engineBuildCounts,
        [previous.vehicle.engineId]:(g.engineBuildCounts[previous.vehicle.engineId]??0)+1},
    }};});
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
        researchPoints:advanceProgramDay(previous.game,7).researchPoints+(success?7:2)+
          (success&&previous.game.observationLaunchService==='custom'?CANADIAN_RESEARCH_BONUS_RP:0),
        canadianMissionSuccesses:previous.game.canadianMissionSuccesses+
          (success&&previous.game.observationLaunchService==='custom'?1:0),
        observationLaunchService:null,
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
          <nav aria-label="Game branches" className="game-tabs grouped-game-tabs" role="tablist">
            {([
              {heading:'01 · CAMPAIGN',hint:'Missions & trajectories',
                tabs:[['missions','Play Campaign'],['orbits','Orbital Map']]},
              {heading:'02 · ENGINEERING',hint:'Build reusable spacecraft',
                tabs:[['systems','Engineering Lab'],['crafts','Spacecraft Library'],['rockets','Rocket Fleet']]},
              {heading:'03 · INFRASTRUCTURE',hint:'Build revenue-generating assets',
                tabs:[['infrastructure','Orbital Networks'],['moon','Moon Base']]},
              {heading:'04 · RESEARCH',hint:'Develop capabilities',
                tabs:[['research','Research & Roadmap']]},
              {heading:'05 · INTELLIGENCE',hint:'Science data & archives',
                tabs:[['nasa','NASA Intel'],['library','Mission Library'],
                  ['sources','Sources & Data'],['learning','Learn Physics']]},
            ] as const).map(group=><div key={group.heading} className={'game-nav-group '+
              (group.tabs.some(([id])=>id===activeView)?'selected':'')}>
              <div className="game-nav-heading"><strong>{group.heading}</strong>
                <small>{group.hint}</small></div>
              <div className="game-nav-links">
                {group.tabs.map(([id,label])=><button key={id} type="button"
                  role="tab" aria-selected={activeView===id}
                  className={activeView===id?'current':''} onClick={()=>{
                    if(id==='systems')setLabObservationChoices(readObservationChoices());
                    if(id==='research')setResearchFocus('All');
                    setActiveView(id);
                  }}>{label}</button>)}
              </div>
            </div>)}
          </nav>
          <div className="prototype-pill"><span className="live-dot" /> PROTOTYPE <span className="version">V1.9</span>{game.devMode&&<span className="dev-indicator"> · DEV UNLOCKED</span>}</div>
        </div>
      </header>

      <main className="main-content">
        <section className="agency-finance-bar" aria-label="Recurring agency finances and research points">
          <div><small>AVAILABLE CASH</small><strong>{usd(game.cash)}</strong></div>
          <div><small>RESEARCH POINTS</small><strong>{game.researchPoints} RP</strong></div>
          <div><small>DAILY OPERATING COST</small><strong>−{usd(dailyBudget.expensesUsd)}/d</strong></div>
          <div><small>PASSIVE REVENUE · LUNAR + ORBITAL</small><strong>+{usd(dailyBudget.revenueUsd)}/d</strong></div>
          <div className={dailyBudget.netUsd>=0?'positive':'negative'}>
            <small>NET / GAME DAY</small><strong>{dailyBudget.netUsd>=0?'+':''}{usd(dailyBudget.netUsd)}/d</strong>
            <small>{dailyBudget.netUsd>=0?'POSITIVE CASH FLOW':
              game.cash<=0?'INSOLVENT · SEEK CONTRACT REVENUE':
              'AT CURRENT BURN: '+Math.floor(game.cash/-dailyBudget.netUsd)+' GAME DAYS OF CASH RUNWAY'}</small>
          </div>
          {game.cash<0&&<div className="finance-distress">CASH DEFICIT · new investments blocked</div>}
        </section>
        {(game.activeStoryRun&&activeFlightProgress||game.activeMoonCargoRun&&lunarProgress||game.activeNetworkRun&&networkProgress||game.activeAssemblyProject)&&<button type="button"
          className="flight-progress-pill" onClick={openFlightViewer}
          aria-label="Open active flight progress">
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="20" fill="none" stroke="#344963" strokeWidth="5"/>
            <circle cx="26" cy="26" r="20" fill="none" stroke="#f3bd7b" strokeWidth="5"
              transform="rotate(-90 26 26)"
              strokeDasharray={String(125.66*(networkProgress?.fraction??lunarProgress?.fraction??activeFlightProgress?.fraction??assemblyFraction??0))+' 125.66'}/>
            <text x="26" y="30" fill="#f6e7d0" textAnchor="middle" fontSize="11" fontWeight="800">{Math.round((networkProgress?.fraction??lunarProgress?.fraction??activeFlightProgress?.fraction??assemblyFraction??0)*100)}%</text>
          </svg>
          <span><strong>{game.activeNetworkRun?.title??game.activeMoonCargoRun?.title??game.activeStoryRun?.title??game.activeAssemblyProject?.draft.title}</strong>
            <small>{(networkProgress??lunarProgress??activeFlightProgress)?.ready?
              game.activeMoonCargoRun?'LANDED · CONFIRM DELIVERY':game.activeNetworkRun?'READY · COMMISSION NETWORK':'READY FOR DEBRIEF':
              game.activeAssemblyProject?
              'ORBIT INVENTORY '+game.activeAssemblyProject.launchesCompleted+'/'+game.activeAssemblyProject.draft.launchCount+' · open staging':
              'ETA '+flightEta((networkProgress??lunarProgress??activeFlightProgress)?.remainingMs??0)+' · open viewer'}</small></span>
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
            launchService={game.rocketService} rocketProgramLevel={game.rocketProgramLevel}
            orbitalAssemblyUnlocked={game.orbitalAssemblyUnlocked}
            priorServiceFlights={game.rocketFlightCounts[game.rocketService]??0}
            otherMissionActive={!!(game.activeStoryRun||game.activeMoonCargoRun||game.activeAssemblyProject||game.activeNetworkRun)}
            canadianSuccesses={game.canadianMissionSuccesses}
            weatherReserveHours={nasaWeather.reserveHours}
            onEditSpacecraft={()=>{setLabObservationChoices(readObservationChoices());setActiveView('systems')}}
            onEditLauncher={()=>setActiveView('rockets')}
            onStart={startEarthObservation}
            technologyDiscount={missionTechnologyDiscount}
            lockedTechnologies={lockedLabParts}
            onComplete={completeEarthObservation}/>}
        {activeView==='missions'&&campaignMode==='progression'&&
          <CampaignMissions assembly={game.activeAssemblyProject}
            onLaunchAssemblyFlight={launchAssemblyFlight}
            onFinalizeAssembly={finalizeOrbitalAssembly}
            onCancelAssembly={cancelOrbitalAssembly}
            launchService={game.rocketService}
            rocketProgramLevel={game.rocketProgramLevel}
            orbitalAssemblyUnlocked={game.orbitalAssemblyUnlocked}
            priorServiceFlights={game.rocketFlightCounts[game.rocketService]??0}
            canadianSuccesses={game.canadianMissionSuccesses}
            nasaNeoOffer={game.neoOpportunity?.mission??null}
            weatherReserveHours={nasaWeather.reserveHours}
            dailyNetUsd={dailyBudget.netUsd}
            onGoToBlueprints={()=>setActiveView('crafts')}
            logisticsInProgress={!!(game.activeMoonCargoRun||game.activeNetworkRun)}
            nowMs={flightNowMs} viewerOpen={flightViewerOpen}
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
            onGoToRocket={()=>setActiveView('rockets')}
            onViewOrbital={openMissionOrbit}/>}
        <div className={'control-layout '+(activeView==='missions'&&campaignMode==='contracts'?'':'view-hidden')} id="mission-control">
          <div className="left-column">
            <section className="panel" id="builder">
              <div className="panel-heading"><div>
                <div className="eyebrow">01 / FIXED LAUNCH SYSTEMS</div>
                <h2>Rocket vehicle procurement</h2>
                <p>Launcher mass and payload capacity are preset by the technology generation.
                  Changing old saved rocket blueprint numbers cannot increase orbit capacity.
                  Upgrade Canadian rockets in the fleet roadmap, or buy an external launch contract.</p>
              </div></div>
              <div className="rocket-return-stats">
                <span>Selected vehicle <strong>{selectedServiceQuote.label}</strong></span>
                <span>Modeled payload limit <strong>{integer(selectedServiceQuote.capacityKg)} kg LEO</strong></span>
                <span>One actual launch invoice <strong>{usd(buildCost)}</strong></span>
                <span>Canadian flight R&D <strong>{game.rocketService==='custom'?'Yes, on successful mission':'No'}</strong></span>
              </div>
              <button type="button" className="secondary-button" style={{marginTop:15}}
                onClick={()=>setActiveView('rockets')}>Select rocket and develop the Canadian fleet ↗</button>
            </section>
            <section className="panel metrics-panel">
              <div className="panel-heading"><div>
                <div className="eyebrow">02 / SERVICE CONTRACT</div>
                <h2>Modeled transport constraints</h2>
                <p>Orbital delivery is an assumed service capability capped by your
                  selected generation—not a slider-controlled ideal rocket equation.</p></div></div>
              <div className="metrics-grid">
                <div><span>DELIVERY LIMIT</span><strong>{integer(selectedServiceQuote.capacityKg)} <small>kg</small></strong></div>
                <div><span>PER LAUNCH COST</span><strong>{usd(buildCost)}</strong></div>
              </div>
              <div className="engineering-note"><span>ℹ</span><p>
                Supplier payload capacities are planning assumptions or unproven
                development targets, not flight-qualified ascent designs.
                The spacecraft's actual wet mass is independently reviewed in Explore Further.</p></div>
            </section>
          </div>
          <div className="right-column">
            <section className="panel mission-panel">
              <div className="panel-heading"><div><div className="eyebrow">03 / MISSION CONTROL</div><h2>Available Contracts</h2><p>Earn funding by delivering payload to orbit.</p></div><div className="panel-glyph">⌁</div></div>
              <div className="contract-list">{CONTRACTS.map((item) => <button key={item.id} className={'contract ' + (item.id === missionId ? 'selected' : '')} onClick={() => chooseContract(item.id)} aria-pressed={item.id === missionId}><div className="contract-dot">{item.id === missionId ? '●' : '○'}</div><div className="contract-main"><span>{item.kicker}</span><strong>{item.label}</strong><small>{item.description}</small></div><div className="contract-price">{usd(item.payoutUsd)}<small>REWARD</small></div></button>)}</div>
            </section>

            <section className="panel launch-panel">
              <div className="panel-heading compact-heading"><div><div className="eyebrow">04 / FLIGHT REVIEW</div><h2>Launch Readiness</h2></div><span className={'status-tag ' + (ready ? 'ready' : 'blocked')}>{ready ? '● DESIGN READY' : '● REVIEW REQUIRED'}</span></div>
              <div className="readiness-list"><div><span><CheckIcon good={payloadOK}/> Provider payload allocation</span><strong>{integer(selectedServiceQuote.capacityKg)} / {integer(contract.requiredPayloadKg)} kg</strong></div>
                <div><span><CheckIcon good={sufficientCash}/> Rocket invoice funded</span><strong>{usd(game.cash)} / {usd(buildCost)}</strong></div>
                <div><span><CheckIcon good={!game.activeStoryRun&&!game.activeMoonCargoRun&&!game.activeAssemblyProject&&!game.activeNetworkRun}/> Flight operations available</span><strong>{ready?'Ready':'Existing mission/assembly in progress'}</strong></div></div>
              <div className="financials"><div><span>EST. VEHICLE COST</span><strong>{usd(buildCost)}</strong></div><div><span>MISSION PAYOUT</span><strong className="green">+{usd(contract.payoutUsd)}</strong></div><div><span>EXPECTED MARGIN IF SUCCESSFUL</span><strong className={contract.payoutUsd >= buildCost ? 'green' : 'danger-text'}>{usd(contract.payoutUsd - buildCost)}</strong></div></div>
              <button className="launch-button" onClick={launch} disabled={!ready}>
                {ready?'Purchase launch and deliver mission':'Increase launcher generation or funds first'}<span>↗</span>
              </button>
              {!ready&&<p className="warning-caption">This mission cannot be attempted
                without its real mass allowance, an idle operations slot and enough cash.
                Invest in Canadian rocket generations or choose a larger external service.</p>}
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
        {activeView==='rockets'&&<RocketFleet vehicle={vehicle} cash={game.cash}
          service={game.rocketService} tier={game.rocketProgramLevel}
          day={game.day} devMode={game.devMode}
          canadianSuccesses={game.canadianMissionSuccesses} researched={game.researchUnlocked}
          assemblyUnlocked={game.orbitalAssemblyUnlocked}
          priorFlights={game.rocketFlightCounts}
          onServiceChange={id=>setSnapshot(previous=>({...previous,game:{...previous.game,rocketService:id}}))}
          onFleetUpgrade={buyFleetUpgrade}
          onUnlockAssembly={buyOrbitalAssembly}
          onGoResearch={()=>{setResearchFocus('Launch');setActiveView('research')}}/>}
        {activeView==='infrastructure'&&<OrbitalInfrastructure
          levels={game.networkLevels} activeRun={game.activeNetworkRun}
          design={spacecraftDesign} cash={game.cash} day={game.day} nowMs={flightNowMs}
          unlocked={game.storyCompleted.includes('observation')||game.devMode}
          launcher={vehicle} service={game.rocketService} tier={game.rocketProgramLevel}
          assemblyUnlocked={game.orbitalAssemblyUnlocked}
          priorFlights={game.rocketFlightCounts[game.rocketService]??0}
          canadianSuccesses={game.canadianMissionSuccesses}
          productionDiscount={missionTechnologyDiscount}
          researched={game.researchUnlocked} devMode={game.devMode}
          onGoToResearch={()=>{setResearchFocus('Infrastructure');setActiveView('research')}}
          otherFlightActive={!!(game.activeStoryRun||game.activeMoonCargoRun||game.activeAssemblyProject)}
          onDispatch={dispatchNetwork} onComplete={finishNetwork}
          onGoToLab={()=>setActiveView('systems')}
          onGoToFleet={()=>setActiveView('rockets')}
          onGoToMission={()=>{setCampaignMode('observation');setActiveView('missions')}}/>}
        {activeView==='crafts'&&<SpacecraftLibrary
          designs={game.spacecraftBlueprints} working={spacecraftDesign}
          onSave={saveWorkingSpacecraft} onNew={newWorkingSpacecraft}
          onLoad={loadWorkingSpacecraft} onDuplicate={duplicateWorkingSpacecraft}
          onRename={renameWorkingSpacecraft} onRemove={deleteWorkingSpacecraft}
          onOpenEngineering={()=>setActiveView('systems')}
          onUseInMission={id=>{
            const saved=game.spacecraftBlueprints.find(x=>x.id===id);
            if(!saved)return;
            setSpacecraftDesign(cloneSpacecraftDesign(saved.design));
            setCampaignMode('progression');setActiveView('missions');
            setMessage('Loaded '+saved.name+' as your current mission spacecraft. Saved original remains unchanged.');
          }}/>}
        {activeView==='moon'&&<MoonBase cash={game.cash} level={game.moonBaseLevel}
          unlocked={game.storyCompleted.includes('lunar')||game.devMode} devMode={game.devMode}
          cargoDeliveredLevel={game.moonCargoDeliveredLevel}
          cargoRun={game.activeMoonCargoRun} nowMs={flightNowMs}
          rocketService={game.rocketService} rocketTier={game.rocketProgramLevel}
          orbitalAssemblyUnlocked={game.orbitalAssemblyUnlocked}
          rocketFlights={game.rocketFlightCounts} vehicle={vehicle}
          canadianSuccesses={game.canadianMissionSuccesses}
          otherFlightActive={!!(game.activeStoryRun||game.activeAssemblyProject||game.activeNetworkRun)}
          onDispatchCargo={startMoonCargo} onCompleteCargo={finishMoonCargo}
          onOpenRocketFleet={()=>setActiveView('rockets')}
          onInvest={investMoonBase}
          onExploreCampaign={()=>{
            setSelectedCampaignId('lunar');setCampaignMode('progression');setActiveView('missions');
          }}/>}
        {activeView==='nasa'&&<NASAMissionIntelligence
          snapshot={nasaSnapshot} loading={nasaLoading} error={nasaError}
          gameDate={dateForGameDay(game.day)} gameDay={game.day} brief={nasaWeather}
          selectedNeoId={game.neoOpportunity?.sourceNeo.id??null}
          onRefresh={()=>void updateNASAIntel(true)}
          onSelectNeo={chooseNASAObject}
          onSelectCSAMission={chooseCSAScienceMission}/>}
        {activeView==='sources' && <div className="single-tab-page"><References/></div>}
        {activeView==='library' && <div className="single-tab-page"><MissionLibrary onOpenMap={()=>setActiveView('orbits')}/></div>}
        {activeView==='learning' && <div className="single-tab-page">
          <LearningLab onOpenBuilder={()=>setActiveView('systems')} onOpenOrbital={()=>setActiveView('orbits')}/>
        </div>}
        {activeView==='research'&&<ResearchLab key={researchFocus+'-'+game.rocketProgramLevel}
          initialBranch={researchFocus} initialSelectedId={researchFocus==='Launch'?
            (FLEET_UPGRADES[game.rocketProgramLevel]?.requiredResearch??'canadian-heavy-lift'):
            researchFocus==='Infrastructure'?'orbital-edge-compute':'production-line'}
          cash={game.cash} researchPoints={game.researchPoints}
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
        {showHelp && <div className="help-notes"><p><strong>Model limits:</strong> Canadian rockets are GAME preset technology generations, not yet established operational rocket services. External launch invoices, procurement prices, Galaxia-inspired compute modules, Canadian orbital-network incomes and Moon base cash flows are fictional. Spacecraft mass, electrical power, thermal, fuel and rocket manifests are connected preliminary engineering assumptions, not actual spacecraft qualification. Flight Directorate uses actual two-body Kepler positions and optional Orekit Lambert transfers, not a fully modeled finite-thrust, lunar n-body or planetary capture solution. The mission-review future Δv chart is a sampled Orekit impulsive Lambert date scan if Java is online; the offline Hohmann phase curve is only a game heuristic. No Starlink-equivalent coverage, end-to-end network performance, manufacturer pricing, ascent, NASA weather forecast or actual Galaxia/CSA contract is claimed.</p><p><strong>AI-assisted work:</strong> Initial source code, interface copy, and documentation were drafted with ChatGPT. See README.md and docs/ATTRIBUTION.md for disclosures. No NASA logos or mission insignia are used.</p></div>}
      </main>
    </div>
  );
}
