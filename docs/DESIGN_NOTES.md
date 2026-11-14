# Design notes — Space Race: Beyond Earth

## Why this project exists

Create a game with a real strategic skill gap, drawing from the player's interests in spacecraft architecture design, mass budgets, power, propulsion, simulation, and economics. The player should make trade-offs that resemble real systems engineering decisions without hiding every engineering consequence behind an upgrade button.

## Strategic pillars

1. **Engineer:** configure propulsion, dry mass, propellant, and payload; future versions add staging, power, structures, thermal and lifetime models.
2. **Contract:** choose payload thresholds and rewards, compete for economic opportunity, and decide whether to manufacture another known design or create a new architecture.
3. **Research:** spend money on research institutions that generate research points; then spend points on new tech or manufacturing/process improvements.
4. **Expand:** Earth orbit → Moon → Mars → Jovian moons, with infrastructure, supply chains, and refueling altering economics.
5. **Compete:** maintain enough forward progress to beat a fictional rival program to milestones.

## Game-flow outline

```text
Start with capital
  → select contract
  → configure/choose spacecraft blueprint
  → evaluate engineering checks and expected margin
  → manufacture + attempt launch
  → payout on success, cost on any attempt
  → advance simulation days, gain production learning
  → reinvest, develop, or expand
```

The **prototype already implements** Earth-orbit contracts, idealized vehicle performance, simple economics and mission attempts, and simulation clock. The remainder is a design direction, not finished code.

## Proposed future modules

- `engineering`: stages, engines, tanks, dry-mass models, trajectory solver, energy/power budget.
- `economy`: recurring income, market saturation, manufacturing costs, investment cash flow.
- `research`: research funding/rate; skills tree with new technologies and continuous improvement branches.
- `simulation`: planet states, time progression, launch windows, finite fleet and concurrent missions.
- `infrastructure`: lunar power, surface bases, refueling depots, production, orbital stations.
- `competition`: fictional rival milestones and time pressure.
- `visualization`: 2D selectable solar system, mission trajectories, orbit diagrams, eventual 3D visualization as a long-term stretch.

## Important science guardrails

- A high-Isp electric thruster does not simply replace high-thrust chemical rocket engines for launch from Earth's surface; acceleration, power, and thrust-to-weight must matter.
- Launch windows emerge from celestial geometry and spacecraft capability, not artificial fixed mission quotas.
- More capable spacecraft can sometimes make less-efficient departures, but every propulsion mode has different time-of-flight, thrust, energy, and mass limits.
- Delivering 10,000 kg instead of 2,000 kg can unlock larger contract payouts, but the player must actually meet the contract's required capacity and mission conditions.
- Tsiolkovsky delta-V is a necessary but **not sufficient** design metric for real launch performance.

## NASA data integration roadmap

- **Now:** JPL Earth GM and NASA NSSDC Earth radius drive circular orbit speed and period on the mission display.
- **Next:** research NASA/JPL Horizons ephemerides and planetary facts for true relative planet positioning and transfer-window visualization; attribute the exact queried datasets.
- **Later:** compare simplified trajectories to NASA mission references; explicitly label illustrative vs validated results.

## Hackathon priorities

1. Working local game and convincing 30-second demonstration.
2. Clear README and source attribution, NASA data integration and engineering explanation.
3. Public website or repository; avoid relying on a private local build.
4. Only then: add complex research, Moon and Mars functionality, or elaborate presentation assets.

## Decisions to revisit

- Do research points scale linearly with funding or with diminishing returns?
- Should the learning curve attach to exact spacecraft blueprints, manufacturing processes, or engine families?
- What is the best balance between the economy and player-directed engineering?
- How will live ephemerides and simplified patched-conic transfers be reconciled with playable time acceleration?
- Should the final campaign have a winning Mars milestone or an open-ended post-campaign sandbox?
