import { useMemo, useState } from 'react';
import Spacecraft3D from './Spacecraft3D';
import HeritageTrajectoryView from './HeritageTrajectoryView';
import { DEFAULT_SUBSYSTEM_DESIGN, sizeSubsystemDesign } from './lib/subsystemDesign';
import { HERITAGE_MISSIONS, type HeritageMission } from './lib/heritageMissions';

function Mass({value,unit='kg'}:{value:number|null;unit?:string}) {
  return <>{value===null?'Not published in selected source':value.toLocaleString('en-US')+' '+unit}</>;
}

export default function MissionLibrary({ onOpenMap }: { onOpenMap:()=>void }) {
  const [selectedId,setSelectedId] = useState<HeritageMission['id']>('dawn');
  const active = HERITAGE_MISSIONS.find(m=>m.id===selectedId) ?? HERITAGE_MISSIONS[0];
  const schematicAnalysis = useMemo(()=>sizeSubsystemDesign(DEFAULT_SUBSYSTEM_DESIGN),[]);

  return <section className="mission-library" aria-label="NASA mission heritage library">
    <div className="panel library-hero">
      <div className="eyebrow">NASA MISSION HERITAGE / REFERENCE LIBRARY</div>
      <h2>Learn from flown missions and unfinished ambitions.</h2>
      <p>Inspect NASA spacecraft engineering, view downloadable 3D assets and retrieve historical spacecraft paths from JPL Horizons when data is available. These are design precedents, <strong>not compulsory propulsion choices</strong>.</p>
    </div>
    <div className="heritage-grid">
      <div className="heritage-left">
        <div className="panel heritage-select">
          <div className="section-label">PRESET MISSION ARCHETYPES <span>SELECT TO INSPECT</span></div>
          {HERITAGE_MISSIONS.map(m=>(
            <button type="button" key={m.id}
              className={'heritage-option '+(m.id===active.id?'selected':'')}
              aria-pressed={m.id===active.id}
              onClick={()=>setSelectedId(m.id)}>
              <div><strong>{m.name}</strong><span>{m.archetype}</span></div>
              <small>{m.missionMode.toUpperCase()}</small>
            </button>
          ))}
        </div>
        <div className="panel heritage-preview">
          <div className="eyebrow">VISUAL REFERENCE · {active.name.toUpperCase()}</div>
          {active.modelLocalUrl ? (
            <Spacecraft3D key={active.id} design={DEFAULT_SUBSYSTEM_DESIGN}
              analysis={schematicAnalysis} referenceModelUrl={active.modelLocalUrl} preferReference/>
          ) : active.imageUrl ? (
            <figure className="heritage-image"><img src={active.imageUrl} alt={'NASA photograph or illustration of '+active.name+' spacecraft'} loading="lazy"/><figcaption>{active.credit}</figcaption></figure>
          ) : (
            <div className="heritage-no-image">
              <div>{active.missionMode==='concept'?'CONCEPT STUDY · NO FLIGHT SPACECRAFT':'NASA 3D reference not verified'}</div>
              <p>{active.missionMode==='concept'
                ? 'Project Prometheus was cancelled before flight. There is no authentic flown spacecraft 3D model or historical spacecraft trajectory. This card is a research reference, not a completed vehicle.'
                : 'NASA references may include images or other downloadable models; a browser-ready GLB has not yet been verified.'}</p>
            </div>
          )}
          <div className="heritage-links">
            {active.modelUrl && <a href={active.modelUrl} target="_blank" rel="noreferrer">Official NASA 3D model and download ↗</a>}
            {active.modelDownloadUrl && <a href={active.modelDownloadUrl} target="_blank" rel="noreferrer">Download original NASA GLB ↗</a>}
            <a href={active.spacecraftUrl} target="_blank" rel="noreferrer">NASA spacecraft details ↗</a>
          </div>
        </div>
        <div className="panel">
          {active.trajectory?<HeritageTrajectoryView key={active.id} mission={active}/>:
            <div className="heritage-concept-note"><div className="eyebrow">RESEARCH, NOT FLIGHT HERITAGE</div>
              <h3>No flight trajectory exists</h3><p>No Project Prometheus/JIMO spacecraft launched. NASA's original reactor-electric propulsion studies are useful for design trades, but they cannot be plotted as historical ephemerides.</p>
            </div>}
        </div>
      </div>
      <aside className="panel heritage-info">
        <div className="eyebrow">HISTORICAL REFERENCE / NOT A PLAYER DESIGN</div>
        <h2>{active.name}</h2>
        <p className="heritage-status">{active.status}</p>
        <p className="heritage-intro">{active.highlights}</p>
        <div className="heritage-specs">
          <div><span>Mission profile</span><strong>{active.archetype}</strong></div>
          <div><span>Destination(s)</span><strong>{active.destinations}</strong></div>
          <div><span>Propulsion / control</span><strong>{active.propulsion}</strong></div>
          <div><span>Electrical energy source</span><strong>{active.primaryPower}</strong></div>
          <div><span>Spacecraft mass at launch</span><strong><Mass value={active.wetMassKg}/></strong></div>
          <div><span>Dry mass (if source provides)</span><strong><Mass value={active.dryMassKg}/></strong></div>
          <div><span>Primary propulsion propellant</span><strong><Mass value={active.propellantKg}/></strong></div>
          <div><span>Electrical output</span><strong>{active.electricOutput}</strong></div>
          <div><span>Science payload / instruments</span><strong>{active.payload}</strong></div>
          <div><span>Spacecraft dimensions</span><strong>{active.dimensions}</strong></div>
        </div>
        <p className="heritage-attr"><strong>Source:</strong> {active.credit}. Published statistics may include different mass accounting boundaries; they must not be compared as identical performance metrics without checking source definitions.</p>
        <a href={active.missionUrl} target="_blank" rel="noreferrer" className="heritage-source">Read NASA mission history ↗</a>
        <button type="button" className="secondary-button" onClick={onOpenMap}>Explore orbital map →</button>
        <p className="heritage-limits">{active.missionMode==='concept'
          ? 'Prometheus is an unfunded historical nuclear-electric architecture study. Reactor shielding, power conversion, multi-MW thermal rejection, launch safety, electrical distribution and mass were not qualified as a flight vehicle. Do not confuse concept parameters with NASA hardware specifications.'
          : 'Historical missions illustrate engineering trade-offs, not exclusive propulsion requirements. Whether your spacecraft can complete a similar mission depends on trajectories, power, mass, margins, communications and instrument requirements.'}</p>
      </aside>
    </div>
  </section>;
}
