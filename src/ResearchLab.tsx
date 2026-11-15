import {useState} from 'react';
import {researchPointsCost} from './lib/programEconomy';
import {TECHNOLOGIES,canResearch,formatMillions,hasTechnology,
  type TechnologyId,type TechnologyNode} from './lib/technologyTree';

export const FUTURE_MISSIONS=[
  {name:'Earth Observation One',phase:'PLAYABLE NOW',region:'Earth orbit',
    goal:'Return scientific imagery through a communications bottleneck',
    tech:'Imaging, solar panels, batteries, launch and data downlink',className:'active'},
  {name:'Lunar Relay Pathfinder',phase:'PLAYABLE AFTER EARTH OBSERVATION',region:'Moon',
    goal:'Deliver a lunar communications relay and maintain a workable link budget',
    tech:'Transfer Δv, capture burns, lunar comm windows and eclipse survival',className:'future'},
  {name:'Asteroid Prospecting',phase:'PLAYABLE AFTER LUNAR RELAY',region:'Near-Earth asteroid',
    goal:'Use onboard magnetometer and spectroscopy data to map an asteroid',
    tech:'Power at distance, solar-electric or chemical correction, long science campaigns',className:'future'},
  {name:'Mars Orbiter',phase:'PLAYABLE AFTER ASTEROID',region:'Mars',
    goal:'Choose a transfer window, handle capture and operate an instrument around Mars',
    tech:'Lambert/trajectory interface, propulsion feasibility, thermal and comm delay',className:'future'},
  {name:'Jovian Flyby Survey',phase:'PLAYABLE AFTER MARS ORBITER',region:'Jupiter',
    goal:'Engineer a high-energy Jupiter-system flyby; radiation, distance-dependent power and communications',
    tech:'RTG or research fission electric, long-duration thrust, thermal management',className:'future'},
] as const;

type Branch=TechnologyNode['branch'];
const BRANCHES:readonly Branch[]=['Launch','Propulsion','Power','Thermal','Science','Infrastructure','Economics'];
const LAYOUT:Record<Branch,{top:number;height:number;label:string}>={
  Launch:{top:24,height:146,label:'SOVEREIGN LAUNCH / CANADA'},
  Propulsion:{top:190,height:290,label:'SPACECRAFT PROPULSION'},
  Power:{top:500,height:156,label:'ELECTRICAL GENERATION'},
  Thermal:{top:678,height:146,label:'THERMAL CONTROL'},
  Science:{top:844,height:146,label:'SCIENCE & DATA'},
  Infrastructure:{top:1008,height:290,label:'ORBITAL INFRASTRUCTURE / CANADA'},
  Economics:{top:1320,height:146,label:'MANUFACTURING ECONOMICS'},
};
const CARD_W=230,CARD_H=102,GRAPH_W=1200,GRAPH_H=1500;
type Positioned={item:TechnologyNode;x:number;y:number;depth:number};
function techPositions():Positioned[]{
  const depthCache=new Map<TechnologyId,number>();
  const depthFor=(node:TechnologyNode):number=>{
    if(depthCache.has(node.id))return depthCache.get(node.id)!;
    const d=node.prerequisites.length?1+Math.max(...node.prerequisites.map(id=>
      depthFor(TECHNOLOGIES.find(t=>t.id===id)!))):0;
    depthCache.set(node.id,d);return d;
  };
  return TECHNOLOGIES.map((node)=>{
    const depth=depthFor(node);
    const branches=TECHNOLOGIES.filter(t=>t.branch===node.branch);
    const root=(id:TechnologyId):TechnologyId=>{
      const n=TECHNOLOGIES.find(t=>t.id===id)!;
      const first=n.prerequisites.find(dep=>TECHNOLOGIES.some(x=>x.id===dep&&x.branch===n.branch));
      return first?root(first):id;
    };
    const tracks=[...new Set(branches.map(t=>root(t.id)))];
    const row=tracks.indexOf(root(node.id));
    return {item:node,x:165+depth*280,y:LAYOUT[node.branch].top+34+row*129,depth};
  });
}
const TECH_POSITIONS=techPositions();
const POSITIONS_BY_ID=new Map(TECH_POSITIONS.map(x=>[x.item.id,x]));
const edges=TECH_POSITIONS.flatMap(to=>to.item.prerequisites.map(from=>({
  from:POSITIONS_BY_ID.get(from)!,to,source:from})));
const displayText=(id:TechnologyId)=>TECHNOLOGIES.find(t=>t.id===id)?.label??id;
export default function ResearchLab({cash,researchPoints,unlocked,devMode,onToggleDevMode,onResearch,
  initialBranch='All',initialSelectedId='production-line'}:{
  cash:number;researchPoints:number;unlocked:readonly TechnologyId[];devMode:boolean;
  onToggleDevMode:()=>void;onResearch:(id:TechnologyId)=>void;
  initialBranch?:'All'|Branch;initialSelectedId?:TechnologyId;
}){
  const [selectedId,setSelectedId]=useState<TechnologyId>(initialSelectedId);
  const [focusBranch,setFocusBranch]=useState<'All'|Branch>(initialBranch);
  const [zoom,setZoom]=useState(1);
  const selected=TECHNOLOGIES.find(t=>t.id===selectedId)??TECHNOLOGIES[0];
  const missing=selected.prerequisites.filter(id=>!unlocked.includes(id));
  const permanentlyUnlocked=unlocked.includes(selected.id);
  const available=hasTechnology(selected.id,unlocked,devMode);
  const researchable=canResearch(selected.id,unlocked,cash,researchPoints)&&!devMode;
  const readyPrerequisites=missing.length===0;
  const moneyReady=cash>=selected.researchUsd;
  const pointsReady=researchPoints>=researchPointsCost(selected.researchUsd);
  const unlockedCount=TECHNOLOGIES.filter(t=>hasTechnology(t.id,unlocked,devMode)).length;
  function chooseNode(id:TechnologyId){
    setSelectedId(id);setFocusBranch('All');
  }
  return <section className="research-lab" aria-label="Agency research and progression">
    <div className="panel research-intro">
      <div><div className="eyebrow">INTERACTIVE RESEARCH ATLAS / CASH + RESEARCH POINTS</div>
        <h2>Build your technology pathways.</h2>
        <p>Follow the connected branches, select a technology, inspect its
          dependencies and invest actual dollars AND RP. The new <b>Launch</b> branch
          unlocks research needed for later Canadian rocket generations,
          while spacecraft branches unlock genuine hardware in Engineering Lab.</p>
      </div>
      <div className="research-intro-side">
        <span>AGENCY CAPITAL</span><strong>{formatMillions(cash)}</strong>
        <span>RESEARCH POINTS</span><strong>{researchPoints} RP</strong>
        <span>TECHNOLOGIES AVAILABLE</span><strong>{unlockedCount} / {TECHNOLOGIES.length}</strong>
      </div>
    </div>
    <div className="panel research-dev-banner">
      <div><div className="eyebrow">DEVELOPMENT / PRESENTATION CONTROLS</div><h3>Developer / Demo Mode</h3>
        <p>Preview all technology, including launched hardware and Canadian R&D.
          It does not pay for rocket-generation infrastructure or mark research as permanently bought.</p></div>
      <button type="button" className={'dev-toggle '+(devMode?'enabled':'')}
        aria-pressed={devMode} onClick={onToggleDevMode}>
        {devMode?'DEV MODE: ON':'DEV MODE: OFF'}</button>
    </div>
    <div className="research-tabs" role="tablist" aria-label="Technology research branches">
      {(['All',...BRANCHES] as const).map(branch=><button type="button"
        role="tab" aria-selected={focusBranch===branch} key={branch}
        onClick={()=>setFocusBranch(branch)}>{branch}</button>)}
    </div>
    <div className="tech-atlas-layout">
      <div className="panel tech-atlas-panel">
        <div className="tech-atlas-toolbar">
          <div><div className="eyebrow">DEPENDENCY NETWORK / SEVEN INVESTMENT BRANCHES</div>
            <h3>Technology development map</h3>
            <p>Click any node to open its research requirements.
              Solid routes are unlocked; brighter routes lead to the selected technology.
              Scroll to explore the map.</p>
          </div>
          <div className="tech-zoom-controls">
            <button type="button" aria-label="Zoom technology map out"
              disabled={zoom<=.65} onClick={()=>setZoom(z=>Math.max(.65,Math.round((z-.15)*100)/100))}>−</button>
            <button type="button" onClick={()=>{setZoom(1);setFocusBranch('All')}}>Fit</button>
            <button type="button" aria-label="Zoom technology map in"
              disabled={zoom>=1.4} onClick={()=>setZoom(z=>Math.min(1.4,Math.round((z+.15)*100)/100))}>+</button>
          </div>
        </div>
        <div className="tech-atlas-key">
          <span><i className="done"/> Researched</span><span><i className="ready"/> Purchasable</span>
          <span><i className="blocked"/> Prerequisite/finances</span>
          <span><i className="active"/> Selected</span>
        </div>
        <div className="tech-map-scroll" role="region" aria-label="Scrollable technology dependency map"
          tabIndex={0}>
          <div className="tech-map-stage" style={{width:GRAPH_W*zoom,height:GRAPH_H*zoom}}>
            <div className="tech-map-canvas" style={{width:GRAPH_W,height:GRAPH_H,
              transform:`scale(${zoom})`,transformOrigin:'top left'}}>
              <svg className="tech-map-links" width={GRAPH_W} height={GRAPH_H}
                viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} aria-hidden="true">
                {BRANCHES.map(b=><g key={b}>
                  <rect x="8" y={LAYOUT[b].top} width={GRAPH_W-20}
                    height={LAYOUT[b].height} rx="12"
                    fill={focusBranch==='All'||focusBranch===b?'#12273b':'#101c2b'}
                    opacity={focusBranch==='All'||focusBranch===b?0.95:0.4}
                    stroke={focusBranch===b?'#e2b17b':'#2d445c'}
                    strokeWidth={focusBranch===b?2:1}/>
                  <text x="28" y={LAYOUT[b].top+21} fill="#e0b889" fontSize="10"
                    fontWeight="800" letterSpacing="1.5">{LAYOUT[b].label}</text>
                </g>)}
                {edges.map(({from,to,source})=>{
                  const fromDone=unlocked.includes(source);
                  const highlighted=selected.id===to.item.id||
                    selected.prerequisites.includes(to.item.id)||
                    selected.id===source;
                  const faded=focusBranch!=='All'&&focusBranch!==to.item.branch;
                  const x1=from.x+CARD_W,y1=from.y+CARD_H/2;
                  const x2=to.x,y2=to.y+CARD_H/2;
                  return <path key={source+'-'+to.item.id}
                    d={`M ${x1} ${y1} C ${x1+45} ${y1}, ${x2-45} ${y2}, ${x2} ${y2}`}
                    fill="none" stroke={highlighted?'#f5cd8c':fromDone?'#6fd3b4':'#4d6780'}
                    strokeWidth={highlighted?3.3:fromDone?2.4:1.8}
                    opacity={faded?0.24:1} strokeDasharray={fromDone?'none':'7 7'}/>;
                })}
              </svg>
              {TECH_POSITIONS.map(({item,x,y})=>{
                const done=unlocked.includes(item.id);
                const canBuy=canResearch(item.id,unlocked,cash,researchPoints);
                const selectedNode=item.id===selected.id;
                const muted=focusBranch!=='All'&&focusBranch!==item.branch;
                return <button type="button" key={item.id}
                  className={'tech-map-node '+(done?'done':devMode?'dev':canBuy?'ready':'blocked')+
                    (selectedNode?' chosen':'')+(muted?' muted':'')}
                  style={{left:x,top:y,width:CARD_W,height:CARD_H}}
                  aria-pressed={selectedNode}
                  aria-label={item.label+' · '+(done?'researched':canBuy?'can invest':'locked')}
                  onClick={()=>setSelectedId(item.id)}>
                  <span className="tech-map-node-head"><span>{item.branch}</span>
                    <b>{done?'✓ DEVELOPED':devMode?'DEV':canBuy?'AVAILABLE':'LOCKED'}</b></span>
                  <strong>{item.label}</strong>
                  <small>{formatMillions(item.researchUsd)} + {researchPointsCost(item.researchUsd)} RP</small>
                </button>;
              })}
            </div>
          </div>
        </div>
      </div>
      <aside className="panel research-node tech-inspector" aria-label="Selected research technology investment details">
        <div className="eyebrow">SELECTED DEVELOPMENT PROJECT / {selected.branch.toUpperCase()}</div>
        <div className="research-node-top"><span className="sys-chip">{selected.branch}</span>
          <span className="research-status">{permanentlyUnlocked?'RESEARCHED':devMode?'DEV UNLOCK':
            researchable?'READY TO INVEST':'LOCKED'}</span></div>
        <h3>{selected.label}</h3>
        <p>{selected.description}</p>
        <div className="research-economics">
          <div><span>R&D INVESTMENT</span><b>{formatMillions(selected.researchUsd)}</b></div>
          <div><span>RESEARCH POINTS</span><b>{researchPointsCost(selected.researchUsd)} RP</b></div>
          <div><span>REFERENCE HARDWARE</span><b>{formatMillions(selected.hardwareCostUsd)}</b></div>
          <div><span>ASSUMED ANNUAL OPEX</span><b>{formatMillions(selected.operationalCostUsdPerYear)}</b></div>
        </div>
        <div className="tech-gates" aria-label="Technology funding and prerequisites">
          <div className={readyPrerequisites?'ready':'missing'}><span>Prerequisite technologies</span>
            <b>{readyPrerequisites?'✓ Met':missing.length+' missing'}</b></div>
          <div className={moneyReady?'ready':'missing'}><span>Capital</span>
            <b>{moneyReady?'✓ Available':formatMillions(selected.researchUsd-cash)+' short'}</b></div>
          <div className={pointsReady?'ready':'missing'}><span>Research Points</span>
            <b>{pointsReady?'✓ Available':researchPointsCost(selected.researchUsd)-researchPoints+' RP short'}</b></div>
        </div>
        {selected.prerequisites.length>0&&<div className="tech-preconditions">
          <div className="eyebrow">REQUIRED RESEARCH / SELECT TO VIEW</div>
          {selected.prerequisites.map(id=><button type="button" key={id}
            onClick={()=>chooseNode(id)}>{unlocked.includes(id)?'✓':'○'} {displayText(id)} ↗</button>)}
        </div>}
        <div className="research-risk"><b>Game maturity: {selected.gameMaturity}</b>
          <small>Design risks: {selected.riskNote}</small></div>
        <p className="research-unlocks"><strong>Unlocks:</strong> {selected.unlocks}</p>
        {selected.sourceUrl&&<a href={selected.sourceUrl} target="_blank" rel="noreferrer">Technical reference ↗</a>}
        <button className="secondary-button tech-invest" type="button"
          disabled={!researchable||permanentlyUnlocked}
          onClick={()=>onResearch(selected.id)}>
          {permanentlyUnlocked?'Already researched':devMode?'Available for demo':
            !available&&!readyPrerequisites?'Complete connected prerequisite nodes':
            !researchable?'Prerequisite / cash / RP required':
            'Invest '+formatMillions(selected.researchUsd)+' + '+researchPointsCost(selected.researchUsd)+' RP →'}
        </button>
      </aside>
    </div>
    <div className="panel research-missions">
      <div className="eyebrow">CAMPAIGN EVOLUTION / PLANNED STORY ARC</div>
      <h2>From Earth orbit to Jupiter</h2>
      <p>The lunar, asteroid, Mars and Jupiter missions unlock in sequence
        after Earth Observation One. The interactive R&D map controls the
        installed parts and Canadian launcher capabilities needed to complete
        progressively difficult missions.</p>
      <div className="research-mission-grid">{FUTURE_MISSIONS.map((mission,i)=>
        <div className={'research-mission-card '+mission.className} key={mission.name}>
          <div><b>{String(i+1).padStart(2,'0')} / {mission.region}</b><span>{mission.phase}</span></div>
          <h3>{mission.name}</h3><p>{mission.goal}</p><small>{mission.tech}</small>
        </div>)}</div>
    </div>
    <p className="research-legal">Research and hardware prices, conceptual maturity,
      risk assessments and Canadian rocket-generation technology gates are gameplay
      assumptions; none represent certified NASA TRLs or manufacturer quotations.</p>
  </section>;
}
