import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import { Box3, Group, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { inspectGlb } from './lib/glbDiagnostics';
import type { SubsystemDesign, SystemResults } from './lib/subsystemDesign';

export type PartName = 'bus' | 'power' | 'radiator' | 'tank' | 'propulsion' | 'antenna' | 'payload';
const PART_DETAILS: Record<PartName, string> = {
  bus: 'Structural spacecraft body: currently a visual envelope. Dry bus mass is entered in the engineering panel.',
  power: 'Solar wings: the number of panels follows the Power tab; individual wing area changes with the total active cell area. Generator count is also shown for radioisotope/fission options.',
  radiator: 'Radiator count and individual panel size follow your Thermal tab. Heat pipes, view factors and source cooling still need detailed modeling.',
  tank: 'Separate colored tank/reservoir shapes match selected propellant families; mass, pressure and spherical tmin estimates are in Tanks. This is schematic geometry, not flight CAD.',
  propulsion: 'Primary and optional secondary thruster sets appear separately. They use independent propellant stores and a sequential idealized burn model; no finite-thrust trajectory is simulated.',
  antenna: 'Communications dish: visual placeholder. Link-budget and pointing constraints are future engineering features.',
  payload: 'Selected catalog science instrument: illustrative camera/sensor envelope, whose mass and electrical power appear in the live subsystem ledger.',
};

function Pick({
  children, part, selected, onSelect,
}: {
  children: React.ReactNode;
  part: PartName;
  selected: PartName;
  onSelect: (part: PartName) => void;
}) {
  return (
    <group
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect(part);
      }}
      scale={selected === part ? 1.07 : 1}
    >
      {children}
    </group>
  );
}

function Metal({ color = '#b4c9d8' }: {color?: string}) {
  return <meshStandardMaterial color={color} metalness={0.7} roughness={0.35}/>;
}

function PanelWing({ side, index, rowCount, areaM2 }: { side: -1 | 1; index: number; rowCount:number; areaM2: number }) {
  // Schematic geometry: panel envelope scales with the square root of its
  // allocation of total active cell area, not with physical 1:1 CAD units.
  const areaScale = Math.sqrt(Math.max(0.01, areaM2));
  const length = Math.max(0.55, Math.min(3.8, 0.65 + areaScale * 0.92));
  const width = Math.max(0.42, Math.min(1.45, 0.3 + areaScale * 0.45));
  const centerX = side * (1.03 + length / 2);
  const offsetZ = (index - (rowCount - 1)/2) * 0.78;
  const columns = Math.max(2, Math.min(10, Math.ceil(3.1 * areaScale)));
  const rows = Math.max(2, Math.min(5, Math.ceil(2 * areaScale)));
  return <group position={[0, 0, offsetZ]}>
    <mesh position={[side*1.08,0,0]} rotation={[0,0,Math.PI/2]}>
      <cylinderGeometry args={[0.05,0.05,0.5,10]}/><Metal color="#8295aa"/>
    </mesh>
    <mesh position={[centerX,0,0]}>
      <boxGeometry args={[length,0.07,width]}/>
      <meshStandardMaterial color="#22375a" metalness={0.55} roughness={0.35}/>
    </mesh>
    {Array.from({length:columns * rows},(_,i)=>{
      const x = centerX - length / 2 + length * ((i % columns)+0.5)/columns;
      const z = -width/2 + width*(Math.floor(i/columns)+0.5)/rows;
      return <mesh key={i} position={[x,0.047,z]}>
        <boxGeometry args={[length/columns-0.025,0.008,width/rows-0.024]}/>
        <meshStandardMaterial color={i%2===0?'#255cb1':'#1c458c'} metalness={0.35} roughness={0.22}/>
      </mesh>;
    })}
  </group>;
}

function RadiatorPanels({ areaM2, count }: {areaM2:number;count:number}) {
  const perPanel = Math.max(0.01, areaM2 / count);
  const dimension = Math.max(0.37,Math.min(1.3,Math.sqrt(perPanel)*0.77));
  return <group>
    {Array.from({length:count},(_,i)=>{
      const side=i%2===0?-1:1;
      const row=Math.floor(i/2);
      const y=0.52-row*0.38;
      const x=side*(0.62+row*.1);
      const z=-1.04-row*.05;
      return <group key={i} position={[x,y,z]}>
        <mesh><boxGeometry args={[dimension*.78,dimension,.04]}/>
          <meshStandardMaterial color="#c1cbd6" roughness={.55} metalness={.27}/>
        </mesh>
        {Array.from({length:5},(_,j)=><mesh key={j}
          position={[-dimension*.34+dimension*.68*(j+.5)/5,0,.027]}>
          <boxGeometry args={[.018,dimension*.92,.012]}/>
          <meshStandardMaterial color="#7591aa" metalness={.5}/>
        </mesh>)}
      </group>;
    })}
  </group>;
}

function ThrusterCluster({ count, electric, ready }: {count:number;electric:boolean;ready:boolean}) {
  const columns = Math.min(3,count);
  const rows = Math.ceil(count/columns);
  return <group position={[0,-.1,-1.15]}>
    {Array.from({length:count},(_,i)=>{
      const row=Math.floor(i/columns), col=i%columns;
      const numberOnRow=Math.min(columns,count-row*columns);
      const x=(col-(numberOnRow-1)/2)*.62;
      const y=(row-(rows-1)/2)*.62;
      return <group key={i} position={[x,y,0]} rotation={[Math.PI/2,0,0]}>
        <mesh><cylinderGeometry args={[.18,.27,.41,20]}/><Metal color="#607489"/></mesh>
        <mesh position={[0,-.24,0]}><torusGeometry args={[.2,.033,9,20]}/><Metal color="#bfd0e4"/></mesh>
        <mesh position={[0,-.255,0]}><circleGeometry args={[.169,20]}/>
          <meshBasicMaterial color={electric&&ready?'#7aafff':'#28303a'}/></mesh>
        {electric&&ready&&<mesh position={[0,-.56,0]} rotation={[Math.PI,0,0]}>
          <coneGeometry args={[.12,.53,18,1,true]}/>
          <meshBasicMaterial color="#68b2ff" transparent opacity={.35} depthWrite={false}/>
        </mesh>}
      </group>;
    })}
  </group>;
}

function Dish() {
  return <group position={[0,1.12,.25]} rotation={[.35,0,0]}>
    <mesh position={[0,.3,0]}><cylinderGeometry args={[.042,.042,.8,12]}/><Metal/></mesh>
    <mesh position={[0,.78,0]} rotation={[Math.PI,0,0]}>
      <coneGeometry args={[.68,.29,44,1,true]}/>
      <meshStandardMaterial color="#dbe3dd" metalness={0.3} roughness={0.42} side={2}/>
    </mesh>
    <mesh position={[0,.93,0]}><sphereGeometry args={[.065,12,9]}/><meshStandardMaterial color="#f5eabf"/></mesh>
  </group>;
}

export function ModularSpacecraft({
  design, analysis, selected, onSelect,
}: {
  design: SubsystemDesign;
  analysis: SystemResults|null;
  selected: PartName;
  onSelect: (part: PartName)=>void;
}) {
  const radiatorArea = analysis?.radiatorAreaM2 ?? 0.3;
  const tankReports = analysis?.tankReports ?? [];
  const primaryTankScale=Math.max(.18,Math.min(.53,.20+(tankReports[0]?.radiusM??.08)*1.3));
  const secondaryTankScale=Math.max(.18,Math.min(.43,.17+(tankReports[1]?.radiusM??.06)*1.3));
  const isNuclear = design.powerSourceId!=='solar';
  const wingCount = design.cellAreaM2 > 0 ? design.solarWingCount : 0;
  return <group rotation={[.12,.1,0]}>
    <Pick part="bus" selected={selected} onSelect={onSelect}>
      <mesh><boxGeometry args={[1.75,1.8,1.65]}/>
        <meshStandardMaterial color="#b4ac82" metalness={.3} roughness={.72}/></mesh>
      <mesh position={[0,0,0.836]}><boxGeometry args={[1.72,1.76,.02]}/>
        <meshStandardMaterial color="#d8b85f" metalness={.3} roughness={.58}/></mesh>
      {[-.65,.65].map(x=><mesh key={x} position={[x,0,.855]}>
        <boxGeometry args={[.04,1.77,.025]}/><Metal color="#747f87"/>
      </mesh>)}
      <mesh position={[0,.88,0]}><boxGeometry args={[1.78,.08,1.73]}/><Metal color="#c4d5e4"/></mesh>
    </Pick>
    {wingCount>0&&<Pick part="power" selected={selected} onSelect={onSelect}>
      {Array.from({length:wingCount},(_,i)=>
        <PanelWing key={i} side={i%2===0?-1:1}
          index={Math.floor(i/2)} rowCount={Math.ceil(wingCount/2)}
          areaM2={design.cellAreaM2/wingCount}/>)}
    </Pick>}
    {isNuclear&&<Pick part="power" selected={selected} onSelect={onSelect}>
      {Array.from({length:design.powerSourceCount},(_,i)=>(
        <group key={i} position={[1.08+(i%2)*.35,-1.05-Math.floor(i/2)*.38,.1]}>
          <mesh rotation={[0,0,Math.PI/2]}>
            <cylinderGeometry args={[.15,.15,.65,16]}/><Metal color="#8d969d"/>
          </mesh>
          <mesh rotation={[0,0,Math.PI/2]}>
            <torusGeometry args={[.16,.027,8,18]}/><Metal color="#c0b19b"/>
          </mesh>
        </group>
      ))}
    </Pick>}
    <Pick part="radiator" selected={selected} onSelect={onSelect}>
      <RadiatorPanels areaM2={radiatorArea} count={design.radiatorPanelCount}/>
    </Pick>
    <Pick part="tank" selected={selected} onSelect={onSelect}>
      <group position={design.secondaryThrusterId==='none'?[0,-.12,0]:[-.39,-.10,0]}>
        <mesh>
          <sphereGeometry args={[primaryTankScale,24,18]}/>
          <meshStandardMaterial color={tankReports[0]?.kind==='iodine'?'#b4896c':
            tankReports[0]?.kind==='hydrazine'?'#86a9a2':'#809dd0'}
            metalness={.55} roughness={.3} transparent opacity={selected==='tank'?1:.88}/>
        </mesh>
        <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[primaryTankScale*.78,.022,8,24]}/>
          <Metal color="#d9d0b1"/></mesh>
      </group>
      {design.secondaryThrusterId!=='none'&&<group position={[.43,-.10,0]}>
        <mesh><sphereGeometry args={[secondaryTankScale,22,18]}/>
          <meshStandardMaterial color={tankReports[1]?.kind==='iodine'?'#b4896c':
            tankReports[1]?.kind==='hydrazine'?'#86a9a2':'#809dd0'}
            metalness={.48} roughness={.32}/>
        </mesh>
        <mesh rotation={[Math.PI/2,0,0]}>
          <torusGeometry args={[secondaryTankScale*.75,.022,8,22]}/><Metal color="#ddd7b0"/>
        </mesh>
      </group>}
    </Pick>
    <Pick part="propulsion" selected={selected} onSelect={onSelect}>
      <group position={design.secondaryThrusterId==='none'?[0,0,0]:[-.39,0,0]}>
        <ThrusterCluster count={design.thrusterCount}
          electric={design.thrusterId!=='mono-reference'}
          ready={analysis?.primaryMode.canPowerAtRatedPoint??false}/>
      </group>
      {design.secondaryThrusterId!=='none'&&
        <group position={[.55,0,.25]} scale={.75}>
          <ThrusterCluster count={design.secondaryThrusterCount}
            electric={design.secondaryThrusterId!=='mono-reference'}
            ready={analysis?.secondaryMode?.canPowerAtRatedPoint??false}/>
        </group>}
    </Pick>
    {design.payloadInstrumentId!=='none'&&<Pick part="payload" selected={selected} onSelect={onSelect}>
      <group position={[0,.2,.93]}>
        <mesh><boxGeometry args={[.58,.52,.42]}/><Metal color="#c5a66e"/></mesh>
        <mesh position={[0,0,.27]} rotation={[Math.PI/2,0,0]}>
          <cylinderGeometry args={[.2,.25,.22,24]}/><Metal color="#7999b7"/>
        </mesh>
        <mesh position={[0,0,.39]}>
          <circleGeometry args={[.18,24]}/><meshStandardMaterial color="#1e6089" metalness={.5} roughness={.1}/>
        </mesh>
      </group>
    </Pick>
    <Pick part="antenna" selected={selected} onSelect={onSelect}><Dish/></Pick>
    <mesh position={[0,-1.7,0]} rotation={[-Math.PI/2,0,0]}>
      <ringGeometry args={[.95,1.0,48]}/>
      <meshBasicMaterial color="#2c607d" transparent opacity={.25} side={2}/>
    </mesh>
  </group>;
}

type ModelReport = { status:'loading'|'loaded'|'failed'; detail:string };

function NASAReferenceMesh({url,onStatus}:{
  url:string;
  onStatus:(report:ModelReport)=>void;
}) {
  const [object,setObject]=useState<Object3D|null>(null);

  useEffect(()=>{
    let cancelled=false;
    const controller=new AbortController();
    setObject(null);
    const report=(status:ModelReport['status'],detail:string)=>{
      if(!cancelled)onStatus({status,detail});
    };

    async function load(){
      try {
        report('loading','Fetching '+url+' from the local game server…');
        const response=await fetch(url,{signal:controller.signal,cache:'no-store'});
        if(!response.ok)throw new Error('HTTP '+response.status+' '+response.statusText+' while requesting '+url);
        const bytes=await response.arrayBuffer();
        if(cancelled)return;
        const info=inspectGlb(bytes);
        const mandatory=info.extensionsRequired.join(', ') || 'none';
        const details=info.bytes.toLocaleString()+' bytes, '+info.meshes+' meshes, GLB v'+info.version+
          ', required extensions: '+mandatory;
        report('loading','Downloaded '+details+'; decoding mesh…');

        const loader=new GLTFLoader();
        const draco=new DRACOLoader();
        draco.setDecoderPath('/draco/');
        draco.setDecoderConfig({type:'wasm'});
        loader.setDRACOLoader(draco);
        const base=url.startsWith('blob:')?'':new URL('./',new URL(url,window.location.href)).toString();

        try {
          const gltf=await loader.parseAsync(bytes,base);
          if(cancelled)return;
          const root=gltf.scene;
          const box=new Box3().setFromObject(root);
          const size=box.getSize(new Vector3());
          const maxDimension=Math.max(size.x,size.y,size.z);
          if(!Number.isFinite(maxDimension)||maxDimension<=0)
            throw new Error('GLB parsed, but its scene has no measurable 3D geometry.');
          const center=box.getCenter(new Vector3());
          root.position.sub(center);
          const group=new Group();
          group.add(root);
          group.scale.setScalar(6.5/maxDimension);
          setObject(group);
          report('loaded','Loaded '+details+'. Drag to orbit and scroll to zoom.');
        } finally {
          draco.dispose();
        }
      } catch (error) {
        if(cancelled)return;
        const reason=error instanceof Error?error.message:String(error);
        console.error('Space Race GLB loader failed:',url,error);
        report('failed',reason);
      }
    }

    void load();
    return ()=>{cancelled=true;controller.abort();};
  },[url,onStatus]);

  return object?<primitive object={object}/>:null;
}

export default function Spacecraft3D({
  design,analysis,referenceModelUrl,preferReference=false,
}:{
  design:SubsystemDesign;
  analysis:SystemResults|null;
  referenceModelUrl?:string;
  preferReference?:boolean;
}) {
  const [selected,setSelected]=useState<PartName>('bus');
  const [nasaStatus,setNasaStatus]=useState<'idle'|'loading'|'loaded'|'failed'>('idle');
  const [loadDetails,setLoadDetails]=useState('');
  const [loadAttempt,setLoadAttempt]=useState(0);
  const [customUrl,setCustomUrl]=useState<string|null>(null);
  const [viewerSource,setViewerSource]=useState<'modular'|'nasa'|'cad'>(
    preferReference&&referenceModelUrl?'nasa':'modular'
  );
  const onStatus=useMemo(()=>(report:ModelReport)=>{
    setNasaStatus(report.status);
    setLoadDetails(report.detail);
  },[]);
  useEffect(()=>{
    const shouldLoad=preferReference&&!!referenceModelUrl;
    setViewerSource(shouldLoad?'nasa':'modular');
    setNasaStatus(shouldLoad?'loading':'idle');
    setLoadDetails(shouldLoad?'Preparing NASA model…':'');
    setLoadAttempt(0);
  },[referenceModelUrl,preferReference]);
  useEffect(()=>()=>{if(customUrl)URL.revokeObjectURL(customUrl)},[customUrl]);
  const activeExternalModelUrl = viewerSource==='nasa'?referenceModelUrl :
    viewerSource==='cad'?customUrl:null;
  function loadCadFile(file:File|undefined) {
    if(!file)return;
    if(!file.name.toLowerCase().endsWith('.glb')){setNasaStatus('failed');return;}
    setCustomUrl(URL.createObjectURL(file));
    setViewerSource('cad');
    setNasaStatus('loading');
    setLoadDetails('Opening imported GLB…');
    setLoadAttempt(attempt=>attempt+1);
  }

  return <div className="craft-visual-shell">
    <div className="craft-visual-head">
      <div><b>3D spacecraft studio</b><span>Drag to orbit · scroll to zoom · click a component to inspect</span></div>
      <div className="craft-model-actions">
        <button type="button" onClick={()=>{setViewerSource('modular');setNasaStatus('idle')}}>Modular prototype</button>
        {referenceModelUrl&&<button type="button" onClick={()=>{
          setViewerSource('nasa');
          setNasaStatus('loading');
          setLoadDetails('Retrying '+referenceModelUrl+'…');
          setLoadAttempt(attempt=>attempt+1);
        }}>{viewerSource==='nasa'?'Retry NASA 3D model':'NASA 3D model'}</button>}
        <label className="craft-upload">Import CAD GLB
          <input type="file" accept=".glb,model/gltf-binary" onChange={e=>loadCadFile(e.target.files?.[0])}/>
        </label>
      </div>
    </div>
    <div className="craft-canvas">
      <Canvas camera={{position:[7,5,9],fov:43,near:0.1,far:80}} dpr={[1,2]} gl={{antialias:true,alpha:false}}
        fallback={<p>WebGL is unavailable in this browser. The engineering builder remains usable without 3D.</p>}>
        <color attach="background" args={['#060e1d']}/>
        <ambientLight intensity={0.8}/>
        <directionalLight position={[5,7,5]} intensity={2.0} color="#f0f4ff"/>
        <directionalLight position={[-5,-2,-4]} intensity={1} color="#5698da"/>
        <Stars radius={45} depth={35} count={1500} factor={1.4} fade speed={0}/>
        <gridHelper args={[28,28,'#244662','#142a3b']} position={[0,-2.35,0]}/>
        {activeExternalModelUrl ? <>
          {nasaStatus!=='loaded'&&<ModularSpacecraft design={design} analysis={analysis} selected={selected} onSelect={setSelected}/>}
          <NASAReferenceMesh key={activeExternalModelUrl+':'+loadAttempt} url={activeExternalModelUrl} onStatus={onStatus}/>
        </> : <ModularSpacecraft design={design} analysis={analysis} selected={selected} onSelect={setSelected}/>}
        <OrbitControls enablePan enableDamping minDistance={3} maxDistance={22}/>
      </Canvas>
    </div>
    <div className="craft-visual-caption">
      <span><strong>{viewerSource!=='modular'?'External 3D: ':'Selected: '}</strong>
        {viewerSource!=='modular'?(nasaStatus==='loaded'?'GLB loaded':nasaStatus==='failed'?'Could not load GLB — see fallback':'Loading GLB…'):selected.toUpperCase()}
      </span>
      <small>{viewerSource!=='modular'
        ? (loadDetails||'Loading model…')
        : PART_DETAILS[selected]}</small>
    </div>
    {viewerSource==='nasa' && nasaStatus==='failed' &&
      <p className="craft-load-help" role="status">
        Could not load <code>{referenceModelUrl}</code>: <strong>{loadDetails||'Unknown model error'}</strong>.
        Check whether <a href={referenceModelUrl} target="_blank" rel="noreferrer">the model URL opens</a>.
        If it reports missing/corrupt bytes, run <code>npm run models:fetch</code>.
        If it reports a decoder or extension error, share this exact message so the 3D loader can be updated.
        Click <b>Retry NASA 3D model</b> to perform a fresh request.
      </p>}
    <p className="craft-disclaimer">SCHEMATIC GEOMETRY. Tank colors indicate propellant class; separate nozzle clusters indicate independent propulsion systems. Solar array mass grows with active area and wing mounts. Import a self-contained .glb from Onshape or FreeCAD for viewing. Engineering calculations use independent mass/geometry inputs, not mesh triangles; parametric CAD coupling is future work.</p>
  </div>;
}
