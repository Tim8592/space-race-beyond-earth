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
      <h2>Build on what has flown.</h2>
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
              <div>NASA 3D resource available</div>
              <p>A model exists in NASA's library, but a browser-ready GLB URL has not yet been verified. Open the official 3D model page below.</p>
            </div>
          )}
          <div className="heritage-links">
            {active.modelUrl && <a href={active.modelUrl} target="_blank" rel="noreferrer">Official NASA 3D model and download ↗</a>}
            {active.modelDownloadUrl && <a href={active.modelDownloadUrl} target="_blank" rel="noreferrer">Download original NASA GLB ↗</a>}
            <a href={active.spacecraftUrl} target="_blank" rel="noreferrer">NASA spacecraft details ↗</a>
          </div>
        </div>
        <div className="panel">
          <HeritageTrajectoryView key={active.id} mission={active}/>
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
        <p className="heritage-limits">A Dawn-like mission favors extended efficient electric thrust for a multi-object rendezvous, but does not impose an artificial ban on chemical propulsion. A New Horizons-like high-energy flyby used a chemical launch and an RTG. Whether YOUR spacecraft can complete such missions requires a trajectory, power and mass analysis.</p>
      </aside>
    </div>
  </section>;
}
