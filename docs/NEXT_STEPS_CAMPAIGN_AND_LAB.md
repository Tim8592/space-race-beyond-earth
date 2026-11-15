> v1.0 delivered: Earth Observation One now unlocks four playable staged missions and a recurring expiring, elliptical-orbit special contract; campaign requirements are coupled to launch/carry mass, propulsion, solar power at distance, installed hot/bus radiators, external mission modules and actual equipment costs. The Orbital Map can receive the game departure date and optionally return Orekit v∞ for Mars/Jupiter. The roadmap sections below describe **future fidelity** not yet implemented.

# Space Race — next prompt: Play Campaign × Engineering Lab

Updated: November 14, 2026. This is the **planned next iteration**, not an implemented feature list.

## v0.8 implementation status

**Already connected:** optional second propulsion system with independent tank/feed estimate; application-specific preliminary xenon/iodine/monopropellant containment; installed science instruments and automatic electrical load/mass addition; separate installed-versus-required radiator area; component-click navigation to matching Engineering Lab control pages; Project Prometheus heritage reference (unflown).

**Next engineering improvements:** use real-gas xenon EOS at specified storage pressure/temperature instead of assumed fixed density; enforce code-like pressure vessel sizing with proper load cases and material/safety criteria rather than preliminary membrane tmin; link engine PPU/bus voltage and actual throttle operating envelopes; allow instrument duty-cycle scheduling, active/standby power and a real communications link budget; generate CAD bill of materials with absolute per-part mass properties.

## Current v0.7 architecture

**Play Campaign** has a new guided **Earth Observation One** mission and the original **Orbital Contracts / Classic mode**. The guided mission has a visible science briefing, instrument/radio/storage choice, orbit and launch-slot choices, budget and six live resource-capacity bars, a shared spacecraft 3D view, a link to the Engineering Lab, seven-day satellite operations and a science-downlink debrief.

**Engineering Lab** retains the detailed spacecraft bus (propulsion, power, thermal and tanks). Both workspaces use **one shared, persisted spacecraft design**. Changing bus mass, thrusters, solar cell area, generator selection or thermal settings in Engineering Lab changes the guided mission's analysis and 3D visualization. Classic launch rocket selections also influence the observation launch budget and feasible payload mass. The selected mission instrument takes the place of the generic science payload mass slot, rather than being added twice.

The mission uses existing first-order models plus clearly labeled **game assumptions** for instrument specifications, communications, contact windows, pricing, scientific return and performance scoring. It is not an operational flight simulator.

## Next UX milestone: make the two views feel like one game

1. **Create a mission workspace state machine** rather than having players jump between loosely connected tabs. Suggested flow: `Briefing → Select science → Design bus → Design launch → Design review → Launch → Operations → Debrief`. Use an always-visible mission-progress stepper and "Back to mission" button.
2. **Connect 3D click-to-edit**: clicking a panel opens Power controls; a radiator opens Thermal; a nozzle opens Propulsion; the science instrument opens payload configuration; the dish opens Comms. The 3D model should indicate what component is selected. The existing 3D viewer already has components with selection click handling; the missing piece is switching the relevant input panel.
3. **Unify payload and mission hardware manifests**: represent each instrument, antenna, battery, radiator, propulsion device and tank as an explicit part with mass, envelope, peak/standby watts, heat and price. This eliminates separate calculation assumptions and supports future GLB parts.
4. **Show delta and cause**: whenever the player adds a part, briefly show `+26 kg, +110 W, +2.5 science pts/hour, +14M cost`, and update an explicit design margin ledger. Make causes of overages visible, not just red bars.
5. **Improve progress feedback**: no massive daily click grind, but a two-speed mode (`Advance day` / `Fast-forward`), pause/inspect telemetry, orbit position, battery state and data queue, and clear reasons for missed science.
6. **Save campaign and repeatability**: preserve a separate mission blueprint from the engineering base, version saves, archive attempts, avoid duplicate reward callbacks after refresh, enable reset of the guided mission without resetting the entire career.

## Next engineering milestone

- **Energy**: replace current conservative peak-power throttling with a time-step solar/eclipse energy store. Model solar recharge in sunlit arcs, battery discharge in eclipse, separate scheduling of science and downlink, and generator continuous power. Then mission duration can expose cascading failures.
- **Thermal**: track heat load by instrument/radio mode and radiator net heat-flux area; later add simple spacecraft temperature/thermal capacity, not just instantaneous W.
- **Communications**: introduce antenna pointing, gain, ground stations and an approximate radio link budget (frequency, EIRP, free-space loss, receiver G/T, modulation/rate); progress from assumed contact hours toward real orbit pass windows. Cite any NASA/CCSDS sourced values and clearly label simplified parameters.
- **Payload/ADCS**: introduce instrument FOV, resolution/ground swath and pointing power/mass. Explain why orbit altitude creates science and downlink trade-offs.
- **Launcher**: compare real published launch vehicle performance curves when feasible, avoid interpreting the old one-stage ideal Tsiolkovsky launcher as real Earth launch physics. Consider a separate rideshare payload-mass/volume envelope.
- **Mission science**: replace arbitrary science points/hour with transparent mission-specific metrics such as area imaged, spectral coverage, validated observations and downlinked quality.
- **Propulsion**: Earth Observation One should use in-space thrusters for orbital maintenance and correction burns only when those operations are simulated. Do not silently charge their full rated power during science collection, and do not use Hall/ion engines for liftoff.
- **Orbit**: animate the observation satellite moving through the existing Earth orbit map while it collects science and transmits data. A beta-angle/eclipse model, station visibility and seasonal constraints can improve realism without relying on the Java service.
- **Interplanetary**: keep Orekit high-fidelity Lambert and eventual finite-thrust optimization as advanced optional services. The playable default campaign must not require the Java backend.

## Next prompt suggested priority order

**P0** — Try the guided mission on the Mac, adjust default balance and game onboarding; make the new 3D camera/antenna visibly respond to instrument/radio choice; fix any browser test regressions. Demonstrate it in a private window, without saved game state.

**P1** — Connect component selection directly to Engineering Lab control panels, and make the design-review ledger show specific plus/minus consequences, preserving a saved mission snapshot.

**P2** — Improve the mission operations simulation from one daily average to sunlight/eclipses, data queue and downlink windows across each orbit, with real power/battery state.

**P3** — After one polished Earth Observation mission, introduce a second scenario: lunar relay or interplanetary flyby, with its own mission goals and relevant physics. Reuse the unified manifest and campaign state machine.

## Java/Maven and hackathon requirement clarification

No prohibition on using Java, Maven, or a backend was identified in the published NASA Space Apps **Space Mission Design Game** summary; the challenge describes learning through designing and operating a mission. NASA's event guidance includes web apps, simulations and other formats. Browser-only operation is a **practical accessibility recommendation** for a judge opening a public demo and reduces reliance on software they may not have installed. The actual submission requirements govern public links and project explanation, not this particular language choice.

Primary source: https://www.spaceappschallenge.org/2026/find-a-team/project_morazan/ ; event formats: https://www.spaceappschallenge.org/2026/local-events/rewari/ .

## Model boundaries (important to communicate)

- At Earth orbit the model forces spacecraft sunlight distance to 1 AU regardless of an Engineer Lab solar-system preset.
- Nominal in-space propulsion power is not charged during routine imaging (propulsion idle); hardware masses are retained.
- Solar/eclipse scenario uses simplified beta=0 eclipse fraction for a circular orbit. Real Earth observing satellites have varying Sun geometry, albedo and atmospheric effects.
- Ground visibility hours, radio performance, sensor stats, cost and scientific points are fictional game assumptions.
- The chosen instrument replaces a generic payload placeholder in the engineering lab; external comms and data storage hardware are added explicitly.
- Negative resource margin cuts operational science duty rather than instantly killing the spacecraft. This is educational game logic, not real fault protection.
- Mission launch cost is deducted immediately; successful science-return payouts are credited at the debrief. Mission outcomes are deterministic forecasts, not stochastic event simulations.
- Xenon, liquid and iodine hardware now have application-specific preliminary tank/feed allowances, but the gas EOS, structural qualification, PPU mass/power provenance, radiation and generator thermal integration remain incomplete. The 3D assembly is still schematic.

## Post-demo v0.10 priorities

**Reliability before spectacle:** A judge should finish Earth Observation One in a clean browser session using the starter design. Keep the 3D, GLB and optional Orekit features resilient and ensure that Dev Mode cannot be mistaken for physical feasibility.

**First integration upgrade:** Convert the current one-day-lump science simulation into orbit-by-orbit time steps for sunlit/eclipsed battery charging, communications contact, instrument pointing and telemetry. Drive the displayed orbit animation from the same time-step state; the current animation is physically scaled for period but runs independently from daily resource bins.

**TRL / risk mechanic:** Track game-assessed technology readiness and independent design risks (power, thermal, radiation, controls, launch, communications, schedule). Instead of inventing a universal failure percentage, tie risk to a test campaign (thermal vacuum, vibration, feed system endurance, redundancy qualification) and let paid testing retire identified failure modes. Interpret NASA's TRL definitions without assigning a NASA-issued score to each product.

**Technology economy:** Show a bill of materials (hardware prices, assembly, qualification, launch and annual operations), supplier lead times, manufacturing learning and research budgets. Permit heritage technology to have lower integration costs than novel architecture while acknowledging that specific market prices are fictitious. Future game balance should avoid unrealistic economic loopholes.

**Next missions, in development order:** Lunar communications relay (orbit capture, lunar eclipse and link budget), asteroid prospecting (ion-thrust and spectrometer science), Mars orbiter (Lambert window and finite propulsion feasibility), Jupiter icy-moon survey (radiation and fission/RTG trade-offs). Future missions should share the same spacecraft engineering state and debrief architecture, not become independent tools.

**Nuclear technologies:** Keep fission-electric, nuclear-thermal and speculative fusion distinct. A realistic nuclear thermal option requires propellant/cryogenic tank sizing, hydrogen compatibility, reactor temperature, material limitations and pressure losses. Fusion/thermonuclear propulsion should remain a visually labeled future concept until credible system-level parameters can be modeled. For fission cooling add separation/shadow shields, two-sided radiative view factors, heat-pipe transport limits, truss mass, radiator temperature constraints and realistic shutdown margins. Neither current nuclear model is flight-qualifiable.

## Future work beyond v1.0 campaign missions

1. **One physics timeline for orbital operation:** Use sub-orbit eclipse, Sun-pointing, active instrument cycles, data buffer, ground-link and heater loads; have the mission animation and physics advance from the SAME timestep.
2. **Real launch-window generation:** Generate windows from porkchop grids or optimized Lambert trajectories using JPL Horizons/SPICE ephemerides, not the present phase-angle Hohmann heuristic. Distinguish calculated transfer windows from commercial bid deadlines. Allow multiple viable date/duration options and low-thrust optimization separately.
3. **Finite-thrust propulsion feasibility:** Integrate actual thrust vs available electrical power, changing mass over time, trajectory and duty cycle. For mixed propulsion handle midcourse correction, chemical insertion, electric spiral and burns in correct order. The current launch review uses staged ideal delta-V and limited burn-time allowance, NOT a true trajectory.
4. **Real mission outcomes:** Complete a separate orbital/science operations phase for each mission; assess data storage, relay availability, radiation, actual captured imagery and scientifically meaningful returned results. The current post-launch completion is a deterministic educational checkpoint after an engineering feasibility check.
5. **Randomized engineering risks:** Mature reliability through funded thermal-vacuum, launch vibration, deployment, accelerated-life and radiation testing. Tie each hazard to its subsystem and physical mitigations; avoid invented deterministic NASA TRL ratings or random disaster without justified impact.
6. **Campaign economics:** Progressive procurement, testing, skilled staff, suppliers, schedule and recurring overhead. Existing research pricing/rewards/contracts are fictional game assumptions. Make cost improvements auditable rather than arbitrary bonuses.
7. **Advanced challenges:** Close approach to near-Earth objects with actual ephemerides, lunar far-side relay coverage, station servicing and refueling, Mars landing, Jupiter radiation belt navigation, multi-spacecraft constellation optimization and a program-level science portfolio.
8. **Save migrations / QA:** Version game saves, unit-test older game state recovery, and add a browser test for a full story mission launch/reload/settlement (not only Earth Observation One).
