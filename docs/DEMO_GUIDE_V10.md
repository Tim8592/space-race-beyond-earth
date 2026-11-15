# Space Race v1.1 — live-clock mission demonstration

## First launch and research progression

1. Fetch/pull the latest `main` in GitHub Desktop; restart `Start Space Race.command`. The Java/Orekit backend remains optional for the browser-only campaign.
2. Start at **Play Campaign → Earth Observation One**. Choose a feasible camera and downlink, launch, then **Finish seven-day simulation**. The first success unlocks **Explore Further**.
3. Open **Explore Further**. The four sequential missions and a live limited-time special contract should be visible. Select **Lunar Relay Pathfinder**. Its default high-energy storable kick stage, high-gain antenna and launch mass make its engineering implications concrete; adjust the radiator/rocket if readiness checks fail.
4. Show how switching to a heavier cryogenic injection stage improves transfer Δv but increases payload mass and procurement cost. Open **Engineering Lab** to change instrument, solar area, propulsion count or tank configuration.
5. Show **Explore Further → Time-sensitive contracts**. A live browser-visible clock advances **seven game days per real minute**, beginning on today's local date for a fresh save. No 'skip 7 days' button exists. Watch a deadline count down, change eccentricity and observe the real two-body orbital apogee change. Closing/hiding the tab pauses time; actual missions that the player completes still advance the calendar by their flight duration.
6. Show the new **NASA mission milestones** cards: Europa Clipper Earth assist (December 2026); NEO Surveyor (NET September 2027); SkyFall (late 2028); Europa Clipper Jupiter arrival (April 2030). These are **fictional player-side contracts inspired by real milestones**, with invented proposal windows and budgets. The included NASA Dragonfly mission (NET July 2028) is an upcoming-mission reference only, since Saturn is not yet playable.
7. Show **CubeSat rideshare / secondary dispenser** in the mission workshop. A higher-tier 3U contract cannot pass the CubeSat interface review with a 1U payload. NASA CubeSat 101 (a listed challenge resource) supplies 1U/3U dimensions and 1U mass; dispenser economics are game estimates.
8. Visit **Sources & Data** and point judges to the exact NASA references and code-to-data traceability. The source list distinguishes NASA data inputs from examples, assumptions and future mission inspiration.
9. Click **Analyze this orbit in Orbital Map**. The app initializes the Earth ellipse or planetary date/target and offers **Return to mission review**.
10. For Mars/Jupiter, launch the optional `Start Orekit.command`, solve a date-specific transfer in the Orbital Map, and return to campaign to display the Orekit result. Without the backend, the campaign runs on approximate Hohmann/phase geometry. Do not claim the heuristic detects an actual planetary launch opportunity.
11. Open **Research & Roadmap → Developer / Demo Mode** to see all implemented missions without completing prerequisites. Hardware research, launch mass, power and cooling feasibility are still checked.
12. After a feasible mission launch, click **Complete flight and mission debrief**. The game advances its calendar and pays the reward once; the next story mission unlocks.
13. **Reset campaign** is destructive and clears normal research, currency and progress. Avoid resetting until after showing your saved mission history.

## Campaign missions in scope

- Lunar Relay Pathfinder — lunar-distance Earth ellipse + capture allowance (not patched-conic Moon navigation)
- Asteroid Prospecting — fictional circular 1.35 AU asteroid stand-in (not an identified asteroid)
- Mars Orbiter — circular Hohmann reference or optional Orekit two-body Lambert v∞ + simplified Mars circular capture
- Jovian Flyby Survey — Jupiter flyby (not a Galilean moons orbital tour)
- Special high-apogee Earth contracts — pseudo-random timed bid windows with actual two-body Earth ellipse sizing

## Limits to tell the judges

All dollar amounts and module technical characteristics are game assumptions. The missions use first-order delta-V, power-at-distance, mass and radiator checks rather than flight validation. The launch-stage rocket is still the simplified single-stage idealized model. The mission animation is schematic, not a propagated low-thrust route, and the Hohmann phase mismatch is not an ephemeris-grade launch-window optimizer. The game intentionally distinguishes NASA-sourced planetary/orbital equations from fictional level requirements.

See [docs/NEXT_STEPS_CAMPAIGN_AND_LAB.md](NEXT_STEPS_CAMPAIGN_AND_LAB.md) for future fidelity upgrades.
