# Sources, tools, and SI/AI attribution

This file documents the resources actually used by the **Space Race: Beyond Earth v0.1 starter project**. Update it whenever new data, assets, code, or AI-generated content is incorporated.

## NASA / JPL resources used in the application

| Source | Link | Actual usage |
| --- | --- | --- |
| JPL Solar System Dynamics — Astrodynamic Parameters | https://ssd.jpl.nasa.gov/astro_par.html | Earth gravitational parameter `GM = 398600.435507 km³/s²` for circular orbital velocity/period |
| NASA NSSDC Earth Fact Sheet | https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html | Equatorial radius `6378.137 km` to convert altitude into orbital radius |

The game uses classical two-body equations; these are general mechanics, not a claim that NASA has approved the model. All mission payouts, component prices, engine figures, and mission readiness delta-V thresholds are original *illustrative gameplay* assumptions, **not NASA datasets**.

## Additional NASA references used in the subsystem research code

The technology catalog `src/lib/spacecraftTechnology.ts` and first-order engineering module `src/lib/spacecraftSystems.ts` include NASA-surveyed manufacturer information and NASA solar irradiance reference data. These are not wired into the game UI yet.

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
