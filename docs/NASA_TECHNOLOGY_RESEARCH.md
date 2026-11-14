# NASA technology research for the Spacecraft Builder

Research date: November 14, 2026. Source of truth: NASA's **2026 State-of-the-Art of Small Spacecraft Technology** (S3VI), alongside NASA Glenn, NASA GSFC, and JPL resources.

**Status:** Research-backed catalog and pure engineering calculations have been added to `src/lib/spacecraftTechnology.ts` and `src/lib/spacecraftSystems.ts`. They are **not yet hooked up to the gameplay interface**. The existing launch-vehicle contract simulator continues to use explicitly illustrative game engine and contract values.

## 1. Model boundaries: launch vehicle vs. in-space spacecraft

This distinction prevents a major category error:
- **Launch vehicle:** high-thrust rocket stages, atmospheric ascent, staging, structural loads, launch site, ascent losses, payload injection. Current `src/lib/engineering.ts` models an idealized high-thrust launch vehicle with fictitious engine figures.
- **In-space spacecraft bus:** payload, thermal, electric power, communication, GNC, avionics, in-space propulsion, pressurant/feed systems, structure. NASA's 2026 Small Spacecraft report focuses on these smaller in-space systems, not launch engines.
- **Mission/trajectory:** separate demand model containing target orbit, maneuvers, duration, eclipse, heliocentric distance and pointing/data constraints. Do not use spacecraft delta-V alone as proof of orbital insertion or interplanetary arrival.

### Component record principles
Every selectable technology should provide:
- `technologyId`, `family`, `manufacturer/name`, `version`, `sourceUrl`, `sourceTable`, `sourceDate`, `provenance` (NASA measurement / NASA survey of manufacturers / model assumption).
- Performance numbers **with units and operating point** (e.g. thrust **mN**, Isp **s**, input electrical power **W**, mass **kg**, **BOL/EOL**, one-sun conditions).
- `componentScope`: cell vs array, thruster head vs full propulsion system, battery cell vs battery pack, chassis vs assembled spacecraft; prevents mass double-counting.
- Applicable environment/TRL (when actually supplied), margins, resource dependencies, and a record of what is unknown.
- User-supplied design choices and game prices **separately** from physical constants and NASA-surveyed performance.

NASA's report is principally a survey of public literature and manufacturer claims; it is not a certification of each device, nor a NASA endorsement of a vendor.

## 2. Propulsion

Official chapter: [NASA 2026 — In-Space Propulsion](https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/) (Tables 4-1, 4-9, 4-10). It categorizes in-space chemical, electric and propellantless devices.

**Surveyed ranges for SMALL spacecraft, not universal physical limits:**

| Type | Surveyed thrust | Surveyed specific impulse |
| --- | --- | --- |
| Hydrazine monopropellant | 0.25–28 N | 180–285 s |
| Cold gas | 10 µN–3.6 N | 40–110 s |
| Gridded ion | 0.1–20 mN | 500–3,000 s |
| Hall-effect | 0.25–55 mN | 200–1,920 s |
| Electrospray | 20 µN–20 mN | 225–3,000 s |

**Discrete examples included in `spacecraftTechnology.ts`:**

| Component | Propellant | Thrust | Isp | Input power | Reported mass |
| --- | --- | --- | --- | --- | --- |
| Busek BHT-100 Hall | Xe | 6.3 mN | 1,086 s | 105 W | 1.2 kg (thruster-head figure) |
| Busek BHT-200 Hall | Xe | 13 mN | 1,390 s | 250 W | 1.2 kg (thruster-head figure) |
| Busek BIT-3 gridded ion | Iodine | 1.0 mN | 1,960 s | 70 W | 2.9 kg, **integrated wet** |

The 2026 report warns that systems can be integrated or distributed, and propulsion power-processing, storage, feed and pressurization should **not** be assumed included in a bare thruster-head specification. Power for the full propulsion system could exceed a table's stated thruster operating power. Do not use Hall thrusters to launch from Earth.

**Implemented equations in `spacecraftSystems.ts`:**

- Ideal maneuver delta-V: `Δv = Isp × g0 × ln(m_initial/m_final)` (m/s).
- Propellant requirement: `m_prop = m_final × [exp(Δv/(Isp × g0)) − 1]` (kg).
- Mass flow: `m_dot = F / (Isp × g0)` (kg/s), with F in **N**.
- Constant-thrust burn duration: `t_burn = m_prop / m_dot` (s).

References: [NASA Glenn — Ideal Rocket Equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/); [NASA Glenn — Specific Impulse](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/specific-impulse/).

**Limitations:** ideal constant-Isp, constant-thrust burn in the absence of external forces; no gravity, drag, pointing, staging, tank-residual losses, throttling or low-thrust orbital integration. A 1 kg propellant burn on a 13 mN Hall device takes many days. High Isp does not automatically mean high transfer speed.

**Next:** add propellant inventories, finite-burn time as a mission constraint, engine lifetime/total impulse, power-processing load, feed/storage mass, and eventually orbit propagation.

## 3. Electrical power

Official: [NASA 2026 — Power](https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/) (Tables 3-1, 3-5 and 3-8). GSFC [Solar Irradiance Science](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science) reports **1361.6 ± 0.3 W/m²** at the 2019 solar minimum; this is a documented reference irradiance at 1 AU, not a perfectly constant quantity.

Select solar technologies:
- AZUR 3G30-Adv: **29.5%** beginning-of-life (BOL) cell efficiency; table's quoted **403 W/m²** peak cell output.
- AZUR 4G32-Adv: **31.5%**, **431 W/m²**.
- Rocket Lab ZTJ: **29.5%**, **397.7 W/m²**.
- Rocket Lab IMMα: **32.0%**, **433.1 W/m²**.

**Sizing equation implemented:** `P_solar ≈ G_1AU × A_active_cells × η_cell × cos(θ) × d_user / r_AU²`.

Here `d_user` is a *user-defined* loss/degradation factor (not a NASA default). Select either `η_cell × irradiance` **or** a manufacturer's reported `W/m²` at test conditions, **not both**. Arrays add substrate, deployment mass, power-conversion losses, temperature derating, aging, radiation and pointing constraints. The current function does **not** calculate array mass, eclipse duration or array EOL degradation automatically.

NASA Table 3-5 gives **PACK-specific** energy examples:
- AAC Clyde Space Optimus: **119.4 Wh/kg**
- Astro Digital Direct Energy Pack: **144 Wh/kg**
- EaglePicher NPD-002271: **153.5 Wh/kg**

**Battery sizing:** `E_eclipse = P_eclipse × t_hours`; `m_battery = E_eclipse / (specificEnergy_pack × DOD_max × η_discharge)`.
`DOD_max`, end-of-life derating and discharge efficiency need design choices or references; do not silently hardcode them as flight-qualified facts.

**Architecture dependency:** power available to Hall thrusters varies with solar distance, eclipse, sun-pointing and simultaneous electronics loads. A spacecraft with sufficient propellant may still be unable to burn on its desired timeline.

## 4. Thermal control

Official: [NASA 2026 — Thermal Control](https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/) (Tables 7-2 to 7-13).

Options include:
- Thermal surface treatments, low-alpha films, multilayer insulation (MLI), conductive thermal straps, heat pipes, deployable radiators, phase-change materials, heaters, cryocoolers, thermoelectric coolers.
- NASA GSFC silver composite coating on 200HN Kapton: **solar absorptivity 0.10** (Table 7-4); 0.005-inch FEP/Ag/Inconel film: **0.07**.
- Important: Table 7-4 reports solar absorptivity, not corresponding emissivity. **Do not invent emissivity for a named coating** from the absorptivity number.

**Preliminary equations implemented:**
- `Q_sun_absorbed ≈ α × G_1AU × A_projected × cos(θ) / r_AU²`.
- `Q_radiated = ε × σ × A_radiator × (T_radiator⁴ − T_sink⁴)`.
- `A_radiator = Q_required / [ε × σ × (T_radiator⁴ − T_sink⁴)]`.

Stefan-Boltzmann constant `σ = 5.670374419e-8 W/(m² K⁴)`. Thermal calculations are **simplified isolated-surface radiation**; real designs require solar and planetary infrared/albedo inputs, view factors, conductive paths, transients, internal heat sources, temperature limits and heater cycles. A true thermal network should follow once the basic calculations are working.

**Dependency:** upgrading processors or electrical propulsion often increases dissipated heat and therefore radiator area/mass or active cooling demand. Electrical input to a thruster **is not all automatically spacecraft waste heat**, since energy is carried away in the exhaust.

## 5. Propellant tanks and pressure systems

Sources:
- [NASA JSC — Propulsion Subsystems](https://www.nasa.gov/reference/jsc-propulsion-subsystems/) describes tanks, pressure-fed systems, helium pressurization, feed lines, valves and fluid-system testing.
- [NASA SmallSat — In-Space Propulsion](https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/) covers propellant management devices and integral vs. distributed storage.
- [NASA hydrazine tank data for spacecraft](https://netspublic.grc.nasa.gov/main/Juno%20FIN%20NRP%20EA%20Pkg-9-4-08.pdf) includes actual heritage tank geometry and masses; for example, its MSL cruise-stage spherical tanks each report **59.5 L** total volume and **6.0 kg** empty tank mass. This is a **reference design**, not a universal kg/L scale.

**Implemented first-order LIQUID tank model** (requiring user-supplied liquid density, pressure and material allowable stress):
- `V_liquid = m_prop / ρ_prop`;
- `V_tank = V_liquid / (1 - f_ullage)`;
- Spherical tank `r = [3 V_tank / (4π)]^(1/3)`;
- Ideal thin spherical membrane shell `t ≈ ΔP × r / (2 S_allow)`;
- Ideal shell mass `m ≈ 4π r² × t × ρ_shell`.

This is **not** a design-code/flight safety result and intentionally excludes bosses, mounts, PMDs, welds, pressurant bottles, feed lines, proof/burst, fatigue, thermal stresses, material effects at cryogenic temperatures, insulation, and boiloff. It reports an indicator for whether the thin-wall assumption `t/r < 0.05` remains plausible. Do not apply incompressible liquid density sizing to compressed gases like xenon.

**Next:** select chemical storage vs high-pressure gas vs cryogenic storage as three distinct physical models, with separate materials/property tables and design data. Add liquid density sources and propellant mixture ratio only after specific operating temperature/pressure is known.

## 6. Structures and mechanisms

Official: [NASA 2026 — Structures, Materials and Mechanisms](https://www.nasa.gov/smallsat-institute/sst-soa/structures-materials-and-mechanisms/) (Table 6-1).

Nominal reference chassis:
- 1U: **100 × 100 × 113.5 mm**, structure reference mass **0.118 kg**
- 3U: **100 × 100 × 340.5 mm**, reference mass **0.352 kg**
- 6U: **100 × 226.3 × 366 mm**, reference mass **0.916–1.94 kg**

These are chassis/structure reference numbers, **not allowable spacecraft wet masses**.

**Next:** total dry-mass roll-up by hardware; structures volume/packaging checks; player-adjustable margin; solar array deployment loads; tank supports; center of mass; system-level mass/launch cost. Don't turn chassis dimensions into a false rigorous structures FE analysis.

## 7. GNC, avionics and communications

- [NASA 2026 — Guidance Navigation & Control](https://www.nasa.gov/smallsat-institute/sst-soa/guidance-navigation-and-control/): reaction wheels, star trackers, Sun sensors, magnetic torquers, deep-space navigation and attitude control, with real hardware tables. E.g., a surveyed integrated BCT XACT-15 ADCS mass **0.885 kg** in Table 5-2.
- [NASA 2026 — Small Spacecraft Avionics](https://www.nasa.gov/smallsat-institute/sst-soa/small-spacecraft-avionics/): onboard computing, radiation tolerance, memory, flight software, autonomy.
- [NASA 2026 — Communications](https://www.nasa.gov/smallsat-institute/sst-soa/soa-communications/): antennas, RF and free-space optical transceivers and link budgets.

**Later models:**
- Reaction wheel torque/acceleration `α = τ/I`; momentum storage and desaturation constraints need actual spacecraft inertia and disturbance torques.
- RF free-space path loss `FSPL = (4πR/λ)²`, receive power and link margin with transmit power, antenna gains, receiver noise, bandwidth, modulation and pointing.
- Data generation/downlink and onboard storage budget; processor power/load and a reliability estimate.
- Avoid interpreting component TRL as a spacecraft-wide success probability.

## 8. Orbital and mission coupling (next phase)

JPL [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) gives planetary ephemerides; [NAIF SPICE](https://naif.jpl.nasa.gov/naif/spiceconcept.html) provides kernels for planetary/spacecraft ephemerides and geometry.

For a near-term hackathon, use the existing NASA/JPL Earth constants to keep orbit mechanics separate from the full spacecraft design. Future transfers should incorporate positions/velocities and a real transfer solver or validated simplified algorithms, not a fake arbitrary launch-window timer.

**API caution:** JPL SSD documentation warns that these APIs may not be embedded directly into browser websites. For the client-side game, prefer a curated, versioned/precomputed NASA-derived data file or a compliant server-side process (and store source and retrieval timestamp).

## 9. Builder implementation order

1. **Engineering-core (added):** source-backed technology catalog, unit-safe first-order functions and tests in `src/lib/`.
2. **UI integration (not yet done):** tabs for Propulsion, Tanks, Electrical Power, Thermal, Structure, GNC; context-aware values, warnings and source links.
3. **Cross-subsystem iteration:** mass build-up → propulsion propellant → tank/structure mass → power/battery mass → thermal sizing → updated mass; converge rather than calculate once.
4. **Mission checking:** delta-V, burn time, time-to-mission, continuous/peak power, eclipse energy, thermal limits and packaging; clear engineering assumptions and uncertainty.
5. **Game progression:** research unlocks new physical devices or improves production cost; manufacturing experience decreases production cost without magically increasing Isp.
6. **Later:** chemical launch stages, detailed multi-burn trajectory modeling, tank feed dynamics, thermal transient networks, solar array EOL and deep-space power.

The entire point is to make selecting an engineering component alter **several dependent constraints**. Keep fictional prices and research progress in the gameplay domain, not in the physics catalog.

## 10. Citation and submission policy

- For NASA Space Apps, cite each **resource actually used**, not just one that was read. Existing game orbit calculations reference JPL Earth's gravitational parameter and NASA NSSDC Earth radius.
- The new technology catalog and pure formulas are in code, but the v0.1 UI does not yet expose these components.
- Report **NASA measurement**, **NASA-surveyed manufacturer information**, **analytical physical equations**, and **gameplay assumptions** as separate categories.
- NASA's report is extensive but explicitly not an exhaustive or independently certified specification of every technology. Check original manufacturer references for engineering design, flight heritage and requirements.
- ChatGPT assisted with coding, research organization, documentation and first-order equations, subject to testing and engineering review. Ensure AI/SI disclosure matches the final submission.

## Primary NASA and JPL resources

1. https://www.nasa.gov/smallsat-institute/sst-soa/
2. https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/
3. https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/
4. https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/
5. https://www.nasa.gov/smallsat-institute/sst-soa/structures-materials-and-mechanisms/
6. https://www.nasa.gov/smallsat-institute/sst-soa/guidance-navigation-and-control/
7. https://www.nasa.gov/smallsat-institute/sst-soa/small-spacecraft-avionics/
8. https://www.nasa.gov/smallsat-institute/sst-soa/soa-communications/
9. https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science
10. https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/
11. https://www.nasa.gov/reference/jsc-propulsion-subsystems/
12. https://netspublic.grc.nasa.gov/main/Juno%20FIN%20NRP%20EA%20Pkg-9-4-08.pdf
13. https://ssd-api.jpl.nasa.gov/doc/horizons.html
14. https://naif.jpl.nasa.gov/naif/spiceconcept.html
