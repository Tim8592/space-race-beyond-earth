/**
 * Spacecraft propellant storage CONCEPT ESTIMATES — not ASME compliance.
 * Separate assumptions for hydrazine-class monopropellant, dense xenon and
 * heated iodine feed. Published spacecraft require manufacturer-specific
 * pressure/temperature behavior, proof/burst factors and detailed load cases.
 */
export type PropellantKind='hydrazine'|'xenon'|'iodine';
export type TankReport={
  kind:PropellantKind;
  label:string;
  propellantKg:number;
  designPressureBar:number|null;
  assumedBulkDensityKgM3:number;
  internalVolumeL:number;
  radiusM:number;
  membraneTminMm:number|null;
  adoptedWallMm:number|null;
  shellMassKg:number;
  feedHardwareKg:number;
  totalHardwareKg:number;
  note:string;
  validThinWall:boolean|null;
};
export type TankEstimateInputs={
  kind:PropellantKind;
  propellantKg:number;
  chemicalPressureBar:number;
  xenonPressureBar:number;
  allowableStressMpa:number;
  shellDensityKgM3:number;
  tankType:'diaphragm'|'bellows'|'capillary';
};

export function estimatePropellantTank(p:TankEstimateInputs):TankReport{
  const nums=[p.propellantKg,p.chemicalPressureBar,p.xenonPressureBar,p.allowableStressMpa,p.shellDensityKgM3];
  if(nums.some(n=>!Number.isFinite(n))||p.propellantKg<=0||
     p.chemicalPressureBar<1||p.chemicalPressureBar>100||
     p.xenonPressureBar<60||p.xenonPressureBar>350||
     p.allowableStressMpa<10||p.allowableStressMpa>700||
     p.shellDensityKgM3<1000||p.shellDensityKgM3>10000)
    throw new RangeError('Invalid propellant storage sizing inputs');

  if(p.kind==='iodine'){
    // Ambient density around 4.9 g/cm³; packing, feed channel and reservoir
    // inefficiency reduce effective volumetric density.
    const effectiveDensity=3650; // kg/m³, entirely illustrative
    const volume=p.propellantKg/effectiveDensity;
    const radius=Math.cbrt(3*volume/(4*Math.PI));
    const containmentKg=0.7+0.08*p.propellantKg;
    const feedKg=1.5+0.12*p.propellantKg; // thermal feed heater and valves
    return {
      kind:p.kind,label:'Iodine · heated solid-feed reservoir',propellantKg:p.propellantKg,
      designPressureBar:null,assumedBulkDensityKgM3:effectiveDensity,
      internalVolumeL:volume*1000,radiusM:radius,
      membraneTminMm:null,adoptedWallMm:null,shellMassKg:containmentKg,
      feedHardwareKg:feedKg,totalHardwareKg:containmentKg+feedKg,
      validThinWall:null,
      note:'Iodine is stored as a solid with a heated feed architecture. These containment and feed masses are game allowances; no liquid pressure-vessel formula is used. Integrated wet engine ratings may overlap with these allowances.',
    };
  }

  const xenon=p.kind==='xenon';
  // Dense xenon does not follow simple ideal gas density at 180 bar:
  // 1000 kg/m³ is a documented GAME ASSUMPTION, not an EOS calculation.
  const bulkDensity=xenon?1000:1020;
  const ullage=xenon?0.08:0.05;
  const volume=p.propellantKg/(bulkDensity*(1-ullage));
  const radius=Math.cbrt(3*volume/(4*Math.PI));
  const pressureBar=xenon?p.xenonPressureBar:p.chemicalPressureBar;
  const P=pressureBar*100_000;
  const S=p.allowableStressMpa*1_000_000;
  const E=0.85; // assumed joint efficiency; NOT a certified weld factor
  const denominator=2*S*E-0.2*P;
  if(denominator<=0)throw new RangeError('Pressure is too high for specified stress assumptions');
  // Inspired by the internal-pressure spherical shell membrane relationship
  // (UG-27-like), evaluated with the INNER radius as a first-order guess.
  const tmem=P*radius/denominator;
  const minWall=xenon?1.0:0.7; // mm, non-code manufacturing assumption
  const adoptedWall=Math.max(tmem*1000,minWall);
  const shellKg=4*Math.PI*radius**2*(adoptedWall/1000)*p.shellDensityKgM3;
  const shellAllowanceKg=shellKg*1.20; // fittings, local reinforcement
  const feed=xenon?(1.5+0.055*p.propellantKg):
    (p.tankType==='bellows'?1.5:p.tankType==='diaphragm'?1:0.5)+
    0.4+0.025*p.propellantKg;
  return {
    kind:p.kind,label:xenon?'Xenon · dense high-pressure vessel':'Hydrazine-class · regulated monopropellant tank',
    propellantKg:p.propellantKg,designPressureBar:pressureBar,
    assumedBulkDensityKgM3:bulkDensity,internalVolumeL:volume*1000,
    radiusM:radius,membraneTminMm:tmem*1000,adoptedWallMm:adoptedWall,
    shellMassKg:shellAllowanceKg,feedHardwareKg:feed,totalHardwareKg:shellAllowanceKg+feed,
    validThinWall:adoptedWall/1000/radius<0.1,
    note:xenon
      ? 'High-pressure xenon assumes 1000 kg/m³ bulk density and fixed 8% ullage; temperature-dependent real-gas EOS and cryogenic/storage hardware are not modeled.'
      : 'Hydrazine-class liquid assumption (1020 kg/m³) with 5% ullage; actual chemistry, vapor pressure, material compatibility and pressure regulation require validation.',
  };
}
