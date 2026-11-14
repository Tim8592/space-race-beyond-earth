# Spacecraft CAD integration and orbital trajectory roadmap

Updated 2026-11-14. This document distinguishes **already implemented** from **possible future integrations**.

## Available now

- React/TypeScript/SVG 2D map without additional runtime packages: `src/OrbitalLab.tsx`.
- Earth-centred Kepler two-body numerical propagation from selected perigee altitude, eccentricity and argument of periapsis: `src/lib/orbitalMechanics.ts`.
- JPL approximate major-planet orbital positions (1800–2050) projected in the J2000 ecliptic plane, with draggable timeline range and play/pause animation.
- Spacecraft subsystems with solar PV, heritage radioisotope sources, historical fission and a ground-test fission reference.
- **Not** a transfer solver and **not** a validation of a vehicle mission.

## Recommended 3D spacecraft architecture (future, not installed)

**Recommended web route: Onshape CAD -> GLB/glTF -> Three.js React model viewer**.

- Onshape CAD: https://www.onshape.com/ ; exports GLTF/GLB/STEP and has developer APIs. Web app REST integration should be server-mediated and OAuth/API credentials kept outside the browser. https://onshape-public.github.io/docs/app-dev/ ; https://cad.onshape.com/help/Content/File/exporting_files.htm
- Three.js: https://threejs.org/ (runtime WebGL rendering; glTF loader). https://threejs.org/manual/pages/loading-3d-models.html
- React Three Fiber (optional for declarative 3D UI): https://r3f.docs.pmnd.rs/
- FreeCAD: https://www.freecad.org/ ; Python scripting, geometry and STEP exchange. Useful for local/offline parametric component generation.
- OpenCascade CAD kernel / browser WASM is a **future advanced option** if editing actual solid B-rep geometry inside our own app rather than importing CAD-built parts. That is substantially harder than 3D viewing.

**Component-to-CAD bridge:** store engineering source-of-truth records for each physical component: ID, units, provenance, modeled mass / inertia tensor, envelope, mating interfaces, frame, orientation, resource ports and an optional glTF mesh. 3D is the VIEW; physics should not depend on mesh triangles alone. Validate unit conversion and coordinate frames. Simulations such as a live cable-mass calculation can later compute cable length from 3D port coordinates and properties.

## Orbit simulation quality ladder

**Current (implemented):**
- Keplerian satellite orbits about Earth using real NASA/JPL Earth constants. No drag, J2, n-body interactions, finite thrust or reentry.
- JPL Table 1 (1800–2050) approximate positions for Venus, Earth–Moon barycenter, Mars and Jupiter. These are animated by date, but they are **not** trajectory solutions for departing spacecraft.

**Next:**
1. Make time an explicit game simulation epoch and use the same epoch in physics, contracts and map.
2. Define missions with initial/target orbit and tolerances, not just an arbitrary required delta-V.
3. Implement **two-impulse Hohmann transfer** demonstrator for circular, coplanar orbits. Compare departure/capture burns and time of flight; disclose assumptions. Useful for Earth-orbit transfers.
4. Add **Lambert two-body transfer solver** over JPL planet departure and arrival states, plotting the resulting heliocentric conic; search departure date × arrival date, with realistic C3, v-infinity and delta-V diagnostics.
5. Include **patched conics** and separate launch/injection, heliocentric coast, encounter/capture, and orbital operations. Transfer geometry and varying launch energy should drive windows rather than hard coded restrictions.
6. Implement **finite-thrust numerical propagation** for ion/Hall; evaluate power availability vs distance and eclipse, acceleration vs changing spacecraft mass, propellant consumption, engine duty cycle, thruster lifetime and mission duration. Impulsive Lambert solutions cannot describe years-long burns with a low-thrust electric spacecraft.
7. Only then connect success/failure contracts and interplanetary mission payouts to numerical results.

**Future physics libraries/tools:** plain TypeScript is enough for Kepler and ideal two-body orbits. For Lambert, testing against established astrodynamics references or a server-side orbital library such as **Orekit** may help. For high fidelity, use **JPL Horizons** or **NAIF SPICE** kernels via controlled preprocessing/server tools rather than hitting Horizons on every browser animation frame.

Important NASA source and caveat:
- https://ssd.jpl.nasa.gov/planets/approx_pos.html (approximate elements and accuracy limitations)
- https://ssd.jpl.nasa.gov/planets/orbits.html (Horizons/DE reference)
- https://ssd.jpl.nasa.gov/tools/mdesign.html (JPL two-body mission design tool; approximate only)
- https://ssd.jpl.nasa.gov/faq.html (interactive visualization should often prefer local approximations rather than massive ephemeris web queries)

## Flight-heritage power modes and thermal dependencies

The builder currently implements photovoltaic output, MMRTG, Voyager MHW-RTG, GPHS-RTG, historic SNAP-10A, and ground-tested KRUSTY class. Its generator count, output and reference mass flow into the electrical supply and modeled spacecraft mass. It does **not** make a reactor technology flight-ready just because it is selectable. Reactor shielding and source thermal rejection are unmodeled; radioisotope source waste heat is not blindly assigned to the bus radiator.

Additional proven technology **to consider later**: Apollo/Shuttle hydrogen-oxygen fuel cells. They were flown, but consumed cryogenic reactants and need fuel/oxygen inventories, feed equipment, thermal management and an energy budget before a credible design can be simulated. NASA Apollo fuel cell report: https://ntrs.nasa.gov/api/citations/19730011146/downloads/19730011146.pdf

## Submission principles

NASA data actually used must be recorded in `docs/ATTRIBUTION.md` and included on the NASA Space Apps project page, while the assistant's programming/documentation assistance is listed in SI/AI disclosures. No generated NASA branding should be added.
