import {TECHNOLOGIES,formatMillions} from './technologyTree';
import type {SubsystemDesign} from './subsystemDesign';
import {extraFrameMassKg} from './structureSizing';
import {ORBITAL_SERVICE_MODULES} from './orbitalServiceModules';

const BASELINE_ENGINE_PRICES:Record<string,number>={
  'mono-reference':350000,'busek-bht100':750000,
  'busek-bht200':1100000,'busek-bit3':1650000,
};
const CATALOG_ENGINE_PRICES:Record<string,number>={
  nstar:3_400_000,t6:3_600_000,'next-c':7_500_000,'spt-140':5_200_000,
};
const POWER_PRICES:Record<string,number>={
  solar:0,mmrtg:25_000_000,'mhw-rtg':23_000_000,'gphs-rtg':28_000_000,
  snap10a:58_000_000,krusty:46_000_000,'reactor-25kwe':110_000_000,
};
export type HardwareEconomics={
  items:{name:string,costUsd:number}[];
  beforeDiscountUsd:number;discountUsd:number;afterDiscountUsd:number;
};
export function spacecraftHardwareEconomics(design:SubsystemDesign,discountFraction=0):HardwareEconomics {
  if(!Number.isFinite(discountFraction)||discountFraction<0||discountFraction>.5)
    throw new RangeError('Invalid production discount');
  const enginePrice=(id:string)=>(BASELINE_ENGINE_PRICES[id]??CATALOG_ENGINE_PRICES[id]??0);
  const items=[
    {name:'Primary propulsion & feed procurement',costUsd:enginePrice(design.thrusterId)*design.thrusterCount},
    {name:'Secondary propulsion & feed procurement',costUsd:design.secondaryThrusterId==='none'?0:
      enginePrice(design.secondaryThrusterId)*design.secondaryThrusterCount},
    {name:'Power generator/reference hardware',costUsd:(POWER_PRICES[design.powerSourceId]??0)*
      (design.powerSourceId==='solar'?0:design.powerSourceCount)},
    {name:'Photovoltaic array & deployment',costUsd:design.cellAreaM2*160_000+design.solarWingCount*90_000},
    {name:'Bus radiator panels and mounts',costUsd:design.installedRadiatorAreaM2*400_000+
      design.radiatorPanelCount*50_000},
    {name:'Reactor branch radiator and heat loop',costUsd:design.powerSourceId==='snap10a'||
      design.powerSourceId==='krusty'||design.powerSourceId==='reactor-25kwe'?
      design.reactorRadiatorAreaM2*900_000+(design.reactorRadiatorAreaM2>0?5_000_000:0):0},
    {name:'Generic bus, ADCS and power distribution',costUsd:1_400_000},
    {name:'Orbital compute / relay service payload',costUsd:ORBITAL_SERVICE_MODULES[design.orbitalServiceModuleId].costUsd},
    {name:'Expanded structural bus and additional mounts',costUsd:extraFrameMassKg(design.structureScale)*85_000},
  ];
  const beforeDiscountUsd=items.reduce((sum,item)=>sum+item.costUsd,0);
  const discountUsd=beforeDiscountUsd*discountFraction;
  return {items,beforeDiscountUsd,discountUsd,afterDiscountUsd:beforeDiscountUsd-discountUsd};
}
export function referenceTechnologyEconomics(id:string):string {
  const found=TECHNOLOGIES.find(t=>t.id===id);
  return found?formatMillions(found.hardwareCostUsd):'Illustrative';
}
