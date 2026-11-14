# Space Race: Beyond Earth

> Design spacecraft. Build an economy. Explore the solar system.

**Space Race: Beyond Earth** is a physics-informed, strategy/tycoon-style space exploration game created for the **2026 NASA Space Apps Challenge** (Space Mission Design Game challenge). It blends spacecraft architecture, mission planning, economic decision-making, research investments, and planetary exploration into a single progression loop.

The goal is **not** to reproduce a professional flight dynamics package inside a video game. Instead, it is to make real engineering trade-offs understandable and engaging, while clearly distinguishing sourced physics from simplified mechanics.

**Status:** Hackathon prototype, v0.4. The game has Mission Control, Spacecraft Builder, Orbital Map, Mission Library, and Research tabs. The Spacecraft Builder includes a selectable modular Three.js spacecraft preview (solar panels, radiators, tank, propulsion, antenna) and can import a GLB file exported from Onshape/FreeCAD for visual inspection. The Mission Library includes NASA-sourced Dawn, Psyche, New Horizons, and Voyager examples, reference models/images and statistics. An **optional local Orekit Java service** now solves and plots impulsive Sun-centered Lambert transfers between approximate planetary positions. In-space subsystem models, orbital transfer solutions and launch-contract payouts are still separate; low-thrust electric trajectories, real launch-window optimization, gravity assists, and mission qualification are NOT implemented.

## Quick start

Requirements: Node.js LTS with npm (Node 22+ supported).

### macOS: double-click to play

After cloning or pulling this repository, open the folder in **Finder** and double-click **`Start Space Race.command`**. It automatically installs dependencies on the first launch, starts the local game server, and opens the game in your default browser.

Keep the Terminal window open while playing. To stop the game, select that window and press **Control+C**. On later launches, just double-click the file again.

### Optional Orekit transfer calculations

The regular game starts with **Node.js only**. To solve Earth-to-planet *impulsive Lambert transfers*, install a JDK (17 or newer) and Apache Maven (3.9+), then double-click **`Start Orekit.command`** in the same repository folder. Keep that second Terminal window running. The **Orbital Map → Planet positions → Earth-to-planet transfer** panel will detect the service at `127.0.0.1:8787`.

Orekit is Java, not JavaScript: it cannot be included in the React browser bundle. The service is **local and optional**. It handles two-body Lambert transfers only, not gravity assists, finite-thrust solar-electric maneuvers, launch from parking orbit, or arrival capture. See [Orekit backend instructions](orekit-service/README.md).

### Interactive 3D models

The builder now supports a modular geometric prototype with responsive component visualization, and lets you import a **self-contained GLB** (e.g. exported from Onshape/FreeCAD) through **Import CAD GLB** without uploading it to a server. A NASA Dawn GLB can be loaded as a reference from its NASA asset URL when the browser permits cross-origin access; the game shows the procedural prototype if remote loading fails. External reference/imported meshes are **view-only** and do not automatically change mass, pressure, thrust, inertia or thermal calculations.

NASA's free [3D Resources](https://science.nasa.gov/3d-resources/) include [Dawn](https://science.nasa.gov/3d-resources/dawn/), [New Horizons](https://science.nasa.gov/resource/new-horizons-3d-model/) and [Voyager](https://science.nasa.gov/resource/voyager-3d-model/). See [CAD and trajectory roadmap](docs/CAD_AND_ORBITAL_ROADMAP.md).

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

## Current features (v0.4)

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
| NASA spacecraft heritage | Dawn, Psyche, New Horizons, Voyager reference technical profiles, image/model links | Reference library |
| Orekit Lambert transfers | Optional local Java 17+ / Maven backend, solves Sun-centered impulsive transfer and draws conic, reports departure C3 and v-infinity at arrival | Implemented, requires separate service |
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
