#!/usr/bin/env node
/** Test a downloaded NASA GLB without opening the 3D game.
 * Usage: npm run models:inspect
 */
import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';

for(const filename of process.argv.slice(2).length ?
    process.argv.slice(2) : ['public/models/Dawn.glb','public/models/Voyager.glb']) {
  try {
    const full=resolve(filename);
    const data=await readFile(full);
    const view=new DataView(data.buffer,data.byteOffset,data.byteLength);
    const info=(await stat(full));
    console.log('\n'+filename+' ('+(info.size/1024).toFixed(0)+' KiB)');
    if(data.length<20 || data.toString('ascii',0,4)!=='glTF') {
      console.log('ERROR: file is not a valid binary glTF (GLB). First bytes:',data.subarray(0,20).toString('hex'));
      process.exitCode=1;
      continue;
    }
    const version=view.getUint32(4,true);
    const advertised=view.getUint32(8,true);
    const jsonLength=view.getUint32(12,true);
    const jsonChunk=view.getUint32(16,true);
    if(version!==2||advertised!==data.length||jsonChunk!==0x4e4f534a||jsonLength>data.length-20){
      console.log('ERROR: invalid GLB container: version='+version+', declared='+advertised+
        ', actual='+data.length+', jsonBytes='+jsonLength);
      process.exitCode=1;
      continue;
    }
    const metadata=JSON.parse(data.toString('utf8',20,20+jsonLength));
    const fields={
      version:metadata.asset?.version,
      generator:metadata.asset?.generator,
      nodes:metadata.nodes?.length??0,
      meshes:metadata.meshes?.length??0,
      materials:metadata.materials?.length??0,
      extensionsUsed:metadata.extensionsUsed??[],
      extensionsRequired:metadata.extensionsRequired??[],
    };
    console.log(JSON.stringify(fields,null,2));
    console.log('Container: VALID — if browser loading fails, inspect the error shown in Mission Library.');
  }catch(error){
    console.log('ERROR:',error instanceof Error?error.message:String(error));
    process.exitCode=1;
  }
}
