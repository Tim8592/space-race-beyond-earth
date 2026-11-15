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

## Time and transfer fidelity

- Open browser tab advances **one game day every two real minutes**. Backgrounded/closed tabs do not accumulate real time. Newly started games map the user's browser calendar date to the 2026-11-14 game epoch; previously saved game days remain intact.
- Calendar event cards are pinned to real NASA-reported month/year milestones, but the game deadlines around those milestones are **deliberately invented** for gameplay.
- Browser orbital calculations are two-body Earth orbit / circular-orbit Hohmann educational approximations using JPL elements for rough planetary phase comparison. Orekit can optionally return an impulsive Lambert solution for Mars and Jupiter. Finite-thrust routing, launch-vehicle certification, actual operational flight windows, radiation qualification and flight hardware designs are not modeled.

See [ATTRIBUTION.md](ATTRIBUTION.md) for software and artistic credits.
