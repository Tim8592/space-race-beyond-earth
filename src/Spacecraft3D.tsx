import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import { Box3, Group, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { SubsystemDesign, SystemResults } from './lib/subsystemDesign';

export type PartName = 'bus' | 'power' | 'radiator' | 'tank' | 'propulsion' | 'antenna';
const PART_DETAILS: Record<PartName, string> = {
  bus: 'Structural spacecraft body: currently a visual envelope. Dry bus mass is entered in the engineering panel.',
  power: 'Solar panels: size responds to selected active cell area. Real panel substrate, gimbals and deployment dynamics are approximated.',
  radiator: 'Radiators: visible area responds to first-order radiative sizing. Heat pipes, view factors and source cooling still need detailed modeling.',
  tank: 'Propellant storage: schematic tank only. Liquid volume/wall sizing is used for the chemical option; xenon/iodine storage models are incomplete.',
  propulsion: 'In-space propulsion: visual thruster type follows your selection. Rated power, Isp, burn time and mass are calculated independently.',
  antenna: 'Communications dish: visual placeholder. Link-budget and pointing constraints are future engineering features.',
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

function PanelWing({ side, scale }: {side: -1|1; scale: number}) {
  const length = Math.max(0.7, Math.min(4.4, 0.75 + scale * 0.53));
  const width = Math.max(0.5, Math.min(1.8, 0.55 + scale * 0.12));
  const centerX = side*(1.05 + length / 2);
  return (
    <group>
      <mesh position={[side*1.13,0,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.048,0.048,1.1,9]}/><Metal color="#8494a8"/>
      </mesh>
      <mesh position={[centerX,0,0]}>
        <boxGeometry args={[length,0.07,width]}/>
        <meshStandardMaterial color="#162b68" metalness={0.42} roughness={0.3}/>
      </mesh>
      {Array.from({length:6},(_,i)=>(
        <mesh key={i} position={[centerX-length/2+length*(i+0.5)/6,0.045,0]}>
          <boxGeometry args={[Math.max(.02,length/6-0.035),0.011,width-0.06]}/>
          <meshStandardMaterial color={i%2?'#2554a0':'#1b4687'} metalness={0.58} roughness={0.28}/>
        </mesh>
      ))}
      {Array.from({length:4},(_,i)=>(
        <mesh key={i} position={[centerX,0.05,-width/2+(i+1)*width/5]}>
          <boxGeometry args={[length,0.01,0.011]}/>
          <meshStandardMaterial color="#83a5d0" emissive="#163355" emissiveIntensity={0.2}/>
        </mesh>
      ))}
      <mesh position={[centerX,0.06,0]}>
        <boxGeometry args={[length,0.011,0.027]}/>
        <meshStandardMaterial color="#9cb2cb"/>
      </mesh>
    </group>
  );
}

function Radiator({area}: {area:number}) {
  const panel = Math.min(2.8,Math.max(0.4,Math.sqrt(Math.max(0.01,area))*.66));
  return <group>
    {([-1,1] as const).map(side=><group key={side} position={[side*0.7,-0.1,-1.08]}>
      <mesh><boxGeometry args={[panel/2,.06,panel]}/><meshStandardMaterial color="#aeb9c9" metalness={0.25} roughness={0.65}/></mesh>
      {Array.from({length:6},(_,i)=><mesh key={i} position={[0,.04,-panel/2+(i+.5)*panel/6]}>
        <boxGeometry args={[panel/2,.012,.018]}/><meshStandardMaterial color="#6f91ab" metalness={0.55}/>
      </mesh>)}
    </group>)}
  </group>;
}

function Thruster({electric,ready}: {electric:boolean;ready:boolean}) {
  return <group position={[0,-.1,-1.12]} rotation={[Math.PI/2,0,0]}>
    <mesh><cylinderGeometry args={[.3,.43,.6,20]}/><Metal color="#667789"/></mesh>
    <mesh position={[0,-.32,0]}><torusGeometry args={[.31,.055,10,24]}/><Metal color="#b6cbdf"/></mesh>
    <mesh position={[0,-.34,0]}><circleGeometry args={[.255,24]}/><meshBasicMaterial color={electric&&ready?'#6caaf8':'#252d37'}/></mesh>
    {electric&&ready&&<mesh position={[0,-.68,0]} rotation={[Math.PI,0,0]}>
      <coneGeometry args={[.24,.7,24,1,true]}/>
      <meshBasicMaterial color="#65a8ff" transparent opacity={0.35} depthWrite={false}/>
    </mesh>}
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
  const pv = Math.sqrt(Math.max(0,design.cellAreaM2));
  const radiatorArea = analysis?.radiatorAreaM2 ?? 0.3;
  const tankScale = Math.max(.28,Math.min(.7,.28+design.propellantMassKg/320));
  const hasSolar = design.cellAreaM2>0;
  const isNuclear = design.powerSourceId!=='solar';
  return <group rotation={[.12,.1,0]}>
    <Pick part="bus" selected={selected} onSelect={onSelect}>
      <mesh><boxGeometry args={[1.75,1.8,1.65]}/><meshStandardMaterial color="#b2a77f" metalness={0.32} roughness={0.72}/></mesh>
      <mesh position={[0,0,0.836]}><boxGeometry args={[1.72,1.76,.02]}/><meshStandardMaterial color="#d8b65b" metalness={0.35} roughness={.58}/></mesh>
      {[-.65,.65].map(x=><mesh key={x} position={[x,0,.855]}><boxGeometry args={[.04,1.77,.025]}/><Metal color="#747f87"/></mesh>)}
      <mesh position={[0,.88,0]}><boxGeometry args={[1.78,.08,1.73]}/><Metal color="#c4d5e4"/></mesh>
    </Pick>
    {hasSolar&&<Pick part="power" selected={selected} onSelect={onSelect}><PanelWing side={-1} scale={pv}/><PanelWing side={1} scale={pv}/></Pick>}
    {isNuclear&&<Pick part="power" selected={selected} onSelect={onSelect}>
      <mesh position={[.78,-1.2,.3]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[.22,.22,1.55,18]}/><Metal color={design.powerSourceId==='mmrtg'?'#8e999e':'#8c786a'}/>
      </mesh>
      <mesh position={[.78,-1.2,.3]} rotation={[0,0,Math.PI/2]}>
        <torusGeometry args={[.23,.035,8,20]}/><Metal color="#c0b19b"/>
      </mesh>
    </Pick>}
    <Pick part="radiator" selected={selected} onSelect={onSelect}><Radiator area={radiatorArea}/></Pick>
    <Pick part="tank" selected={selected} onSelect={onSelect}>
      <mesh position={[0,-.12,0]}>
        <sphereGeometry args={[tankScale,20,16]}/><meshStandardMaterial color="#798a9b" metalness={.8} roughness={.25} transparent opacity={selected==='tank'?1:.85}/>
      </mesh>
      <mesh position={[0,-.12,.03]} rotation={[Math.PI/2,0,0]}>
        <torusGeometry args={[tankScale*.78,.028,8,24]}/><Metal color="#d9d0b1"/>
      </mesh>
    </Pick>
    <Pick part="propulsion" selected={selected} onSelect={onSelect}>
      <Thruster electric={design.thrusterId!=='mono-reference'} ready={analysis?.canPowerThruster??false}/>
    </Pick>
    <Pick part="antenna" selected={selected} onSelect={onSelect}><Dish/></Pick>
    <mesh position={[0,-1.7,0]} rotation={[-Math.PI/2,0,0]}>
      <ringGeometry args={[.95,1.0,48]}/>
      <meshBasicMaterial color="#2c607d" transparent opacity={.25} side={2}/>
    </mesh>
  </group>;
}

function NASAReferenceMesh({ url, onStatus }: {
  url:string;
  onStatus:(s:'loaded'|'failed')=>void;
}) {
  const [object,setObject] = useState<Object3D|null>(null);
  useEffect(()=>{
    let cancelled = false;
    setObject(null);
    const loader = new GLTFLoader();
    loader.load(url,(gltf)=>{
      if(cancelled)return;
      const root = gltf.scene;
      const box = new Box3().setFromObject(root);
      const size = box.getSize(new Vector3());
      const maxDimension = Math.max(size.x,size.y,size.z);
      if(!(maxDimension>0)){onStatus('failed');return;}
      const center = box.getCenter(new Vector3());
      root.position.sub(center);
      const group = new Group();
      group.add(root);
      group.scale.setScalar(6.5/maxDimension);
      setObject(group);
      onStatus('loaded');
    },undefined,()=>{if(!cancelled)onStatus('failed')});
    return ()=>{cancelled=true;};
  },[url,onStatus]);
  return object ? <primitive object={object}/> : null;
}

export default function Spacecraft3D({
  design,analysis,referenceModelUrl,
}:{
  design:SubsystemDesign;
  analysis:SystemResults|null;
  referenceModelUrl?:string;
}) {
  const [selected,setSelected]=useState<PartName>('bus');
  const [nasaStatus,setNasaStatus]=useState<'idle'|'loading'|'loaded'|'failed'>('idle');
  const [customUrl,setCustomUrl]=useState<string|null>(null);
  const [viewerSource,setViewerSource]=useState<'modular'|'nasa'|'cad'>('modular');
  const onStatus = useMemo(()=> (status:'loaded'|'failed')=>setNasaStatus(status),[]);
  useEffect(()=>{setViewerSource('modular');setNasaStatus('idle')},[referenceModelUrl]);
  useEffect(()=>()=>{if(customUrl)URL.revokeObjectURL(customUrl)},[customUrl]);
  const activeExternalModelUrl = viewerSource==='nasa'?referenceModelUrl :
    viewerSource==='cad'?customUrl:null;
  function loadCadFile(file:File|undefined) {
    if(!file)return;
    if(!file.name.toLowerCase().endsWith('.glb')){setNasaStatus('failed');return;}
    setCustomUrl(URL.createObjectURL(file));
    setViewerSource('cad');
    setNasaStatus('loading');
  }

  return <div className="craft-visual-shell">
    <div className="craft-visual-head">
      <div><b>3D spacecraft studio</b><span>Drag to orbit · scroll to zoom · click a component to inspect</span></div>
      <div className="craft-model-actions">
        <button type="button" onClick={()=>{setViewerSource('modular');setNasaStatus('idle')}}>Modular prototype</button>
        {referenceModelUrl&&<button type="button" onClick={()=>{setViewerSource('nasa');setNasaStatus('loading')}}>NASA 3D model</button>}
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
          <NASAReferenceMesh key={activeExternalModelUrl} url={activeExternalModelUrl} onStatus={onStatus}/>
        </> : <ModularSpacecraft design={design} analysis={analysis} selected={selected} onSelect={setSelected}/>}
        <OrbitControls enablePan enableDamping minDistance={3} maxDistance={22}/>
      </Canvas>
    </div>
    <div className="craft-visual-caption">
      <span><strong>{viewerSource!=='modular'?'External 3D: ':'Selected: '}</strong>
        {viewerSource!=='modular'?(nasaStatus==='loaded'?'GLB loaded':nasaStatus==='failed'?'Could not load GLB — see fallback':'Loading GLB…'):selected.toUpperCase()}
      </span>
      <small>{viewerSource!=='modular'?
        'Imported GLB models are view-only and do not automatically set mass, inertia, tank sizes or physics parameters.'
        :PART_DETAILS[selected]}</small>
    </div>
    <p className="craft-disclaimer">SCHEMATIC GEOMETRY. Import a self-contained .glb from Onshape or FreeCAD for viewing. Engineering calculations use independent mass/geometry inputs, not mesh triangles; parametric CAD coupling is future work.</p>
  </div>;
}
