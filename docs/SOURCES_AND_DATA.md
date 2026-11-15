# NASA Space Apps 2026 — data lineage and future mission milestones

Reviewed 2026-11-14. This document is intended to make the actual use of NASA source data easy for judges to verify. The game is an independent, educational prototype, not an endorsed mission-design tool.

## Challenge-resource NASA data used as input, not merely referenced

**NASA CubeSat 101**, NASA CubeSat Launch Initiative (2017), Section 1.1:
<https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf>

- Source data: 1U 10 × 10 × 11 cm and approximately 1–1.33 kg; 3U 10 × 10 × 34 cm.
- Implemented in **src/lib/campaignMissions.ts** as `NASA_CUBESAT_REFERENCE` and in the flight review for special **NASA CubeSat 101 · 3U Rideshare** contracts. The player selects a 1U, 3U or no rideshare/dispenser option.
- Changing the selected format recalculates spacecraft launch mass, electrical draw and procurement cost; a 3U-only contract cannot pass readiness with an incompatible dispenser.
- **Fidelity**: 3U reference payload mass is calculated as 3 × 1.33 kg for game purposes; not asserted as a real 3U mass standard. Dispenser mass, cost and electrical demand are game assumptions. The historical 2017 PDF does not supersede an actual launch provider's current interface-control document.

The **Space Mission Design Game** challenge lists CubeSat 101 in its NASA Resources section. The judging authority decides eligibility; we do not claim to certify compliance.

## Other active NASA/JPL numerical sources

- JPL *Approximate Positions of the Planets* (1800–2050): <https://ssd.jpl.nasa.gov/planets/approx_pos.html>. Numerical orbital elements and secular rates are stored in `src/lib/orbitalMechanics.ts` and used in heliocentric position calculations and planetary phase indicators.
- JPL *Astrodynamic Parameters*: <https://ssd.jpl.nasa.gov/astro_par.html>. Gravitational parameters in orbital energy, circular-orbit speeds and Keplerian motion.
- NASA/NSSDC *Planetary Fact Sheet*: <https://nssdc.gsfc.nasa.gov/planetary/factsheet/>. Planetary reference dimensions and environment.
- NASA GMAT (official challenge resource): <https://software.nasa.gov/software/GSC-17177-1>. Research reference only — the game does not execute GMAT. Optional higher-fidelity impulsive transfers are handled by **Orekit**, not GMAT.

## Planned, real-life NASA missions used for fictional support contracts

- **Europa Clipper**, December 2026 Earth gravity-assist flyby and April 2030 Jupiter orbit insertion: <https://science.nasa.gov/mission/europa-clipper/mission-timeline/>.
- **NEO Surveyor**, not-earlier-than September 2027 launch, asteroid/comet infrared telescope: <https://science.nasa.gov/mission/neo-surveyor/>.
- **SkyFall**, late-2028 planned Mars rotorcraft mission: <https://science.nasa.gov/mission/skyfall/>.
- **Dragonfly**, NET July 2028 launch, late-2034 Titan arrival: <https://science.nasa.gov/mission/dragonfly/>. Listed as a future mission in the references tab, not as a playable fake Saturn trajectory.

Mission titles, prizes, proposal/launch windows, energy thresholds, CubeSat dispenser costs, required payload masses, and the player's spacecraft are **fictional**. If a fictional NASA-inspired proposal period is missed, a **25% lower-paying follow-on contract** remains playable, under the original contract ID (only one reward). Original NASA milestones are not repeated, and main story unlocks do not depend on accepting them. In particular: the game asteroid is synthetic, its NEO Surveyor contract does not use the actual Sun-Earth L1 orbit; the Jupiter scenario is a flyby rather than Europa Clipper's Jupiter orbit insertion; SkyFall's actual reactor-powered transfer is not simulated. Spacecraft and real mission properties must not be conflated with gameplay parameters.

## Launcher, cost, spacecraft delivery and Moon cargo provenance (v1.5)

- **SpaceX Falcon 9 published service price (2026):** SpaceX *Capabilities & Services*, published 2025, standard Falcon 9 payment plan **$74 million through 2026** for a service up to 5.5 metric tons to standard **GTO**, and maximum **fully expendable** LEO capability **22,000 kg**. <https://www.spacex.com/assets/media/Capabilities%26Services.pdf>. This does **not** state that a reused Falcon 9 has a 22-tonne payload or that any specific LEO mission is $74M. Game assumptions use a conservative **15,500 kg** reusable LEO scenario with a $74M reference price for comparison, not a real quote.
- **Starship published capability:** <https://new.spacex.com/vehicles/starship> advertises the 100+ tonne *design* goal for fully reusable LEO operations; the game's **100,000 kg** capacity and **$180M** launch fee are purely speculative comparison figures, not actual commercially offered pricing. Falcon Heavy game payload and price, additional fleet-level reuse discounts, orbital assembly economics, and integration weight penalties are equally fictional.
- **Game rocket math:** `src/lib/engineering.ts` calculates ideal ascent Δv and liftoff thrust-to-weight for the user's custom rocket. `src/lib/launchLogistics.ts` computes an indicative LEO payload limit for that rocket at 9,300 m/s reference ascent demand and minimum 1.15 TWR, then uses it, or a separately identified service capacity, in an itemized multi-flight manifest. **The full spacecraft and kick-stage WET mass, including propellant, must be launched;** additional dock/join kits add to the manifest. Each flight is paid separately. No real multi-body ascent trajectory, recovery dynamics or mechanical docking simulation is claimed.
- **Lunar logistics:** `src/lib/launchLogistics.ts` lists each required payload component and masses in three fictional Moon Base stages. A chemical lander dry-mass estimate uses a fixed structure allowance and 14% of payload; a 5,550 m/s assumed combined TLI/LOI/descent-equivalent ideal Δv at 345s assumed Isp computes propellant mass via the rocket equation. Each cargo mission includes launcher invoices, itemized hardware procurement and optional docking fees. `src/MoonBase.tsx` shows the manifest and a timed lunar transfer. Only cargo receipt plus separate construction investment activates revenue; neither a genuine Moon landing guidance solution nor verified NASA vehicle integration is supplied.
- **Persistence:** `src/App.tsx` stores rocket fleet generation, provider, reuse flight counts, orbital docking license, each assembly-stage inventory and separately timed Moon freight delivery in the original campaign save, migrating older purchased Moon Base levels as already having received supplies.

## v1.4 finance, research and flight playback provenance

All program financial rates, starting cash, Moon Base facilities, commercial revenues, R&D point requirements, daily RP drip, and 105-second mission playback durations are **invented gameplay mechanics**, not NASA budgets, procurement commitments, actual lunar market forecasts or published spacecraft mission operations.

- `src/lib/programEconomy.ts`: single program-day ledger for base operations, active R&D yearly upkeep converted to per-game-day expense, flight operations, lunar base gross income/opex, net cash, and routine research-point accrual. The same day-settlement logic is called when the visible live clock ticks and when a completed mission jumps the calendar.
- `src/lib/technologyTree.ts`: each tech requires BOTH cash and game Research Points plus prerequisite nodes, and neither can be overspent. Program progression and saved RP are handled in `src/App.tsx`.
- `src/MoonBase.tsx`: an interactive, schematic Moon close-up with invented infrastructure locations and three capital investments. Facility placements are illustrative and NOT certified landing coordinates, surveying coordinates or orbital trajectories.
- `src/MissionFlightViewer.tsx` and `src/missionFlightTrajectory.ts`: a live 105-second mission visualization with persisted timestamps and %/ETA. Mars/Jupiter may draw the optional *local Orekit 13.1.9* Sun-centred impulsive Lambert path returned from the same solver model as the Orbital Map. The fallback curve and Moon/asteroid animations are visual-only; a 105-second view is NOT a real-world travel-time prediction. **The Orekit endpoint does not simulate Earth–Moon elliptical transfers or an invented synthetic asteroid.**
- Unlocked planets and future missions do not imply that their actual mission trajectory has been solved: the orbit list hides locked destination/location traces and exposes only the mission name and locked status.

## Propellant depletion, power-constrained thrust and 3D architecture (v1.3)

- The fundamental governing relation **ṁ = F/(Isp · g₀)** and Tsiolkovsky **Δv = Isp · g₀ · ln(m₀/mf)** are implemented in `src/lib/spacecraftSystems.ts` and `src/lib/propulsionBurn.ts`; no fuel is instantaneously deleted to obtain mission Δv. Propellant mass drains throughout the burn and its remaining mass stays aboard.
- Distinguish **ideal all-propellant Δv** (independent of thrust count at fixed wet mass) from **deliverable mission-window Δv** (finite rated engine thrust, time available, firing duty, and whole powered engine count). The distinction explains why reducing engine count can increase total potential Δv while lowering delivered Δv during a short opportunity. Engine counts change dry mass through engine and PPU mass.
- Dual propulsion families share a single time budget and burn sequentially in the selected order. Power left after housekeeping determines how many rated engines can fire; no unpublished throttle efficiency curve is invented.
- `src/lib/structureSizing.ts` computes unique rear nozzle mounts and minimum frame width for the installed engine count. Increasing visual bus frame scale also adds dry mass and an illustrative manufacturing cost; no qualification or structural stress analysis is performed.
- The physics is preliminary: **no numerical finite-thrust orbit propagation, gravity losses during long burns, varying power across a trajectory, eclipse duty integration, flow regulation, propellant boiloff, gimbals, thruster plume interaction or engine qualification**.

## Time and transfer fidelity

- Open browser tab advances **one game day every two real minutes**. Backgrounded/closed tabs do not accumulate real time. Newly started games map the user's browser calendar date to the 2026-11-14 game epoch; previously saved game days remain intact.
- Calendar event cards are pinned to real NASA-reported month/year milestones, but the game deadlines around those milestones are **deliberately invented** for gameplay.
- Browser orbital calculations are two-body Earth orbit / circular-orbit Hohmann educational approximations using JPL elements for rough planetary phase comparison. Orekit can optionally return an impulsive Lambert solution for Mars and Jupiter. Finite-thrust routing, launch-vehicle certification, actual operational flight windows, radiation qualification and flight hardware designs are not modeled.

See [ATTRIBUTION.md](ATTRIBUTION.md) for software and artistic credits.
