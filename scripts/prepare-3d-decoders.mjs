#!/usr/bin/env node
/** Serve the Draco decoder from the same Vite origin as NASA GLB files.
 *  three ships these files; we copy them to Vite's public folder.
 *  Avoids an external CDN and supports offline use after npm install.
 */
import {copyFile, mkdir, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const input=fileURLToPath(new URL('../node_modules/three/examples/jsm/libs/draco/gltf/',import.meta.url));
const output=fileURLToPath(new URL('../public/draco/',import.meta.url));
await mkdir(output,{recursive:true});
for(const name of ['draco_decoder.js','draco_decoder.wasm','draco_wasm_wrapper.js']){
  const from=join(input,name);
  if(!(await stat(from).catch(()=>null))){
    throw new Error('Three.js Draco decoder missing: '+from+' — run npm install first.');
  }
  await copyFile(from,join(output,name));
}
console.log('3D decoder ready: public/draco/ (local Three.js files)');
