# NASA Space Apps 2026 — submission readiness and 30-second demo

> **Deadline:** Sunday, November 15, 2026, 11:59 PM local time according to the NASA Space Apps event schedule. Verify your particular event's requirements. **Save Progress is not the same as Submit for Judging.**

The repository is an independently developed 2026 *Space Mission Design Game* prototype. **Current features (v0.7):** guided seven-day Earth Observation One science/downlink campaign with linked spacecraft, launcher and capacity bars; Earth-orbit contract campaign, one-stage simplified launch rocket model, funding and manufacturing discounts, procedural 3D spacecraft assembly, NASA sample models, surveyed propulsion/power/thermal first-order sizing, real Keplerian Earth orbit map, approximate JPL planetary positions, optional local Orekit two-body Lambert transfers/flight-duration search, NASA heritage mission reference library, optional on-demand Horizons historical tracks, and an interactive learning tab.

**Do not describe future work as a playable feature.** The new **Earth Observation One** mission links the spacecraft bus, selected payload, radio, recorder, launch rocket, power, thermal, storage, ground downlink and financial outcome within a seven-day educational mission. The original classic orbital contracts and optional interplanetary Lambert planner remain separate modes. There is **no flight-grade interplanetary spacecraft feasibility**, lunar manufacturing, Mars colony or real-time multiplayer.

See [Challenge alignment & gameplay roadmap](CHALLENGE_ALIGNMENT_AND_GAMEPLAY.md) for a prioritized end-to-end plan.

## Required public outputs — check before submission

- [ ] Project public URL, preferably a browser demo hosted without requiring Java/Maven or any local tool installation.
- [ ] Public project demonstration: ≤30 seconds of video **or** ≤7 slides including introduction (verify the form).
- [ ] Final, concise project summary (50–200 words if form uses the previously supplied limit).
- [ ] Project description explaining user need, actual game interactions, engineering trade-offs, NASA data, assumptions, creativity, impact and clear limitations.
- [ ] Cite original NASA/JPL references, reference model sources, Orekit/Three.js/dependencies, images and licenses from [ATTRIBUTION.md](ATTRIBUTION.md).
- [ ] Accurately disclose assistant/SI assistance in the project form; review any generated images/audio requirements.
- [ ] Test all URLs while signed out/in a private window; verify on a second computer/browser if possible.
- [ ] Save then **Submit for Judging** and check the final confirmation.

## Suggested honest 30-second demonstration for the CURRENT build

1. **0–5 s:** "Space Race: Beyond Earth — make real engineering trade-offs into a space agency strategy game."
2. **5–11 s:** Show the orbital contract, adjust launcher mass/propellant and see Δv/TWR/cost respond.
3. **11–16 s:** Enter Earth Observation One and show launch mass, electrical power, thermal and daily downlink bars responding to hardware.
4. **16–23 s:** Launch and fast-forward the seven-day mission; show science return, communications data bars and mission debrief.
5. **23–27 s:** Open the 3D Engineering Lab; change a solar/power/radiator setting or show the Earth orbit. **Do not rely on a Java backend during the recording**.
6. **27–30 s:** "NASA/JPL orbital data plus transparent engineering models. Redesign the same satellite until the science gets home."

The v0.7 demo should emphasize **mission objective → payload design → mass/power/thermal/downlink trade-offs → scientific downlink → debrief**, which responds directly to the challenge.

## Suggested summary (update before submitting)

Space Race: Beyond Earth is a physics-informed mission design game that puts players in charge of a small space agency. In Earth Observation One, players choose a scientific instrument, onboard data storage, radio, orbit, power and thermal upgrades, and a launch vehicle. Real-time resource bars expose the consequences of each choice: wet spacecraft mass, electrical loads, heat rejection, battery endurance, downlink capacity and mission cost. After launch, players simulate seven days of science collection, data storage and transmission, with science credited only when it reaches Earth. A mission debrief explains shortfalls and rewards successful engineering. The underlying spacecraft lab includes interactive 3D geometry and NASA-derived spacecraft technology examples, while orbital maps use published NASA/JPL data and classical mechanics. Instrument numbers, science scores and ground contacts are labeled educational game assumptions rather than flight-ready predictions.

## Local validation and known limitations

```bash
npm test
npm run build
npm run test:browser
```

Browser smoke tests require Playwright Chromium installed locally: `npx playwright install chromium`. CI runs the browser tests independently.

The 3D NASA models may be absent in a deployed build unless the authorized asset is placed in the hosting build's `public/models` directory. NASA model downloads are local optional assets; do not imply the 3D files are bundled into GitHub. A public static React app will **not** have the local `127.0.0.1:8787` Orekit server, so manual transfer solving and on-demand NASA Horizons historical track requests are not generally available to remote viewers. Make that limitation explicit and provide in-browser scenario/fallback content for judging.

**NASA Space Apps source:** https://www.spaceappschallenge.org/2026/ . Challenge details reproduced at https://hackathlone.com/challenges/space-mission-design-game .
