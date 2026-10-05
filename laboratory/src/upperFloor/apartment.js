import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import layout from './apartmentLayout.json' with {type:'json'};

// Original Godot coordinates: hall entry (-3.2, -.8), main room 6.6 × 5 m.
// Turn the whole apartment once, so that entry meets the lab's south exit.
export const apartmentPoint=(x,z)=>({x:z-15.4,z:-x-.8});
export function apartmentWalkable(x,z){
 const p=apartmentPoint(x,z),radius=.20;
 const floors=[[0,6.6,0,5],[3.1,6.6,-4.9,0],[.4,3.1,-4.3,-1.6],[-3.2,3.1,-1.6,0]];
 if(!floors.some(([a,b,c,d])=>p.x>=a&&p.x<=b&&p.z>=c&&p.z<=d))return false;
 return !layout.colliders.some(({position:[cx,,cz],size:[w,,d],yaw})=>{
  const dx=p.x-cx,dz=p.z-cz,c=Math.cos(yaw),s=Math.sin(yaw);
  return Math.abs(c*dx-s*dz)<w/2+radius&&Math.abs(s*dx+c*dz)<d/2+radius;
 });
}
export function createApartment(parent,onStatus){
 const group=new T.Group();group.name='Original Godot apartment';group.position.set(-.8,0,15.4);group.rotation.y=-Math.PI/2;parent.add(group);
 let disposed=false,loaded=false;
 const materials=new Set(),geometries=new Set(),textures=new Set();
 const ready=new GLTFLoader().loadAsync(import.meta.env.BASE_URL+'models/apartment5c/apartment.glb').then(({scene})=>{
  const batches=new Map();scene.updateMatrixWorld(true);
  scene.traverse(o=>{if(!o.isMesh)return;
   const m=o.material;materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);
   geometries.add(o.geometry);m.envMapIntensity=.35;
   const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
   // Only compatible vertex layouts are merged; transparent glass stays separate.
   const key=m.uuid+':'+Object.keys(geometry.attributes).sort().join(',')+(m.transparent?':'+o.uuid:'');
   if(!batches.has(key))batches.set(key,{material:m,parts:[]});batches.get(key).parts.push(geometry);
  });
  for(const {material,parts} of batches.values()){
   const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
   if(!geometry)throw new Error('Apartment geometry could not be combined');
   geometries.add(geometry);const mesh=new T.Mesh(geometry,material);mesh.castShadow=!material.transparent;mesh.receiveShadow=true;group.add(mesh);
  }
  for(const light of layout.lights){const lamp=new T.PointLight(new T.Color(...light.color),light.energy*5,light.range,2);lamp.position.fromArray(light.position);group.add(lamp);}
  loaded=true;if(disposed)dispose();else onStatus?.('Apartment ready');
 }).catch(error=>{if(!disposed)onStatus?.('Apartment could not load: '+error.message);});
 function dispose(){disposed=true;group.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}
 return {ready,get loaded(){return loaded;},dispose};
}

