# Sources, tools, and SI/AI attribution

This file documents publicly linked resources actually used by **Space Race: Beyond Earth through v0.8**, including its initial prototype and subsequent NASA component and orbital data. Keep this updated for Space Apps judging.

## NASA / JPL resources used in the application

| Source | Link | Actual usage |
| --- | --- | --- |
| JPL Solar System Dynamics — Astrodynamic Parameters | https://ssd.jpl.nasa.gov/astro_par.html | Earth gravitational parameter `GM = 398600.435507 km³/s²` for circular orbital velocity/period |
| NASA NSSDC Earth Fact Sheet | https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html | Equatorial radius `6378.137 km` to convert altitude into orbital radius |

The game uses classical two-body equations; these are general mechanics, not a claim that NASA has approved the model. All mission payouts, component prices, engine figures, and mission readiness delta-V thresholds are original *illustrative gameplay* assumptions, **not NASA datasets**.

## Additional NASA references used in the subsystem research code

The technology catalog `src/lib/spacecraftTechnology.ts` and first-order engineering module `src/lib/spacecraftSystems.ts` include NASA-surveyed manufacturer information and NASA solar irradiance reference data. These are now wired into the separate spacecraft subsystem builder and calculations. NASA/DOE/JPL references remain distinct from game balancing and user-chosen engineering assumptions.

| Source | Link | Data used in research/code |
| --- | --- | --- |
| NASA 2026 SoA — In-Space Propulsion | https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/ | BHT-100, BHT-200 and BIT-3 thrust/Isp/power and scoped reported masses |
| NASA 2026 SoA — Power | https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/ | Example solar efficiencies, BOL peak densities, pack-level specific energy |
| NASA GSFC Solar Irradiance Science | https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science | TSI reference 1361.6 W/m² near 1 AU |
| NASA 2026 SoA — Thermal | https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/ | Solar absorptivity of two surface materials |
| NASA 2026 SoA — Structures | https://www.nasa.gov/smallsat-institute/sst-soa/structures-materials-and-mechanisms/ | CubeSat nominal chassis dimensions and structure mass references |
| NASA 2026 SoA — GNC | https://www.nasa.gov/smallsat-institute/sst-soa/guidance-navigation-and-control/ | Example integrated ADCS mass |
| NASA Glenn Ideal Rocket Equation | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/ | Ideal delta-V and inverse propellant requirement |

Research details, formulas, limitations and additional sources: [NASA_TECHNOLOGY_RESEARCH.md](NASA_TECHNOLOGY_RESEARCH.md). NASA's SoA is a survey of publicly available sources, and listed product performance is not equivalent to NASA validation or endorsement.

## Additional NASA/JPL power and orbit resources actually used in v0.3

| Source | Link | Usage in code |
| --- | --- | --- |
| NASA/JPL Solar System Dynamics — approximate positions | https://ssd.jpl.nasa.gov/planets/approx_pos.html | Table 1 element values and rates (1800–2050); Kepler solver for heliocentric position visualization |
| NASA/JPL Solar System Dynamics — orbital parameter GM | https://ssd.jpl.nasa.gov/astro_par.html | Earth gravity parameter for two-body orbit propagation |
| NASA/JPL radioisotope power systems reference book (2015) | https://ntrs.nasa.gov/api/citations/20160001769/downloads/20160001769.pdf | Voyager MHW-RTG power/mass/degradation; GPHS-RTG historical power/mass/degradation |
| NASA MMRTG technical primer | https://ntrs.nasa.gov/api/citations/20170000017/downloads/20170000017.pdf | MMRTG approximately 110 W electric, 45 kg and 1880 W thermal |
| NASA 1965 space reactor study | https://ntrs.nasa.gov/api/citations/19650058959/downloads/19650058959.pdf | Historical SNAP-10A 500 W and unshielded system mass estimate; reactor integration still incomplete |
| NASA KRUSTY ground test (2018) | https://ntrs.nasa.gov/citations/20180007748 | Ground-demonstrated fission research; explicitly not flight proven |
| NASA Radioisotope Power Systems RTG summary | https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/power-radioisotope-thermoelectric-generators/ | Flight heritage and power class distinctions |

An RTG's published thermal output is not automatically heat entering the spacecraft bus radiator. Reactor mass/source thermal subsystem size, source shielding, integration mass, power conditioning, and suitable reactor radiator design remain missing in the first-order model. The JPL solar-system model is a low-accuracy visualization, not mission-grade ephemeris.

## v0.4 mission heritage, 3D models and Orekit integration

| Resource | URL | Actual use |
| --- | --- | --- |
| NASA Dawn Spacecraft facts | https://science.nasa.gov/mission/dawn/technology/spacecraft/ | Spacecraft and power/propulsion statistics; Dawn reference info panel |
| NASA Dawn mission press kit (mass accounting) | https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/d/dawn-ceres.pdf | Approx. 1,217.7 kg wet launch mass vs. 747.1 kg spacecraft mass and separate xenon/hydrazine inventories |
| NASA Psyche spacecraft | https://science.nasa.gov/mission/psyche/spacecraft/ | Psyche reference propulsion, power, dimensions, mass, payload |
| JPL Psyche reference illustration/photo | https://d2pn8kiwq2w21t.cloudfront.net/images/Psyche_Mission_-_Spacecraft_H.2e16d0ba.fill-1800x775-c10.jpg | Mission Library visual; source NASA/JPL-Caltech |
| NASA New Horizons | https://science.nasa.gov/mission/new-horizons/ | Mass 478 kg, RTG and science payload reference |
| NASA Voyager | https://science.nasa.gov/mission/voyager/ | Outer planet flyby / gravity assist comparison, power type |
| NASA Dawn 3D resource and model | https://science.nasa.gov/3d-resources/dawn/ | User-triggered GLB model loading in reference view; NASA/Brian E. Kumanchik |
| NASA New Horizons 3D resource | https://science.nasa.gov/resource/new-horizons-3d-model/ | Link to official model page |
| NASA Voyager 3D resource | https://science.nasa.gov/resource/voyager-3d-model/ | Link to official model page |
| Orekit 13.1.9 | https://www.orekit.org/ | JVM-based Lambert orbit estimation and Keplerian propagation; optional local service, Apache License 2.0 |
| Three.js | https://threejs.org/ | WebGL spacecraft visualization / GLB loader; MIT License |
| React Three Fiber | https://r3f.docs.pmnd.rs/ | Declarative React Three.js integration; MIT License |
| Drei | https://drei.docs.pmnd.rs/ | Orbit controls / starfield helper components; MIT License |
| NASA/JPL approximate planetary elements | https://ssd.jpl.nasa.gov/planets/approx_pos.html | Frontend heliocentric positions/approximate finite-difference velocities supplied to Orekit |
| NASA Eyes on Solar System | https://eyes.nasa.gov/apps/solar-system/ | Interaction design inspiration only, NO code or assets copied |

The user also shared https://delrizzo.dev/ for interaction inspiration, but the site was not accessible to verify implementation or retrieve material. No source code or assets are used from that site.

**NASA materials:** NASA's media use guidelines and individual credits apply to reference models and images. Do not claim NASA endorses the game. NASA Dawn and Voyager (Probe B) GLB files are optionally downloaded at local game startup from official NASA sources to an untracked `public/models/` directory. The browser loads these same-origin assets; they are not included in the GitHub source or shipped as unlicensed binaries.

**Orekit calculations:** the local service uses actual Java Orekit code, but source positions are **approximate JPL orbital elements**, not high-precision Horizons/SPICE states. Departure C3 and v-infinity are not equivalent to rocket injection delta-V, capture delta-V, or a full feasible mission. Java Maven dependencies are open source and fetched from Maven Central at build time.

**AI assistance:** OpenAI ChatGPT also assisted with v0.4 component/3D UI design, mission reference text and source links, and implementation of the optional Orekit backend and tests. Code must be checked with CI, local browser and numerical scenario validation before presenting as flight-ready.

## v0.5 transfer optimizer — actual sources and assumptions

- [JPL Solar System Dynamics astrodynamic parameters](https://ssd.jpl.nasa.gov/astro_par.html): Earth, Venus, Mars-system and Jupiter-system gravitational parameters used in ideal departure/capture burn estimates
- [JPL planetary physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html): reference equatorial radii for ideal circular parking orbits
- [Orekit](https://www.orekit.org/): Java open-source impulsive Lambert candidate solving and propagation

The JPL approximate ephemeris, impulsive patched-conic calculations, and sampled minimum over flight time are **not** mission-grade optimization. The game does not force a propulsion type per destination; launch/transfer/capture feasibility still requires spacecraft-specific finite-thrust and mass/power constraints.

## v0.6 learning, historical trajectories and locally downloaded NASA 3D assets

| Official resource | Link | Usage |
| --- | --- | --- |
| NASA Dawn 3D | https://science.nasa.gov/3d-resources/dawn/ | Optional local Dawn GLB display in Mission Library |
| NASA Voyager Probe B 3D | https://science.nasa.gov/3d-resources/voyager-probe-b/ | Optional local Voyager visual reference GLB |
| NASA/JPL Horizons | https://ssd.jpl.nasa.gov/horizons/ | On-demand spacecraft position vectors (Sun-centered ecliptic AU) for specific historical times when available |
| NASA/JPL Horizons API | https://ssd-api.jpl.nasa.gov/doc/horizons.html | Optional Java-proxied request format, bounded historical data retrieval, 12-hour cache |
| NASA Glenn Ideal Rocket Equation | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/ | Learning tab rocket equation, Isp/mass flow context |
| NASA Small Spacecraft State-of-the-Art — Power | https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/ | Learning tab solar and storage interpretation |
| NASA Small Spacecraft State-of-the-Art — Thermal | https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/ | Learning tab thermal surface context |
| NASA/DOE New Horizons mission reference | https://science.nasa.gov/mission/new-horizons/ | Mission reference image and historical spacecraft details |

This version dynamically partitions a player-specified total active cell area over a user-specified number of visual solar panels, and similarly splits computed radiator area into selectable panels. The number of thrusters increases the model's nominal combined thrust, full-power electrical demand, hardware mass and heat in an **illustrative simultaneous firing assumption**; the visualization is not an assembly drawing or certified power distribution design. Local 3D download and Horizons requests have been unit/build-tested, but live NASA network access is environment-dependent.

**The JPL spacecraft track is sampled observational/predicted ephemeris data when available, not a mathematically reconstructed generic ellipse.** Connecting the sparse points for display should not be confused with a continuous, validated thrust/gravity-assist integration.

## v0.7 linked Earth Observation One gameplay

- **Real physics:** existing NASA/JPL Earth gravitational parameter and equatorial radius, two-body circular orbital period and a simplified cylindrical shadow/eclipsed fraction; spacecraft solar/thermal and rocket-equation modeling per prior citations
- **Educational game assumptions, not NASA technical specifications:** compact/multispectral/hyperspectral instrument mass, power and data rates; UHF/S-band/X-band communications performance and pricing; contact windows; storage capacity hardware mass/cost; 7-day science point targets; mission budget, rewards, radiator extension and battery pricing; power/thermal-driven observation duty factor; mission score
- **Science/data bookkeeping:** deterministic daily generation, buffer cap, overflow and downlink. Science credit is proportional to the data actually downlinked, not merely observed. This is illustrative game mechanics, not a flight communications or imaging model.
- The real spacecraft bus and launch vehicle configurations are now shared between Play Campaign and Engineering Lab, with a snapshot taken when the user launches; the generic instrument payload field is replaced by the selected observation instrument mass.

## v0.8 reference propulsion, science instruments and Prometheus

**Wikipedia discovery pages (taxonomy and historical context, not the numerical authority):**
- [Ion thruster](https://en.wikipedia.org/wiki/Ion_thruster) — explains gridded-ion, Hall, electromagnetic, field-emission and laboratory propulsion families. Not all are simulated because published matched operating conditions and complete spacecraft masses are unavailable.
- [Project Prometheus](https://en.wikipedia.org/wiki/Project_Prometheus) — directed us to NASA and government sources; concept is explicitly unflown.

**Technical basis for additional selectable thrusters:**
- [NASA Dawn ion-propulsion background](https://science.nasa.gov/mission/dawn/technology/ion-propulsion/) — ~91 mN max thrust for NSTAR, xenon, three installed engines with one operating at a time
- [NASA/NTRS 2011 NEXT overview](https://ntrs.nasa.gov/api/citations/20110007141/downloads/20110007141.pdf) — NSTAR/NEXT comparative Isp and full power, 91 mN, ~3120 s, 2.3 kW class
- [NASA/NTRS NEXT-C performance table](https://ntrs.nasa.gov/api/citations/20205005694/downloads/AIAA_NEXT-C_Flight_Ion_System_Status_Aug2020_8_04_2020.pdf) — 235 mN, 4155 s at 7.33 kW PPU input
- [NASA/NTRS T6 performance testing](https://ntrs.nasa.gov/citations/20150008918) — 143 mN, 4120 s at a high-power operating point; the game's 5 kW planning allocation is approximate
- [NASA/NTRS SPT-140 Hall study](https://ntrs.nasa.gov/api/citations/20170003033/downloads/20170003033.pdf) — ~4.5 kW, 300 V/15 A, reference hall thruster operating behavior
- [NASA/NTRS nuclear-electric propulsion history](https://ntrs.nasa.gov/api/citations/20210016968/downloads/TM-20210016968_final.pdf) — Project Prometheus/JIMO reactor-electric studies; the program was cancelled in 2005 without a flight vehicle
- [GAO Project Prometheus](https://www.gao.gov/products/gao-05-242) — independent government historical assessment of the project's changing goals and resource constraints

**Clearly illustrative game assumptions:** all numerical mass, power, data rates, mission scores and prices in `src/lib/instrumentCatalog.ts`; assumed xenon bulk density, liquid propellant density, storage pressure choice, iodine packing, spherical tank fitting/feed mass and minimum wall thickness; electrical controller loads of 1.5 W per wing and 0.65 W per radiator panel, a 94% distribution efficiency, 88% PPU planning efficiency, and 2.5 kg/m² solar array are not product-certified performance claims. The user-entered tank strength is a conceptual allowable, and the spherical membrane pressure relationship **does not constitute ASME VIII compliance** or an appropriately safety-factored spacecraft pressure-vessel design. Radioisotope/fission generator waste heat and structural shielding are not completely modeled.

## Other frameworks and external sources

- React: https://react.dev/
- Vite: https://vite.dev/
- TypeScript: https://www.typescriptlang.org/
- Vitest: https://vitest.dev/
- DM Sans, Space Grotesk fonts (CSS optionally loads from Google Fonts): https://fonts.google.com/ — use governed by the font licenses; system fonts are available as fallback.

No external image assets, music, or third-party design templates are included. The orbit graphic and interface decoration are drawn in code using SVG/CSS. No NASA logos, flags or mission identifiers are generated or used.

## SI / AI assistance disclosure

**Tool:** OpenAI ChatGPT (large language model), used on November 14, 2026.

**How it was used:** iterative concept development, architecture planning, writing/editing this documentation, generating starter React/TypeScript/CSS source, writing test cases and explanatory copy, and creating illustrative SVG drawing instructions in the source code. The user contributed the game's key ideas, research/economics concepts, engineering priorities, mission progression, and iterative scope decisions. Model-assisted code must be verified by running the tests/build and manual gameplay checks.

**Where to find that work:** `src/App.tsx`, `src/styles.css`, `src/lib/*`, root configuration files, and markdown in `README.md` and `docs/`.

**Images/video/audio:** No generated bitmap images, videos, music, or narration included at this stage. Any future AI-generated visual or audio media must be acknowledged and watermarked/described as required by the challenge submission guidelines.

**IMPORTANT for official form:** Select whichever SI-use checkbox categories correctly describe the *final project*, including code/data assistance, rather than claiming that no SI tools were used.
