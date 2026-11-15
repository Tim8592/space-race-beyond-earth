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

function TechCard({item,unlocked,devMode,cash,researchPoints,onResearch}:{
  item:TechnologyNode;unlocked:readonly TechnologyId[];devMode:boolean;
  cash:number;researchPoints:number;onResearch:(id:TechnologyId)=>void;
}){
  const permanentlyUnlocked=unlocked.includes(item.id);
  const available=hasTechnology(item.id,unlocked,devMode);
  const researchable=canResearch(item.id,unlocked,cash,researchPoints)&&!devMode;
  const missing=item.prerequisites.filter(id=>!unlocked.includes(id));
  const maturity=item.gameMaturity;
  return <article className={'research-node '+(available?'researched':'locked')}>
    <div className="research-node-top"><span className="sys-chip">{item.branch}</span>
      <span className="research-status">{permanentlyUnlocked?'RESEARCHED':devMode?'DEV UNLOCK':'LOCKED'}</span></div>
    <h3>{item.label}</h3>
    <p>{item.description}</p>
    <div className="research-economics">
      <div><span>R&D INVESTMENT</span><b>{formatMillions(item.researchUsd)}</b></div>
      <div><span>RESEARCH POINTS</span><b>{researchPointsCost(item.researchUsd)} RP</b></div>
      <div><span>REFERENCE HARDWARE</span><b>{formatMillions(item.hardwareCostUsd)}</b></div>
      <div><span>ASSUMED ANNUAL OPEX</span><b>{formatMillions(item.operationalCostUsdPerYear)}</b></div>
    </div>
    <div className="research-risk"><b>Game maturity: {maturity}</b><small>Design risk: {item.riskNote}</small></div>
    <p className="research-unlocks"><strong>Unlocks:</strong> {item.unlocks}</p>
    {missing.length>0&&!devMode&&
      <p className="research-prereq">Requires {missing.map(id=>TECHNOLOGIES.find(t=>t.id===id)?.label??id).join(' + ')}</p>}
    {item.sourceUrl&&<a href={item.sourceUrl} target="_blank" rel="noreferrer">Technical reference ↗</a>}
    <button className="secondary-button" type="button" disabled={!researchable||permanentlyUnlocked}
      onClick={()=>onResearch(item.id)}>
      {permanentlyUnlocked?'Already researched':devMode?'Available for demo':
      !researchable?'Prerequisite / cash / RP required':'Invest '+formatMillions(item.researchUsd)+' + '+researchPointsCost(item.researchUsd)+' RP →'}
    </button>
  </article>;
}

export default function ResearchLab({cash,researchPoints,unlocked,devMode,onToggleDevMode,onResearch}:{
  cash:number;researchPoints:number;unlocked:readonly TechnologyId[];devMode:boolean;
  onToggleDevMode:()=>void;onResearch:(id:TechnologyId)=>void;
}){
  const [branch,setBranch]=useState<'All'|TechnologyNode['branch']>('All');
  const visible=branch==='All'?TECHNOLOGIES:TECHNOLOGIES.filter(t=>t.branch===branch);
  const displayedUnlocked=TECHNOLOGIES.filter(t=>hasTechnology(t.id,unlocked,devMode)).length;
  return <section className="research-lab" aria-label="Agency research and progression">
    <div className="panel research-intro">
      <div><div className="eyebrow">TECHNOLOGY DIRECTORATE / ECONOMIC STRATEGY</div>
        <h2>Research the next frontier.</h2>
        <p>Invest contract proceeds into new spacecraft architectures. Compare development cost,
          conceptual hardware procurement, operating burden and engineering maturity before choosing a path. Each technology requires BOTH cash and research points; RP comes from missions and the ongoing laboratory program.</p>
      </div>
      <div className="research-intro-side">
        <span>AGENCY CAPITAL</span><strong>{formatMillions(cash)}</strong>
        <span>RESEARCH POINTS</span><strong>{researchPoints} RP</strong>
        <span>TECHNOLOGIES AVAILABLE</span><strong>{displayedUnlocked} / {TECHNOLOGIES.length}</strong>
      </div>
    </div>
    <div className="panel research-dev-banner">
      <div><div className="eyebrow">PRESENTATION CONTROLS</div><h3>Developer / Demo Mode</h3>
        <p>Temporarily unlock every cataloged research technology for tomorrow’s demonstration.
          No R&D money is spent. Turn it off to restore your actual progression.
          <strong> It also opens all implemented campaign milestones for inspection; it does not bypass their physics checks.</strong></p></div>
      <button type="button" className={'dev-toggle '+(devMode?'enabled':'')} aria-pressed={devMode}
        onClick={onToggleDevMode}>{devMode?'DEV MODE: ON':'DEV MODE: OFF'}</button>
    </div>
    <div className="research-tabs" role="tablist" aria-label="Technology research branches">
      {(['All','Propulsion','Power','Thermal','Science','Economics'] as const).map(b=>
        <button type="button" role="tab" aria-selected={branch===b} key={b}
          onClick={()=>setBranch(b)}>{b}</button>)}
    </div>
    <div className="research-node-grid">
      {visible.map(item=><TechCard key={item.id} item={item} unlocked={unlocked}
        devMode={devMode} cash={cash} onResearch={onResearch}/>)}
    </div>
    <div className="panel research-missions">
      <div className="eyebrow">CAMPAIGN EVOLUTION / PLANNED STORY ARC</div>
      <h2>From Earth orbit to Jupiter</h2>
      <p>The lunar, asteroid, Mars and Jupiter-flyby contracts are now playable,
        and unlock in sequence after Earth Observation One. Special time-limited
        high-apogee contracts rotate with the game calendar. These simplified
        mission models use first-order trajectory and spacecraft feasibility checks;
        finite-thrust mission navigation and detailed mission operations remain future work.</p>
      <div className="research-mission-grid">{FUTURE_MISSIONS.map((mission,i)=>
        <div className={'research-mission-card '+mission.className} key={mission.name}>
          <div><b>{String(i+1).padStart(2,'0')} / {mission.region}</b><span>{mission.phase}</span></div>
          <h3>{mission.name}</h3><p>{mission.goal}</p><small>{mission.tech}</small>
        </div>)}</div>
    </div>
    <p className="research-legal">Economic amounts, game maturity categories and design-risk summaries are invented
      campaign planning assumptions, not NASA technology-specific TRL certification, supplier prices, mission insurance
      rates, or actual probabilities of failure. See <a href="https://www.nasa.gov/directorates/somd/space-communications-navigation-program/technology-readiness-levels/" target="_blank" rel="noreferrer">NASA's official TRL definitions</a>.</p>
  </section>;
}
