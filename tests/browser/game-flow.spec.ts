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
    await expect(page.getByText('Propellant storage class:')).toBeVisible();
    await page.getByRole('tab',{name:'Engineering Analysis'}).click();
    await expect(page.getByRole('heading',{name:'Coupled engineering analysis'})).toBeVisible();
    await expect(page.getByText('Combined power margin')).toBeVisible();
    await page.reload();
    await page.getByRole('tab',{name:'Engineering Lab'}).click();
    await expect(page.locator('label.sys-field').filter({hasText:'Number of thrusters'}).locator('input')).toHaveValue('3');
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
    await expect(page.getByRole('heading',{name:'Build on what has flown.'})).toBeVisible();
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
