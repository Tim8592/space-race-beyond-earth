import {describe,it,expect} from 'vitest';
import {inspectGlb} from './glbDiagnostics';

function glbWith(json:object):ArrayBuffer {
  const original=new TextEncoder().encode(JSON.stringify(json));
  const padded=Math.ceil(original.length/4)*4;
  const out=new Uint8Array(20+padded);
  const view=new DataView(out.buffer);
  view.setUint32(0,0x46546c67,true); // glTF magic
  view.setUint32(4,2,true);
  view.setUint32(8,out.byteLength,true);
  view.setUint32(12,padded,true);
  view.setUint32(16,0x4e4f534a,true); // JSON chunk
  out.fill(32,20);
  out.set(original,20);
  return out.buffer;
}

describe('NASA GLB preflight diagnostics',()=>{
  it('explains a Vite HTML fallback rather than reporting a generic load failure',()=>{
    const html=new TextEncoder().encode('<!DOCTYPE html><html><body>Game</body></html>');
    expect(()=>inspectGlb(html.buffer)).toThrow(/received HTML/);
  });
  it('reads mesh count and compression requirements for decoder guidance',()=>{
    const data=inspectGlb(glbWith({
      asset:{version:'2.0'},meshes:[{primitives:[]}],
      materials:[{}],extensionsRequired:['KHR_draco_mesh_compression']
    }));
    expect(data.version).toBe(2);
    expect(data.meshes).toBe(1);
    expect(data.extensionsRequired).toContain('KHR_draco_mesh_compression');
  });
  it('detects a truncated GLB download',()=>{
    const full=glbWith({asset:{version:'2.0'}});
    const partial=full.slice(0,full.byteLength-4);
    expect(()=>inspectGlb(partial)).toThrow(/Truncated or corrupted/);
  });
});
