import {describe,it,expect} from 'vitest';
import {estimatePropellantTank} from './propellantTanks';

const base={
  kind:'hydrazine' as const,propellantKg:8,chemicalPressureBar:20,
  xenonPressureBar:180,allowableStressMpa:150,shellDensityKgM3:2700,
  tankType:'diaphragm' as const,
};
describe('application-specific propellant tanks',()=>{
  it('computes a positive spherical membrane tmin and obeys practical thickness floor',()=>{
    const r=estimatePropellantTank(base);
    expect(r.membraneTminMm).toBeGreaterThan(0);
    expect(r.adoptedWallMm).toBeGreaterThanOrEqual(r.membraneTminMm!);
    expect(r.shellMassKg).toBeGreaterThan(0);
    expect(r.totalHardwareKg).toBeGreaterThan(r.shellMassKg);
  });
  it('higher regulated chemical pressure raises pressure-shell tmin, without linear claims about installed mass',()=>{
    const a=estimatePropellantTank(base);
    const b=estimatePropellantTank({...base,chemicalPressureBar:40});
    expect(b.membraneTminMm).toBeGreaterThan(a.membraneTminMm!);
    expect(b.adoptedWallMm).toBeGreaterThanOrEqual(a.adoptedWallMm!);
  });
  it('uses high-pressure xenon rather than a liquid monopropellant tank',()=>{
    const x=estimatePropellantTank({...base,kind:'xenon'});
    expect(x.designPressureBar).toBe(180);
    expect(x.label).toMatch(/Xenon/);
    expect(x.totalHardwareKg).toBeGreaterThan(0);
    expect(x.shellMassKg).toBeGreaterThan(0);
  });
  it('iodine is not given a fictitious internal pressure',()=>{
    const i=estimatePropellantTank({...base,kind:'iodine'});
    expect(i.designPressureBar).toBeNull();
    expect(i.membraneTminMm).toBeNull();
    expect(i.totalHardwareKg).toBeGreaterThan(0);
    expect(i.note).toMatch(/solid/);
  });
});
