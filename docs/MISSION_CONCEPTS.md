# Mission concepts for the engineering game

## Why electric propulsion is a strategic option, not a required destination unlock

There is no hard physical restriction making ion/Hall thrusters the **only possible** way to reach Mars, the asteroid belt, or Pluto. A mission's feasible architecture is constrained by total delta-V, launch energy, payload, power, time of flight, thermal limits, systems reliability and economics. The new in-space systems laboratory estimates some subsystem dependencies but is not a transfer solver.

### Dawn-style multi-body asteroid campaign

**NASA precedent:** [JPL Dawn mission](https://www.jpl.nasa.gov/missions/dawn/), [NASA Dawn mission history](https://www.nasa.gov/history/15-years-ago-dawn-begins-voyage-to-asteroid-vesta-and-dwarf-planet-ceres/).

Dawn's solar-electric ion propulsion made a multi-year mission with extended orbits at Vesta and Ceres economically achievable, whereas chemical propulsion would have demanded prohibitive propellant mass in the chosen mission design. This is a good mission contract design:

- Fly by Vesta (lower difficulty) and collect survey data.
- Enter orbit and perform science maneuvers (more cumulative delta-V).
- Continue from Vesta to Ceres and enter orbit (higher cumulative delta-V and extended low thrust).
- Player can select chemical or ion, but chemical may fail on available mass or budget, while electric may fail on continuous power, thruster lifetime or deadlines.

Important NASA note: Dawn's ions change the trajectory gradually; low-thrust transfers are **not** just impulsive Hohmann transfers with higher Isp.

### Psyche-inspired asteroid survey

**NASA precedent:** [NASA Psyche spacecraft data](https://science.nasa.gov/mission/psyche/spacecraft/) and [NASA Psyche spacecraft details](https://www.jpl.nasa.gov/press-kits/psyche/mission/spacecraft/).

Psyche uses Hall-effect propulsion: up to **240 mN** rated thrust at a time, using solar arrays that provide about **21 kW** near Earth but only **2.3–3.4 kW** near the asteroid. This is a natural tech-tree challenge that depends on array area, electric propulsion power demand and the required travel time. It should **not** use the tiny BHT-200 operating point as a physically equivalent Psyche-class engine.

### Pluto Explorer and potential Pluto Orbiter

**NASA precedent:** [New Horizons spacecraft](https://science.nasa.gov/mission/new-horizons/), [NASA RTG mission list](https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/missions/).

New Horizons **flew past** Pluto, powered by an RTG for instruments and communications, while high-energy chemical launch stages and a Jupiter gravity assist provided most of the translational energy. It did **not** use an ion/Hall main propulsion system. An advanced game mission could contrast:

1. **Fast flyby:** large initial launch energy, limited deceleration requirement, minimal deep-space electric thrust.
2. **Pluto orbiter (stretch):** very demanding slowing/capture or alternate mission architecture, long-duration power and thermal control, potential advanced nuclear-electric technologies.

At `r = 39.5 AU`, solar irradiance is about `1/39.5² = 0.000641` of the irradiance at Earth; ordinary array power is therefore extremely limited. A hypothetical **nuclear-electric propulsion** architecture would require a nuclear power source that can supply its thruster input power, not merely an RTG designed to power a small instrument bus. This is future research, **not currently implemented in the builder**.

## Gameplay contract guidance

- **LEO delivery**: launch-vehicle engine, ascent, payload, launch cost. Low-thrust Hall/ion is not a replacement for liftoff thrust.
- **Earth-orbit station keeping / orbital repositioning**: in-space propulsion can save propellant at the expense of power and maneuver duration.
- **Asteroid rendezvous**: low-thrust is advantageous for large cumulative delta-V if solar arrays and mission timeline work.
- **Vesta → Ceres**: strong incentive to invest in electric propulsion and reliable solar power.
- **Pluto flyby**: high-energy launch + power and longevity; do not make ion thruster mandatory.
- **Pluto orbiter**: stretch challenge requiring higher-fidelity trajectory and power modeling before determining feasibility.

### Final warning

A `power margin > 0` and `ideal delta-V > demanded delta-V` are **necessary, not sufficient** for a mission. Continuous low-thrust thrusting, eclipse periods, available navigation windows, capture energy, propulsion life and mission-specific constraints all matter. Later missions need validated low-thrust trajectory tools and documented NASA/JPL ephemerides.
