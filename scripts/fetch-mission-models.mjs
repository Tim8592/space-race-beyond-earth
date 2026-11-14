#!/usr/bin/env node
/**
 * Download NASA public 3D GLB assets to same-origin Vite public/models/.
 * Browsers cannot reliably fetch assets.science.nasa.gov from localhost
 * because CORS response headers are outside our control. Node can retrieve
 * them as a local build-time asset instead.
 *
 * Files are intentionally NOT committed to source control. NASA source
 * URLs and credits remain in docs/ATTRIBUTION.md.
 */
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/models/', import.meta.url));
const optional = process.argv.includes('--optional');
const sources = [
  {
    name:'Dawn.glb',
    url:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/dawn/Dawn.glb',
    source:'https://science.nasa.gov/3d-resources/dawn/',
  },
  {
    name:'Voyager.glb',
    url:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/voyager-probe-%28b%29/Voyager%20Probe%20%28B%29.glb',
    source:'https://science.nasa.gov/3d-resources/voyager-probe-b/',
  },
];

let failures = 0;
await mkdir(root,{recursive:true});
for (const entry of sources) {
  const destination=join(root,entry.name);
  try {
    if ((await stat(destination).catch(()=>null))?.size > 10000) {
      const header=await readFile(destination);
      if(header.toString('ascii',0,4)==='glTF'){
        console.log('3D model ready:',entry.name);
        continue;
      }
    }
    console.log('Retrieving NASA model:',entry.name);
    const response=await fetch(entry.url,{
      headers:{'User-Agent':'SpaceRaceBeyondEarth/0.6 educational prototype'},
      signal:AbortSignal.timeout(12000),
    });
    if(!response.ok)throw new Error('NASA asset HTTP '+response.status);
    const length=Number(response.headers.get('content-length'));
    if(Number.isFinite(length)&&length>15_000_000)throw new Error('File unexpectedly large');
    const bytes=Buffer.from(await response.arrayBuffer());
    if(bytes.length>15_000_000||bytes.length<20||bytes.toString('ascii',0,4)!=='glTF')
      throw new Error('Invalid or oversized GLB model');
    const temp=destination+'.tmp';
    try {await writeFile(temp,bytes);await rename(temp,destination)}
    finally {await rm(temp,{force:true}).catch(()=>{})}
    console.log('NASA model installed:',destination,'('+Math.round(bytes.length/1024)+' KiB)');
  } catch(error) {
    failures++;
    console.warn('Could not retrieve',entry.name+':',error.message);
    console.warn('Manual download:',entry.source,'→ save GLB as public/models/'+entry.name);
  }
}
if(failures) {
  console.warn('Missing NASA models are optional; the engineering game still works.');
  if(!optional)process.exitCode=1;
}
