# NASA Space Apps 2026 — project submission checklist

> **Deadline:** Sunday, November 15, 2026, 11:59 PM **Halifax local time** per the participant form. Verify any local-organizer changes. Saving is not submitting.

## Draft project summary — revise to describe the actual final product

Space Race: Beyond Earth is a physics-informed space strategy game that asks players to think like spacecraft engineers and program managers. Players configure launch vehicles by selecting propulsion systems and trading dry mass, fuel mass, and payload capacity against estimated cost. Our prototype calculates ideal rocket delta-V and thrust-to-weight ratio, then uses those results in low Earth orbit contracts: meet the engineering constraints to deliver payloads, earn revenue, and expand your space program. A 2D orbit display uses NASA/JPL Earth parameters to estimate circular orbital speed and period. Our broader vision connects technological research, manufacturing experience, lunar infrastructure, and interplanetary mission planning into one progressively expanding space economy. By bringing engineering choices into a strategic gameplay loop, the project makes the trade-offs behind space exploration accessible and engaging.

**Only claim functionality demonstrated by the final build.** The current application does not simulate Mars transfers or a lunar base.

## Deliverables

- [ ] Public **Project** link: deployed web application or repository URL.
- [ ] Public **Project Demonstration** link: video **≤30 seconds** OR slide presentation **≤7 slides** including title/introduction.
- [ ] Summary copied into project form and under field's character limit.
- [ ] Project details: features, technology, engineering approach, impact, limitations, originality, design trade-offs.
- [ ] NASA Data: list source links from `docs/ATTRIBUTION.md` with correct resource titles.
- [ ] Space Agency Partner & Other Data: all third-party code, external content, frameworks, assets, fonts, and sources used in the final product.
- [ ] SI tool use: accurately select applicable disclosure categories; ensure any generated image/video/audio has required disclosure/watermark/metadata.
- [ ] Confirm final project is original and attribution is complete.
- [ ] Test links **while signed out** or in a private window to ensure anyone can access without permission or login.
- [ ] Click **Save Progress** as you work.
- [ ] Click **Submit for Judging** before the deadline and verify confirmation.

## 30-second demo concept

- **0–5s:** 'Space Race: Beyond Earth — engineer your own space program.'
- **5–12s:** Show propulsion and mass configuration changing live delta-V, cost and TWR.
- **12–22s:** Select an orbit contract, show readiness, launch, payout and budget change.
- **22–30s:** Show orbit visualization and mention NASA/JPL Earth parameters + the research/Moon/Mars roadmap (clearly labeled future work).

## Project details outline

1. **Problem:** Space exploration requires integrated engineering, financing, mission selection, and resource management.
2. **Solution:** A game that makes architecture and strategic trade-offs interactive.
3. **Technical implementation:** React/TypeScript/Vite, classical ideal-rocket and two-body orbital calculations, local save state, contract-based simulation.
4. **Data:** JPL Earth GM and NASA NSSDC Earth equatorial radius for orbital metrics.
5. **Innovation:** Engineering calculations directly affect financial outcomes and reward strategic decisions.
6. **Limitations:** One-stage idealization, illustrative contract thresholds, no validated launch trajectory or deep-space transfer physics yet.
7. **Next steps:** Research, manufacturing, lunar missions, Mars windows, competitor milestones.
