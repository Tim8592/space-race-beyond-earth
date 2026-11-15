import {AGENCY_MILESTONES} from './lib/realWorldMissions';
import {NASA_CUBESAT_REFERENCE} from './lib/campaignMissions';
const nasaData=[
  {
    name:'NASA CubeSat 101 · CubeSat Launch Initiative (2017)',
    tag:'CHALLENGE-RESOURCE DATA / ACTIVE CALCULATION',
    url:'https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf',
    use:'Section 1.1 supplies 1U dimensions (10 × 10 × 11 cm), an approximate 1U mass range (1–1.33 kg) and 3U dimensions (10 × 10 × 34 cm). The CubeSat dispenser selector uses those values directly in contract feasibility and mission wet-mass calculation. The model extrapolates 3U payload mass from the 1U upper reference; simulated dispenser hardware and prices are NOT NASA specifications.'
  },
  {
    name:'NASA/JPL Approximate Positions of the Planets (1800–2050)',
    tag:'NASA/JPL NUMERICAL ORBITAL DATA / ACTIVE CALCULATION',
    url:'https://ssd.jpl.nasa.gov/planets/approx_pos.html',
    use:'Published approximate J2000 orbital elements and their rates drive actual planetary positions in src/lib/orbitalMechanics.ts. Used to visualize approximate trajectories and compute planetary alignment indicators. Not Horizons precision or an optimized launch-window solver.'
  },
  {
    name:'NASA/JPL Solar System Dynamics · Astrodynamic Parameters',
    tag:'NASA/JPL PHYSICAL CONSTANTS / ACTIVE CALCULATION',
    url:'https://ssd.jpl.nasa.gov/astro_par.html',
    use:'Gravitational parameters used in speed, period, orbital energy and transfer equations throughout the orbital model.'
  },
  {
    name:'NASA Planetary Fact Sheet · GSFC/NSSDC',
    tag:'NASA PHYSICAL CONSTANTS / ACTIVE CALCULATION',
    url:'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
    use:'Earth and planet reference sizes and parameters used in mission and orbit engineering. Figures are documented in the engineering source files.'
  },
  {
    name:'NASA General Mission Analysis Tool (GMAT)',
    tag:'CHALLENGE-LISTED RESEARCH / NOT RUN AS A SOLVER',
    url:'https://software.nasa.gov/software/GSC-17177-1',
    use:'Challenge resource describing realistic mission-analysis practices. The game currently computes browser-based two-body orbits and can optionally call Orekit. It does not claim to run GMAT.'
  }
] as const;
export default function References(){
  return <section className="references-view" aria-label="NASA data and attribution">
    <div className="panel references-intro">
      <div className="eyebrow">TRACEABILITY / NASA SPACE APPS 2026</div>
      <h2>Sources, datasets & engineering provenance</h2>
      <p>Source-to-feature traceability shows which published NASA information is used as
        actual model data and what is only inspiration. This independent educational game
        is not NASA-endorsed. All hardware pricing, mission deadlines, risk and game
        budgets are illustrative assumptions unless explicitly marked otherwise.</p>
      <div className="references-data-highlight">
        <strong>NASA challenge resource directly used: CubeSat 101</strong>
        <span>1U {NASA_CUBESAT_REFERENCE[1].label}; {NASA_CUBESAT_REFERENCE[1].referenceMaxMassKg} kg upper reference mass.
          3U {NASA_CUBESAT_REFERENCE[3].label}. Rideshare payload and dispenser
          selection affect launched mass, power, cost and special contract readiness.</span>
      </div>
      <p>Space Apps guidance requires a meaningful use of a NASA resource from the
        specific challenge's Resources tab for Global Awards. NASA CubeSat 101 appears
        there; final eligibility is determined by the organizers, not this game.</p>
    </div>
    <div className="references-section">
      <h3>NASA datasets & engineering resources</h3>
      <div className="references-grid">{nasaData.map(source=>
        <article className="panel references-card" key={source.url}>
          <div className="eyebrow">{source.tag}</div>
          <h4>{source.name}</h4>
          <p>{source.use}</p>
          <a href={source.url} target="_blank" rel="noreferrer">View source ↗</a>
        </article>
      )}</div>
    </div>
    <div className="references-section">
      <h3>Real NASA future mission milestones used in the campaign</h3>
      <p>The events are from NASA, but each player contract is fictional and its
        payload requirements, budget, launch schedule and trajectory are game assumptions.
        Mission schedules may change after this source review (November 14, 2026).</p>
      <div className="references-grid">{AGENCY_MILESTONES.map(event=>
        <article className="panel references-card" key={event.id}>
          <div className="eyebrow">NASA MISSION / {event.event.toUpperCase()}</div>
          <h4>{event.realMission}</h4>
          <p>{event.sourceNote}</p>
          <a href={event.sourceUrl} target="_blank" rel="noreferrer">NASA mission details ↗</a>
        </article>
      )}</div>
      <article className="panel references-card">
        <div className="eyebrow">FUTURE MISSION ON ROADMAP / NOT PLAYABLE</div>
        <h4>NASA Dragonfly · Titan rotorcraft</h4>
        <p>NASA currently lists launch no earlier than July 2028 and arrival in late
          2034. It is documented as future content only; the game does not yet
          model Saturn/Titan entry or rotorcraft flight and will not mislabel a
          Jupiter transfer as Dragonfly's real trajectory.</p>
        <a href="https://science.nasa.gov/mission/dragonfly/" target="_blank" rel="noreferrer">NASA Dragonfly mission ↗</a>
      </article>
    </div>
    <div className="panel references-card">
      <h3>Other science libraries, code & credits</h3>
      <p>Advanced transfers use the optional open-source Orekit Java service.
        3D scenes and React/TypeScript user interfaces are game code, not flight
        validation. For the complete asset, software and AI-assistance disclosures,
        consult the project documentation.</p>
      <a href="https://www.orekit.org/" target="_blank" rel="noreferrer">Orekit project ↗</a>
      {' · '}
      <a href="https://github.com/Tim8592/space-race-beyond-earth/blob/main/docs/ATTRIBUTION.md"
        target="_blank" rel="noreferrer">Full project attribution ↗</a>
      {' · '}
      <a href="https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/?tab=resources"
        target="_blank" rel="noreferrer">Challenge resources ↗</a>
    </div>
  </section>;
}
