import type {NASAMissionSnapshot,NearEarthApproach,WeatherOperationalBrief}
  from './lib/nasaMissionIntelligence';
import {nasaIntelCacheIsFresh,makeNeoObservationOffer} from './lib/nasaMissionIntelligence';
import {CSA_DATA_PROGRAMS} from './lib/csaScienceMissions';
type Props={
 snapshot:NASAMissionSnapshot|null;loading:boolean;error:string|null;
 gameDate:string;gameDay:number;brief:WeatherOperationalBrief;
 selectedNeoId:string|null;onRefresh:()=>void;
 onSelectNeo:(neo:NearEarthApproach)=>void;
  onSelectCSAMission:(missionId:string)=>void;
};
const fmt=(n:number,decimals=0)=>n.toLocaleString('en-US',{maximumFractionDigits:decimals});
const dateTime=(s:string)=>{
 const d=new Date(s);return Number.isFinite(d.getTime())?
   d.toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'})+' UTC':s;
};
export default function NASAMissionIntelligence({
 snapshot,loading,error,gameDate,gameDay,brief,selectedNeoId,onRefresh,onSelectNeo,
  onSelectCSAMission,
}:Props){
 const fresh=nasaIntelCacheIsFresh(snapshot);
 const weather=snapshot?.weather.slice(0,12)??[];
 const asteroids=snapshot?.approaches.slice(0,10)??[];
 return <section className="nasa-intel-page" aria-label="NASA real data and mission intelligence">
   <div className="panel nasa-intel-intro">
     <div className="eyebrow">NASA API / LIVE REFERENCE DATA, GAME MISSION SCENARIOS</div>
     <h2>NASA Mission Intelligence</h2>
     <p>Space-weather observations alter short-term <strong>mission reserve planning</strong>
       when the real event dates overlap your in-game calendar. Real close-approach data
       can generate separately priced <strong>Earth-orbit asteroid observation</strong> contracts.
       Offline data never blocks your game. No NASA mission, forecast, supplier contract
       or asteroid interception is implied.</p>
     <div className="nasa-intel-connection">
       <span className={'nasa-intel-state '+(!snapshot?'offline':fresh&&!snapshot.partial?'synced':'cached')}>
         {!snapshot?'● NOT SYNCED':fresh&&!snapshot.partial?'● NASA DATA SYNCED':'● CACHED / PARTIAL NASA DATA'}
       </span>
       <div>{snapshot?'Retrieved '+dateTime(snapshot.fetchedAt)+' · '+(snapshot.partial?'some feeds unavailable':'3 DONKI + NeoWs'):
         'NASA sources not retrieved yet'}</div>
       <button className="secondary-button" type="button" onClick={onRefresh} disabled={loading}>
         {loading?'Contacting NASA…':snapshot?'Refresh NASA data ↻':'Load NASA mission data ↗'}</button>
     </div>
     {error&&<p className="nasa-intel-error" role="alert">{error}</p>}
     {snapshot?.warnings?.map((w,i)=><p key={i} className="nasa-intel-warning">{w}</p>)}
     <p className="rocket-fleet-disclaimer">A key is optional. Local development uses the public
       DEMO_KEY unless you configure NASA_API_KEY inside an ignored .env.local file.
       Registered keys are used by the local development proxy and never sent to your
       browser. DEMO_KEY is rate limited; reusing cached NASA data avoids repeat calls.</p>
   </div>
   <div className="nasa-intel-summary">
     <div className="panel">
       <small>SPACE WEATHER · DONKI</small><strong>{snapshot?snapshot.weather.length:'—'}</strong>
       <span>Observed solar flare, geomagnetic and particle records · last 7 real days</span>
     </div>
     <div className="panel">
       <small>NEAR-EARTH APPROACHES · NEOWS</small><strong>{snapshot?snapshot.approaches.length:'—'}</strong>
       <span>Upcoming 7 real days · named asteroid tracking opportunities</span>
     </div>
     <div className="panel">
       <small>ACTIVE MISSION CONTINGENCY</small>
       <strong>{brief.reserveHours>0?'+'+brief.reserveHours+' h': '0 h'}</strong>
       <span>Extra modeled battery reserve during matching real/game dates</span>
     </div>
   </div>
   <div className="nasa-intel-columns">
     <div className="panel nasa-intel-forecast">
       <div className="eyebrow">DONKI / SPACE-WEATHER EVENT RECORDS</div>
       <h3>Solar and geomagnetic observations</h3>
       <p>Based on the latest NASA DONKI flare (FLR), geomagnetic storm (GST) and
         solar energetic particle (SEP) records. Severe events may increase
         power-backup requirements for near-Earth/lunar operations—not by a
         scientifically predicted number of hours, but by an explicit game assumption.</p>
       <div className="nasa-intel-operational-note">
         <strong>{brief.risk==='high'?'HEIGHTENED OPERATIONS REVIEW':
           brief.risk==='elevated'?'ELEVATED OPERATIONS REVIEW':'BASELINE OPERATIONS'}</strong>
         <span>{brief.message}</span>
         <small>Game date: {gameDate} (day {gameDay}). Evidence must be
           within 3 actual days of this date. NASA DONKI is experimental research
           data; <a href="https://www.spaceweather.gov/" target="_blank"
             rel="noreferrer">NOAA SWPC is the official forecast source</a>.</small>
       </div>
       {!snapshot&&!loading&&<p className="nasa-intel-placeholder">No NASA data loaded. Click
         “Load NASA mission data” above to populate this briefing.</p>}
       {snapshot&&weather.length===0&&<p className="nasa-intel-placeholder">No matching
         DONKI events were returned. This does not establish quiet conditions.</p>}
       <div className="nasa-intel-event-list">
         {weather.map(w=><article key={w.kind+'-'+w.id}
           className={'nasa-intel-event '+w.level}>
           <div><span className="eyebrow">{w.kind==='FLR'?'SOLAR FLARE':
             w.kind==='GST'?'GEOMAGNETIC STORM':'ENERGETIC PARTICLES'}</span>
             <b>{w.reading}</b></div>
           <time dateTime={w.observedAt}>{dateTime(w.observedAt)}</time>
           <p>{w.summary}</p>
           <a href={w.sourceUrl} target="_blank" rel="noreferrer">NASA record ↗</a>
         </article>)}
       </div>
     </div>
     <div className="panel nasa-intel-neos">
       <div className="eyebrow">NASA JPL / NEAR-EARTH OBJECT WEB SERVICE</div>
       <h3>Real asteroid approaches</h3>
       <p>Select a near-Earth asteroid to create a <strong>fictional short-deadline
         optical tracking contract</strong> in the progressive campaign.
         The science target name, close-approach date, miss distance and estimated
         size come from NASA. The mission is an <em>Earth-orbit observer</em>;
         an actual rendezvous trajectory has NOT been solved.</p>
       {!snapshot&&!loading&&<p className="nasa-intel-placeholder">Sync NASA data
         to view the next week's JPL-reported approach candidates.</p>}
       {snapshot&&asteroids.length===0&&<p className="nasa-intel-placeholder">The
         NeoWs feed returned no objects for this period, or was unavailable.</p>}
       <div className="nasa-intel-asteroids">
         {asteroids.map(neo=><article key={neo.id} className={'nasa-asteroid '+(selectedNeoId===neo.id?'selected':'')}>
           <div><strong>{neo.name}</strong>
             <small>Closest Earth approach: {neo.date}</small></div>
           <div className="nasa-asteroid-metrics">
             <span>MISS DISTANCE <b>{fmt(neo.missDistanceKm)} km</b></span>
             <span>SIZE EST. <b>{fmt(neo.diameterM)} m</b></span>
             <span>RELATIVE SPEED <b>{fmt(neo.velocityKmS,1)} km/s</b></span>
           </div>
           <div className="nasa-asteroid-scenario">
             <small>FICTIONAL OBSERVATION CONTRACT (NASA-SCALED)</small>
             <strong>Reward ${fmt(makeNeoObservationOffer(neo,gameDay).mission.payoutUsd/1e6)}M</strong>
             <span>Required science payload {makeNeoObservationOffer(neo,gameDay).mission.requiredScienceKg} kg ·
               minimum electrical power {makeNeoObservationOffer(neo,gameDay).mission.minElectricW} W</span>
           </div>
           {neo.potentiallyHazardous&&<small className="nasa-hazard-note">NASA potentially hazardous classification is an orbital-screening category, NOT an imminent impact alert.</small>}
           <div className="nasa-asteroid-actions">
             <a href={neo.sourceUrl} target="_blank" rel="noreferrer">JPL record ↗</a>
             <button type="button" className="secondary-button"
               onClick={()=>onSelectNeo(neo)}>
               {selectedNeoId===neo.id?'✓ Selected · open contract again':
                 'Create asteroid-watch contract ↗'}</button>
           </div>
         </article>)}
       </div>
     </div>
   </div>
   <div className="panel csa-data-programs" aria-label="Canadian Space Agency GitHub mission and science dataset opportunities">
      <div className="eyebrow">CANADIAN SPACE AGENCY / VERIFIED PUBLIC GITHUB SOURCE REPOS</div>
      <h3>Canadian science-data missions</h3>
      <p>Real CSA open-source tutorials demonstrate optical FITS image analysis,
        auroral imaging and synthetic-aperture radar datasets. These official
        repositories now inspire <strong>three optional playable spacecraft missions</strong>
        with distinct physical payload, power, heat and launch requirements.
        The hardware figures and mission rewards are original game estimates;
        imagery is not copied or claimed to be live observations.</p>
      <div className="csa-data-grid">
        {CSA_DATA_PROGRAMS.map(program=><article key={program.id} className="csa-data-card">
          <div className="eyebrow">{program.realProgram.toUpperCase()}</div>
          <h4>{program.mission.title}</h4>
          <p>{program.datasetDescription}</p>
          <div className="csa-data-facts">
            <span>DATA TYPE <b>{program.datasetFormat}</b></span>
            <span>REQUIRED INSTRUMENT <b>{program.mission.acceptedInstruments.join(', ')}</b></span>
            <span>GAME POWER FLOOR <b>{program.mission.minElectricW} W</b></span>
            <span>FICTIONAL REWARD <b>${fmt(program.mission.payoutUsd/1e6)}M</b></span>
          </div>
          <small>{program.dataAccess}</small>
          <div className="csa-data-actions">
            <a href={program.sourceUrl} target="_blank" rel="noreferrer">CSA GitHub tutorial ↗</a>
            <a href={program.technicalDataUrl} target="_blank" rel="noreferrer">Original data service ↗</a>
          </div>
          <button className="launch-button" type="button"
            onClick={()=>onSelectCSAMission(program.mission.id)}>
            Plan this Canadian data-inspired mission ↗
          </button>
        </article>)}
      </div>
    </div>
    <div className="panel nasa-open-source-physics">
      <div className="eyebrow">NASA OFFICIAL GITHUB / SCIENTIFIC SOFTWARE REFERENCES</div>
      <h3>Mission dynamics libraries worth exploring</h3>
      <p><a href="https://github.com/nasa/mission-viz" target="_blank" rel="noreferrer">NASA mission-viz ↗</a> demonstrates mathematical orbital visualizations.
        <a href="https://github.com/NASA/GMAT" target="_blank" rel="noreferrer"> NASA GMAT ↗</a>
        provides a much more comprehensive mission-design and trajectory platform.
        <a href="https://github.com/nasa/jeod" target="_blank" rel="noreferrer"> NASA JEOD ↗</a>
        is a sophisticated dynamics framework built for NASA Trick.
        None is directly running in this browser. The Flight Directorate
        uses the smaller existing Orekit service and explicit two-body physics.</p>
    </div>
    <p className="research-legal">NASA source APIs:
      <a href="https://api.nasa.gov/" target="_blank" rel="noreferrer">NASA Open APIs</a>,
      <a href="https://ccmc.gsfc.nasa.gov/tools/DONKI/" target="_blank" rel="noreferrer"> NASA CCMC DONKI</a>,
      and <a href="https://api.nasa.gov/#browseAPI" target="_blank" rel="noreferrer"> JPL NeoWs</a>.
      NASA data may be delayed, revised or unavailable. Game revenue, 1–2 hour reserve
      additions, contract deadlines, and launch engineering remain modeled gameplay,
      not NASA space-weather forecasts or real procurement offers.</p>
 </section>;
}
