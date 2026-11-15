# Space Race v0.9 — Demo day quick guide

## Before demonstrating

1. In GitHub Desktop, fetch/pull `main`, close the old game Terminal with Control+C, then open `Start Space Race.command`.
2. Keep the browser running on the local Vite URL from Terminal. For the guided Earth mission, the Orekit/Java service is **optional and not required**.
3. In **Research & Roadmap**, enable **Developer / Demo Mode** to reveal all implemented thrusters, radioisotope generators, fission concepts and planetary sensors without spending the $350M starting agency funds.
4. In **Engineering Lab → Power → Primary power generation**, verify the new reactor choices show as selectable. Then select **SNAP-10A**, open **Thermal**, and add a hot reactor radiator branch until the heat rejection margin turns positive. Observe the boom panels in the 3D spacecraft. This is conceptual thermal sizing, not a NASA-approved flight reactor.
5. To run the starter Earth Observation mission, reset the spacecraft to its base **solar + BHT-200** architecture using the Engineering Lab reset control, return to **Play Campaign → Earth Observation One**, then launch and finish the seven-day simulation.
6. For standard play, turn Dev Mode back off. Purchased research unlocks persist, but demo-only access does not become permanent.

## Recommended demonstration story (60–90 seconds; shorten to suit event)

- **0–12 s — Mission stakes:** Show the Earth Observation One briefing and live mass, thermal, solar, data and cost margins. Explain that the objective is returned scientific data, not merely getting a camera into space.
- **12–28 s — Consequences:** Change the camera, radio and installed radiator area. Watch downlink/science forecasts change. Mention real NASA orbital constants and openly labeled gameplay numbers.
- **28–43 s — Flight:** Launch the starter design; animated Earth orbit shows altitude, period and illustrative eclipse. Advance a day and finish the week; show returned data and final debrief.
- **43–58 s — Engineering:** Click the 3D solar panel to open its controls; show area increasing hardware mass and electrical production. Choose a second thruster or discuss propellant-specific storage.
- **58–78 s — Research & ambitious designs:** Open Research & Roadmap to show R&D cost, procurement and technology maturity. Turn on Dev Mode, select an experimental fission system, and show how a high-power reactor needs a separate radiator branch with substantial mass.
- **78–90 s — Future arc:** Point to Lunar Relay, Asteroid Prospecting, Mars Orbiter and Jupiter Icy Moons as **planned**, not functioning missions.

## Honest limits

- TRL levels are NASA-defined; technology-specific maturity/risk categories, dollar amounts and manufacturing improvements are fictional planning assumptions.
- Animated orbit uses the NASA/JPL two-body period but does not drive every individual electrical/data time step yet. No real-time Horizons or Orekit input is needed for Earth Observation One.
- SNAP-10A and KRUSTY are reference-era hardware; the 25 kWe concept is an explicitly invented research option and is not verified nuclear reactor design. Flight-qualified shielding, licensing, safety and radiation control are out of scope.
- Nuclear thermal rockets and fusion propulsion are **roadmap concepts**, not added engine models.
- Demo unlocks do not waive mass, power, thermal or spacecraft feasibility checks.

## Quick checks if something goes wrong

```bash
cd ~/Documents/GitHub/space-race-beyond-earth
npm test
npm run build
```

For a stuck page: hard refresh the game, check the browser console, and pull the latest commit from GitHub Desktop. To restore a base spacecraft, use **Engineering Lab → Reset subsystem design**; to reset all campaign research/currency and mission progress, use **Reset campaign** (this also clears saved blueprints).
