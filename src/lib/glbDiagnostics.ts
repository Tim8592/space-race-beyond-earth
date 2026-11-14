/**
 * Minimal, deterministic glTF 2.0 binary metadata inspector.
 * Used to explain failures BEFORE giving a GLB to Three.js.
 * This does not execute content or decode any mesh.
 */
export type GlbInspection = {
  version:number;
  bytes:number;
  meshes:number;
  materials:number;
  extensionsUsed:string[];
  extensionsRequired:string[];
};

export function inspectGlb(input:ArrayBuffer):GlbInspection {
  if(input.byteLength < 20) throw new Error('The response is too small to be a glTF binary (.glb).');
  const view = new DataView(input);
  if(view.getUint32(0,true)!==0x46546c67) {
    const text = new TextDecoder().decode(new Uint8Array(input,0,Math.min(30,input.byteLength))).trim();
    const clue = text.startsWith('<')?' (received HTML, probably the Vite app/404 fallback)':'';
    throw new Error('Response is not a binary GLB: expected glTF magic bytes'+clue+'.');
  }
  const version=view.getUint32(4,true);
  if(version!==2)throw new Error('GLB version '+version+' is unsupported (expected glTF 2.0).');
  const length=view.getUint32(8,true);
  if(length!==input.byteLength)throw new Error('Truncated or corrupted GLB: header length '+length+' bytes, response length '+input.byteLength+'.');
  const jsonLength=view.getUint32(12,true);
  if(view.getUint32(16,true)!==0x4e4f534a || jsonLength>input.byteLength-20) {
    throw new Error('GLB has no valid JSON chunk.');
  }
  let data:unknown;
  try {
    data=JSON.parse(new TextDecoder().decode(new Uint8Array(input,20,jsonLength)));
  } catch {
    throw new Error('GLB contains unreadable glTF JSON.');
  }
  if(!data || typeof data!=='object')throw new Error('GLB JSON is not an object.');
  const root=data as Record<string,unknown>;
  const strings=(v:unknown):string[]=>Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'):[];
  return {
    version,
    bytes:input.byteLength,
    meshes:Array.isArray(root.meshes)?root.meshes.length:0,
    materials:Array.isArray(root.materials)?root.materials.length:0,
    extensionsUsed:strings(root.extensionsUsed),
    extensionsRequired:strings(root.extensionsRequired),
  };
}
