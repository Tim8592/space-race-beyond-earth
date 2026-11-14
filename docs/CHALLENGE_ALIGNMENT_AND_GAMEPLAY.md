> **v0.7 implementation update, Nov 14, 2026:** The priority Earth Observation One vertical slice described below is NOW implemented as a first-order deterministic gameplay demo. It connects shared spacecraft and launcher configurations, instrument/radio/storage choices, mass/power/thermal/eclipsed-energy/downlink/budget bars, seven days of imaging/data operations and a success/failure debrief. The text below also describes future refinements and should not be read as proof of detailed ADCS, real communications passes or mission-grade physics. See [Next steps](NEXT_STEPS_CAMPAIGN_AND_LAB.md).

# Space Race: Beyond Earth — Challenge alignment & gameplay blueprint

**Planning review:** 2026-11-14  
**Challenge:** NASA Space Apps 2026, *Space Mission Design Game*.  
**This is a design proposal, not a statement that the listed future features are implemented.**

## Source and interpretation

- Challenge summary reproduced on NASA Space Apps team pages: https://www.spaceappschallenge.org/2026/find-a-team/missionforge/
- Detailed wording, objectives and optional ideas reproduced by a local Space Apps event: https://hackathlone.com/challenges/space-mission-design-game
- NASA Space Apps 2026 participation and submission deadline: https://www.spaceappschallenge.org/2026/
- Judging categories noted by 2026 NASA Space Apps local event: Impact, Creativity, Validity, Relevance, Presentation: https://www.spaceappschallenge.org/2026/local-events/ajmer/

The challenge asks for a **game**, not just individual spaceflight calculators: design and manage an end-to-end space mission, experience coupled constraints across objectives, payload, spacecraft design, launch, orbits, cost, power, data, communications and time, then understand the consequence of each decision.

The detailed brief treats single-player or up-to-four-player cooperation as an **optional** feature, not an absolute requirement. Difficulty, random events, social play, rankings and broad scenario variety are suggestions, not mandatory components.

## Current implementation audit (November 14)

| Challenge dimension | Current experience | Gap before a complete game |
| --- | --- | --- |
| Mission objective | Three fictional Earth orbit payload contracts | Objective doesn't connect to instrument/data/operations |
| Launch capability | Ideal one-stage rocket equation; cost, TWR and payload criteria | No staging, launch performance envelope or link to bus design |
| Spacecraft | Modular Three.js bus, selectable survey thrusters, power, radiators, tank math | Bus and launcher not used together by campaign; payload/antenna/data are not simulated |
| Dynamics | NASA/JPL approximate planet positions, Earth Kepler orbits, optional Orekit Lambert | Trajectory optimization isn't consumed by game missions; no low-thrust solver |
| Budgets/progression | Funding, payouts, manufacturing discount and clock | No meaningful research unlock or mission operations |
| Mission simulation | Launch readiness pass/fail and instantaneous payout | No post-launch orbit operations, science collection or downlink |
| Learning | Learn Physics, tooltips, NASA heritage models and trajectories | Need a clear "why mission succeeded/failed" debrief |
| Collaboration | Single player | Optional stretch goal; do not block end-to-end gameplay |

**The biggest risk:** The campaign, subsystem builder and orbit-transfer solver are different workspaces; an elegant engineering model does not yet determine the result of an actual playable mission.

## Core pitch

> **Lead a small space agency. Choose a scientific mission, build a spacecraft, launch it, and operate it long enough to return useful science. Every part you add has a mass, energy, data, money and mission-lifetime consequence.**

The player should feel the conflict: a more powerful imager generates better science but weighs more, draws more power and produces more data; adding solar panels uses area/mass and has eclipse limitations; an antenna and ground access must downlink the science; a higher orbit changes observation quality and coverage. Success is **mission objective achieved within engineering limits**, not simply reaching space.

## Recommended MVP: "Earth Observation One" as a complete mission

1. **Briefing / science request.** Deliver useful imagery or environmental measurements over a 7-day observation campaign. Present a budget, target orbit band, minimum successful science returns, mission date/deadline and simple educational guidance.
2. **Payload decision.** Pick one of three **illustrative** instruments (compact imager / high-resolution imager / spectrometer). Each has mass, electrical load, cost, data rate and science value. Label balancing values **game assumptions** unless supported by published NASA source.
3. **Bus & launch design.** Use the existing 3D spacecraft viewer and subsystems. Show a live ledger for `wet mass`, `peak W`, `eclipse Wh`, `radiator area`, `data Mb/day`, `downlink Mb/day`, `remaining cash`, and `mission time`. Make satellite mass count against launcher payload capacity; currently those systems are separate. Avoid treating ion/Hall thrusters as launch engines.
4. **Orbit and communications.** Choose e.g. 400 vs 700 km circular orbit as approximate choices. Compare Earth observing geometry, eclipse time, drag/lifetime limits and visibility passes. Choose a low/high-rate radio and ground station access model; use deliberately simplified communications equations/assumptions and display margins. If data production exceeds downlink, stored data accumulates and scientific return falls.
5. **Launch & operations.** Animate an initial orbit insertion, then step through seven simulated days. Each time step produces power, charges/discharges battery, operates instrument and radio, accumulates/downlinks data, uses propellant where relevant and advances science completion. A missing electrical margin causes power-limited science, not an arbitrary game over. Optional events should be seeded, clearly labeled and replayable.
6. **Debrief and next attempt.** Report objectives met, science returned, cost, resource margins, decision-by-decision reasons for failure/success, and one or two actionable redesign suggestions. Let the player change their craft and retry. Mission completion generates agency capital and research progress; preserve old blueprints.

### Why this single mission is strategically valuable

- It satisfies the brief's **complete mission** emphasis without pretending to simulate the entire space program.
- There are meaningful **no single best answer** trade-offs.
- It can be played by a school-age user or an engineering student; detailed equations remain in expandable analysis/learn tabs.
- It directly demonstrates NASA source use through orbital parameters, solar irradiance, and published technology references; all other values remain clearly illustrative.
- A 30-second demo can showcase the sequence **objective → instrument/spacecraft choice → trade-off warning → launch → science downlink → debrief**.

## Architecture changes: connected model, not a new simulator from scratch

**Keep** the reusable engine, spacecraft 3D viewer, NASA heritage gallery, learning lessons and orbital map. Connect them with one shared **MissionDesign** record:

```text
MissionBrief {objective, orbit, duration, minimumScience, budget, deadline}
   → Instrument {mass, power, scienceRate, dataRate, price}
   → SpacecraftDesign {engine, propellant, solar, battery, radiator, antenna, bus}
   → LaunchSelection {capacity, mass, orbit, cost}
   → MissionSimulation {timeline, energyWh, dataStored, downlinked, science, spending}
   → Debrief {successFactors, causes, score, refunds, missionUnlocks}
```

Use pure, deterministic functions for each calculation so Vitest can validate expected relationships and Playwright can test the complete browser flow. Keep advanced Orekit/JPL Horizons services optional; judges should be able to play the core mission **from a normal website with no Java or local setup**. Use simplified or precomputed, clearly credited trajectories where appropriate, not a fictitious claim of real-time optimization.

Suggested feedback messages: "Your camera generated 2.6 GB but the antenna returned only 1.2 GB; choose a higher-rate communications system or lower instrument duty cycle." "Your battery emptied during eclipse; reduce peak loads or increase usable Wh." These are examples; values must come from the actual simulation, not hardcoded narration.

## User interface recommendation

- **Play campaign** — prominent start/resume, mission briefing, spacecraft selection, 3D design, launch, mission operations, debrief.
- **Engineering lab** — power/thermal/propulsion/tanks in advanced tabs, with existing detailed numeric controls; don't force new players to configure every parameter.
- **Orbit map** — interactive Kepler/JPL visualization and optional Orekit transfer optimization.
- **Mission library** — NASA precedents with actual 3D models and sampled historic trajectories when available.
- **Learn physics** — accessible progressive explanations, linked directly to why the mission did/didn't work.
- Research/roadmap belongs in the game progression or a clearly labeled "Coming next" area—not a substitute for player-visible unlocked technologies.

Use keyboard-accessible controls, short explanations and an "educational estimate" badge only where uncertainty is meaningful. Show progress rather than endless technical cards.

## Scoring proposal — game assumptions, not NASA criteria

Example mission score (0–100) could combine:
- **40 points:** achievement of stated science and operational objective.
- **20 points:** downlinked usable science, not merely instrument collection.
- **15 points:** budget efficiency, constrained by minimum science.
- **15 points:** healthy subsystem margins and mission duration.
- **10 points:** good decisions under optional, seeded events.

Prevent exploiting the economy by fitting no instruments, or by choosing extreme payload values that bypass science requirements. Expose how each score was calculated. NASA Space Apps judges use their own evaluation categories, not this gameplay score.

## What NOT to build before the hackathon submission

- General-purpose parametric CAD and STEP/B-rep editing in the browser.
- Full multi-body trajectory optimization or finite-thrust low-thrust guidance.
- Online multiplayer/account infrastructure.
- Ten planets or speculative gameplay branches that do not connect to a working mission objective.
- An elaborate nuclear reactor design treated as realistic without shielding, mass and thermal analyses.

## Priority and test gates

**P0 — submission-critical:**
1. One complete, demonstrable mission with science/power/data/communications and debrief.
2. Standalone, shareable browser deployment (no Java prerequisite), clear NASA and third-party credits.
3. Browser smoke tests, no broken buttons, useful offline/asset fallbacks, replay and saves.
4. Final 30-second demo or <=7-slide presentation, project summary, verified public links and submission.

**P1 — if P0 is complete:** second mission type, meaningful research unlocks, structured "design review", power eclipse scenarios and better comm pass modeling.

**P2 — after event:** extended space agency tycoon economics, Moon/Mars progression, Orekit porkchop and low-thrust transfer feasibility, higher-fidelity CAD linkage, competitive faction and optional up-to-4-player role collaboration.

### Testing status and gaps

Engineering Vitest and Java Maven tests cover numerical modules. Added Playwright smoke coverage of the real browser for campaign launch/save reload, spacecraft settings, orbit and transfer UI, learning, mission references and NASA model retry. CI success means browser interactions passed in automated Chromium; it does not prove correctness of live NASA/JPL web services, every Mac/browser/WebGL driver, or flight physics.

Additional manual verification: inspect an Orekit transfer from the browser against the running Java service, retry a NASA/JPL Horizons track with internet access, and test the shared game in a fresh private-window session without local service installation.
