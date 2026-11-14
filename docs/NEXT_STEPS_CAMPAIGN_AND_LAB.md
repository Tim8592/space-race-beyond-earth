# Space Race — next prompt: Play Campaign × Engineering Lab

Updated: November 14, 2026. This is the **planned next iteration**, not an implemented feature list.

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
- Mission cost is applied to the financial campaign when the simulation completes; mission outcome is a local deterministic forecast, not a stochastic event simulator.
- The propulsion system still has incomplete stored-gas mass/PPU/tank and detailed radiation/thermal integration. The 3D assembly is only schematic.
