# Space Race v1.5 — live-clock mission demonstration

## First launch and research progression

1. Fetch/pull the latest `main` in GitHub Desktop; restart `Start Space Race.command`. The Java/Orekit backend remains optional for the browser-only campaign.
2. Start at **Play Campaign → Earth Observation One**. Choose a feasible camera and downlink, launch, then **Finish seven-day simulation**. The first success unlocks **Explore Further**.
3. Open **Explore Further**. The four sequential missions and a live limited-time special contract should be visible. Select **Lunar Relay Pathfinder**. Its default high-energy storable kick stage, high-gain antenna and launch mass make its engineering implications concrete; adjust the radiator/rocket if readiness checks fail.
4. Show how switching to a heavier cryogenic injection stage improves transfer Δv but increases payload mass and procurement cost. Open **Engineering Lab** to change instrument, solar area, propulsion count or tank configuration.
5. Show **Explore Further → Time-sensitive contracts**. A live browser-visible clock advances **one game day every two real minutes**, beginning on today's local date for a fresh save. No 'skip 7 days' button exists. Watch a deadline count down, change eccentricity and observe the real two-body orbital apogee change. Closing/hiding the tab pauses time; actual missions that the player completes still advance the calendar by their flight duration.
6. In the new **Orbital campaign map**, use **Fit**, **+**, and **−** to zoom between inner planets and Jupiter. The numbered markers and right-hand mission directory select the same contract as the workshop. Open **Engineering Lab** and show its mission bottlenecks plus the mass/power/cooling impact summary in each system tab. Then show the new **NASA mission milestones** cards: Europa Clipper Earth assist (December 2026); NEO Surveyor (NET September 2027); SkyFall (late 2028); Europa Clipper Jupiter arrival (April 2030). These are **fictional player-side contracts inspired by real milestones**, with invented proposal windows and budgets. If the initial window is missed, a discounted follow-on contract remains available, without blocking later NASA-inspired side missions or story milestones. The included NASA Dragonfly mission (NET July 2028) is an upcoming-mission reference only, since Saturn is not yet playable.
7. Show **CubeSat rideshare / secondary dispenser** in the mission workshop. A higher-tier 3U contract cannot pass the CubeSat interface review with a 1U payload. NASA CubeSat 101 (a listed challenge resource) supplies 1U/3U dimensions and 1U mass; dispenser economics are game estimates.
8. Visit **Sources & Data** and point judges to the exact NASA references and code-to-data traceability. The source list distinguishes NASA data inputs from examples, assumptions and future mission inspiration.
9. Click **Analyze this orbit in Orbital Map**. The app initializes the Earth ellipse or planetary date/target and offers **Return to mission review**.
10. For Mars/Jupiter, launch the optional `Start Orekit.command`, solve a date-specific transfer in the Orbital Map, and return to campaign to display the Orekit result. Without the backend, the campaign runs on approximate Hohmann/phase geometry. Do not claim the heuristic detects an actual planetary launch opportunity.
11. Open **Research & Roadmap → Developer / Demo Mode** to see all implemented missions without completing prerequisites. Hardware research, launch mass, power and cooling feasibility are still checked.
12. After a feasible mission launch, the **105-second flight viewer** starts. You cannot claim the reward yet. Watch the mission-specific animation and ETA, use **Exit flight viewer**, navigate to another tab, then reopen via the persistent circular progress indicator. When the indicator reaches **100%**, click **Complete flight and mission debrief**. The game advances its modeled flight days (including ordinary program operating expenses) and pays the reward and RP once. Mars/Jupiter can use a live Orekit Lambert arc when the service is available; Moon/Earth ellipses show a labelled simple animation.
13. **Reset campaign** is destructive and clears normal research, currency and progress. Avoid resetting until after showing your saved mission history.

## v1.7 NASA mission intelligence demonstration

1. Open the new **NASA Intel** tab and press **Load NASA mission data**. It automatically requests recent NASA DONKI solar flare, geomagnetic storm and energetic-particle event records, plus seven days of NASA JPL NeoWs asteroid close approaches. Dates, Kp indexes, flare classes, asteroid distances, estimated sizes and NASA source links are real observed database fields.
2. Compare the **real UTC event date** with the game clock. If observations overlap within three real days and were recorded within 72 hours, the game adds an explicit 1–2-hour **estimated extra battery backup** requirement to near-Earth/lunar spacecraft; inspect **Explore Further → Flight engineering review** and **Engineering Lab** to see the NASA DONKI contingency check. You can add battery reserve hardware to meet it. If the campaign's clock has advanced into the distant future, the observation is displayed as a **historical reference only**, not a future weather forecast.
3. Click **Create asteroid-watch contract** on a NASA-listed asteroid. The game returns to **Explore Further**, creates an **Asteroid Watch · [name]** side mission on the campaign map and engineering screen, and opens a limited in-game launch window. You must design and pay for a real spacecraft/launcher and launch within the window to collect the fictional payout. The mission **orbits Earth to observe** the asteroid and does NOT travel to it.
4. Reload after selecting an asteroid: its mission and data source remain in saved game state. NASA feeds use four-hour local caching and don't need repeated requests.
5. Simulate blocked NASA API requests or turn off network: the panel marks the unavailable data, and the basic game continues with no unexpected weather penalties.
6. **API key is optional for the hackathon demo:** `DEMO_KEY` works at low limits. For more usage, request a free key at <https://api.nasa.gov/>, copy `.env.example` to `.env.local`, set `NASA_API_KEY=...`, then restart your local dev server. The key stays in the local Node proxy and **must not** be committed or sent in the chat. On public/static hosting only the public demo key can be used until a private backend is added.

## v1.6 Canadian rocket presets and visual technology network

1. Open **Rocket Fleet**: custom dry-mass/propellant/payload capacity inputs are gone. Choose Canadian **Aurora**, expand to **Tundra**, **Borealis** and **Tempest** generations as research, time, heritage and upfront development funding allow. Compare their modeled payload and launch prices.
2. Select SpaceX Falcon 9 for immediate lift. Its invoice pays for transport, but **does not** count toward Canadian launch-technology improvement.
3. Open **Research & Roadmap**: the six-branch visual map has click-to-select technologies, research prerequisites, node status, and spendable cash+RP. Fund **Canadian Small-Launch Qualification**, then return to the fleet to complete generation 2 (Tundra) after calendar/mission conditions have been met.
4. Complete launch contracts using a Canadian rocket. Canadian successful missions reduce later domestic launch invoices and advance the R&D generation time requirement faster than calendar alone. Those discounts are genuinely included in spacecraft and lunar cargo manifests. Test that editing a legacy saved rocket's payload mass **cannot** alter the preset generation capacity.
5. Treat all Canadian launch service status/fee/flight-heritage rates as **fictional**; their company names and public development ambitions are the real references, not flight-ready launchers.

## Launch economics, orbital assembly and physical lunar cargo (v1.5)

1. Go to **Rocket Fleet**. Compare the custom rocket equation and TWR from your actual designed rocket with the separate Falcon 9, Falcon Heavy and Starship-class service cards. Only the Falcon 9 $74M GTO *reference price* is published; other LEO game costs are hypothetical. Save cash before buying larger launch-system generations.
2. Purchase **Recovery and flight integration**; observe that launcher costs decline in the same quotes used by the mission review. Repeated flights generate additional capped savings.
3. In **Earth Observation One**, open **What you'll actually launch**. Verify the same selected rocket's invoice and the smaller deployment slot limit. External launch services are treated as provider performance contracts, not falsely evaluated using your custom rocket's engines.
4. For a heavy exploration spacecraft, choose a small custom launcher and fund **Orbital docking & assembly infrastructure**. Observe the flight engineering review list all spacecraft, transfer-stage wet mass, multiple rocket invoices and join kit hardware. With orbital assembly not purchased, the heavy mission cannot launch.
5. Start the mission, then repeatedly click **Launch and dock hardware batch N/M**, charging each rocket individually and increasing the persisted orbital inventory. Reload halfway through: the delivered batches remain. Pay the last docking fee via **Assemble spacecraft and begin transfer flight**. Only then does the regular spacecraft flight timer start.
6. In **Moon Base**, the first stage displays its equipment inventory, chemical lunar descent lander, rocket-equation fuel mass and selected LEO launch manifest. Fund **Dispatch rocket launches to Moon**; income stays zero during the timed flight. Complete **Confirm lunar landing & cargo receipt**, then separately pay to **Construct Lunar Survey Outpost**. Only now does lunar revenue start. Each later building requires its own heavier hardware shipment and construction funds.

## Research, business cash flow and Moon Base demonstration (v1.5)

1. Show the **persistent finance strip**: available cash, RP, daily operating burn (including $0.95M base overhead), Moon revenue and net/day. Wait one visible in-game day (2 real minutes) or complete a campaign flight to advance many game days. Operating expenses settle automatically.
2. In **Research & Roadmap**, buy the $20M Manufacturing Learning Curve node for **5 RP** in addition to dollars. Starting RP is 10; mission successes and periodic lab research accrue additional RP. Larger nodes require more RP, and a node with insufficient RP stays locked even if the cash is available.
3. Open the **Moon Base** tab. Before Lunar Relay Pathfinder, investment is locked (unless Dev Mode is enabled), but the lunar surface zoom scene can be viewed. After unlocking, deliver the equipment in a separately funded lunar cargo flight and land it; then purchase the **Lunar Survey Outpost** construction and watch Moon income and upkeep appear on the persistent finance strip. Lunar Logistics Hub and Industrial Campus are later upgrades, and income continues even off the Moon tab.
4. In **Explore Further → Orbital campaign map**, select a locked Mars/Jupiter story; only the mission name/classified state is shown until the proper chapter is unlocked. Dev Mode deliberately reveals completed prototype-level chapters.
5. During a launched mission, compare the **Orekit Lambert** (if a local backend is running and produces a trajectory) with the visible simplified fallback label, then minimize the viewer and use the status ring.

## New propulsion and structural sizing demonstration (v1.5)

1. Open **Engineering Lab → Propulsion**. Set **Number of thrusters** to 8 and enable a second propulsion type with 8 more thrusters.
2. Observe **Engine mounting structure too small**, then click **Auto-fit installed thrusters**. The bus visually widens and all 16 nozzles receive distinct non-overlapping mounting positions. Structural wet/dry mass and estimated procurement cost increase.
3. Compare **Ideal all-fuel Δv** and **Usable Δv in N days**, then change the **Propulsion evaluation window** from 90 days to 10 days. The finite-burn Δv and propellant consumed decrease, although ideal total Δv is unchanged.
4. Compare powered engine count, **mg/s**, mission burn days, propellant remaining, and the decreasing wet-mass rows. Reduce solar area in **Power** and return to Propulsion to see how nominal electric thruster availability falls; the game does not assume arbitrary constant-Isp throttling at inadequate power.
5. From **Play Campaign → Explore Further**, select a demanding mission and observe the revised **Transfer energy / onboard Δv** check. Onboard propulsion is now time-limited and power-limited, rather than treating every propulsion family as if it could burn for the whole mission duration.
6. Explain why removing engines may increase the **ideal** Δv but reduce thrust, duration-limited delivered Δv and real mission readiness. This is a physically meaningful mass/thrust/power trade-off, not a software error.

## Campaign missions in scope

- Lunar Relay Pathfinder — lunar-distance Earth ellipse + capture allowance (not patched-conic Moon navigation)
- Asteroid Prospecting — fictional circular 1.35 AU asteroid stand-in (not an identified asteroid)
- Mars Orbiter — circular Hohmann reference or optional Orekit two-body Lambert v∞ + simplified Mars circular capture
- Jovian Flyby Survey — Jupiter flyby (not a Galilean moons orbital tour)
- Special high-apogee Earth contracts — pseudo-random timed bid windows with actual two-body Earth ellipse sizing

## Limits to tell the judges

All dollar amounts and module technical characteristics are game assumptions. The missions use first-order delta-V, power-at-distance, mass and radiator checks rather than flight validation. The launch-stage rocket is still the simplified single-stage idealized model. The mission animation is schematic, not a propagated low-thrust route, and the Hohmann phase mismatch is not an ephemeris-grade launch-window optimizer. The game intentionally distinguishes NASA-sourced planetary/orbital equations from fictional level requirements.

See [docs/NEXT_STEPS_CAMPAIGN_AND_LAB.md](NEXT_STEPS_CAMPAIGN_AND_LAB.md) for future fidelity upgrades.
