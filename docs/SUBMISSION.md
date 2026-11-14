# NASA Space Apps 2026 — submission readiness and 30-second demo

> **Deadline:** Sunday, November 15, 2026, 11:59 PM local time according to the NASA Space Apps event schedule. Verify your particular event's requirements. **Save Progress is not the same as Submit for Judging.**

The repository is an independently developed 2026 *Space Mission Design Game* prototype. **Current features (v0.6):** Earth-orbit contract campaign, one-stage simplified launch rocket model, funding and manufacturing discounts, procedural 3D spacecraft assembly, NASA sample models, surveyed propulsion/power/thermal first-order sizing, real Keplerian Earth orbit map, approximate JPL planetary positions, optional local Orekit two-body Lambert transfers/flight-duration search, NASA heritage mission reference library, optional on-demand Horizons historical tracks, and an interactive learning tab.

**Do not describe future work as a playable feature.** The campaign's launch-vehicle contracts, in-space spacecraft bus architecture and trajectory planner are presently separate. There is **no complete in-orbit science-data/downlink mission loop**, verified interplanetary spacecraft feasibility, lunar manufacturing, Mars colony, or real-time multiplayer.

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
3. **11–16 s:** Execute a contract and show budget and mission completion progress.
4. **16–23 s:** Open the 3D spacecraft builder; change thrusters/solar wings; show electrical margin, heat and mass results.
5. **23–27 s:** Open the orbit map; show Keplerian elliptical orbit or an already-calculated trajectory. **Do not rely on an offline Java backend during the recording**.
6. **27–30 s:** "Built with NASA/JPL open data; next we're connecting scientific instruments, mission operations and downlink into one mission."

If the proposed complete-mission MVP is implemented before judging, update the demonstration to show **mission objective → payload design → scientific downlink → debrief**, which responds more directly to the challenge.

## Suggested summary (update before submitting)

Space Race: Beyond Earth is an interactive aerospace engineering and space agency game that helps players explore real trade-offs in mission planning. Players configure an idealized launch vehicle, evaluate thrust-to-weight ratio and rocket delta-v, and attempt fictional orbital delivery contracts while managing costs and revenue. A 3D spacecraft laboratory connects propulsion choices with electrical power, thermal rejection, battery sizing, propellant inventory and estimated spacecraft mass. Interactive orbital maps use NASA/JPL orbital data, while an optional local Orekit service models ideal two-body planetary transfers. Reference models of actual NASA missions and an interactive physics learning section help explain the engineering behind each decision. The project distinguishes published scientific parameters from game assumptions. Our next goal is to turn these connected engineering tools into a complete mission—from science objective and spacecraft design through launch, downlink, and post-mission analysis.

## Local validation and known limitations

```bash
npm test
npm run build
npm run test:browser
```

Browser smoke tests require Playwright Chromium installed locally: `npx playwright install chromium`. CI runs the browser tests independently.

The 3D NASA model downloads may be missing in a deployed version unless the asset is placed in that hosting build's `public/models` directory. NASA model downloads are local optional assets; do not imply the 3D files are bundled into GitHub. A public static React app will **not** have the local `127.0.0.1:8787` Orekit server, so manual transfer solving and on-demand NASA Horizons historical track requests are not generally available to remote viewers. Make that limitation explicit and provide in-browser scenario/fallback content for judging.

**NASA Space Apps source:** https://www.spaceappschallenge.org/2026/ . Challenge details reproduced at https://hackathlone.com/challenges/space-mission-design-game .
