/**
 * Educational campaign research / economics, NOT NASA procurement quotations or
 * a NASA-certified TRL rating for any particular hardware configuration.
 * NASA TRL definitions: https://www.nasa.gov/directorates/somd/space-communications-navigation-program/technology-readiness-levels/
 */
export type TechnologyId =
  'precision-imaging'|'ion-electric'|'hall-power'|'advanced-ion'|'high-power-hall'|
  'radioisotope-power'|'fission-power'|'reactor-25kwe'|
  'thermal-engineering'|'reactor-heat-pipe'|'production-line'|'deep-space-science';
export type TechnologyNode={
  id:TechnologyId;label:string;branch:'Science'|'Propulsion'|'Power'|'Thermal'|'Economics';
  researchUsd:number;
  hardwareCostUsd:number;
  operationalCostUsdPerYear:number;
  gameMaturity:'flight heritage'|'prototype/research'|'concept';
  riskNote:string;
  description:string;
  unlocks:string;
  prerequisites:TechnologyId[];
  sourceUrl?:string;
};
export const TECHNOLOGIES:readonly TechnologyNode[]=[
  {id:'precision-imaging',label:'Precision Earth Imaging',branch:'Science',
    researchUsd:8e6,hardwareCostUsd:14e6,operationalCostUsdPerYear:500000,
    gameMaturity:'flight heritage',riskNote:'Detector calibration, pointing and data volume',description:'Mission imaging modes and more science options.',unlocks:'Multispectral and advanced imaging upgrades',
    prerequisites:[],sourceUrl:'https://landsat.gsfc.nasa.gov/'},
  {id:'ion-electric',label:'Gridded-Ion Propulsion',branch:'Propulsion',
    researchUsd:18e6,hardwareCostUsd:3.4e6,operationalCostUsdPerYear:450000,
    gameMaturity:'flight heritage',riskNote:'Long burns, xenon pressure, grid erosion and PPU',description:'Dawn-class ion thrusters for long-duration maneuvers.',
    unlocks:'NSTAR, T6 / gridded-ion propulsion',prerequisites:[],
    sourceUrl:'https://science.nasa.gov/mission/dawn/technology/ion-propulsion/'},
  {id:'hall-power',label:'Hall Electric Propulsion',branch:'Propulsion',
    researchUsd:12e6,hardwareCostUsd:2.8e6,operationalCostUsdPerYear:350000,
    gameMaturity:'flight heritage',riskNote:'Xenon feed, power demand, lifetime and plume effects',description:'More efficient maneuvering than chemical in many use cases.',
    unlocks:'SPT-140 Hall technology',prerequisites:[]},
  {id:'advanced-ion',label:'Higher-Power Ion Systems',branch:'Propulsion',
    researchUsd:35e6,hardwareCostUsd:7.5e6,operationalCostUsdPerYear:850000,
    gameMaturity:'prototype/research',riskNote:'High-voltage distribution, thruster erosion and integration',description:'Advanced high-efficiency thruster class; model assumes published nominal point.',
    unlocks:'NEXT-C advanced ion thruster',prerequisites:['ion-electric']},
  {id:'high-power-hall',label:'High-Power Hall Integration',branch:'Propulsion',
    researchUsd:22e6,hardwareCostUsd:5.2e6,operationalCostUsdPerYear:700000,
    gameMaturity:'flight heritage',riskNote:'Electrical distribution and heat at multi-kilowatt throttle points',description:'Higher-power high-thrust Hall option.',
    unlocks:'SPT-140 and improved Hall procurement',prerequisites:['hall-power']},
  {id:'radioisotope-power',label:'Radioisotope Power',branch:'Power',
    researchUsd:25e6,hardwareCostUsd:25e6,operationalCostUsdPerYear:600000,
    gameMaturity:'flight heritage',riskNote:'Heat rejection, supply, mission safety and regulatory approval',description:'Long-lived thermal-electric generation for dark outer-solar-system missions.',
    unlocks:'MMRTG, GPHS-RTG and MHW-RTG',prerequisites:[]},
  {id:'fission-power',label:'Fission Reactor Systems',branch:'Power',
    researchUsd:65e6,hardwareCostUsd:58e6,operationalCostUsdPerYear:4e6,
    gameMaturity:'prototype/research',riskNote:'Reactor shielding, safety approval, thermal balance and launch integration',description:'Access experimental SNAP-10A/KRUSTY reactor research scenarios, with credible heat issues.',
    unlocks:'SNAP-10A and KRUSTY reactor concepts',prerequisites:['radioisotope-power','thermal-engineering']},
  {id:'reactor-25kwe',label:'High-Power Fission Electric',branch:'Power',
    researchUsd:95e6,hardwareCostUsd:110e6,operationalCostUsdPerYear:9e6,
    gameMaturity:'concept',riskNote:'Unproven complete system: shielding, power converter, kW heat rejection and launch safety',description:'Illustrative 25 kWe nuclear-electric power concept for very heavy deep-space payloads, not flight hardware.',
    unlocks:'Conceptual 25 kWe electric reactor',prerequisites:['fission-power','reactor-heat-pipe']},
  {id:'thermal-engineering',label:'Deployable Radiator Engineering',branch:'Thermal',
    researchUsd:14e6,hardwareCostUsd:7e6,operationalCostUsdPerYear:260000,
    gameMaturity:'flight heritage',riskNote:'Thermal expansion, deployment and space-environment cycling',description:'Build radiator and deployment capability for sustained heat rejection.',
    unlocks:'Thermal system architecture planning',prerequisites:[]},
  {id:'reactor-heat-pipe',label:'Remote Reactor Heat Rejection',branch:'Thermal',
    researchUsd:48e6,hardwareCostUsd:23e6,operationalCostUsdPerYear:3e6,
    gameMaturity:'prototype/research',riskNote:'Heat pipe redundancy, long booms, coolant containment and hot-surface radiation',description:'Separate high-temperature radiator wings, reactor separation boom and conceptual coolant loop.',
    unlocks:'High-temperature radiator branch hardware',prerequisites:['thermal-engineering']},
  {id:'production-line',label:'Manufacturing Learning Curve',branch:'Economics',
    researchUsd:20e6,hardwareCostUsd:0,operationalCostUsdPerYear:150000,
    gameMaturity:'flight heritage',riskNote:'Schedule, supplier yield and fabrication quality',description:'Repeatable production methods reduce the spacecraft hardware portion of mission cost by 12%.',
    unlocks:'12% spacecraft procurement discount',prerequisites:[]},
  {id:'deep-space-science',label:'Deep-Space Instrument Lab',branch:'Science',
    researchUsd:28e6,hardwareCostUsd:12e6,operationalCostUsdPerYear:800000,
    gameMaturity:'flight heritage',riskNote:'Radiation, remote calibration, data backlog and long latency',description:'Scientific instruments for asteroids, magnetospheres and icy moons.',
    unlocks:'Advanced planetary-science payloads',prerequisites:['precision-imaging']},
] as const;

export const STARTER_TECHNOLOGIES=new Set(['mono-reference','busek-bht100','busek-bht200','busek-bit3']);
export const THRUSTER_RESEARCH:Readonly<Record<string,TechnologyId|undefined>>={
  nstar:'ion-electric',t6:'ion-electric','next-c':'advanced-ion','spt-140':'high-power-hall',
};
export const POWER_RESEARCH:Readonly<Record<string,TechnologyId|undefined>>={
  mmrtg:'radioisotope-power','mhw-rtg':'radioisotope-power','gphs-rtg':'radioisotope-power',
  snap10a:'fission-power',krusty:'fission-power','reactor-25kwe':'reactor-25kwe',
};
export const INSTRUMENT_RESEARCH:Readonly<Record<string,TechnologyId|undefined>>={
  magnetometer:'deep-space-science',irMapper:'deep-space-science',
  gammaNeutron:'deep-space-science',lidar:'deep-space-science',
};
export function hasTechnology(id:TechnologyId|undefined,unlocked:readonly TechnologyId[],devMode:boolean):boolean {
  return !id||devMode||unlocked.includes(id);
}
export function canResearch(id:TechnologyId,unlocked:readonly TechnologyId[],fundingUsd:number):boolean {
  const tech=TECHNOLOGIES.find(x=>x.id===id);
  return !!tech&&!unlocked.includes(id)&&fundingUsd>=tech.researchUsd &&
    tech.prerequisites.every(dep=>unlocked.includes(dep));
}
export function researchDiscount(unlocked:readonly TechnologyId[],devMode:boolean):number {
  return hasTechnology('production-line',unlocked,devMode)?.12:0;
}
export function formatMillions(usd:number):string{
  return '$'+(usd/1e6).toLocaleString('en-US',{maximumFractionDigits:1})+'M';
}
/** Design-review concerns rather than a guessed probability of failure. */
export function missionRiskSummary(input:{
  powerMarginW:number;thermalMarginW:number;massMarginKg:number;moneyMarginUsd:number;
  generatorClass:'photovoltaic'|'radioisotope'|'fission';
  hasConceptTech:boolean;
}):{level:'Low'|'Elevated'|'High';drivers:string[]}{
  const drivers:string[]=[];
  if(input.powerMarginW<0)drivers.push('Electrical demand exceeds available generation');
  if(input.thermalMarginW<0)drivers.push('Installed radiator capacity is below peak heat load');
  if(input.massMarginKg<0)drivers.push('Spacecraft exceeds available launch mass');
  if(input.moneyMarginUsd<0)drivers.push('Budget is insufficient to complete the design');
  if(input.generatorClass==='fission')drivers.push('Reactor thermal, radiation and launch qualification not demonstrated here');
  if(input.hasConceptTech)drivers.push('Unqualified research technology is selected');
  return {level:drivers.length>=3?'High':drivers.length?'Elevated':'Low',drivers};
}
