import { test, expect, type Page } from '@playwright/test';

async function expectNoErrors(page:Page, run:(errors:string[])=>Promise<void>) {
  const errors:string[] = [];
  const onError=(err:Error)=>errors.push(err.message);
  page.on('pageerror',onError);
  try {await run(errors);} finally {page.off('pageerror',onError);}
  expect(errors,'Uncaught React or browser JavaScript exception').toEqual([]);
}

test('Mission Control supports a launch, financial feedback, and save-state reload',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:/Orbital Contracts · Classic mode/}).click();
    await expect(page.getByRole('heading',{name:/Build the future/i})).toBeVisible();
    await expect(page.getByText('AVAILABLE CAPITAL')).toBeVisible();
    const launch=page.getByRole('button',{name:/Launch mission|Attempt mission anyway/i});
    await expect(launch).toBeEnabled();
    await launch.click();
    await expect(page.getByText('SUCCESSFUL MISSIONS')).toBeVisible();
    await expect(page.getByText('1 / 1')).toBeVisible();
    await page.reload();
    await expect(page.getByText('1 / 1')).toBeVisible();
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await expect(page.getByRole('heading',{name:'Recent missions'})).toBeVisible();
  });
});

test('Spacecraft builder tabs, design fields and analysis remain interactive',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    await expect(page.getByRole('heading',{name:'Spacecraft Subsystems'})).toBeVisible();
    const thruster=page.locator('label.sys-field').filter({hasText:'Number of thrusters'}).locator('input');
    await expect(thruster).toHaveValue('1');
    await thruster.fill('3');
    await expect(thruster).toHaveValue('3');
    await page.getByRole('tab',{name:'Power',exact:true}).click();
    await expect(page.locator('label.sys-field').filter({hasText:'Number of solar wings'})).toBeVisible();
    await page.getByRole('tab',{name:'Thermal',exact:true}).click();
    await expect(page.locator('label.sys-field').filter({hasText:'Number of radiator panels'})).toBeVisible();
    await page.getByRole('tab',{name:'Tanks'}).click();
    await expect(page.getByRole('heading',{name:'Propellant storage architecture'})).toBeVisible();
    await expect(page.getByText('Membrane Tmin').first()).toBeVisible();
    await page.getByRole('tab',{name:'Engineering Analysis'}).click();
    await expect(page.getByRole('heading',{name:'Coupled engineering analysis'})).toBeVisible();
    await expect(page.getByText('Combined power margin')).toBeVisible();
    await page.reload();
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    await expect(page.locator('label.sys-field').filter({hasText:'Number of thrusters'}).locator('input')).toHaveValue('3');
  });
});

test('Propulsion lab shows power-limited mass flow and structural auto-fit for 16 unique nozzles',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await page.getByRole('button',{name:'DEV MODE: OFF'}).click();
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    await page.getByRole('tab',{name:'Propulsion'}).click();
    await expect(page.getByText('Where the Δv comes from')).toBeVisible();
    await expect(page.locator('.sys-burn-stats')).toContainText('Ideal all-fuel Δv');
    await expect(page.locator('.sys-burn-stats')).toContainText('Consumed propellant');
    await page.locator('label.sys-field').filter({hasText:'Number of thrusters'}).locator('input').fill('8');
    await page.locator('label.sys-field').filter({hasText:'Optional second propulsion system'})
      .locator('select').selectOption('mono-reference');
    await page.locator('label.sys-field').filter({hasText:'Secondary thruster count'}).locator('input').fill('8');
    await expect(page.locator('.sys-engine-packing')).toContainText('Engine mounting structure too small');
    const former=await page.locator('.sys-live-strip').innerText();
    await page.getByRole('button',{name:/Auto-fit installed thrusters/}).click();
    await expect(page.locator('.sys-engine-packing')).toContainText('Engine mounts fit structure');
    await expect(page.locator('.sys-live-strip')).not.toHaveText(former);
    await expect(page.locator('.sys-burn-modes')).toContainText('engines powered');
    await expect(page.locator('.sys-fuel-table tbody tr')).toHaveCount(6);
    await page.locator('label.sys-field').filter({hasText:'Propulsion evaluation window'}).locator('input').fill('1');
    await expect(page.locator('.sys-burn-stats')).toContainText('Within 1 days');
  });
});

test('Orbital map and transfer planning have a graceful offline state',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Orbital Map'}).click();
    await expect(page.getByRole('heading',{name:'Orbital Map & Simulation'})).toBeVisible();
    await expect(page.getByRole('img',{name:/Calculated elliptical Earth satellite orbit/})).toBeVisible();
    await page.getByRole('tab',{name:'Planet positions'}).click();
    await expect(page.getByRole('img',{name:/Calculated approximate JPL planetary positions/})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Earth → planetary transfer'})).toBeVisible();
    await page.getByRole('tab',{name:'Optimize minimum Δv'}).click();
    await expect(page.getByRole('button',{name:/Find lowest Δv/})).toBeVisible();
  });
});

test('Learning tab and Mission Library survive real navigation',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Learn Physics'}).click();
    await expect(page.getByRole('heading',{name:'The physics behind your spacecraft'})).toBeVisible();
    await page.getByRole('tab',{name:'Electrical power'}).click();
    await expect(page.getByRole('heading',{name:/How much power can sunlight provide/})).toBeVisible();
    await page.getByRole('tab',{name:'Mission Library'}).click();
    await expect(page.getByRole('heading',{name:'Learn from flown missions and unfinished ambitions.'})).toBeVisible();
    await page.getByRole('button',{name:/New Horizons/}).click();
    await expect(page.getByRole('heading',{name:'New Horizons'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Historical spacecraft trajectory'})).toBeVisible();
  });
});

test('NASA GLB failure gives a specific error and Retry triggers a new fetch',async({page})=>{
  await expectNoErrors(page,async()=>{
    let requests=0;
    await page.route('**/models/Dawn.glb',async route=>{
      requests++;
      await route.fulfill({status:404,contentType:'text/plain',body:'Missing test model'});
    });
    await page.goto('/');
    await page.getByRole('tab',{name:'Mission Library'}).click();
    await expect(page.locator('.craft-load-help')).toContainText('HTTP 404');
    await expect.poll(()=>requests).toBeGreaterThanOrEqual(1);
    const before=requests;
    await page.getByRole('button',{name:'Retry NASA 3D model'}).click();
    await expect.poll(()=>requests).toBeGreaterThan(before);
    await expect(page.locator('.craft-load-help')).toContainText('HTTP 404');
  });
});

test('Campaign blueprints can be saved and loaded after changing a mass slider',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:/Orbital Contracts · Classic mode/}).click();
    const name=page.locator('#craft-name');
    await name.fill('QA verification spacecraft');
    await page.getByRole('button',{name:/Save blueprint/}).click();
    const reload=page.getByRole('combobox',{name:'Load saved blueprint'});
    await expect(reload).toBeVisible();
    await name.fill('Changed working copy');
    await reload.selectOption('QA verification spacecraft');
    await expect(name).toHaveValue('QA verification spacecraft');
    await page.reload();
    await page.getByRole('tab',{name:/Orbital Contracts · Classic mode/}).click();
    await expect(page.getByRole('combobox',{name:'Load saved blueprint'})).toBeVisible();
  });
});

test('Earth Observation One shares spacecraft design and completes a seven-day scientific mission',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await expect(page.getByRole('heading',{name:'Earth Observation One'})).toBeVisible();
    await expect(page.getByText('Resource and capacity margins')).toBeVisible();
    await expect(page.locator('.ob-capacity')).toHaveCount(6);
    await expect(page.getByText('Projected science returned')).toBeVisible();
    await page.getByRole('button',{name:/Edit propulsion, solar and thermal/}).click();
    await expect(page.getByRole('heading',{name:'Spacecraft Subsystems'})).toBeVisible();
    const thrusters=page.locator('label.sys-field').filter({hasText:'Number of thrusters'}).locator('input');
    await thrusters.fill('2');
    await page.getByRole('button',{name:/Return to mission design/}).click();
    await expect(page.getByRole('heading',{name:'Earth Observation One'})).toBeVisible();
    const start=page.getByRole('button',{name:/Launch Earth Observation One/});
    await expect(start).toBeEnabled();
    const balance=page.locator('.kpi').filter({hasText:'AVAILABLE CAPITAL'}).locator('strong');
    const balanceBefore=await balance.textContent();
    await start.click();
    await expect(balance).not.toHaveText(balanceBefore??'');
    await expect(page.getByRole('heading',{name:/Satellite in orbit/})).toBeVisible();
    await page.getByRole('button',{name:/Advance one day/}).click();
    await expect(page.getByText(/Day 1: instrument operated/)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/Day 1: instrument operated/)).toBeVisible();
    await page.getByRole('button',{name:/Finish seven-day simulation/}).click();
    await expect(page.getByRole('heading',{name:/Mission successful/})).toBeVisible();
    await expect(page.getByText('1 / 1')).toBeVisible();
    await page.getByRole('button',{name:/Redesign and try again/}).click();
    await expect(page.getByText('Resource and capacity margins')).toBeVisible();
  });
});

test('Guided observation engineering lab displays live mission-specific capacity and science constraints',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('button',{name:/Edit propulsion, solar and thermal/}).click();
    await expect(page.locator('.sys-mission-brief')).toContainText('Earth Observation One');
    await expect(page.locator('.sys-mission-brief')).toContainText('modeled capacity checks pass');
    await expect(page.locator('.sys-mission-brief')).not.toContainText('Lunar Relay Pathfinder');
    await page.getByRole('tab',{name:'Thermal'}).click();
    await expect(page.getByRole('heading',{name:'Thermal hardware effect'})).toBeVisible();
    await page.locator('label.sys-field').filter({hasText:'Installed radiator area'}).locator('input').fill('4');
    await expect(page.locator('.sys-impact-delta')).toContainText('Heat rejection');
    await page.getByRole('button',{name:/Return to mission design/}).click();
    await expect(page.getByRole('heading',{name:/Earth Observation One/}).first()).toBeVisible();
  });
});

test('Earth observation thermal and downlink limits change the forecast, not just graphics',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    const science=page.locator('.ob-forecast').first();
    await expect(science).toContainText('Projected science returned');
    await page.getByRole('combobox',{name:'Communications / antenna'}).selectOption('uhf');
    await expect(page.getByText(/Data generation exceeds daily contact capacity/)).toBeVisible();
    await page.getByRole('combobox',{name:'Communications / antenna'}).selectOption('sband');
    await page.getByRole('slider',{name:'Additional radiator area'}).fill('0');
    await expect(page.getByText(/Insufficient modeled radiator heat rejection/)).toBeVisible();
  });
});

test('Science instrument selection automatically changes mass, electrical load and catalog details',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    const mass=page.locator('.sys-live-strip').getByText('MODELED WET MASS').locator('..').locator('strong');
    const before=await mass.textContent();
    await page.getByRole('tab',{name:'Science payload'}).click();
    await page.getByRole('combobox',{name:/Installed science sensor/}).selectOption('hyperspectral');
    await expect(page.getByRole('heading',{name:'Hyperspectral mapper'})).toBeVisible();
    await expect(mass).not.toHaveText(before??'');
    await page.getByRole('tab',{name:'Power',exact:true}).click();
    await expect(page.getByText('AUTO-CALCULATED POWER LEDGER')).toBeVisible();
    await expect(page.getByText('Installed science instrument')).toBeVisible();
    await page.getByRole('tab',{name:'Thermal'}).click();
    await expect(page.locator('label.sys-field').filter({hasText:'Installed radiator area'})).toBeVisible();
  });
});

test('Secondary propulsion gets a second tank with its own propellant class',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    await page.getByRole('combobox',{name:/Optional second propulsion system/}).selectOption('mono-reference');
    await expect(page.getByText(/Secondary · Illustrative/)).toBeVisible();
    await page.getByRole('tab',{name:'Tanks'}).click();
    await expect(page.locator('.sys-tank-card')).toHaveCount(2);
    await expect(page.getByRole('heading',{name:/Hydrazine-class · regulated monopropellant tank/})).toBeVisible();
  });
});

test('Prometheus library entry makes it clear no vehicle flew',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Mission Library'}).click();
    await page.getByRole('button',{name:/Project Prometheus/}).click();
    await expect(page.getByText('No flight trajectory exists')).toBeVisible();
    await expect(page.getByText(/CANCELLED/).first()).toBeVisible();
  });
});

test('Research investment spends agency capital and permanently unlocks technology',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await expect(page.getByRole('heading',{name:'Research the next frontier.'})).toBeVisible();
    const invest=page.getByRole('button',{name:/Invest \$20M/});
    await expect(page.locator('.research-intro-side')).toContainText('10 RP');
    await invest.click();
    await expect(page.locator('.research-intro-side')).toContainText('5 RP');
    await expect(page.getByText('Already researched')).toBeVisible();
    await page.reload();
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await expect(page.locator('.research-intro-side')).toContainText('5 RP');
    await expect(page.getByText('Already researched')).toBeVisible();
  });
});

test('Developer mode temporarily unlocks fission research without spending R&D',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    await page.getByRole('tab',{name:'Power',exact:true}).click();
    const power=page.getByRole('combobox',{name:/Primary power generation/});
    await expect(power.locator('option[value="reactor-25kwe"]')).toBeDisabled();
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await page.getByRole('button',{name:'DEV MODE: OFF'}).click();
    await expect(page.getByRole('button',{name:'DEV MODE: ON'})).toBeVisible();
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    await page.getByRole('tab',{name:'Power',exact:true}).click();
    await expect(power.locator('option[value="reactor-25kwe"]')).toBeEnabled();
    await power.selectOption('snap10a');
    await page.getByRole('tab',{name:'Thermal'}).click();
    await expect(page.getByRole('heading',{name:'Deployable remote reactor radiator'})).toBeVisible();
    await expect(page.getByText('Reactor heat rejection margin')).toBeVisible();
    await page.reload();
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await expect(page.getByRole('button',{name:'DEV MODE: ON'})).toBeVisible();
    await page.getByRole('button',{name:'DEV MODE: ON'}).click();
    await expect(page.getByRole('button',{name:'DEV MODE: OFF'})).toBeVisible();
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    await expect(page.locator('.sys-error')).toContainText('technology research unlock');
  });
});

test('Observation One renders accelerated orbit motion and hardware economics on mission launch',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await expect(page.getByText('SPACECRAFT TECHNOLOGY / PROCUREMENT ECONOMICS')).toBeVisible();
    await expect(page.getByText('ENGINEERING RISK REVIEW')).toBeVisible();
    const button=page.getByRole('button',{name:/Launch Earth Observation One/});
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.locator('.mission-orbit-scene svg')).toBeVisible();
    await expect(page.getByText('SIMULATED FLIGHT')).toBeVisible();
    await page.getByRole('button',{name:/Finish seven-day simulation/}).click();
    await expect(page.locator('.orbit-live-pill')).toHaveText('MISSION COMPLETE');
  });
});

test('Earth observation success unlocks the lunar mission and new campaign screen',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await expect(page.getByRole('heading',{name:'From Earth orbit to the outer planets'})).toBeVisible();
    await expect(page.getByText(/Complete the preceding campaign missions to unlock Lunar Relay Pathfinder/)).toBeVisible();
    await page.getByRole('tab',{name:/Earth Observation One · Guided mission/}).click();
    await page.getByRole('button',{name:/Launch Earth Observation One/}).click();
    await page.getByRole('button',{name:/Finish seven-day simulation/}).click();
    await expect(page.getByRole('heading',{name:/Mission successful/})).toBeVisible();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await expect(page.getByRole('heading',{name:'Lunar Relay Pathfinder'}).first()).toBeVisible();
    await expect(page.getByText(/WINDOW OPEN/)).toBeVisible();
    await page.reload();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await expect(page.getByText('AVAILABLE',{exact:true}).first()).toBeVisible();
    await page.getByRole('button',{name:/Analyze this orbit in Orbital Map/}).click();
    await expect(page.getByRole('heading',{name:'Orbital Map & Simulation'})).toBeVisible();
    await expect(page.getByText(/Apogee/).first()).toBeVisible();
  });
});

test('Continuous campaign clock is slower and replaces manual day skip',async({page})=>{
  await page.clock.install({time:new Date('2026-11-14T12:00:00Z')});
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await page.getByRole('button',{name:'DEV MODE: OFF'}).click();
    await page.getByRole('tab',{name:'Play Campaign'}).click();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await expect(page.getByRole('button',{name:/Advance 7 days/})).toHaveCount(0);
    await expect(page.locator('.campaign-special-offer')).toBeVisible();
    await expect(page.locator('.campaign-live-clock')).toContainText('1 game day / 2 minutes');
    await page.clock.runFor(120_000);
    await expect(page.locator('.campaign-live-clock')).toContainText('2026-11-15');
    await page.locator('.campaign-special-offer').click();
    await expect(page.locator('.campaign-orbital-inputs')).toBeVisible();
    const apogeeCheck=page.locator('.campaign-system-check').filter({hasText:'Elliptical target apogee'});
    const initial=await apogeeCheck.textContent();
    await page.getByRole('slider',{name:'Mission eccentricity'}).fill('0.78');
    await expect(apogeeCheck).not.toHaveText(initial??'');
  });
});

test('RP and operating costs persist, Moon investment income and hidden missions have no trajectory',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await expect(page.getByText('RESEARCH POINTS').first()).toBeVisible();
    await expect(page.getByText('DAILY OPERATING COST')).toBeVisible();
    await expect(page.getByText('NET / GAME DAY')).toBeVisible();
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await expect(page.locator('.research-node').first()).toContainText('RESEARCH POINTS');
    await page.getByRole('tab',{name:'Moon Base'}).click();
    await expect(page.getByRole('heading',{name:'Moon Base Directorate'})).toBeVisible();
    await expect(page.getByRole('button',{name:/Zoom in lunar map/})).toBeVisible();
    await expect(page.getByText('Moon Base financing locked')).toBeVisible();
    await page.getByRole('tab',{name:'Play Campaign'}).click();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await page.locator('.campaign-stage-card').filter({hasText:'Mars Orbiter'}).click();
    await expect(page.locator('.campaign-locked-overlay')).toContainText('unlock Mars Orbiter');
    await expect(page.locator('.campaign-workshop')).toHaveCount(0);
    await expect(page.locator('.campaign-map-current')).toContainText('Mission classified');
    await expect(page.getByRole('button',{name:/Select 03 Mars Orbiter/})).toHaveCount(0);
  });
});
test('Moon Base income requires paid transport, a lunar landing and separate construction investment',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.evaluate(()=>{
      const key='space-race-v01-save',saved=JSON.parse(localStorage.getItem(key)!);
      saved.game.storyCompleted=['observation','lunar'];
      saved.game.cash=600e6;
      saved.game.rocketService='falcon9';
      localStorage.setItem(key,JSON.stringify(saved));
    });
    await page.reload();
    await page.getByRole('tab',{name:'Moon Base'}).click();
    await expect(page.getByRole('button',{name:/Deliver lunar hardware before constructing/})).toBeDisabled();
    await expect(page.locator('.moon-cargo-manifest')).toContainText('Transfer + lunar descent propellant');
    await expect(page.locator('.moon-cargo-manifest')).toContainText('Falcon 9');
    await expect(page.locator('.agency-finance-bar')).toContainText('+$0M/d');
    await page.getByRole('button',{name:/Dispatch 1 rocket launch/}).click();
    await expect(page.getByRole('button',{name:/Cargo in transit · ETA/})).toBeDisabled();
    await expect(page.locator('.agency-finance-bar')).toContainText('+$0M/d');
    await page.evaluate(()=>{
      const key='space-race-v01-save',saved=JSON.parse(localStorage.getItem(key)!);
      saved.game.activeMoonCargoRun.startedAtMs=Date.now()-120000;
      localStorage.setItem(key,JSON.stringify(saved));
    });
    await page.reload();
    await page.getByRole('tab',{name:'Moon Base'}).click();
    await page.getByRole('button',{name:/Confirm lunar landing & cargo receipt/}).click();
    await expect(page.getByRole('button',{name:/Construct Lunar Survey Outpost/})).toBeEnabled();
    await expect(page.locator('.agency-finance-bar')).toContainText('+$0M/d');
    await page.getByRole('button',{name:/Construct Lunar Survey Outpost/}).click();
    await expect(page.getByText('1 / 3')).toBeVisible();
    await expect(page.locator('.agency-finance-bar')).toContainText('+$1.5M/d');
    await page.reload();
    await page.getByRole('tab',{name:'Moon Base'}).click();
    await expect(page.getByText('1 / 3')).toBeVisible();
    await expect(page.locator('.moon-cargo-manifest')).toContainText('Landing deck and guidance beacons');
  });
});
test('Rocket Fleet prices payload by launched mass and requires orbital assembly for large spacecraft',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Rocket Fleet'}).click();
    await expect(page.getByRole('heading',{name:'Rocket Fleet & Orbital Logistics'})).toBeVisible();
    await expect(page.locator('.rocket-fleet-grid')).toContainText('Starship');
    await expect(page.locator('.rocket-fleet-option.locked')).toHaveCount(2);
    await page.getByRole('button',{name:/Commission orbital assembly facility/}).click();
    await expect(page.getByRole('button',{name:/Orbital assembly operational/})).toBeDisabled();
    await page.getByRole('tab',{name:'Play Campaign'}).click();
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await page.getByRole('button',{name:'DEV MODE: OFF'}).click();
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    await page.getByRole('tab',{name:'Science payload'}).click();
    await page.locator('label.sys-field').filter({hasText:'Additional instruments / cargo mass'})
      .locator('input').fill('1000');
    await page.getByRole('tab',{name:'Thermal'}).click();
    await page.locator('label.sys-field').filter({hasText:'Installed radiator area'}).locator('input').fill('5');
    await page.getByRole('tab',{name:'Play Campaign'}).click();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await expect(page.locator('.campaign-logistics-breakdown')).toContainText('Rocket 2:');
    await expect(page.locator('.campaign-logistics-breakdown')).toContainText('Docking/assembly joins');
  });
});
test('Heavy spacecraft launches rocket batches individually and assembles hardware before the transfer flight',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.evaluate(()=>{
      const key='space-race-v01-save',saved=JSON.parse(localStorage.getItem(key)!);
      saved.game.storyCompleted=['observation'];
      saved.game.devMode=true;
      saved.game.cash=1000e6;
      saved.game.orbitalAssemblyUnlocked=true;
      saved.game.rocketService='custom';
      saved.vehicle.payloadMassKg=700;
      localStorage.setItem(key,JSON.stringify(saved));
    });
    await page.reload();
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    await page.getByRole('tab',{name:'Thermal'}).click();
    await page.locator('label.sys-field').filter({hasText:'Installed radiator area'})
      .locator('input').fill('5');
    await page.getByRole('tab',{name:'Play Campaign'}).click();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await page.getByRole('combobox',{name:'External kick stage'}).selectOption('cryogenic');
    await page.getByRole('checkbox',{name:/Extended-duration energy module/}).check();
    await expect(page.locator('.campaign-logistics-breakdown')).toContainText('Rocket 2:');
    const launch=page.getByRole('button',{name:/Accept contract and launch/});
    await expect(launch).toBeEnabled();
    await launch.click();
    await expect(page.locator('.campaign-assembly-progress')).toBeVisible();
    const batchCount=await page.locator('.rocket-assembly-items > div').count();
    expect(batchCount).toBeGreaterThan(1);
    await expect(page.locator('.flight-progress-pill')).toContainText('ORBIT INVENTORY 0/');
    await page.getByRole('button',{name:/Launch and dock hardware batch/}).click();
    await expect(page.locator('.flight-progress-pill')).toContainText('ORBIT INVENTORY 1/');
    await page.reload();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await expect(page.locator('.rocket-assembly-items .launched')).toHaveCount(1);
    for(let i=1;i<batchCount;i++)
      await page.getByRole('button',{name:/Launch and dock hardware batch/}).click();
    await expect(page.locator('.rocket-assembly-items .launched')).toHaveCount(batchCount);
    await page.getByRole('button',{name:/Assemble spacecraft and begin transfer flight/}).click();
    await expect(page.getByText('FLIGHT OPERATIONS / CONTRACT IN PROGRESS')).toBeVisible();
    await expect(page.locator('.flight-progress-pill')).not.toContainText('ORBIT INVENTORY');
  });
});
test('NASA datasets, source linkage and future mission calendar remain navigable',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Sources & Data'}).click();
    await expect(page.getByRole('heading',{name:'Sources, datasets & engineering provenance'})).toBeVisible();
    await expect(page.getByText(/NASA challenge resource directly used: CubeSat 101/)).toBeVisible();
    await page.getByRole('tab',{name:'Play Campaign'}).click();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await expect(page.getByRole('heading',{name:'Future mission opportunities'})).toBeVisible();
    await expect(page.locator('.campaign-agency-offer')).toHaveCount(4);
  });
});

test('Mission map zoom, selection and engineering lab bottlenecks stay synchronized',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await page.getByRole('button',{name:'DEV MODE: OFF'}).click();
    await page.getByRole('tab',{name:'Play Campaign'}).click();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await expect(page.getByRole('heading',{name:'Orbital campaign map'})).toBeVisible();
    await page.getByRole('button',{name:'Zoom in solar system map'}).click();
    await page.getByRole('button',{name:'Select 03 Mars Orbiter'}).click();
    await expect(page.locator('.campaign-map-current')).toContainText('Mars Orbiter');
    await page.getByRole('button',{name:/Engineering Lab \/ installed equipment/}).click();
    await expect(page.locator('.sys-mission-brief')).toContainText('Mars Orbiter');
    await expect(page.locator('.sys-mission-bottlenecks')).toBeVisible();
    await page.getByRole('tab',{name:'Thermal'}).click();
    await expect(page.getByRole('heading',{name:'Thermal hardware effect'})).toBeVisible();
    await expect(page.locator('.sys-impact-summary')).toContainText('Installed bus + reactor cooling mass');
    await page.locator('.sys-mission-brief').getByRole('button',{name:/Return to selected mission/}).click();
    await expect(page.locator('.campaign-map-current')).toContainText('Mars Orbiter');
  });
});

test('Missed NASA game window becomes a playable follow-on rather than blocking later missions',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.evaluate(()=>{
      const key='space-race-v01-save';
      const raw=localStorage.getItem(key);
      if(!raw)throw new Error('Missing campaign save');
      const snapshot=JSON.parse(raw);
      snapshot.game.day=100;
      localStorage.setItem(key,JSON.stringify(snapshot));
    });
    await page.reload();
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await page.getByRole('button',{name:'DEV MODE: OFF'}).click();
    await page.getByRole('tab',{name:'Play Campaign'}).click();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    const agency=page.locator('.campaign-agency-offer').first();
    await expect(agency).toContainText('FOLLOW-ON AVAILABLE');
    await agency.click();
    await expect(page.locator('.campaign-workshop-controls')).toContainText('Follow-on');
    await expect(page.locator('.campaign-time-tag')).toContainText('remains available');
    await page.locator('.campaign-stage-card').filter({hasText:'Mars Orbiter'}).click();
    await expect(page.getByRole('heading',{name:'Mars Orbiter'})).toBeVisible();
  });
});

test('Dev Mode opens later planetary missions and orbital solver entry points',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await page.getByRole('button',{name:'DEV MODE: OFF'}).click();
    await page.getByRole('tab',{name:'Play Campaign'}).click();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await page.locator('.campaign-stage-card').filter({hasText:'Mars Orbiter'}).click();
    await expect(page.getByRole('heading',{name:'Mars Orbiter'})).toBeVisible();
    await page.getByRole('button',{name:/Analyze this orbit in Orbital Map/}).click();
    await expect(page.getByRole('tab',{name:'Planet positions'})).toHaveAttribute('aria-selected','true');
    await expect(page.getByRole('heading',{name:'Earth → planetary transfer'})).toBeVisible();
    await page.getByRole('tab',{name:'Optimize minimum Δv'}).click();
    await expect(page.getByRole('button',{name:/Find lowest Δv/})).toBeVisible();
  });
});

test('A configured lunar milestone launches, survives reload and pays exactly one contract reward',async({page})=>{
  await expectNoErrors(page,async()=>{
    await page.goto('/');
    await page.getByRole('tab',{name:'Research & Roadmap'}).click();
    await page.getByRole('button',{name:'DEV MODE: OFF'}).click();
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    await page.getByRole('tab',{name:'Thermal'}).click();
    await page.locator('label.sys-field').filter({hasText:'Installed radiator area'}).locator('input').fill('5');
    await page.getByRole('tab',{name:'Play Campaign'}).click();
    await page.getByRole('tab',{name:'Rocket Fleet'}).click();
    await page.locator('.rocket-fleet-option').filter({hasText:'Falcon 9 · dedicated'}).click();
    await page.getByRole('tab',{name:'Play Campaign'}).click();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await page.getByRole('combobox',{name:'External kick stage'}).selectOption('cryogenic');
    await page.getByRole('checkbox',{name:/Extended-duration energy module/}).check();
    const go=page.getByRole('button',{name:/Accept contract and launch/});
    await expect(go).toBeEnabled();
    await go.click();
    await expect(page.getByRole('heading',{name:'Lunar Relay Pathfinder'}).first()).toBeVisible();
    await expect(page.getByText('FLIGHT OPERATIONS / CONTRACT IN PROGRESS')).toBeVisible();
    await page.reload();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await expect(page.getByText('FLIGHT OPERATIONS / CONTRACT IN PROGRESS')).toBeVisible();
    await expect(page.getByRole('button',{name:/Flight underway · ETA/})).toBeDisabled();
    await expect(page.getByRole('button',{name:'Open active flight progress'})).toBeVisible();
    await page.evaluate(()=>{
      const key='space-race-v01-save',saved=JSON.parse(localStorage.getItem(key)!);
      saved.game.activeStoryRun.startedAtMs=Date.now()-120_000;
      localStorage.setItem(key,JSON.stringify(saved));
    });
    await page.reload();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await expect(page.getByRole('button',{name:/Complete flight and mission debrief/})).toBeEnabled();
    await page.getByRole('button',{name:/Complete flight and mission debrief/}).click();
    await expect(page.getByText(/unlocked the next stage/)).toBeVisible();
    await expect(page.getByText('1 / 4')).toBeVisible();
    await page.locator('.campaign-stage-card').filter({hasText:'Lunar Relay Pathfinder'}).click();
    await expect(page.getByText(/reward cannot be claimed twice/)).toBeVisible();
    await page.reload();
    await page.getByRole('tab',{name:/Explore Further/}).click();
    await expect(page.locator('.campaign-stage-card').filter({hasText:'Lunar Relay Pathfinder'})).toContainText('COMPLETED');
  });
});
