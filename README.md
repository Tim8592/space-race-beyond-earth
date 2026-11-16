# Space Race: Beyond Earth

**Design spacecraft. Run a space agency. Explore the solar system.**

An interactive, physics-informed space exploration and strategy game built for the **2026 NASA Space Apps Challenge — Space Mission Design Game**. Choose scientific objectives, assemble spacecraft, balance power, propulsion, cooling, payload, data and cost, then launch and operate missions.

> **New here?** Start with [Play in a few minutes](#play-in-a-few-minutes). The core game runs in your web browser on your own computer with **no accounts, NASA API key, Java, or special hardware required**. A separately hosted public game URL is not provided by this repository; follow the local setup steps below.
>
> **NASA Space Apps judges:** The [complete public source and attribution index](docs/SPACE_APPS_RESOURCE_LINKS.md) includes NASA/JPL datasets, Canadian Space Agency resources, other references, software, visual credits, and AI/SI disclosure. The submission form had limited room for links.

## What you can do

| Explore | What it means |
| --- | --- |
| **Campaign** | Start with **Earth Observation One**, select instruments, design the mission, launch, collect/downlink science and review the debrief. Unlock Moon and deep-space missions, plus timed contracts. |
| **Engineering** | Adjust propulsion, tanks, solar arrays, batteries, radiators, structure, communications and science equipment. Watch mass, electrical demand, thermal margins, delta-v and cost change together. Inspect a clickable **3D spacecraft**. |
| **Spacecraft Library & Rocket Fleet** | Save, duplicate and reuse spacecraft designs. Compare and upgrade launch services; account for payload capacity and multiple-flight assembly where needed. |
| **Infrastructure** | Plan lunar deliveries and orbital satellite networks; investment and operations contribute to the fictional space-agency economy. |
| **Research** | Unlock technologies through a branching research tree and spend modeled cash and research points. |
| **Intelligence & learning** | Explore NASA science references, mission history, near-Earth asteroid opportunities, space-weather reports, orbital maps and the equations behind design decisions. |

### A suggested first 5–10 minutes

1. Open **Campaign → Play Campaign → Earth Observation One**. Read the mission objectives.
2. Try a camera, radio and onboard data-storage choice; inspect the launch, electrical, cooling, eclipse-energy, downlink and budget indicators.
3. Visit **Engineering → Engineering Lab**. Change solar-array area or radiator area and see how the spacecraft's mass, power and heat margins respond. Rotate or click the 3D model.
4. Return to **Earth Observation One**, adjust anything marked insufficient, launch a feasible mission and review the **seven-day science and downlink debrief**. Successful science is counted after data returns to Earth.
5. Explore **Campaign → Orbital Map** or **Intelligence → NASA Intel**. For a quick tour of later missions, use **Research & Roadmap → Developer / Demo Mode**; it previews progression but does not waive engineering readiness checks.

Mission rewards, research costs, orbital service income, some hardware figures and deadlines are **illustrative game mechanics**, not NASA forecasts, procurement quotes or spaceflight certification.

## Play in a few minutes

### Requirements

- **Node.js 22.12+** (or a newer compatible LTS release), which includes npm: [Download Node.js](https://nodejs.org/).
- A modern browser, such as Chrome, Firefox, Edge or Safari.
- Internet access for the initial npm installation. NASA feeds and optional spacecraft-model downloads also require internet access; the main game can still run when those feeds are unavailable.
- No Python, Java, Maven, GitHub account, NASA API key or paid software is required **for the normal game**.

### Option A — Download a ZIP (no Git knowledge needed)

1. On this GitHub page, choose **Code → Download ZIP**.
2. **Extract the whole ZIP** to a folder. Do not run the launcher from inside the compressed ZIP.
3. Install Node.js from the link above, then follow your operating system:

| Operating system | Easiest start |
| --- | --- |
| **macOS** | Double-click **`Start Space Race.command`**. It installs npm dependencies if needed and opens the game. If macOS blocks the script, open Terminal in the extracted project folder and run `bash "Start Space Race.command"`. |
| **Windows** | Double-click **`Start Space Race.bat`**. It checks npm, installs dependencies, then starts the game and opens your browser. If Windows displays a security warning, review the script before running it. |
| **Linux** | Open a terminal in the extracted project directory; run `npm install` and then `npm run dev -- --open`. |

**Keep the Terminal / Command Prompt window open while playing.** The game stops when you close that window or press **Ctrl+C**.

If your browser does not open automatically, use the **Local** URL printed in the terminal (usually `http://localhost:5173`; the port can differ if already in use).

### Option B — Clone using Git or GitHub Desktop

Using a terminal:

```bash
git clone https://github.com/Tim8592/space-race-beyond-earth.git
cd space-race-beyond-earth
npm install
npm run dev -- --open
```

Or choose **Code → Open with GitHub Desktop**, clone the repository, then use one of the launch methods above.

To get later updates, **Fetch origin → Pull origin** in GitHub Desktop, or run `git pull` in the project folder. Restart the game afterward. For a ZIP download, extract a newly downloaded copy when you want an update.

### Option C — Manual terminal setup on any platform

From the extracted / cloned project directory (the folder containing `package.json`):

```bash
npm install
npm run dev
```

Open the **Local** URL shown by Vite. `npm install` is required before the first run; `npm run dev` runs the browser application. Use **Ctrl+C** to stop.

**No extra dependency installation is necessary for regular gameplay.** The Three.js 3D libraries, React and other web packages are included in `package.json` and installed by npm.

## Optional advanced features

The following are **not required** for the browser game, Earth Observation One, Engineering Lab or the basic orbital map.

<details>
<summary><strong>More precise ideal transfer calculations (Orekit / Java)</strong></summary>

For optional **impulsive Lambert transfer estimates**, departure-date comparisons, and historical JPL Horizons paths, run the separate **local Orekit service**.

1. Install a **Java JDK 17+** (for example, Eclipse Temurin) and **Apache Maven 3.9+**.
2. On macOS, double-click **`Start Orekit.command`** after installing both dependencies; alternatively start it from Terminal with `bash "Start Orekit.command"`.
3. On Windows or Linux, from the repository root run:

```bash
mvn -f orekit-service/pom.xml clean package
java -jar orekit-service/target/orekit-transfer-service-0.4.0.jar
```

4. Keep the Java service running in its **own** terminal alongside the normal game.
5. Optional health check: [http://127.0.0.1:8787/health](http://127.0.0.1:8787/health).

The initial Maven build requires internet access. The service listens locally, not as a hosted public service. Without it, the map uses explicitly labeled simpler orbital approximations; **the regular campaign remains playable**.

See [Orekit service setup and scientific limitations](orekit-service/README.md).

</details>

<details>
<summary><strong>NASA API access and optional API key</strong></summary>

The **NASA Intel** screen requests DONKI solar/space-weather reports and NASA NeoWs near-Earth asteroid approaches.

- **No key needed to try it:** the game can use NASA's public `DEMO_KEY`, subject to rate limits and network availability.
- For more generous limits during **local development**, register for a free key at [https://api.nasa.gov/](https://api.nasa.gov/).
- Make a copy of `.env.example` named **`.env.local`**, and fill in `NASA_API_KEY=YOUR_KEY`.
- Restart `npm run dev`. The local Vite proxy keeps this variable server-side; **do not put a private key into `VITE_*` variables or commit it to GitHub**.

The game caches NASA responses and can degrade gracefully when APIs fail. Static-hosted builds without a protected API proxy may use `DEMO_KEY` and may encounter rate limits or cross-origin restrictions.

Recent DONKI events are historical/near-real-time observations, **not a space-weather forecast**. Asteroid contracts are fictional Earth-orbit observation challenges, **not asteroid intercept trajectories**.

</details>

<details>
<summary><strong>NASA 3D model downloads and importing CAD</strong></summary>

The 3D builder works with procedural spacecraft geometry out of the box.

- Some **historical NASA Dawn and Voyager GLB models** are downloaded **optionally** during local startup and are not stored in this GitHub repository.
- If an optional model does not appear, the game shows a fallback; check your network, then try `npm run models:fetch` and `npm run models:inspect`.
- You can **import a GLB** exported from CAD software such as Onshape or FreeCAD for **visual inspection**. Imported geometry does **not** automatically change engineering mass, thrust, structural or thermal calculations.
- NASA models and images retain their original source attribution and applicable usage guidelines.

See [NASA model and CAD notes](README_DETAILS.md#interactive-3d-models) and [asset/source credits](docs/ATTRIBUTION.md).

</details>

## Troubleshooting

| Symptom | Try this |
| --- | --- |
| `npm` or `node` is not recognized | Install [Node.js](https://nodejs.org/) and fully restart Terminal / Command Prompt, then check `node -v` and `npm -v`. |
| Node/Vite reports an unsupported version | Upgrade to **Node.js 22.12+** or a compatible newer LTS release. |
| `package.json` not found | Extract the entire ZIP and open a terminal **inside the project root**, not in `src/` or `docs/`. |
| Dependency installation fails | Check internet connectivity and the printed error, then retry `npm install` from the project root. |
| macOS will not launch the `.command` file | Open Terminal in the project folder and run `bash "Start Space Race.command"`. |
| Browser page is blank or never opens | Check that `npm run dev` is still running and use the actual **Local** address printed by Vite. Try a refresh or another modern browser. |
| NASA feeds or historical spacecraft models are missing | Confirm internet access. Rate limits, source API outages, optional downloads and local Java-service availability can affect these features; the normal game does not require them. |
| Orekit-based trajectory features are unavailable | This is expected unless you separately start the optional Java backend. Follow the Orekit instructions above. |
| Progress disappeared | Saves are held in **that browser's local storage**, not a cloud account. Switching browsers, clearing site data or using **Reset campaign** can remove local progress. |
| Want a clean reinstall | Stop the game, run `npm install` again, then restart. The **Reset campaign** action is separate and clears gameplay progress. |

If something still fails, include your **operating system, Node.js version, exact command and full error message** in a [GitHub issue](https://github.com/Tim8592/space-race-beyond-earth/issues). **Never share API keys or other secrets** in screenshots or logs.

## Technical overview and validation

- **Frontend:** React, TypeScript, Vite, Three.js, React Three Fiber and Drei.
- **Game mechanics:** browser-based TypeScript engineering and campaign models; session and saved designs stored in `localStorage`.
- **Optional analysis backend:** Java 17+, Maven and Orekit for ideal impulsive transfers and simple orbit propagation.
- **Science & source integration:** NASA/JPL planetary and spacecraft references; optional live NASA API calls; public CSA sources inform additional science mission concepts.

Useful development commands:

```bash
npm test                 # engineering/unit tests (Vitest)
npm run build            # TypeScript check and production build
npx playwright install chromium
npm run test:browser     # browser smoke tests (Playwright)
npm run preview          # preview a built app locally
```

The [GitHub Actions workflow](.github/workflows/engineering-ci.yml) runs the web build/unit tests, optional Java service checks and browser smoke tests. These automated checks do not mean the physics model is flight-validated.

## Data provenance, transparency and limitations

**What is sourced:** NASA/JPL gravitational and orbital parameters, selected technology references, spacecraft history, optional JPL Horizons trajectories, NASA NeoWs observations and DONKI space-weather events. Canadian Space Agency open resources inform fictional science missions.

**What is modeled or fictional:** many instrument parameters, launcher prices, mission contracts, resource economics, research costs, contingency battery hours and orbital-network hardware figures. All readiness checks are first-order educational estimates. The game does **not** provide mission-grade spacecraft qualification, real asteroid observation geometry, finite-thrust navigation, certified tank design or real launch availability.

**AI-assisted development:** ChatGPT assisted with source code, design exploration, tests, writing and documentation under participant direction. See the disclosure and original third-party credits in the source index.

## Documentation and credits

- [**Complete NASA, Space Agency Partner and Other Resource Links**](docs/SPACE_APPS_RESOURCE_LINKS.md) — **recommended for Space Apps judges**
- [Sources, NASA data lineage and actual game integration](docs/SOURCES_AND_DATA.md)
- [Third-party attribution, visual resources and AI/SI disclosure](docs/ATTRIBUTION.md)
- [NASA spacecraft technology research](docs/NASA_TECHNOLOGY_RESEARCH.md)
- [Orekit backend documentation](orekit-service/README.md)
- [Detailed technical README and development history (archived)](README_DETAILS.md)

**License:** The project's original source code is available under the [Apache License, Version 2.0](LICENSE) (Copyright 2026 Timothy J.E. Bruneau). Third-party libraries, NASA/CSA materials, reference images and 3D models remain subject to their own terms and attribution; see [credits and data sources](docs/SPACE_APPS_RESOURCE_LINKS.md).

**Project status:** Hackathon prototype with simplified educational calculations, not a flight-planning product. This independent entry is **not sponsored or endorsed by NASA, CSA or referenced companies**.

---

Created for **NASA Space Apps Challenge 2026** — *Space Mission Design Game*.
