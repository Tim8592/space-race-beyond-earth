import {AGENCY_MILESTONES} from './lib/realWorldMissions';
import {NASA_CUBESAT_REFERENCE} from './lib/campaignMissions';
import {CSA_DATA_PROGRAMS} from './lib/csaScienceMissions';
const nasaData=[
  {
    name:'NASA CubeSat 101 · CubeSat Launch Initiative (2017)',
    tag:'CHALLENGE-RESOURCE DATA / ACTIVE CALCULATION',
    url:'https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf',
    use:'Section 1.1 supplies 1U dimensions (10 × 10 × 11 cm), an approximate 1U mass range (1–1.33 kg) and 3U dimensions (10 × 10 × 34 cm). The CubeSat dispenser selector uses those values directly in contract feasibility and mission wet-mass calculation. The model extrapolates 3U payload mass from the 1U upper reference; simulated dispenser hardware and prices are NOT NASA specifications.'
  },
  {
    name:'NASA/JPL Near Earth Object Web Service (NeoWs) · close-approach feed',
    tag:'NASA/JPL OBSERVATION-DERIVED DATA / ACTIVE MISSION GENERATION',
    url:'https://api.nasa.gov/',
    use:'The NASA Mission Intelligence tab requests the next seven UTC days of predicted Earth close approaches through /neo/rest/v1/feed. JPL-derived asteroid designations, approach dates, miss distances, Earth-relative speeds and estimated diameter ranges become selectable Asteroid Watch targets. These are predictions calculated from astronomical observations—not live satellite imagery or evidence that a spacecraft can image the target.'
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
    name:'NASA mission-viz · public web-based orbital visualizations',
    tag:'OFFICIAL NASA GITHUB / ORBIT REFERENCE, NOT RUNTIME DEPENDENCY',
    url:'https://github.com/nasa/mission-viz',
    use:'NASA repository demonstrates web orreries, elliptical-orbit trajectories and Earth–Moon visualizations. Our Flight Directorate uses separately implemented Kepler/orbit propagation and optional Orekit instead of embedding its examples verbatim.'
  },
  {
    name:'NASA/JSC JEOD · Engineering Orbital Dynamics',
    tag:'OFFICIAL NASA GITHUB / HIGH-FIDELITY RESEARCH, NOT EMBEDDED',
    url:'https://github.com/nasa/jeod',
    use:'NASA orbital dynamics libraries coupled to Trick. Useful for evaluating what a future high-fidelity n-body or spacecraft attitude simulation could require. NOT installed or run in the game.'
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
      <h3>From NASA asteroid observations to spacecraft feasibility</h3>
      <p>The <strong>Real asteroid approaches</strong> panel in NASA Mission Intelligence connects
        a NASA/JPL close-approach catalogue to the same spacecraft engineering review used
        elsewhere in the campaign. It is a preliminary <em>mission-design feasibility
        screen</em>, not a verified prediction that a satellite can detect an asteroid.</p>
      <div className="references-grid">
        <article className="panel references-card">
          <div className="eyebrow">01 / NASA DATA → MISSION TARGET</div>
          <h4>Identify a real observation opportunity</h4>
          <p>The game loads NeoWs close-approach candidates for the next seven real UTC
            days, sorts them by approach date and distance, and shows the asteroid name,
            predicted date, nominal Earth miss distance, relative speed and estimated size.
            These predictions are derived from Earth-based measurements and fitted
            orbits; they are not a live telescope feed.</p>
          <p>Selecting an asteroid creates a fictional <strong>Asteroid Watch</strong>
            Earth-orbit observation contract linked to that named object.</p>
        </article>
        <article className="panel references-card">
          <div className="eyebrow">02 / NASA FIELDS → GAME DESIGN REQUIREMENTS</div>
          <h4>Translate observations into design trade-offs</h4>
          <p>The code uses estimated asteroid diameter to scale the fictional minimum
            science payload mass, reported approach speed to scale minimum electrical
            power, and reported miss distance plus size to adjust the contract payout.
            The contract also requires high-gain communications and gives the player
            an eight-game-day launch window starting when it is selected.</p>
          <p>Those engineering thresholds, launch deadline and reward are <strong>game
            assumptions</strong>, not NASA-computed requirements or a real observing
            schedule tied to the predicted approach date.</p>
        </article>
        <article className="panel references-card">
          <div className="eyebrow">03 / SPACECRAFT BUILDER → FEASIBILITY REVIEW</div>
          <h4>Can the proposed satellite mission launch?</h4>
          <p>The existing mission review compares the designed spacecraft against
            the generated contract: launcher capacity and assembly, available versus
            required Δv for a modeled Earth orbit, installed science mass, power
            generation, battery reserve, thermal rejection, high-gain link, budget,
            flight-time envelope and open launch deadline. Failed checks identify
            changes the player needs to make before dispatch.</p>
          <p><strong>Important limit:</strong> Passing these checks does not establish
            optical observability. The game does not yet solve the asteroid's
            ephemeris relative to the satellite or evaluate telescope sensitivity,
            sky brightness, line of sight, illumination or pointing. No actual
            asteroid intercept, rendezvous or confirmed detection is simulated.</p>
        </article>
      </div>
      <p>Traceability: <code>src/lib/nasaMissionClient.ts</code> fetches the feed;
        <code>src/lib/nasaMissionIntelligence.ts</code> parses it and creates a
        scenario; <code>src/App.tsx</code> passes the selected contract into the
        campaign; <code>src/lib/campaignMissions.ts</code> performs the engineering
        readiness checks. Read more from <a href="https://cneos.jpl.nasa.gov/about/cneos.html"
          target="_blank" rel="noreferrer">JPL CNEOS ↗</a> and
        <a href="https://api.nasa.gov/" target="_blank" rel="noreferrer">NASA Open APIs ↗</a>.</p>
    </div>
    <div className="references-section">
      <h3>Canadian Space Agency open GitHub data & source-inspired hardware</h3>
      <p>Each repository provides access instructions and processing examples for a
        genuine Canadian scientific dataset. The game includes separately modeled
        optical/auroral/SAR instrument classes and playable fictional observation
        missions, but does not download original science imagery or present actual
        flight hardware specifications.</p>
      <div className="references-grid">{CSA_DATA_PROGRAMS.map(source=>
        <article className="panel references-card" key={source.id}>
          <div className="eyebrow">CSA / {source.realProgram.toUpperCase()} · {source.datasetFormat}</div>
          <h4>{source.mission.title}</h4>
          <p>{source.datasetDescription}</p>
          <p>{source.dataAccess}</p>
          <p>Modeled gameplay: requires {source.mission.acceptedInstruments.join(', ')},
            {source.mission.minElectricW} W of generation and an actually funded
            launch. Instrument masses, power and mission rewards are fictional.</p>
          <a href={source.sourceUrl} target="_blank" rel="noreferrer">Official CSA GitHub repository ↗</a>
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
