# NASA Space Apps 2026 — Complete resource and attribution links

**Project:** Space Race: Beyond Earth  
**Purpose:** Supplement the NASA Space Apps submission fields when the form runs out of room.  
**Last reviewed:** 2026-11-15

This index lists the public URLs for NASA scientific data, Space Agency Partner resources, external engineering/industry references, software, and other tools used to build or research the prototype. The descriptions distinguish **data consumed or parameters used in code**, **research/inspiration only**, and **third-party software dependencies**. Linked material is credited to its respective owners; a citation does not imply NASA/CSA/industry endorsement or permission to redistribute copyrighted assets.

For fuller explanations of the actual implementation, game assumptions, and modeling limitations, see [Sources & Data](SOURCES_AND_DATA.md), [Attribution and AI disclosure](ATTRIBUTION.md), and [NASA technology research](NASA_TECHNOLOGY_RESEARCH.md).

## 1. NASA data and scientific resources

| Link text / resource | Full public URL | Use |
| --- | --- | --- |
| NASA Open APIs — NeoWs (Near Earth Object Web Service) | https://api.nasa.gov/ | **Live API**: close-approach object name, estimated diameter, date, miss distance and velocity generate fictional observation contracts |
| NASA DONKI — Space Weather Database | https://ccmc.gsfc.nasa.gov/tools/DONKI/ | **Live API** through NASA Open APIs: solar flares, geomagnetic storms and energetic particles change invented game contingency energy margins |
| NASA JPL Horizons System | https://ssd.jpl.nasa.gov/horizons/ | **Optional on-demand data**: historical positions for reference spacecraft when the local service and API are available |
| NASA JPL Horizons API Documentation | https://ssd-api.jpl.nasa.gov/doc/horizons.html | API request format for historical flight-path retrieval |
| JPL Approximate Positions of the Planets | https://ssd.jpl.nasa.gov/planets/approx_pos.html | **Numerical data**: approximate orbital elements and rates used for planetary positions and orbital transfer estimates |
| JPL Astrodynamic Parameters | https://ssd.jpl.nasa.gov/astro_par.html | **Numerical data**: gravitational parameters used in orbit, delta-v and transfer calculations |
| JPL Planetary Physical Parameters | https://ssd.jpl.nasa.gov/planets/phys_par.html | Reference planetary radii used in idealized orbit and capture estimates |
| NASA Planetary Fact Sheet | https://nssdc.gsfc.nasa.gov/planetary/factsheet/ | Reference dimensions and environmental values |
| NASA CubeSat 101 | https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf | Reference 1U/3U form factors supporting fictional rideshare requirements |
| NASA 2026 Small Spacecraft State-of-the-Art — In-Space Propulsion | https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/ | Published/surveyed propulsion performance context for engineering catalog |
| NASA 2026 Small Spacecraft State-of-the-Art — Power | https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/ | Solar-cell and battery references for spacecraft sizing |
| NASA 2026 Small Spacecraft State-of-the-Art — Thermal Control | https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/ | Thermal-control materials and radiator engineering context |
| NASA 2026 Small Spacecraft State-of-the-Art — Structures | https://www.nasa.gov/smallsat-institute/sst-soa/structures-materials-and-mechanisms/ | Small spacecraft chassis/structure references |
| NASA 2026 Small Spacecraft State-of-the-Art — GNC | https://www.nasa.gov/smallsat-institute/sst-soa/guidance-navigation-and-control/ | Attitude determination and control hardware reference |
| NASA Glenn — Ideal Rocket Equation | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/ | Rocket equation learning and propulsion math |
| NASA GSFC Solar Irradiance Science | https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science | Near-1 AU solar irradiance reference |
| NASA Dawn Spacecraft and 3D Model | https://science.nasa.gov/3d-resources/dawn/ | Historical spacecraft reference visual; NASA-provided model optionally downloaded locally |
| NASA Voyager Probe B 3D Model | https://science.nasa.gov/3d-resources/voyager-probe-b/ | Historical spacecraft reference visual; NASA-provided model optionally downloaded locally |
| NASA Psyche Mission Spacecraft | https://science.nasa.gov/mission/psyche/spacecraft/ | Historical/reference spacecraft profile and image |
| NASA New Horizons Mission | https://science.nasa.gov/mission/new-horizons/ | Historical mission reference |
| NASA Voyager Mission | https://science.nasa.gov/mission/voyager/ | Historical mission reference |
| NASA General Mission Analysis Tool (GMAT) | https://github.com/NASA/GMAT | **Research reference only**; the game does not execute GMAT |
| NASA Mission Visualization (mission-viz) | https://github.com/nasa/mission-viz | **Research reference only**; not embedded as code |
| NASA JEOD — Engineering Orbital Dynamics | https://github.com/nasa/jeod | **Research reference only**; not embedded as code |

NASA data above supports a **simplified educational simulation**, not a flight-certified feasibility finding. NeoWs observation contracts do not intercept asteroids or use their actual orbits for spacecraft rendezvous. The game's battery-contingency hours, financial rewards, payload requirements and most commercial equipment assumptions are invented.

## 2. Canadian Space Agency — Space Agency Partner

| Link text / resource | Full public URL | Use |
| --- | --- | --- |
| CSA NEOSSAT Data Tutorial | https://github.com/asc-csa/NEOSSAT_Tutorial | **Research and data provenance** for fictional Canadian optical asteroid survey; actual FITS images are not downloaded into the game |
| CSA CASSIOPE Satellite Data Tutorial | https://github.com/asc-csa/CASSIOPE-Tutorial | **Research and data provenance** for fictional auroral-imaging mission; no actual FAI raster is embedded |
| CSA Earth Observation Visualization and Search Tutorial | https://github.com/asc-csa/EO-Visualization-and-Search-Tutorial | **Research and data provenance** for fictional radar Earth-observation mission |
| CSA RADARSAT-1 Open Data Scripts | https://github.com/asc-csa/radarsat1-scripts | **Research and data provenance** for synthetic aperture radar mission scenario; real SAR imagery is not bundled |

The scenario instruments, data rates, masses, prices and mission deadlines are invented game values, not CSA satellite specifications.

## 3. Industry, government and commercial space references

| Link text / resource | Full public URL | Use |
| --- | --- | --- |
| Galaxia — Onyx Edge Orbital Computing | https://gx.space/news-press-releases/galaxia-introduces-onyx-edge | **Concept inspiration** for fictional orbital edge compute and hosted-service mechanics |
| Galaxia — OSPREY and Halifax Class | https://gx.space/news-press-releases/galaxia-unveils-osprey-advancing-canadian-built-space-technology-for-defence-applications | **Concept inspiration** for fictional hybrid RF/optical satellite network |
| Kepler Communications | https://www.kepler.space/ | **Industry inspiration** for space-based data relay and satellite networks |
| Reaction Dynamics — Borealis | https://www.reactiondynamics.space/en/news/reaction-dynamics-unveils-borealis | **Industry reference** for a proposed Canadian medium-lift launch stage |
| NordSpace — Canadian Launch and Spacecraft | https://www.nordspace.com/ | **Industry reference** for proposed Canadian launch vehicles and satellite services |
| Maritime Launch Services — Spaceport Nova Scotia | https://maritimelaunch.com/launch/spaceport-nova-scotia | **Industry context** for Canadian launch infrastructure |
| SpaceX — Falcon 9 | https://www.spacex.com/vehicles/falcon-9/ | **Reference** for an international launch-service option |
| SpaceX — Capabilities and Services | https://www.spacex.com/assets/media/Capabilities%26Services.pdf | **Published reference** for standard GTO service pricing and expendable vehicle payload figures; not a quote for the game's LEO missions |
| SpaceX — Starship | https://www.spacex.com/vehicles/starship/ | **Concept/target capability reference**; game pricing is fictional |
| Government of Canada — Sovereign Space Launch Investments | https://www.canada.ca/en/department-national-defence/news/2026/03/minister-mcguinty-announces-strategic-investments-in-sovereign-space-launch.html | Public policy/industry background for Canadian launch progression |
| DARPA — DRACO Nuclear Thermal Propulsion | https://www.darpa.mil/research/programs/demonstration-rocket-for-agile-cislunar-operations | **Research context only** for nuclear thermal propulsion concepts |
| GAO — Project Prometheus | https://www.gao.gov/products/gao-05-242 | **Historical research reference** for the unflown Jupiter Icy Moons Orbiter concept |

No commercial supplier endorses this game. Fictional satellite modules, propulsion integration, launch service fees, revenue, and research unlocks are **not** supplier quotes or claims of operational availability.

## 4. Software libraries, languages, development tools and typography

| Link text / resource | Full public URL | Use |
| --- | --- | --- |
| React | https://react.dev/ | Web application user interface |
| React DOM | https://react.dev/reference/react-dom | Browser rendering library |
| TypeScript | https://www.typescriptlang.org/ | Main typed application code |
| JavaScript | https://developer.mozilla.org/en-US/docs/Web/JavaScript | Browser and Node runtime language |
| Vite | https://vite.dev/ | Development server, build pipeline and API proxy |
| Node.js | https://nodejs.org/ | JavaScript build and development runtime |
| Three.js | https://threejs.org/ | Interactive 3D spacecraft and GLB viewing |
| React Three Fiber | https://r3f.docs.pmnd.rs/ | React/Three.js renderer integration |
| Drei | https://drei.docs.pmnd.rs/ | 3D controls and helper components |
| Orekit | https://www.orekit.org/ | **Optional locally run Java service** for Lambert transfer and Keplerian propagation |
| Java | https://www.java.com/ | Optional orbital calculation backend language/runtime |
| Apache Maven | https://maven.apache.org/ | Optional Java service dependency/build tooling |
| Jackson Databind | https://github.com/FasterXML/jackson-databind | Java JSON request/response serialization |
| Vitest | https://vitest.dev/ | Browser-model and gameplay unit tests |
| Playwright | https://playwright.dev/ | Automated browser reliability tests |
| JUnit 5 | https://junit.org/junit5/ | Java numerical/backend tests |
| GitHub | https://github.com/ | Source versioning and hosting |
| GitHub Actions | https://github.com/features/actions | Continuous integration and automated tests |
| Google Fonts — DM Sans and Space Grotesk | https://fonts.google.com/ | Optional web fonts in UI; subject to font licenses |
| OpenAI ChatGPT | https://chatgpt.com/ | **AI-assisted** concepts, code implementation, documentation, tests, and technical explanations |

Exact runtime and development dependencies are also listed in [package.json](../package.json), [Java pom.xml](../orekit-service/pom.xml), and relevant code imports. The project uses standard HTML/CSS/SVG along with the frameworks above.

## 5. Additional reading used during research

| Link text / resource | Full public URL | Use |
| --- | --- | --- |
| Wikipedia — Ion Thruster | https://en.wikipedia.org/wiki/Ion_thruster | Background taxonomy only, not primary authority for numerical hardware values |
| Wikipedia — Project Prometheus | https://en.wikipedia.org/wiki/Project_Prometheus | Historical discovery reference only; NASA and GAO materials are technical authorities |
| NASA Eyes on the Solar System | https://eyes.nasa.gov/apps/solar-system/ | Interface inspiration; no source code/assets copied |

## Copyright, images and AI / SI disclosure

- **NASA reference images and 3D models:** used in the mission-reference section with attribution to their original NASA/JPL sources. Their use remains subject to original credits and NASA media guidelines; the game does not imply NASA endorsement.
- **CSA tutorials:** cited and used for technical research and scenario inspiration, **not** as a claim that third-party CSA imagery/code was redistributed or run inside the app.
- **Industry and government pages:** referenced for concepts and public descriptions; no supplier logos, copyrighted illustrations, or proprietary CAD files are included by this resource index.
- **Original graphics:** most game graphics are constructed in code (Three.js, SVG and CSS). User-imported GLB files remain user-provided and do not automatically become the project's redistribution rights.
- **Third-party open-source code:** subject to the applicable upstream licenses. Publicly accessible does not mean unrestricted copyright permission.
- **AI/SI assistance:** ChatGPT was used to draft and refine code, tests, game architecture, written explanations and documentation. The user originated and directed the game concepts, design priorities and engineering trade-offs. AI-assisted code was subject to project testing and review. This disclosure must also be reflected in the Space Apps SI/AI questionnaire.

## Implementation and provenance

- [Full NASA and game-data lineage](SOURCES_AND_DATA.md)
- [Extended citations and attribution](ATTRIBUTION.md)
- [NASA engineering research notes](NASA_TECHNOLOGY_RESEARCH.md)
- [Project source and dependency inventory](../README.md)

**Important:** This is a hackathon educational prototype, not a mission-operations tool, an official NASA/CSA product, or a flight-certified engineering analysis package.
