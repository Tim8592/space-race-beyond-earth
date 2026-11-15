# Space Race: Beyond Earth

> Design spacecraft. Build an economy. Explore the solar system.

**Space Race: Beyond Earth** is a physics-informed, strategy/tycoon-style space exploration game created for the **2026 NASA Space Apps Challenge** (Space Mission Design Game challenge). It blends spacecraft architecture, mission planning, economic decision-making, research investments, and planetary exploration into a single progression loop.

The goal is **not** to reproduce a professional flight dynamics package inside a video game. Instead, it is to make real engineering trade-offs understandable and engaging, while clearly distinguishing sourced physics from simplified mechanics.

**Status:** Hackathon prototype, v1.9. The game has Play Campaign, Engineering Lab, Orbital Map, Mission Library, Learn Physics, and Research tabs. The Spacecraft Builder includes a selectable modular Three.js spacecraft preview (solar panels, radiators, tank, propulsion, antenna) and can import a GLB file exported from Onshape/FreeCAD for visual inspection. The Mission Library includes NASA-sourced Dawn, Psyche, New Horizons, Voyager, and the cancelled Project Prometheus/JIMO concept, reference models/images, statistics, milestone timelines, and on-demand historical JPL Horizons spacecraft paths when ephemerides are available. An **optional local Orekit Java service** now solves and plots impulsive Sun-centered Lambert transfers between approximate planetary positions. The new Earth Observation One mission shares the spacecraft sizing configuration, rocket performance and 3D design to run a seven-day imaging/data-downlink mission. The progressive exploration campaign can now use matching Orekit Lambert results from the Orbital Map; if Java is offline the game shows openly labeled approximate Hohmann or Earth-ellipse energy estimates. Interplanetary transfer solutions are still first-order models; low-thrust electric trajectories, real launch-window optimization, gravity assists and flight qualification are NOT implemented.

## Challenge-aligned game plan and browser reliability tests

The official *Space Mission Design Game* asks for a complete space mission experience spanning concept, spacecraft/instrument choice, launch, operations and evaluation, with meaningful mass, power, communications, data, resource and time trade-offs. Our current tools are capable technical building blocks but still need to be joined into one playable mission.

- [Challenge alignment & complete-mission gameplay blueprint](docs/CHALLENGE_ALIGNMENT_AND_GAMEPLAY.md) — proposed vertical slice, feature priorities and technical cautions
- **Automated browser smoke checks:** `npm run test:browser` (first install Chromium using `npx playwright install chromium`). GitHub Actions runs Chromium on every push to catch tab failures, browser exceptions, campaign persistence and NASA model retry regressions.
- The independent core game must be deployable to an ordinary website without asking judges to install Java. Orekit and JPL historical position services are optional advanced modes.

## New in v1.9 — business branches, realistic orbital income, spacecraft workbooks and Δv launch-window map

**Five organized game branches** replace the crowded flat navigation row:
1. **Campaign:** Play Campaign, Orbital Map.
2. **Engineering:** Engineering Lab, Spacecraft Library, Rocket Fleet.
3. **Infrastructure:** Orbital Networks, Moon Base.
4. **Research:** Research & Roadmap (now includes the seventh **Infrastructure** branch).
5. **Intelligence:** NASA Intel, Mission Library, Sources & Data, Learn Physics.

**Orbital Networks** is a second independent passive-revenue system in the Infrastructure branch. It offers two simulated Canadian orbital service models, each with three successive physically funded stages:
- **Orbital Compute** uses modeled modular compute blades (75 kg, 550 W bus demand, 495 W local dissipated heat and $28 million equipment price per node) and starts with one satellite; later stages add two and five nodes. Its technology inspiration is Galaxia's genuine **Onyx Edge Core + Blades and VSaS** hosted service concepts (https://gx.space/news-press-releases/galaxia-introduces-onyx-edge).
- **Canadian Orbit Network** uses modeled mixed optical/RF relay nodes (60 kg, 410 W, 350 W local waste heat, $24 million module price per node) and progressively adds two, four and eight satellites. This idea draws on Galaxia's OSPREY/Halifax Class work and Kepler's Canadian relay heritage, **not** an assertion that 14 satellites could deliver Starlink-grade global coverage.
- **These figures are fictional game equipment assumptions, never quoted supplier specifications or real revenue projections.** The research tree introduces *Orbital Edge Compute & Hosted Services* and *Canadian Hybrid Communications Relay*. Buy prerequisites with **both cash and RP**, install the corresponding new module in Engineering Lab → Science payload, then provide enough solar/nuclear electrical generation, eclipse backup and real radiator capacity. The module adds its physical mass, energy, thermal load and procurement cost to existing spacecraft subsystem reports.
- An orbital investment purchases an entire batch of satellites, ground service equipment and separately invoiced rocket launches. A rocket must carry each **intact independent satellite**; unlike a single oversized assembled spacecraft, independent constellation satellites require **no invented orbital docking**. Some rocket generations cannot lift even one fully configured node; upgrade the fleet or purchase a higher-capacity service. Deployments have persistent accelerated flight timers and can be minimized, but revenue is **zero until the player commissions the completed orbital deployment**. At commissioning, per-day fictional subscription gross and ongoing fleet ground/operations expenses are added to the existing base Moon and agency economic clock.
- Finance bar distinguishes total **passive income (Moon + LEO)**, operating expenses and net per game day; waiting for opportunities costs money even when not launching.

**Spacecraft Library:** Engineering → Spacecraft Library offers **New blank**, **Save independent snapshot**, **Load a working copy**, **Duplicate** (like Excel Save As/Crop: old model unchanged), **Rename** and **Delete**; each complete `SubsystemDesign` including propulsion, structures, tanks, instruments and orbital service modules is validated and preserved in game save storage. **Actual launched spacecraft** are automatically archived and annotated with their mission names. Duplicates do not share design references; older save versions missing service-module fields migrate to `none`.

**Flight Review / launch-window comparison:** For **Mars and Jupiter** missions, the **Flight engineering review** shows an interactive future departure-date vs. Δv graph with **32 dates sampled 28 game days apart**. The visible line is the required Δv (5% planning margin); the dashed line is the player's **installed spacecraft/booster capability**. Compare today, the lowest sampled future requirement, savings, expected cash burned/earned while waiting, and a selected future date. If the local Java service is running, the new `POST /api/departure-window` computes a fresh **Orekit Lambert transfer at each candidate departure**, holding flight duration fixed, with ideal patched-conic departure burn and simplified Mars arrival capture (Jupiter flyby only). It is not a globally optimized launch window or finite-thrust trajectory. **Without Orekit**, a clearly labeled game Hohmann/phase heuristic plots an approximation; it must not be interpreted as actual feasible date-specific Lambert trajectories. The separate Orbital Map still contains the detailed optimization tool. For Earth ellipses and lunar missions, the review explicitly avoids inventing a date-dependent physically minimized window without a higher-fidelity solver.

## New in v1.8 — NASA/CSA official GitHub source integration and real-flight-geometry Directorate

- **Official sources actually reviewed:** <https://github.com/nasa/mission-viz> (orbital/orrery visualization examples), <https://github.com/NASA/GMAT> (NASA General Mission Analysis Tool), <https://github.com/nasa/jeod> (NASA/JSC Engineering Orbital Dynamics with NASA Trick); and Canadian Space Agency <https://github.com/asc-csa/NEOSSAT_Tutorial>, <https://github.com/asc-csa/CASSIOPE-Tutorial>, <https://github.com/asc-csa/EO-Visualization-and-Search-Tutorial>, <https://github.com/asc-csa/radarsat1-scripts>. Full GMAT/JEOD are NOT embedded into the game; their extensive modeling capabilities make them important future references.
- **Three new optional CSA science campaigns** use *real public science-data provenance* and the existing actual spacecraft engineering + launch game chain. NEOSSAT tutorial's astronomical FITS data teaches asteroid optical analysis, CASSIOPE's Fast Auroral Imager documents auroral science, and CSA's RADARSAT/EODMS data tutorial covers SAR observations. The player must install a specific NEOSSAT-style telescope, auroral imager, or **power-hungry active SAR** payload. Each new instrument has explicitly **invented** example mass, electrical power, thermal and data-load requirements as well as procurement price. A separate "Canadian science-data missions" section in **NASA Intel** links directly to the real archives/tutorials and launches the fictional scenarios. No live FITS/FAI/SAR raster is downloaded; some archives require account/permissions.
- **Flight Directorate now physically propagates orbit geometry, not cosmetic cubic curves:** For elliptical Earth-orbit contracts, it integrates the actual Earth-centered two-body Keplerian orbit (perigee, eccentricity, orbital period, velocity) using selected mission settings; the spacecraft position follows accelerated orbital **time**, not constant polar angle. The first-order lunar transfer is a time-propagated Earth-centered highly eccentric Kepler conic reaching **384,400 km** at apogee in approximately 5 real modeled days, aligned to an **approximate mean circular lunar position** at arrival. Moon insertion, gravitational capture/descent and three-body perturbations are NOT solved.
- **Planetary transfers:** If the optional Orekit Java service is running, Mars and Jupiter still use their physically computed Sun-centered impulsive Lambert conic. Without it, the fallback is a **proper Keplerian Hohmann ellipse**, anchored to JPL's approximate Earth departure position and the target body's published approximate semimajor axis, with calculated transfer time, actual moving JPL-approximate target-position marker and miss-distance indicator. An ideal Hohmann ellipse is NOT a solved rendezvous: it can miss the moving planet and the UI does not artificially attach the craft to it. The "asteroid" remains the explicitly synthetic 1.35 AU survey object, not a real asteroid ephemeris.
- **New Orekit Earth propagation endpoint:** `POST /api/earth-orbit` samples an actual Orekit `KeplerianPropagator` 3D trajectory using the Earth gravitational parameter and supplied Kepler elements. Both circular/elliptical Earth and the Earth-centered translunar injection model can use this endpoint when the local `Start Orekit.command` service is running; without Java, independent browser two-body Kepler propagation is used instead. The Java tests verify orbital closure, the ~92-minute LEO orbit, and a transfer coast to lunar radial distance.
- **Playback remains accelerated ~105 seconds**; the underlying physical-path sample coordinates have correct distance units (km about Earth, AU about Sun), source labels, orbit periods/speeds where applicable, planetary positions advancing with simulated date, zoom and explicit model limitations. Destination and body symbols can be enlarged for visibility; path geometry is in consistent physical units. The mission still requires paying the rocket/spacecraft invoices and completing the same debrief.
- **Important fidelity boundary:** We did not embed NASA GMAT, NASA JEOD, a full SPICE/DE ephemeris, an Orekit lunar three-body propagator, launch ascent, Moon capture, J2/drag or continuous-thrust simulation. The phase-matched circular Moon is an approximate model, **not a solved lunar rendezvous**. Solver outputs are not suitable for flight engineering certification.

## New in v1.7 — actual NASA API data influences game opportunities and mission readiness

- **NASA Mission Intelligence tab:** Pulls real NASA **DONKI FLR** (solar flares), **GST** (geomagnetic events/Kp) and **SEP** (energetic particles) reports from the last seven real days, plus **NASA JPL NeoWs** asteroid close-approach data for the next seven days. The UI provides observed dates, source links, actual NASA classifications, and explicit API/cached/offline state.
- **Space-weather engineering impact:** If the actual NASA event falls within a 72-hour observation window and the accelerated game calendar remains within three real days of today, elevated DONKI events add **one hour**, and high-level events add **two hours**, to the **game-estimated backup-energy requirement** for near-Earth/lunar campaign missions. Engineering Lab and Play Campaign show the same updated pass/fail readiness; extra battery/reserve-module design can address it. **This is a deliberately invented contingency margin, NOT NASA's predicted storm outage duration, radiation dose, event duration or official forecast.** Historical reports must NOT masquerade as forecasts of future campaign dates; if the game runs ahead the extra modifier is turned off.
- **NASA real-NEO mission offers:** Select an asteroid in NASA Intel and create a **time-limited fictional Earth-orbit observation** contract, with NASA-derived object name, close-approach date, estimated size, miss distance and approach velocity. These observations directly scale the game's **fictional required science mass, electrical demand and offered payout**. The generated mission participates in the existing map, mission review, launch invoices, debrief and saved mission state. **It does not intercept, land on or reproduce the orbit of the real asteroid.**
- **Rate limit, security and resilience:** NASA API requests are limited to the new tab and cached in browser storage for **four hours**; four requests (3 DONKI + 1 NeoWs) are sent per refresh. NASA's **DEMO_KEY** permits 30/hour/IP and 50/day/IP, while a registered personal key defaults to 1000/hour. No key is required for a single user local test. For a private developer key, copy `.env.example` to `.env.local`, set `NASA_API_KEY=YOUR_KEY`, and restart Vite. Only the **local Node development server** attaches the key via the `/nasa-api` proxy; it is never compiled into the React app or checked into GitHub. **Static deployments without their own backend** use the public DEMO_KEY and can be rate limited or blocked by cross-origin rules; the game remains usable without the feed.
- NASA's DONKI archives are research/prototyping data; **NOAA Space Weather Prediction Center** is the official US space-weather forecast service. DONKI records and asteroid close approaches may be updated after publication. NASA data does not imply approval of any game mission or financial assumptions.

## New in v1.6 — Canadian preset rocket generations and branching interactive R&D

- Replaced the manual launch-rocket dry mass, fuel and payload capacity editor with an **immutable four-stage Canadian launch program** inspired by the *announced goals* of **Reaction Dynamics Aurora (~220 kg), NordSpace Tundra (1,100 kg), Reaction Dynamics Borealis (6,000 kg) and NordSpace Tempest (10,000 kg)**. Each stage requires a matching **Launch**-branch technology in Research & Roadmap, game-calendar maturation, successful Canadian mission heritage for later generations, and a separate capital investment. These are not operational 2026 Canadian orbital services.
- Falcon 9, Falcon Heavy and future Starship-class launches are alternative international buys with game-example capacities and costs. Buying SpaceX flights provides lift immediately but **does not earn Canadian rocket technology/flight experience**, does not advance Canada's launcher time gates and does not receive Canadian domestic learning-curve discounts. Canadian flights progressively reduce domestic per-launch fees and accelerate maturity of later generations. Rocket invoices in actual mission reviews use these same immutable models; edited old save payload numbers cannot increase real launch capacity.
- Replaced the card-grid research list with a **zoomable, scrollable visual dependency map** across six branches: Launch, Propulsion, Power, Thermal, Science and Economics. Prerequisite links, researched paths, affordability and research-point gates are visible. Clicking a node opens a side inspector with technical risk and hardware economics and funds actual research with cash + RP. The Rocket Fleet development button opens its specific next technology prerequisite in that interactive map.

## New in v1.5 — launch architecture, orbital assembly and Moon cargo logistics

- **Separate spacecraft and launch vehicle**: Engineering Lab configures the spacecraft's thrusters, propellant tanks, instruments, arrays and radiators. New **Rocket Fleet** tab selects immutable Canadian preset rocket generations or external services; previous manually editable rocket inputs are no longer permitted. Campaign review uses the selected preset launch-service capacity and explicitly paid per-launch invoices.
- **Launch contract alternatives**: Falcon 9 game allocation (15,500 kg per LEO service, $74M reference price), illustrative Falcon Heavy, and futuristic Starship-class heavy cargo, alongside the player's custom rocket. SpaceX's **2026 published Falcon 9 $74M standard service price is specifically for a GTO mission**, not a guarantee of that price for every LEO or rideshare manifest. Starship per-launch game price is entirely fabricated: no validated public standard dedicated launch price has been used.
- **Rocket upgrades actually reduce launch invoices**: Fleet generation 1–3 costs money upfront, unlocks larger services and reduces the actual fees paid for each subsequent launch. Completed flights add capped learning-curve reductions. Each quote and capacity feeds mission procurement and available cash, rather than being a cosmetic tech-tree label.
- **Mass-split hardware logistics**: A spacecraft heavier than a rocket's payload capacity needs more than one real launch invoice. A deterministic mass manifest divides the spacecraft (including **wet** transfer stage and all propellant) among rockets, adds 65 kg per orbital joining kit and $7M per joining operation. **Without buying the $34M orbital docking/assembly facility, these missions cannot launch.** 
- **Interactive assembly instead of instant teleportation**: Multi-rocket exploration missions first procure the spacecraft and enter a persistent orbital assembly project. The player launches each manifest batch independently and spends actual money for each flight. Only after the final payload batch has docked can the player fund integration and begin the usual timed deep-space mission. Cancelling forfeits paid hardware/launch costs.
- **Moon Base requires physical cargo delivery**: Before buying stage 1/2/3 buildings, a **separate lunar cargo mission** must procure the required surface modules, fund a chemical transfer/landing spacecraft and **every** rocket needed for the cargo's mass. TLI, lunar orbit insertion and descent use a combined illustrative 5,550 m/s at 345 s Isp in the rocket equation to determine **additional propellant and lander dry mass**. The player sees the itemized cargo list, fuel inventory, manifest, launches, and paid invoices, then spends ~105 seconds in a genuine timed Earth→Moon playback before accepting the surface-delivery receipt. Only after the landing can construction be financed; income starts only after both conditions are met.
- **Persistent logistics UI**: An always-available circular progress badge follows the current exploration flight, active lunar cargo transfer, or partially completed orbital hardware staging. All mission payments, flight counts, landed cargo and assembly state are saved and reloadable. Existing earlier Moon Base upgrades in saved games are grandfathered as already delivered, preserving their purchased status.

**Fidelity:** Physical propellant mass, staging wet mass, rocket equation, allocation and paid invoices are modeled. Rocket launch prices beyond the published Falcon 9 reference, reusable LEO payload allocations, docking hardware, hypothetical Starship pricing, lander dry-mass coefficients, single-stage lunar transfer/descent budget and instantaneous docking checks are **game assumptions**, not launch provider price quotes, actual NASA lander designs, certified orbital construction, verified mission navigation or real launch availability.

## New in v1.4 — live expenses, two-resource research, Moon Base & timed flights

- **Research Points (RP):** Technology research now requires both the published game R&D dollar cost and RP. RP starts at **10**, increases gradually by **1 per eight in-game days** of operating the research laboratory, and is rewarded on missions. Every technology has a visible required RP amount (at least 2; larger R&D projects cost more). RP is deducted when the node is researched, persisted in saved progress, and checked atomically alongside cash and prerequisites. Dev Mode still previews all implemented research without purchasing.
- **A program that spends money:** Base facilities/engineers/tracking/lab operations cost **$0.95 million per game day**, with additional research-node annual OPEX, lunar operating costs and flight operations; the model settles continuously as days pass and whenever a mission advances the calendar. The finance strip persists across all tabs: capital, RP, daily costs, lunar income and daily net. Negative cash prevents investments and mission purchases. These rates are all invented game-balance values.
- **Moon Base investment and close-up:** New **Moon Base** tab shows stylized zoomable lunar polar terrain and three proposed infrastructure stages. Lunar Relay Pathfinder unlocks purchasing (Dev Mode allows a demo preview/purchase). Each stage costs substantial capital and produces **gross income EVERY game day** as well as daily lunar operating expense. Revenue is not passive profit without upkeep; the new agency financial ledger credits and debits both. Income continues as calendar time progresses even when looking at other tabs.
- **Timed mission playback:** Progressive missions launch into a **105-second** real-time playback rather than completing immediately. A scene specific to Earth elliptical/lunar, asteroid, Mars, or Jupiter destination displays a moving craft, completion percentage and remaining time. Leaving the viewer (or navigating to other tabs) keeps the flight running; a fixed circular progress ring/ETA opens the viewer again. Completion/debrief rewards cannot be claimed before playback ends, and double claims remain blocked.
- **Optional Orekit animation:** If a suitable previous Orekit Lambert trajectory exists, its sampled conic is used in the Mars/Jupiter flight viewer. Otherwise the viewer checks the running local Orekit service and can request a date-specific Sun-centred Lambert path. If unavailable or on an Earth ellipse, Moon or synthetic asteroid, the viewer uses a clearly labelled simplified animation (including **“Orekit elliptical viewer not available”** where applicable). These are accelerated visualizations, not real-time spacecraft ephemerides.
- **Spoiler-free exploration map:** Locked story and future mission names remain listed, while their destination, route highlights, orbital markers and full mission workshop are hidden until the stage unlocks. The independent Moon close-up is always inspectable with financing gated by story progress.

## New in v1.3 — Δv, finite propellant consumption and engine packaging

- **Ideal Δv versus delivered Δv:** At fixed fuel, removing installed engines reduces dry mass and can physically increase the Tsiolkovsky all-fuel Δv, but also reduces thrust and propellant mass flow. The Propulsion tab now reports both the ideal/unlimited-time value and a delivered value for a player-controlled firing duration.
- **Mass depletion and nominal mass-flow ledger:** At a fixed published operating point, propellant drains at **ṁ = F/(Isp·g₀)** and instantaneous spacecraft mass declines. The finite burn ledger shows power-limited active engines, per-mode mass flow, burn days, fuel consumed/remaining, acceleration at the beginning/end, and six samples of mass and cumulative Δv. A selectable duty fraction specifies firing time versus coasting. For dual propulsion, modes share ONE mission timeline rather than each obtaining its own full duration. The mission feasibility screen now uses this same burn model for the time-limited onboard Δv contribution.
- **No arbitrary fractional-power thruster:** Whole engines run only if rated power can be supplied after housekeeping. Extra unpowered engines add dry mass without magic additional thrust. This is a discrete scheduling approximation, not a manufacturer throttle performance curve.
- **Resizable spacecraft structure:** Propulsion tab offers bus frame scale and **Auto-fit installed thrusters**. Primary and secondary thrusters share 16 uniquely placed, non-overlapping rear nozzle mounts; oversized configurations display a clearance warning. Expanding the frame adds **18 kg × (scale² − 1)** of illustrative structural mass and additional game procurement cost, affects modeled wet/dry mass, launch capacity and Δv.
- **Engineering limitations:** Propulsion model is constant Isp/thrust, not actual throttle dynamics, thermal throttle cycling, time-varying solar input, power storage/discharge, finite-thrust numerical trajectory, detailed structural sizing, actual exhaust plume impingement or flight qualification. It integrates ideal Δv over the shrinking vehicle mass while tracking a finite burn timeline.

## New in v1.2 — mission-aware engineering, slower clock and interactive solar map

- **Mission-aware Engineering Lab:** The active campaign mission remains selected when switching views. A live readiness panel lists violated mass, power, radiator, payload, instrument, budget and trajectory checks, with shortcuts to the subsystem controls that can address them. Entering from **Earth Observation One** instead shows that guided mission's actual capacity and projected science constraints.
- **Per-subsystem impact summaries:** Propulsion, science, power, thermal, tank and full analysis tabs each show their own calculated installed mass and performance contribution, with change-from-last-edit wet mass, available electrical power and cooling-capacity deltas.
- **Heliocentric campaign mini map:** Animated by campaign day rather than an independent arbitrary loop. Uses NASA/JPL approximate planetary positions for Venus, Earth, Mars and Jupiter; map fit/zoom and numbered story, NASA-inspired, and special-contract markers select the common mission. Planetary transfer highlights are **schematic**, not solved Lambert arcs. Moon/Earth-ellipse highlights are not to solar-system scale. Synthetic asteroid geometry is labeled as such.
- **Slower campaign clock:** One in-game day every two real minutes while the tab is visible, instead of one week per minute. Skipping time by button remains disabled. Closed/background tabs do not advance.
- **Missed NASA-inspired opportunities:** The real historical event passes, but a new fictional follow-on contract remains selectable at a 25% lower reward. NASA side contracts never become mandatory prerequisites for main-story chapters. The game's own recurring timed ellipse contracts can still expire and rotate.
- **NASA resource lineage:** The Sources & Data tab and [NASA data traceability](docs/SOURCES_AND_DATA.md) identify numerical NASA data that actually affects the program, versus illustrative game assumptions.

## New in v1.0 — progressive missions, orbital integration and expiring opportunities

The first successful **Earth Observation One** flight (not an unrelated classic-mode contract) permanently unlocks **Explore Further** inside Play Campaign. You progress in this order:

| Level | Mission | Engineering trade-off | Time |
|---|---|---|---|
| 1 | **Lunar Relay Pathfinder** | An Earth-to-lunar-distance ellipse, higher departure Δv, deployable antenna and real launch capacity | 8 simulated days |
| 2 | **Asteroid Prospecting** | Fictional 1.35 AU circular-orbit survey target, science sensor, electric power and transfer energy | 220 days |
| 3 | **Mars Orbiter** | Date-dependent Earth/Mars phase, injection and approximate circular-orbit capture, instrument/radio requirements | 270 days |
| 4 | **Jovian Flyby Survey** | Very large Hohmann-class transfer energy, deep-space power and radiation shielding; flyby, NOT Jovian capture/tour | 1050 days |

**Shared physical viability.** Each mission uses the configured spacecraft and launcher and a real-time checklist covering rocket manifest/ideal ascent payload, external kick-stage wet/dry mass and Tsiolkovsky delta-V, onboard limited-duration propulsion delta-V, onboard power at the target's heliocentric distance, installed bus radiator area, instrument suitability, external equipment mass/power/cost, nuclear hot radiator feasibility and agency cash. The story missions are simulated educational operations; they do not propagate a true finite-thrust spacecraft or run a detailed lunar/planetary capture/navigation simulation.

**External mission modules.** Players choose no kick stage, a storable injection stage, or a larger cryogenic kick stage; high-gain antenna, radiation shielding and battery modules also change the installed flight mass and electricity/cost requirements. A more powerful booster makes long-range missions feasible, but may overload the launch rocket. Mission purchases subtract funds immediately and successful flights settle the reward once. Save/reload preserves an in-progress campaign flight and completed milestones; Developer Mode allows an implemented milestone to be inspected early but does not bypass its physics.

**Time-limited special missions.** After the first Earth Observation success, a deterministic pseudo-random high-apogee Earth-orbit contract appears every **32 in-game days**, with a **22-day inclusive bid/launch window**. Rotating mission briefs require heavy payload, high-gain relay or radiation shielding, and a minimum elliptical apogee derived from the same Earth two-body Kepler model used by the Orbital Map. The launch must begin while the bid is open; no contract can be completed twice. These are **fictional agency procurement deadlines**, not astronomical transfer-window ephemerides. The open visible browser tab progresses one game day every two real minutes; background or closed tabs pause the countdown. Longer successful flights still move the calendar forward. Missed NASA-inspired date-window side contracts become discounted follow-on opportunities so they do not permanently disappear or block main story progress.

**Orbital Map integration.** “Analyze this orbit in Orbital Map” sets the game departure day and selected Earth perigee/eccentricity or planetary destination. For Mars/Jupiter it opens the **optional** Orekit 13.1.9 service and the already-working manual/low-delta-V Lambert optimizer. When the solver returns a departure on the same game date and target, the mission's idealized departure and arrival energy uses that solved v∞ instead of its fallback. Without Java the game uses a coplanar circular-orbit Hohmann reference, with approximate JPL planet position phase-angle mismatch as an **educational surcharge**. Neither the surcharge nor a Hohmann minimum is a genuine high-fidelity ephemeris launch-window prediction. The asteroid is a **synthetic 1.35 AU circular orbit**, not a specific observed asteroid.

**Flight visualization.** The mission workshop includes a basic moving spacecraft marker along the computed two-body ellipse or a clearly schematic heliocentric trajectory, plus time/energy values and an engineering checklist. It does not claim to animate a solved Orekit heliocentric path or to represent finite-thrust time-history telemetry. The existing Earth Observation One day-by-day imaging/downlink animation remains available.

[Demo guide for v1.0](docs/DEMO_GUIDE_V10.md) · [Scientific limits and attribution](docs/ATTRIBUTION.md)

## New in v0.9 — research economics, demo unlocks, animated mission and reactor thermal branch

**Research & Roadmap is now interactive.** Contract capital can fund twelve persistent research nodes across propulsion, power, thermal, science and manufacturing. The research tree enforces prerequisites and budgets, labels equipment game-maturity tiers (not official technology-specific NASA TRLs) and shows separate illustrative R&D, procurement and annual operation costs. The acquisition gate is enforced in Engineering Lab for advanced thrusters, RTGs/reactors and deep-space science sensors. Previously saved unresearched hardware can still be inspected, but cannot launch on the guided mission without an unlock.

**Developer / Demo Mode:** The Research tab contains a one-click toggle to make every implemented technology selectable for a presentation, without spending research money or permanently changing the unlocked node list. Turning it off restores normal access. Dev Mode unlocks the **implemented catalog** only; future lunar/Mars/Jupiter missions shown in the research roadmap are previews, not claimed playable features.

**Mission procurement:** Earth Observation One now includes spacecraft propulsion, solar, cooling, power generator and bus procurement as explicitly game-estimated costs in addition to launch/instrument/radio/storage. Researching Manufacturing Learning Curve reduces the spacecraft hardware procurement portion by 12%. The design review shows hardware costs, savings, qualitative engineering risk and hard launch/money margins; these are not supplier quotes or flight failure probabilities.

**Animated Earth observation:** A stylized satellite-orbit scene appears during the seven-day mission. The displayed period and eclipse fraction use the same NASA/JPL Earth constants and circular-orbit assumptions as the orbit simulator. Altitude is exaggerated visually and animation runs faster than actual time; the daily science and data simulation remains a separate simplified model.

**Fission thermal engineering:** SNAP-10A and the explicitly invented 25 kWe conceptual fission generator have an isolated high-temperature radiator branch with player-controlled area and temperature. Its radiative capacity, required area, cooling-loop/boom mass, and thermal margin are displayed in Engineering Lab and reflected in spacecraft mass/3D geometry. Unknown KRUSTY thermal input remains UNKNOWN, not zero. The guided mission blocks reactor-powered launches if required reactor cooling or generator mass is unverified.

**Nuclear distinctions:** Fission-electric power generation supplies electrical thrusters but is not itself a thruster. Nuclear thermal rockets use fission heat directly to exhaust propellant; thermonuclear/fusion rocket concepts are further research ideas. Neither a functioning nuclear thermal rocket nor a fusion propulsion solver is implemented. Existing nuclear entries are historical benchmarks/concept-level planning data with major shielding and regulatory exclusions.

[Demonstration walk-through](docs/DEMO_GUIDE_V09.md) · [Next development roadmap](docs/NEXT_STEPS_CAMPAIGN_AND_LAB.md)

## New in v0.8 — smarter spacecraft architecture and ion propulsion

### Ion and Hall propulsion catalogue

The Engineering Lab now includes additional published reference operating points: NASA NSTAR (Dawn/Deep Space 1), NASA NEXT-C (DART hardware), QinetiQ T6 (BepiColombo), and SPT-140 Hall, alongside Busek BHT-100, BHT-200 and BIT-3 and an illustrative chemical monopropellant option. The [ion thruster taxonomy on Wikipedia](https://en.wikipedia.org/wiki/Ion_thruster) was a discovery starting point; **numerical hardware claims are grounded in linked NASA/NTRS engineering references**, and any unmatched electrical points or missing dry masses are flagged.

You can choose **two propulsion architectures** with independent propellant inventories, thruster quantities and separate tank/feed estimates. Both systems contribute to spacecraft launch mass. The performance model assumes the propulsion families are operated **sequentially**, reports nominal single-family power requirements, and applies the ideal rocket equation once to each propellant burn in the chosen order. This is *not* a real finite-thrust trajectory, and it does not model simultaneous operation of different families or gimbal/power-bus scheduling.

### Application-specific tank sizing

- **Liquid hydrazine-class monopropellant:** approximately 1020 kg/m³ assumed liquid density, 5% ullage, configurable diaphragm/bellows/capillary feed and regulated pressure
- **Dense xenon:** pressure-vessel design at a user-adjustable gas/supercritical reference pressure, but with **assumed** bulk xenon density (1000 kg/m³ at the default reference conditions), rather than a validated real-gas EOS
- **Iodine:** solid heated-feed reservoir and containment allowances, not a pressurized liquid spherical tank

For spherical pressure vessels the game reports a **membrane Tmin** using an internal-pressure stress relationship `t ≈ P·R/(2·S·E − 0.2·P)`, an assumed joint efficiency of 0.85, a non-code minimum manufacturing thickness and a feed/fit-up allowance. These are **conceptual engineering calculations, not ASME VIII or spacecraft pressure-vessel compliance**. Flight design needs pressure/temperature EOS, material compatibility, liner, weld, proof/burst factors, vibration loads, fracture control, qualification, PMDs and detailed thermal-structural FEA. For iodine, no pressure-vessel Tmin is calculated.

### Automatic power, mass and thermal consequences

- **Solar-array mass:** total active PV area × an explicitly assumed **2.5 kg/m²**, plus **0.5 kg per deployable wing**. Increasing solar area *does increase wet spacecraft mass*.
- **Power:** editable baseline avionics watts + estimated wing controller watts + radiator sensor watts + selected science instrument active watts + assumed distribution/wiring inefficiency (94% electrical efficiency) + worst-active propulsion power and PPU losses.
- **Science instruments:** Earth imagers, multispectral/hyperspectral cameras, thermal infrared radiometer, magnetometer, visible/IR mapper, gamma-ray/neutron spectrometer and laser altimeter. The payload catalog provides illustrative size/mass/watts/data and NASA science mission inspiration links—not certified flight instrument data.
- **Radiators:** player chooses **installed thermal area** (with its own mass and visible geometry) separately from *calculated required area*. If installed radiator heat rejection is insufficient, the engineering margin and Earth Observation One mission performance suffer. Radiator mounting adds mass per panel.
- **Breakdown:** Engineering Lab now shows a permanent mass/power summary strip, a component power ledger, two tank cards when dual propulsion is fitted, and a wet-mass roll-up. Clicking the modular 3D spacecraft's power, radiator, tank, nozzle or instrument geometry opens the corresponding engineering controls.

### Project Prometheus is a research reference, not a flown satellite

**Mission Library → Project Prometheus / Jupiter Icy Moons Orbiter (JIMO)** now includes NASA/GAO context on the 2003–2005 nuclear-electric studies. This program was **cancelled before flight**. The library does not fabricate a spacecraft model, position track, validated reactor mass or real flight-science manifest. Reference material: [NASA 2021 technical memorandum](https://ntrs.nasa.gov/api/citations/20210016968/downloads/TM-20210016968_final.pdf) and [GAO historical assessment](https://www.gao.gov/products/gao-05-242).

**Model limitations:** solar attitude, electrical control losses, tank fluid density, dynamic thermal margins and installed power/propulsion hardware allowances remain educational. Electricity and tank sizing calculations are estimates with provenance, not engineering authorization. In-flight science collection, telemetry and downlink remain deterministic first-order game approximations.

## New in v0.7 — Earth Observation One

**Play Campaign → Earth Observation One** is a guided complete mission demonstration. Pick a compact/multispectral/hyperspectral/thermal instrument, radio, recorder, observation duty cycle, orbit altitude, payload allocation and optional radiator/battery upgrades. The mission uses the **same spacecraft design** as Engineering Lab, replacing its generic instrument payload mass slot with the chosen real-world-shaped game instrument. The original rocket builder determines the launch performance for the actual spacecraft wet mass.

Live horizontal bars compare **launch payload (kg), sunlit electrical load (W), thermal load (W), eclipse energy (Wh), daily science data/downlink (Mb/day), and total cost ($M)** with their modeled capacities. Overages are red; each shows consequences. Launch a viable design and advance through seven days of simulated operations; data can be buffered, overflow and be downlinked, with **science counted only after downlink**. The final debrief explains failure causes and financial outcome. No Orekit server required.

**Everything beyond the NASA/JPL Earth/orbit and cataloged spacecraft component values is labeled a game assumption**: instrument mass/power/data and science reward, radio rates/ground contact, budget, thermal- and power-driven science derating and score. The model is deliberately an educational approximation and not a flight design. Mission launch costs are charged immediately, and earned scientific contract revenue is added only after the seven-day debrief. A snapshot of the spacecraft configuration is locked at launch, so later design edits do not retroactively change the in-flight mission.

The original launch-contract activity remains under **Play Campaign → Orbital Contracts (Classic mode)**. Use **Engineering Lab** for the detailed subsystem tabs and return to the campaign to see the effect of those design changes.

[Next steps: Play Campaign and Engineering Lab architecture](docs/NEXT_STEPS_CAMPAIGN_AND_LAB.md)

## Quick start

Requirements: Node.js LTS with npm (Node 22+ supported).

### macOS: double-click to play

After cloning or pulling this repository, open the folder in **Finder** and double-click **`Start Space Race.command`**. It automatically installs dependencies on the first launch, starts the local game server, and opens the game in your default browser.

Keep the Terminal window open while playing. To stop the game, select that window and press **Control+C**. On later launches, just double-click the file again.

### Optional Orekit transfer calculations

The regular game starts with **Node.js only**. To solve Earth-to-planet *impulsive Lambert transfers*, install a JDK (17 or newer) and Apache Maven (3.9+), then double-click **`Start Orekit.command`** in the same repository folder. Keep that second Terminal window running. The **Orbital Map → Planet positions → Earth-to-planet transfer** panel will detect the service at `127.0.0.1:8787`.

Orekit is Java, not JavaScript: it cannot be included in the React browser bundle. The service is **local and optional**. It handles two-body Lambert transfers only, not gravity assists, finite-thrust solar-electric maneuvers, launch from parking orbit, or arrival capture. See [Orekit backend instructions](orekit-service/README.md).

### Interactive 3D models

The builder supports a modular geometric prototype that changes its number of nozzle meshes, solar panel wings, radiator panels and radioisotope generator shapes according to the selected component counts. Solar panel size depends on the **total active cell area divided across the wings**; radiator area is similarly divided across panels. The game also lets you import a **self-contained GLB** from Onshape/FreeCAD using **Import CAD GLB**. External reference/imported meshes are **view-only** and do not automatically change mass, pressure, thrust, inertia or thermal calculations.

### Fixing the NASA GLB model loading error (macOS)

The earlier Mission Library tried fetching NASA's model directly from a different website, which may fail due to browser cross-origin restrictions. **v0.6 instead loads downloaded files from the game's own server.** The game now attempts the downloads at startup via `npm run dev` / `Start Space Race.command`, saving each file under `public/models/` in your cloned repository. Internet access is required for the initial retrieval.

**If the model fails to load, use these diagnostics:**

```bash
npm run models:inspect
```

This checks local Dawn/Voyager file signatures, complete byte lengths and glTF extensions (including Draco). In Mission Library, click **Retry NASA 3D model**. The loader now validates the HTTP response, prints mesh count and extension information, and displays the **actual error message** both on-screen and in your browser Console.

Three.js's Draco decoder is copied from the installed Three.js package into `public/draco/` at startup and at build time. No external decoder CDN is required. If a GLB requires another unsupported extension, the viewer's diagnostic message will say so rather than claiming the NASA file is missing.

**If the model doesn't load automatically, open Terminal in your repo folder and run:**

```bash
npm run models:fetch
```

**Or download manually from the official NASA model pages and save these exact paths inside your repository:**

| NASA reference | Official model page / download | Save as |
| --- | --- | --- |
| Dawn | [NASA 3D Dawn](https://science.nasa.gov/3d-resources/dawn/) ([direct GLB](https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/dawn/Dawn.glb)) | `public/models/Dawn.glb` |
| Voyager (Probe B visual reference) | [NASA 3D Voyager Probe B](https://science.nasa.gov/3d-resources/voyager-probe-b/) ([direct GLB](https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/voyager-probe-%28b%29/Voyager%20Probe%20%28B%29.glb)) | `public/models/Voyager.glb` |

Create the `public/models` folder if necessary. **Preserve the capital letters in the filenames.** Refresh the game page or restart the game to load the assets. The model loader shows the modular prototype as a fallback; this is **not** the historical spacecraft model. These locally downloaded NASA model files are ignored by Git and are not committed to the repository. Check NASA media and model attribution requirements.

New Horizons' official model page is linked from the Mission Library, but a self-contained browser-ready GLB download is not yet integrated; its reference image is displayed instead. Psyche displays a reference image.

NASA's free [3D Resources](https://science.nasa.gov/3d-resources/) include [Dawn](https://science.nasa.gov/3d-resources/dawn/), [New Horizons](https://science.nasa.gov/resource/new-horizons-3d-model/) and [Voyager](https://science.nasa.gov/resource/voyager-3d-model/). See [CAD and trajectory roadmap](docs/CAD_AND_ORBITAL_ROADMAP.md).

### Optimize the lowest sampled delta-V for a specified departure date

On **Orbital Map → Planet positions**, choose **Optimize minimum Δv**, select a destination and UTC departure date, and specify a flight-time search window. The optimizer uses Orekit to solve each candidate and refines around the lowest sampled duration to one-day intervals. Two optimization targets:

- **Departure Δv** from an ideal circular Earth parking orbit (default 400 km).
- **Departure + capture Δv** including ideal circular orbit insertion at the destination (default 300 km at Venus/Mars, or an illustrative 100,000 km above Jupiter's 1-bar equatorial reference radius).

The ideal patched-conic burns use `Δv = √(v∞² + 2μ/r) − √(μ/r)` with NASA/JPL gravitational parameters and planetary radii. The map plots the lowest sampled solution and shows an energy-vs-flight-duration curve.

**Important:** This holds the departure date fixed. It does **not** optimize both launch date and arrival date (porkchop plot), simulate Hall/ion finite burns, gravity assists, aerobraking or departure from Earth's surface. The lowest sampled cost inside the search range is not guaranteed to be a global optimum, and ideal instantaneous burns are not necessarily realizable by a given spacecraft.

After pulling the change, **restart `Start Orekit.command`**; the running Java process does not update itself, and the newly added `/api/optimize` endpoint must be loaded.

### Learning and historical flight paths

Click **Learn Physics** to study the equations driving the spacecraft engineering calculations. Experiment with mass, Isp, thrust, solar area/distance, radiator temperature, tank pressure and orbital eccentricity. Most input fields include a keyboard-accessible **?** tooltip; hover, focus with Tab or tap it to read the meaning and units.

In **Mission Library**, select Dawn, Psyche, New Horizons or Voyager, then click **Load historical flight path**. This asks the **local Orekit Java server** to retrieve **sampled NASA/JPL Horizons spacecraft positions** (not a reconstructed orbit guessed from milestones), show the 2D ecliptic projection and allow scrubbing by sample date. Loading requires both Java server running **and** internet access. JPL coverage differs by mission, so a request might fail; the verified milestones remain visible if data are not available. In the Voyager entry, the sample track uses **Voyager 1**. Historical spacecraft trajectories are **not** generic closed Keplerian orbits: gravity assists, ion thrust and mission targeting change their paths. Restart `Start Orekit.command` after pulling the update to enable the new `/api/heritage-track` endpoint.

### Terminal: manual launch

Open a terminal **in this repository folder**, then run:

```bash
npm install
npm run dev
```

Open the address printed by Vite (usually `http://localhost:5173`).

To run checks:

```bash
npm test
npm run build
```

The game saves campaign progress and saved vehicle blueprints in the browser's `localStorage`. The **Reset campaign** action clears the current save. No account or backend is required.

## Current features (v0.8)

| Feature | How it works | Status |
| --- | --- | --- |
| Spacecraft builder | Choose kerolox, methalox, or hydrolox; tune dry mass, propellant, and payload | Playable |
| Engineering metrics | Ideal rocket equation delta-V, initial mass, liftoff thrust-to-weight, Isp | Playable |
| Orbit contracts | Three fictional LEO contract tiers with payload and delta-V thresholds | Playable |
| Economy | Starting budget, costs, successful payouts, risk of losing money on failed missions | Playable |
| Manufacturing learning | 2% build-cost reduction per previous attempt using the same propulsion family, capped at 20% | Playable (simplified) |
| Simulation clock | Each mission advances a set number of days; manual 7-day advance | Playable |
| Saved spacecraft designs | Save and reload named blueprints locally | Playable |
| Interactive orbital map | Keplerian Earth satellite trajectories with adjustable altitude/eccentricity and time; JPL 1800–2050 approximate Earth–Moon barycenter, Venus, Mars and Jupiter positions | Playable (two-body/approximate) |
| Subsystem tabs | Propulsion, power, thermal, tanks, separate analysis | Playable |
| Spacecraft 3D studio | Procedural Three.js solar arrays, radiators, tank, bus, antenna, thruster; click parts, orbit/zoom; import user .glb exported from CAD | Interactive prototype |
| Model-driven geometry counts | Change number of thrusters, wings, radiators or power generators; the geometry and first-order hardware/power/heat estimates respond | Interactive preliminary model |
| Field explanations | Hover/focus/tap accessible (?) descriptions beside engineering and trajectory inputs | Interactive |
| Learn Physics | Separate tab explaining propulsion, solar electric power, thermal radiation, tank shell mass, orbital mechanics and Lambert transfers with live calculations | Interactive lessons |
| NASA historical orbit references | Load sampled spacecraft ephemeris from JPL Horizons through local Orekit service with 2D heliocentric projected trail, timeline and mission milestones | Requires Orekit and JPL internet availability |
| Earth Observation One | Linked 3D spacecraft, instrument, radio, storage and launch configurations; resource margin bars and a seven-day scientific downlink simulation with debrief | Playable (game assumptions, fully browser-based) |
| Unified Play Campaign / Engineering Lab | Shared persisted spacecraft design and launch config feed the same guided mission. Classic contracts remain separate | Playable |
| NASA spacecraft heritage | Dawn, Psyche, New Horizons, Voyager reference technical profiles, image/model links | Reference library |
| Orekit Lambert transfers | Optional local Java 17+ / Maven backend, solves Sun-centered impulsive transfer and draws conic, reports departure C3 and v-infinity at arrival | Implemented, requires separate service |
| Fixed-date delta-V optimizer | Samples flight duration, refines best time to 1-day resolution, minimizes departure injection burn or ideal departure + capture burn at specified circular parking altitudes | Requires Orekit service |
| Advanced generators | PV, MMRTG, MHW-RTG, GPHS-RTG, SNAP-10A heritage reactor, Kilopower ground-demonstrator reference | Playable (reference data; some integration/mass is incomplete) |
| Research/tech tree | Fund a research institution, earn research points, unlock tech, improve manufacturing | **Planned** |
| Deep-space transfers | Moon, Mars, Jupiter-moon orbital mechanics, launch windows and trajectory plots | **Planned** |
| Infrastructure | Lunar outposts, fuel depots, manufacturing, recurring revenue | **Planned** |
| Competition | Rival agency progression and a strategic loss condition | **Planned** |

### First gameplay loop

1. Choose a low Earth orbit contract with a minimum payload and delta-V requirement.
2. Configure engine type, dry mass, propellant mass, and payload in the spacecraft builder.
3. Review **available delta-V**, liftoff **thrust-to-weight**, **payload capacity**, and **build cost**.
4. Launch the design. An attempt consumes its build cost and advances the campaign clock.
5. Complete contracts to earn revenue; failed launches lose their manufacturing cost.
6. Reinvest earnings into higher-performance designs or repeat a design to benefit from a manufacturing learning curve.

This loop is intentionally small enough to be a working demonstration rather than a collection of disconnected screens.

## NASA-sourced subsystem engineering foundation (development)

The 2026 NASA Small Spacecraft SoA research has been organized into a [component data catalog](src/lib/spacecraftTechnology.ts), [first-order sizing functions](src/lib/spacecraftSystems.ts), [unit tests](src/lib/spacecraftSystems.test.ts), and a detailed [NASA technology research guide](docs/NASA_TECHNOLOGY_RESEARCH.md). Source-backed examples cover in-space Hall/ion propulsion, PV cells, battery packs, thermal surfaces, CubeSat structure references, and GNC.

**New in v0.3 — interactive subsystem lab:** click **Spacecraft Builder** in the navigation and choose a subsystem tab. The separate in-space spacecraft design panel connects propulsion, solar generation, batteries, thermal radiator sizing and (liquid-only) tank geometry into an illustrative system mass and ideal delta-V/burn-time analysis. Changing engine, solar distance, array area, battery, radiator coating or tank sizing updates dependent engineering quantities in real time. It has independently saved parameters in browser localStorage.

**Limitations:** the map shows two-body planetary/satellite positions, **not** maneuver trajectories or actual launch windows. Solar output is distance-dependent, RTG output is age-dependent, and generator mass may change modeled delta-V. The source's own waste heat is shown separately, **not automatically routed through the spacecraft radiator**. These models are early design estimates, not flight validation. Gas and solid propellant storage still lack a tank-mass model and are displayed as *incomplete modeled mass estimates*. PV/thermal assembly areal mass, PPU and tank-management allowances are explicitly illustrative, not NASA performance data. The separate v0.1 launch-vehicle contract simulator remains unchanged.

### Calculated orbits versus missions

The interactive Orbital Map uses NASA/JPL parameters and [JPL's approximate planetary element equations](https://ssd.jpl.nasa.gov/planets/approx_pos.html). The Earth satellite view computes Kepler's equation and vis-viva speed for adjustable eccentricity, altitude and time. The solar-system view computes projected J2000 heliocentric positions using elements and secular rates for 1800–2050. It uses Earth–Moon barycenter, not geocentric Earth, and a UTC approximation of TDB. These models do **not** yet produce a launch-window optimizer, patched-conic Earth–Mars flight trajectory, orbit insertion or finite-thrust optimal control.

### CAD strategy

A future 3D assembler could use **Onshape** for parametric parts and assemblies and **Three.js** (optionally React Three Fiber) to load exported GLB/glTF meshes in our React web UI. Onshape REST integrations would need a **server-side API/OAuth layer**, not browser-only secret keys. **FreeCAD** or OpenCascade-based tools are potential offline/open-source alternatives. In-game mesh geometry and physical design properties (mass, tank volume, solar area, heat/power demands) should be linked through an explicit component schema. See [3D CAD and orbital roadmap](docs/CAD_AND_ORBITAL_ROADMAP.md).

## Engineering foundation

The prototype calculates ideal vehicle delta-V using the Tsiolkovsky rocket equation:

\[ \Delta v = I_{sp} g_0 \ln\left(\frac{m_0}{m_f}\right) \]

where:

- `Isp` is specific impulse in seconds;
- `g0` is standard gravity, 9.80665 m/s²;
- `m0 = dry mass + propellant mass + payload mass`;
- `mf = dry mass + payload mass`.

Initial launch thrust-to-weight ratio is:

\[ TWR = \frac{F}{m_0 g_0} \]

**Key limitations:** This assumes one idealized stage, constant thrust and specific impulse, and instantaneous use of the propellant. It does **not** simulate atmosphere, drag, gravity losses, structural loads, engine throttling, staging, finite burns, re-entry, launch-site latitude, or guidance. Game contract delta-V targets are illustrative thresholds, **not** actual mission-design requirements. Passing the game's readiness checks is **not proof** a launch vehicle could reach orbit.

Engine performance and prices are deliberately fictitious balancing inputs and should not be described as NASA engine specifications. The initial mission selection is Earth orbit only.

### NASA data actually used

The two-body Earth orbit panel uses these NASA/JPL resources:

1. **JPL Solar System Dynamics — Astrodynamic Parameters**: https://ssd.jpl.nasa.gov/astro_par.html — Earth's gravitational parameter `GM = 398600.435507 km³/s²` (DE440 Earth parameter).
2. **NASA NSSDC Earth Fact Sheet**: https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html — Earth equatorial radius `6378.137 km`.

From those values, the displayed circular orbital speed and period are calculated as:

\[v_c = \sqrt{\mu/r}, \qquad T = 2\pi\sqrt{r^3/\mu}\]

with `r = equatorial radius + selected mission altitude`. This is a simple two-body model of a circular orbit, not a spacecraft ephemeris or launch-trajectory simulator. The orbit graphic is schematic and not to scale. See [`src/lib/nasaData.ts`](src/lib/nasaData.ts) and [`docs/ATTRIBUTION.md`](docs/ATTRIBUTION.md).

## Longer-term game design

### A strategic space program

The long-term vision is a game in which you begin with limited funds and basic launch technology. You choose between immediately fulfilling contracts, increasing manufacturing capacity, and investing in research. Getting stuck repeating the first lucrative launch is intentionally discouraged through diminishing market returns, new contract requirements, competition, and emerging destinations.

### Research and engineering technology tree

The planned **Research University** converts funding into research points at an investment-dependent rate. Players will allocate points between two broad branches:

- **Discover new capabilities:** better propulsion options (chemical and, for in-space use, electric thrusters), solar arrays, power systems, structures, and mission equipment.
- **Improve established capabilities:** lower mass, better manufacturing yields, lower unit cost, better operating life, and reusable architecture.

A separate **learning-by-doing** mechanic rewards repeat production. The eventual objective is to make research and manufacturing scale distinct, complementary strategic choices rather than a single linear upgrade button.

### Missions and economic progression

Proposed campaign progression:

1. **Earth orbit:** commercial payloads, first spacecraft builds, reusable architectures, cash generation.
2. **Lunar orbit/surface:** landers, surface power, fuel storage and later in-situ resource/propellant production.
3. **Lunar industry:** manufacturing and supply chains that change the economics of deep-space missions.
4. **Mars:** higher-energy transfers, long-duration systems, constrained interplanetary departure periods, and settlement contracts.
5. **Outer solar system (stretch):** Jovian moon reconnaissance and advanced mission architecture.

Players will eventually be able to create **custom sandbox missions** as well as play through fixed contracts.

### Launch windows and interactive map

The proposed map is a 2D orbital view that advances in simulated time. Interplanetary transfers should use actual orbital positions and simplified transfer mechanics where feasible. Low-energy Earth-to-Mars opportunities repeat approximately every 26 months, but they are **not hard caps** on the number of vehicles that may depart. Higher-energy architectures can often tolerate less favorable departure times at a cost. A mission's departure opportunities should therefore depend on **time, delta-V, delivered mass, and propulsion constraints**, not simply a single annual launch quota.

**Important:** None of these interplanetary transfer calculations exist in v0.1. The current orbit graphic does **not** model Mars trajectory planning.

### Competition and loss conditions

The proposed rival program creates pressure to make strategic decisions. The original game idea uses a competing national space program as a race mechanic; to avoid inventing geopolitical facts or implying real NASA endorsements, the working game design will treat this as a **fictional competing program**. The player may eventually lose an objective if the rival achieves a milestone first or if funds run out.

## Suggested build order

- [x] Repository scaffolding, browser UI, documentation.
- [x] Editable spacecraft configuration + delta-V/TWR performance metrics.
- [x] Orbital contracts, economics, and basic time progression.
- [x] NASA-derived simple Earth circular-orbit parameters.
- [x] Browser save / reload for campaigns and named spacecraft blueprints.
- [ ] Add stronger physics input validation, a mission simulator with staging, and physically defensible launch constraints.
- [ ] Research tree with player-controlled investment allocation.
- [ ] More complete solar system map and phase-dependent transfers.
- [ ] Lunar contracts, manufacturing, and fuel logistics.
- [ ] Fictional rival program and milestones.
- [ ] Publicly deployed website, 30-second demo, and Space Apps project submission.

## Repository layout

```text
space-race-beyond-earth/
├── docs/
│   ├── ATTRIBUTION.md          # NASA source, third-party resources, SI disclosures
│   ├── DESIGN_NOTES.md         # Mechanic proposals and hackathon roadmap
│   └── SUBMISSION.md           # Submission checklist and draft summary
├── src/
│   ├── App.tsx                 # Gameplay state + React UI
│   ├── main.tsx                # React mount
│   ├── styles.css              # Responsive dashboard styles
│   └── lib/
│       ├── engineering.ts      # Ideal vehicle performance / prices
│       ├── engineering.test.ts # Engineering and orbital tests
│       └── nasaData.ts         # Source-backed Earth parameters / orbit math
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Space Apps 2026 submission plan

According to the 2026 form: provide a **50–200 word** project summary (field maximum 1,500 characters), a **public project link**, and a **public demo** of **at most seven slides OR 30 seconds of video**. Also supply detailed methodology, list actual NASA data used, credit non-NASA resources, and accurately disclose SI/AI contributions. Submission deadline listed is **November 15, 2026 at 11:59 PM local Halifax time**. The form's **Save Progress** button does *not* submit the entry—use **Submit for Judging**.

Read [`docs/SUBMISSION.md`](docs/SUBMISSION.md) for the submission draft and checklist. Verify the official challenge page for exact intent and requirements; this project was initially planned from the team's description of the challenge and the quoted submission form, not from a full formal challenge review.

## Originality, attribution and use of AI

- Initial source code, UI structure, initial copy and README were **drafted with ChatGPT assistance** during the 2026 hackathon. The participant directs the concept, mechanics, scope, and engineering priorities, and should review/test every change.
- All artwork in this version is hand-coded CSS/SVG (no external screenshots, NASA logos, insignia, or stock images). A Google Fonts stylesheet is fetched only if the browser can access it; system fonts provide fallback.
- The NASA/JPL data sources used by the orbit panel are explicitly linked above and in the attribution file.
- Third-party JavaScript tooling is listed in `package.json` and is distributed under its own respective licenses.
- There is no music, video, generated narration, or SI-generated image in this starter project.
- Any future AI-generated images/videos/audio must be clearly labeled in the way required by the Space Apps rules, and all newly used sources must be added to attribution.

This is an independent participant project, not sponsored or endorsed by NASA. A project license has not yet been selected; contact the author before assuming reuse rights.
