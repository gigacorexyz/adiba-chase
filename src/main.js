import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { RoadPath } from './road-path.js';
import { installBend } from './bend.js';
import { makeTextures } from './textures.js';
import { createAudio } from './audio.js';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background=new THREE.Color(0x3a5570);
scene.fog = new THREE.Fog(0x3a5570, 30, 125);
const camera = new THREE.PerspectiveCamera(58, innerWidth/innerHeight, .1, 180);
camera.position.set(0, 6.4, 12.5);
camera.lookAt(0,1,0);

scene.add(new THREE.HemisphereLight(0xbfdcff,0x263041,2.1));
const sun = new THREE.DirectionalLight(0xffe1b3,2.6); sun.position.set(-8,14,8); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);
// ---- v5 stage 3: world bend (winding roads). ?nobend=1 turns it off. ----
const bend=installBend(THREE,{enabled:!/[?&]nobend=1/.test(location.search)});
if(renderer.debug)renderer.debug.onShaderError=()=>{console.warn('Shader rejected - road bend disabled');bend.disable(scene,renderer,sun);};
const path=new RoadPath();let pathS=0,camLook=0;path.fill(0,bend.U.value);
// ---- v5 stage 4: procedural textures (<=256px, shared) ----
const TX=makeTextures(THREE);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>TX.repaintText()).catch(()=>{});
const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
const roadMat=mat(0x303b45), sidewalkMat=mat(0x69727a), laneMat=mat(0xf5d38a), skinMat=mat(0xc98762), shirtMat=mat(0x8e2638), pantsMat=mat(0x202b39), blackMat=mat(0x111923), goldMat=mat(0xe7ad51), tealMat=mat(0x1c6e70), redMat=mat(0xc74338);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(300,420),(()=>{const m=mat(0x233d42);m.userData.nobend=true;return m;})());ground.rotation.x=-Math.PI/2;ground.position.set(0,-.18,-110);ground.receiveShadow=true;scene.add(ground);

// ---------- Endless scrolling street: pooled, recycled segments ----------
const SEG_L=30,SEG_N=6,segs=[];
const bGeo=new THREE.BoxGeometry(1,1,1),pGeo=new THREE.PlaneGeometry(1,1),poleGeo=new THREE.CylinderGeometry(.06,.08,5,6),trunkGeo=new THREE.CylinderGeometry(.12,.16,1.6,6),leafGeo=new THREE.SphereGeometry(1,10,8);
const themes=[
 {n:'ব্যস্ত ঢাকা মেইন রোড',c:[0x586a79,0x8b9294,0x647b82],h:[6,18],x:11},
 {n:'পুরান ঢাকা',c:[0xb7794f,0xa86f5a,0xc9a05b],h:[4,9],x:9.6},
 {n:'বাণিজ্যিক এলাকা',c:[0x3f6c8f,0x5b7f9a,0x7e8fa0],h:[12,26],x:11.5,tall:1},
 {n:'আবাসিক সড়ক',c:[0xd7c6a3,0x9fb59a,0xc58f7a],h:[7,14],x:10.5,trees:1},
 {n:'বাজার স্ট্রিট',c:[0xd1553f,0xe0a53a,0x2f9c8a],h:[4,8],x:9.8}];
roadMat.map=TX.asphalt;roadMat.color.set(0xffffff);roadMat.needsUpdate=true;
const roadGeo=new THREE.PlaneGeometry(1,1,1,30),sideGeo=new THREE.BoxGeometry(1,1,1,1,1,15); // subdivided along the road so it can bend
sidewalkMat.map=TX.concrete;sidewalkMat.color.set(0xe2e6e8);sidewalkMat.userData.wuv=.5;
const edgeMat=mat(0xf2f2f2,.6),shutterMat=new THREE.MeshStandardMaterial({map:TX.shutter,roughness:.7,metalness:.3}),tankMat=mat(0x4f6f8f,.55),benchMat=mat(0x7a5a3a,.8),binMat=mat(0x2f6f4f,.7),poleMat=mat(0x8d949b,.5);
shutterMat.userData.wuv=.5;
const barrierMat=new THREE.MeshStandardMaterial({map:TX.barrier,roughness:.6});
const signPlateMats=TX.roadSigns.map(t=>new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:.4,side:THREE.DoubleSide}));
const tankGeo=new THREE.CylinderGeometry(.8,.8,1.2,12);
const themeMats=themes.map((t,ti)=>t.c.map(c=>{const m=mat(c,.85),brick=(ti===1||ti===4);m.map=brick?TX.brick:TX.paint;m.userData.wuv=brick?.625:.25;return m;}));
const signMats=TX.signs.map(t=>new THREE.MeshStandardMaterial({map:t,roughness:.6}));
const winMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x1d3344,roughness:.3,map:TX.windows,alphaTest:.5});winMat.userData.wuv=.3;
const lampMat=new THREE.MeshBasicMaterial({color:0xffe9a8}), leafMat=mat(0x2f7d46), trunkMat=mat(0x5a4030);
const posterTexts=[['আদিবা লাইভ কনসার্ট','শনিবার রাত ৮টায়','#c2185b'],['বিসিএস কোচিং','ভর্তি চলছে!','#1565c0'],['ঢাকা বিরিয়ানি হাউস','কাচ্চি ১৫০ টাকা','#e65100'],['ক্রিকেট ফাইনাল','আজ রাত ৭টায়','#2e7d32'],['জ্যামমুক্ত ঢাকা চাই!','— কাল্পনিক প্রার্থী','#6a1b9a'],['স্বামী পলাতক!','খুঁজে পেলে আদিবাকে জানান','#ad1457'],['বইমেলা ২০২৬','পরিবারসহ আসুন','#00838f'],['রিকশা রেস','আজ বিকেলে চকবাজারে','#827717']];
const posterMats=posterTexts.map(()=>new THREE.MeshBasicMaterial());
function paintPosters(){posterTexts.forEach(([a,b,c],i)=>{
 const cv=document.createElement('canvas');cv.width=256;cv.height=352;const x=cv.getContext('2d');
 x.fillStyle='#fff';x.fillRect(0,0,256,352);x.fillStyle=c;x.fillRect(10,10,236,332);x.fillStyle='#fff';x.textAlign='center';
 let f=34;x.font='700 '+f+'px "Hind Siliguri",sans-serif';while(x.measureText(a).width>216&&f>16){f-=2;x.font='700 '+f+'px "Hind Siliguri",sans-serif';}
 x.fillText(a,128,170);x.font='500 22px "Hind Siliguri",sans-serif';x.fillText(b,128,225,216);x.font='56px sans-serif';x.fillText('❤',128,100);
 const m=posterMats[i];if(m.map)m.map.dispose();m.map=new THREE.CanvasTexture(cv);m.map.colorSpace=THREE.SRGBColorSpace;m.needsUpdate=true;});}
paintPosters();try{document.fonts&&document.fonts.load('700 30px "Hind Siliguri"').then(paintPosters);}catch(e){}
function makeSeg(){
 const g=new THREE.Group();
 const road=new THREE.Mesh(roadGeo,roadMat);road.scale.set(10,SEG_L,1);road.rotation.x=-Math.PI/2;road.position.y=-.12;road.receiveShadow=true;g.add(road);
 for(const x of [-1.65,1.65])for(let k=0;k<4;k++){const d=new THREE.Mesh(bGeo,laneMat);d.scale.set(.09,.025,3.4);d.position.set(x,-.095,-SEG_L/2+3.75+k*7.5);g.add(d);}
 const slots=[],lamps=[],trees=[],props=[];
 for(const s of [-1,1]){
  const ed=new THREE.Mesh(sideGeo,edgeMat);ed.scale.set(.12,.02,SEG_L);ed.position.set(s*4.65,-.1,0);g.add(ed);
  const pr={s,bench:new THREE.Mesh(bGeo,benchMat),back:new THREE.Mesh(bGeo,benchMat),bin:new THREE.Mesh(tankGeo,binMat),pole:new THREE.Mesh(poleGeo,poleMat),plate:new THREE.Mesh(pGeo,signPlateMats[0]),bar:new THREE.Mesh(sideGeo,barrierMat)};
  pr.bin.scale.set(.32,.55,.32);pr.pole.scale.set(.6,.52,.6);pr.bar.scale.set(.22,.55,2.4);pr.bench.scale.set(.5,.1,1.5);pr.back.scale.set(.08,.45,1.5);
  g.add(pr.bench,pr.back,pr.bin,pr.pole,pr.plate,pr.bar);props.push(pr);
  const w=new THREE.Mesh(sideGeo,sidewalkMat);w.scale.set(1.1,.25,SEG_L);w.position.set(s*5.5,-.03,0);g.add(w);
  for(const z of [-7,8]){const pole=new THREE.Mesh(poleGeo,blackMat);pole.position.set(s*5.2,2.4,z);const lamp=new THREE.Mesh(bGeo,lampMat);lamp.scale.set(.5,.15,.3);lamp.position.set(s*4.9,4.9,z);g.add(pole,lamp);}
  const tr=new THREE.Group();const tk=new THREE.Mesh(trunkGeo,trunkMat);tk.position.y=.8;const lf=new THREE.Mesh(leafGeo,leafMat);lf.position.y=2.3;lf.scale.set(1.1,1.2,1.1);tr.add(tk,lf);tr.position.set(s*6.7,0,0);g.add(tr);trees.push(tr);
  for(let i=0;i<3;i++){
   const b=new THREE.Mesh(bGeo,themeMats[0][0]);b.castShadow=true;
   const f=new THREE.Mesh(pGeo,winMat);f.rotation.y=-s*Math.PI/2;
   const po=new THREE.Mesh(pGeo,posterMats[0]);po.rotation.y=-s*Math.PI/2;po.scale.set(2,2.8,1);
   const aw=new THREE.Mesh(bGeo,signMats[0]);
   const sh=new THREE.Mesh(pGeo,shutterMat);sh.rotation.y=-s*Math.PI/2;const rt=new THREE.Mesh(tankGeo,tankMat);
   g.add(b,f,po,aw,sh,rt);slots.push({s,z:-10+i*10,b,f,po,aw,sh,rt});
  }
 }
 g.userData={slots,trees,props};scene.add(g);return g;
}
function buildSeg(g,t){
 const ti=themes.indexOf(t);
 for(const sl of g.userData.slots){
  const h=t.h[0]+Math.random()*(t.h[1]-t.h[0]),w=3+Math.random()*3,s=sl.s,near=s*(t.x-1.2);
  sl.b.material=themeMats[ti][(Math.random()*3)|0];
  sl.b.scale.set(w,h,8);sl.b.position.set(near+s*w/2,h/2-.1,sl.z);
  sl.f.scale.set(7.4,Math.max(2,h-2.5),1);sl.f.position.set(near-s*.02,h/2+.9,sl.z);
  const showP=Math.random()<.65;sl.po.visible=showP;
  if(showP){sl.po.material=posterMats[(Math.random()*posterMats.length)|0];sl.po.position.set(near-s*.05,2.6,sl.z-1.6+Math.random()*3.2);}
  sl.aw.material=signMats[(Math.random()*signMats.length)|0];sl.aw.scale.set(.7,.55,6.6);sl.aw.position.set(near-s*.35,3.9,sl.z);
  const showSh=h>=4&&Math.random()<.7;sl.sh.visible=showSh;if(showSh){sl.sh.scale.set(6.2,2.5,1);sl.sh.position.set(near-s*.07,1.15,sl.z);}
  const showT=Math.random()<.4;sl.rt.visible=showT;if(showT)sl.rt.position.set(near+s*w/2,h+.6,sl.z+(Math.random()-.5)*4);
 }
 for(const tr of g.userData.trees)tr.visible=!!t.trees||Math.random()<.3;
 for(const p of g.userData.props){const s=p.s,z=-13+Math.random()*26;
  const vb=Math.random()<.4;p.bench.visible=p.back.visible=vb;if(vb){p.bench.position.set(s*5.45,.28,z);p.back.position.set(s*5.7,.55,z);}
  const vn=Math.random()<.5;p.bin.visible=vn;if(vn)p.bin.position.set(s*5.15,.3,z+2.2);
  const vs=Math.random()<.5;p.pole.visible=p.plate.visible=vs;if(vs){const zz=z-3;p.pole.position.set(s*5.75,1.3,zz);p.plate.position.set(s*5.7,2.8,zz);p.plate.rotation.y=-s*Math.PI/2;p.plate.scale.set(.75,.75,1);p.plate.material=signPlateMats[(Math.random()*signPlateMats.length)|0];}
  const vr=Math.random()<.22;p.bar.visible=vr;if(vr)p.bar.position.set(s*4.75,.2,-13+Math.random()*26);}
}
for(let i=0;i<SEG_N;i++){const g=makeSeg();g.position.z=15-i*SEG_L;buildSeg(g,themes[0]);segs.push(g);}
let themeIdx=0;
function updateWorld(dt){
 const ti=Math.floor(distance/300)%themes.length;
 for(const g of segs){g.position.z+=speed*dt;if(g.position.z>27){g.position.z-=SEG_N*SEG_L;buildSeg(g,themes[ti]);}}
 if(ti!==themeIdx){themeIdx=ti;toast('📍 '+themes[ti].n);}
 pathS+=speed*dt;path.fill(pathS,bend.U.value);
}
function resetWorld(){segs.forEach((g,i)=>{g.position.z=15-i*SEG_L;buildSeg(g,themes[0]);});themeIdx=0;pathS=0;camLook=0;path.reset();path.fill(0,bend.U.value);}

function makePersonRaw(topColor, bottomColor, scale=1, isAdiba=false){
 const g=new THREE.Group();
 const shirt=mat(topColor,.68), pants=mat(bottomColor,.82), skin=mat(isAdiba?0xd99a78:0xc98762,.72);
 shirt.map=TX.fabric;pants.map=TX.fabric;skin.map=TX.skin;
 const gold=mat(0xe6b45d,.48), hairMat=mat(isAdiba?0x15131a:0x17151b,.38), shoeMat=mat(0xf1eee8,.55);hairMat.map=TX.hair;
 const add=(parent,geo,material,pos,rot)=>{const m=new THREE.Mesh(geo,material);m.position.set(...pos);if(rot)m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 // torso, neck and head
 const torso=add(g,new THREE.CylinderGeometry(.31,.35,.88,16),shirt,[0,1.28,0]);
 const neck=add(g,new THREE.CylinderGeometry(.105,.13,.2,12),skin,[0,1.78,0]);
 const head=add(g,new THREE.SphereGeometry(.29,24,18),skin,[0,2.08,.015]);
 // ears, eyes, brows, nose and mouth face camera (+Z)
 for(const x of [-.29,.29]) add(g,new THREE.SphereGeometry(.075,12,10),skin,[x,2.08,0]);
 for(const x of [-.105,.105]){
   add(g,new THREE.SphereGeometry(.043,12,10),mat(0x201a1a),[x,2.115,.267]);
   add(g,new THREE.SphereGeometry(.017,8,8),mat(0xffffff),[x-.01,2.13,.302]);
   add(g,new THREE.BoxGeometry(.11,.025,.035),hairMat,[x,2.205,.255],[0,0,x>0?-.12:.12]);
 }
 add(g,new THREE.SphereGeometry(.045,10,8),skin,[0,2.02,.29]);
 add(g,new THREE.BoxGeometry(.13,.018,.025),mat(0x713e3c),[0,1.965,.28]);
 if(isAdiba){
   // long traditional black dress with embroidered gold borders
   add(g,new THREE.CylinderGeometry(.31,.55,1.15,16,1),shirt,[0,.85,0]);
   for(let y of [.36,.53,1.05,1.36]){const ring=add(g,new THREE.TorusGeometry(y<.6?.48:.32,.018,6,32),gold,[0,y,0]);ring.rotation.x=Math.PI/2;}
   for(let i=0;i<7;i++)for(let side of [-1,1])add(g,new THREE.SphereGeometry(.025,7,6),gold,[side*(.17+i*.035),.55+i*.12,.28]);
   // head covering: hood and trailing dupatta panels
   add(g,new THREE.SphereGeometry(.34,20,14,0,Math.PI*2,0,Math.PI*.62),hairMat,[0,2.12,-.025]);
   const veil=add(g,new THREE.ConeGeometry(.43,1.5,12),hairMat,[0,1.62,-.12],[.18,0,0]);
   add(g,new THREE.TorusGeometry(.34,.018,6,32),gold,[0,2.19,.02],[Math.PI/2,0,0]);
   for(let i=0;i<10;i++)add(g,new THREE.SphereGeometry(.018,6,6),gold,[(i%2?1:-1)*(.19+(i%3)*.035),1.25+(i*.09),.24]);
 } else {
   // button shirt details
   for(let y of [1.53,1.34,1.15,.96])add(g,new THREE.SphereGeometry(.025,8,6),gold,[.035,y,.315]);
   add(g,new THREE.BoxGeometry(.025,.62,.018),mat(0x4c1724),[0,1.27,.31]);
   // swept, voluminous hairstyle
   add(g,new THREE.SphereGeometry(.315,20,14,0,Math.PI*2,0,Math.PI*.56),hairMat,[0,2.22,-.015],[-.18,0,0]);
   add(g,new THREE.SphereGeometry(.22,16,10),hairMat,[-.13,2.34,-.015],[0,0,-.25]);
   // backpack and visible straps
   add(g,new THREE.BoxGeometry(.58,.72,.24),mat(0x151d27),[0,1.28,-.31]);
   for(let x of [-.235,.235])add(g,new THREE.BoxGeometry(.085,.75,.075),mat(0x252d38),[x,1.35,.22],[0,0,x>0?-.12:.12]);
 }
 // articulated limb pivots; upper and lower legs/arms animate independently
 const limbs={legs:[],arms:[]};
 for(const x of [-.17,.17]){
   const hip=new THREE.Group();hip.position.set(x,1.0,0);g.add(hip);
   add(hip,new THREE.CylinderGeometry(.09,.12,.42,12),pants,[0,-.25,0]);
   const knee=new THREE.Group();knee.position.y=-.48;hip.add(knee);
   add(knee,new THREE.CylinderGeometry(.075,.09,.4,12),pants,[0,-.22,0]);
   add(knee,new THREE.BoxGeometry(.19,.12,.38),shoeMat,[0,-.46,.105]);
   limbs.legs.push({hip,knee,side:x>0?1:-1});
 }
 for(const x of [-.39,.39]){
   const shoulder=new THREE.Group();shoulder.position.set(x,1.56,0);g.add(shoulder);
   add(shoulder,new THREE.SphereGeometry(.13,12,10),shirt,[0,0,0]);
   add(shoulder,new THREE.CylinderGeometry(.075,.09,.4,12),shirt,[0,-.25,0],[0,0,x>0?-.1:.1]);
   const elbow=new THREE.Group();elbow.position.y=-.48;shoulder.add(elbow);
   add(elbow,new THREE.CylinderGeometry(.06,.075,.35,12),isAdiba?shirt:skin,[0,-.19,0]);
   add(elbow,new THREE.SphereGeometry(.075,10,8),skin,[0,-.39,.015]);
   limbs.arms.push({shoulder,elbow,side:x>0?1:-1});
 }
 g.userData={limbs,torso,head,isAdiba};
 g.scale.setScalar(scale);return g;
}

function makePerson(a,b,sc,isA){const inner=makePersonRaw(a,b,sc,isA);inner.rotation.y=Math.PI;const h=new THREE.Group();h.add(inner);h.userData=inner.userData;return h;}
const player=makePerson(0x8c293c,0x222b39,1,false);
player.position.set(0,0,4);scene.add(player);
const adiba=makePerson(0x171d28,0x171d28,.93,true);
adiba.position.set(0,0,7.2);scene.add(adiba);

function animateCharacter(character,t,mode='run',blend=1){
 const rig=character?.userData?.limbs;
 if(!rig)return;
 const runningPose=mode==='run';
 for(const leg of rig.legs||[]){
   const phase=t*10+(leg.side>0?Math.PI:0);
   leg.hip.rotation.x=runningPose?Math.sin(phase)*.72*blend:Math.sin(t*1.8+leg.side)*.025;
   leg.knee.rotation.x=runningPose?Math.max(0,-Math.sin(phase))*.95*blend:0;
 }
 for(const arm of rig.arms||[]){
   const phase=t*10+(arm.side>0?0:Math.PI);
   arm.shoulder.rotation.x=runningPose?Math.sin(phase+Math.PI)*.58*blend:Math.sin(t*1.4+arm.side)*.035;
   arm.shoulder.rotation.z=arm.side*(runningPose?.12:.04);
   arm.elbow.rotation.x=runningPose?-.35-Math.max(0,Math.sin(phase))*.45:0;
 }
 const torso=character.userData.torso;
 const head=character.userData.head;
 if(torso)torso.rotation.x=runningPose?-.06+Math.sin(t*20)*.018:Math.sin(t*1.5)*.012;
 if(head)head.rotation.x=Math.sin(t*2.1)*.018;
}

const lanes=[-3.1,0,3.1];let lane=1, running=false, paused=false, distance=0, score=0, coins=0, chase=0, speed=17, jumpV=0, jumping=false, sliding=0, elapsed=0, spawnTimer=0, coinTimer=0, dialogueTimer=0, lastDialogue=-1;
const obstacles=[], collectibles=[], scenery=[], pedestrians=[], trafficVehicles=[];
const gc={},mc={};
const G=(w,h,d)=>gc[w+','+h+','+d]||(gc[w+','+h+','+d]=new THREE.BoxGeometry(w,h,d));
const M=(c,r=.55,m=.1)=>mc[c+','+r+','+m]||(mc[c+','+r+','+m]=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,map:TX.metal}));
const glassMat=new THREE.MeshStandardMaterial({color:0x9fd0e0,roughness:.1,metalness:.4,transparent:true,opacity:.78});
const headMat=new THREE.MeshBasicMaterial({color:0xfff2c0}),tailMat=new THREE.MeshBasicMaterial({color:0xff2a2a});
const tireMat=mat(0xffffff,.9);tireMat.map=TX.tread;const chromeMat=M(0xc8ccd0,.25,.8);
const wGeo=new THREE.CylinderGeometry(.34,.34,.24,14),wGeoS=new THREE.CylinderGeometry(.3,.3,.12,12);
function addB(g,w,h,d,m,x,y,z){const o=new THREE.Mesh(G(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o;}
function addW(g,ws,x,y,z,geo){const w=new THREE.Mesh(geo||wGeo,tireMat);w.rotation.z=Math.PI/2;w.position.set(x,y,z);g.add(w);ws.push(w);}
function lights(g,hw,y,hz){for(const x of [-hw,hw]){addB(g,.3,.16,.05,headMat,x,y,-hz);addB(g,.3,.16,.05,tailMat,x,y,hz);}}
const pick5=a=>a[Math.floor(Math.random()*a.length)];
function boxObstacle(x,z,type,vs=0){
 const g=new THREE.Group(),ws=[];let hz=1.2,hx=1;
 if(type==='car'){hz=1.85;hx=.85;const c=M(pick5([0xb33a3a,0x2f5fa3,0xe3e3e3,0x222831,0xd9a441]),.35,.5);
  addB(g,1.6,.55,3.6,c,0,.6,0);addB(g,1.44,.42,1.7,glassMat,0,1.07,.2);addB(g,1.3,.08,1.5,c,0,1.32,.2);lights(g,.5,.65,1.8);
  addB(g,1.7,.14,.1,chromeMat,0,.38,1.82);addB(g,1.7,.14,.1,chromeMat,0,.38,-1.82);
  for(const x of [-.82,.82])for(const z of [-1.15,1.15])addW(g,ws,x,.34,z);}
 else if(type==='bus'){hz=3.3;hx=1.15;const c=M(pick5([0x287b83,0xc0392b,0x2d6a4f]),.5,.2);
  addB(g,2.3,2.2,6.4,c,0,1.55,0);addB(g,2.34,.7,5.4,glassMat,0,2.05,0);addB(g,2.34,.22,6.42,M(0xf4bd58),0,1.25,0);addB(g,2,.8,.05,glassMat,0,2.05,-3.21);
  lights(g,.8,.9,3.2);addB(g,2.4,.16,.12,chromeMat,0,.5,3.25);
  for(const x of [-1.1,1.1])for(const z of [-2.1,2.1])addW(g,ws,x,.38,z);}
 else if(type==='truck'){hz=2.9;hx=1.15;const c=M(pick5([0xd9822b,0x3a6ea5,0x7a8f3a]),.5,.2);
  addB(g,2,1.7,1.7,c,0,1.3,-2);addB(g,2.02,.6,.05,glassMat,0,1.65,-2.86);addB(g,2.3,2.2,3.9,M(0xd8d2c4,.7,.05),0,1.7,.85);addB(g,2,.3,5.6,M(0x20252b),0,.6,0);
  lights(g,.7,.85,-2.86);for(const x of [-.7,.7])addB(g,.3,.16,.05,tailMat,x,.85,2.8);
  for(const x of [-1,1])for(const z of [-2,.5,1.9])addW(g,ws,x,.36,z);}
 else if(type==='cng'){hz=1.2;hx=.8;
  addB(g,1.5,1.2,2.2,M(0x2d8b62,.45,.2),0,.85,0);addB(g,1.6,.12,1.9,M(0xe9c030),0,1.55,.1);addB(g,1.3,.6,.05,glassMat,0,1.15,-1.1);lights(g,.45,.6,1.1);
  for(const x of [-.7,.7])for(const z of [-.7,.7])addW(g,ws,x,.3,z,wGeoS);}
 else if(type==='rickshaw'){hz=1.5;hx=.65;
  addB(g,1,.4,.9,M(0xc0392b,.6),0,.9,.4);addB(g,1.1,.08,1.2,M(0xd33a3a,.6),0,1.9,.4);for(const x of [-.5,.5])addB(g,.06,1,.06,chromeMat,x,1.4,-.1);
  addB(g,.9,.6,.08,M(0xf4bd58,.6),0,1.2,.88);addB(g,.45,.7,.3,M(pick5([0x3a6ea5,0xb65a42,0x547b45])),0,1.35,-.9);
  const hd=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),mat(0xc98762));hd.position.set(0,1.85,-.9);g.add(hd);
  addB(g,.08,.08,1.8,chromeMat,0,.55,-.3);addW(g,ws,-.55,.35,.5,wGeoS);addW(g,ws,.55,.35,.5,wGeoS);addW(g,ws,0,.35,-1.2,wGeoS);}
 else if(type==='moto'){hz=1;hx=.4;
  addB(g,.35,.45,1.5,M(pick5([0xb33a3a,0x2f5fa3,0x222831]),.4,.4),0,.75,0);addB(g,.3,.1,.6,M(0x111111),0,1.02,.35);
  addB(g,.42,.62,.3,M(pick5([0x3a6ea5,0xd9a441,0x8e2638])),0,1.35,.15);const hd=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),mat(0xc98762));hd.position.set(0,1.82,.1);g.add(hd);
  addB(g,.2,.15,.05,headMat,0,.95,-.78);addB(g,.2,.12,.05,tailMat,0,.8,.78);addW(g,ws,0,.32,-.65,wGeoS);addW(g,ws,0,.32,.65,wGeoS);}
  else if(type==='van'){hz=2.2;hx=.95;const c=M(pick5([0xf2f2f2,0x2f6fa3,0xe8e0c8]),.45,.3);
   addB(g,1.8,1.5,3.6,c,0,1.15,.2);addB(g,1.7,.6,.9,glassMat,0,1.55,-1.5);addB(g,1.82,.2,3.4,M(0xd83a2a),0,.85,.2);addB(g,1.2,.5,.05,M(0x1d2a38),0,1.3,2.02);lights(g,.65,.7,2);addB(g,1.9,.14,.1,chromeMat,0,.4,-2.02);
   for(const x of [-.9,.9])for(const z of [-1.3,1.4])addW(g,ws,x,.36,z);}
 else {addB(g,1.45,1.15,1.3,M(0xc16a43,.8,0),0,.65,0);addB(g,1.5,.2,1.35,M(0xf5f5f5),0,1.1,0);hz=.8;hx=.8;}
 g.position.set(x,0,z);scene.add(g);obstacles.push({mesh:g,type,hit:false,wheels:ws,vs,hz,hx});
}
const vtypes=['moto','car','car','bus','truck','cng','rickshaw','van','barrier'];
const vsp={moto:[11,14],car:[8,11],bus:[5,7],truck:[4,6],cng:[6,8],rickshaw:[3,5],van:[6,9],barrier:[0,0]};
function trySpawn(){
 const l=Math.floor(Math.random()*3),type=vtypes[Math.floor(Math.random()*vtypes.length)],[lo,hi]=vsp[type],vs=lo+Math.random()*(hi-lo);
 let L=null;for(const o of obstacles)if(Math.abs(o.mesh.position.x-lanes[l])<.5&&(!L||o.mesh.position.z<L.mesh.position.z))L=o;
 if(L&&(L.mesh.position.z<-59||(vs<L.vs&&L.mesh.position.z<-10)))return false;
 boxObstacle(lanes[l],-75,type,vs);return true;
}
function spawnCoin(x,z){const m=new THREE.Mesh(new THREE.TorusGeometry(.34,.11,8,16),goldMat);m.position.set(x,1.15,z);m.rotation.y=Math.PI/2;scene.add(m);collectibles.push(m);}
function spawnStreetDetail(z){
 const side=Math.random()>.5?1:-1, x=side*(6.2+Math.random()*1.4);
 const g=new THREE.Group();const stall=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.2,1.2),mat(Math.random()>.5?0x9c5735:0x27736b));stall.position.y=.65;g.add(stall);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(1.1,.65,4),goldMat);roof.position.y=1.55;roof.rotation.y=Math.PI/4;g.add(roof);
 g.position.set(x,0,z);scene.add(g);scenery.push(g);
}

// Dhaka roadside pedestrians: placed on the pavements, clear of the runner lanes.
function addRoadsidePeople(){
 const outfits=[0x276b75,0xb65a42,0x547b45,0x6b527d,0xd09a3c,0x315a8a];
 for(let side of [-1,1]){
  for(let i=0;i<5;i++){
   const person=makePerson(outfits[(i+(side>0?2:0))%outfits.length],0x26313c,.68,false);
   person.position.set(side*(6.05+(i%2)*.42),0,-48+i*20);
   person.rotation.y=side===-1?-.35:.35;
   scene.add(person);
   pedestrians.push({mesh:person,baseZ:person.position.z,phase:i*.9+side});
  }
 }
}

// Small moving cars/CNGs on the outer service strips, separate from collision obstacles.
function makeTrafficVehicle(side,z,index){
 const g=new THREE.Group();
 const bodyColor=[0x287b83,0xc77b38,0x3b668a,0x9b4b42][index%4];
 const body=new THREE.Mesh(new THREE.BoxGeometry(1.25,.72,2.25),mat(bodyColor,.62));
 body.position.y=.62;body.castShadow=true;g.add(body);
 const cabin=new THREE.Mesh(new THREE.BoxGeometry(.98,.62,1.12),mat(0x9bcbd5,.28));
 cabin.position.set(0,1.22,-.08);g.add(cabin);
 const bumper=new THREE.Mesh(new THREE.BoxGeometry(1.3,.13,.16),goldMat);
 bumper.position.set(0,.35,1.12);g.add(bumper);
 const wheels=[];
 for(const x of [-.66,.66])for(const zz of [-.72,.72]){
  const w=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.12,12),blackMat);
  w.rotation.z=Math.PI/2;w.position.set(x,.28,zz);g.add(w);wheels.push(w);
 }
 g.position.set(side*7.65,0,z);
 g.rotation.y=side===1?Math.PI:0;
 scene.add(g);
 trafficVehicles.push({mesh:g,wheels,side,offset:index});
}
function initTraffic(){
 for(let side of [-1,1])for(let i=0;i<3;i++)makeTrafficVehicle(side,-35-i*34,i+(side>0?2:0));
}
initTraffic();
addRoadsidePeople();
const dialogues=[
 ['husband','আরে বাবা! একটু শান্তি দাও!'],['husband','আমি নির্দোষ, বিশ্বাস করো!'],['husband','আজকে বাসায় ফিরবো না!'],['husband','ভাই, কেউ আমাকে বাঁচাও!'],['husband','আম্মু, তোমার ছেলেকে বাঁচাও!'],['husband','আর দৌড়াতে পারছি না!'],
 ['adiba','এই দাঁড়াও! আজকে তোমার খবর আছে!'],['adiba','কোথায় পালাও দেখি!'],['adiba','বাসায় চলো, তারপর বুঝাচ্ছি!'],['adiba','আজকে তোমার শেষ রক্ষা নাই!'],['adiba','আর কত দৌড়াবা?'],['adiba','ধরতে পারলেই বুঝবা!']
];
const $=s=>document.querySelector(s);
// ================= v5 stage 4: audio, voice captions, memes =================
const A=createAudio({onCaption:t=>showCaption(t)});
function showCaption(t){const b=$('#voice-bubble');if(!b)return;b.textContent='🗣 '+t;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');clearTimeout(showCaption.t);showCaption.t=setTimeout(()=>b.classList.remove('show'),2600);}
const MEMES={
 near:[['😱','ভাই বাঁচাইলা!','boing'],['🫣','চোখ বন্ধ করে ফেলছিলাম!','whoosh'],['😎','ঢাকার রাস্তায় এটা তো নরমাল!','airhorn']],
 money:[['🤑','{t} জমে গেল! বড়লোক!','coin'],['💰','এই টাকায় তো বিরিয়ানি হবে!','boing'],['🤯','ওয়ালেটে {t}! ভাবি জানলে কী হবে?','airhorn']],
 jet:[['🚀','নাসা ফোন করছে!','airhorn'],['🛸','ঢাকার আকাশে নতুন অতিথি!','whoosh']],
 shop:[['🤪','দোকানি: ভাই, ফুচকা খাবেন?','boing'],['😮','পানওয়ালা হাঁ করে তাকিয়ে আছে!','bruh'],['🥴','চা-ওয়ালার হাত থেকে কাপ পড়ে গেল!','trombone']],
 ped:[['🙀','পথচারী: আল্লাহ রে!','boing'],['🤯','এটা কি অলিম্পিক?','airhorn'],['😂','ভাইরাল হইয়া গেলা ভাই!','bruh']],
 land:[['🛬','সাবধানে নামেন, বিল্ডিং আছে!','whoosh']]};
let memeAt=-99,lastMeme='',memeNext=14;
function triggerMeme(kind,force=false){
 const now=performance.now()/1000;if(!force&&now-memeAt<6)return false;
 const pool=MEMES[kind].filter(m=>m[1]!==lastMeme),m=pool.length?pool[Math.floor(Math.random()*pool.length)]:MEMES[kind][0];
 const el=$('#meme');if(!el)return false;memeAt=now;lastMeme=m[1];
 el.querySelector('.m-emoji').textContent=m[0];el.querySelector('.m-cap').textContent=m[1].replace('{t}',fmtTaka(coins));
 el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(triggerMeme.t);triggerMeme.t=setTimeout(()=>el.classList.remove('show'),2500);
 A.sfx(m[2]);memeLog.push(m[1]);if(kind==='ped'||kind==='shop')reactPedestrian();return true;}
const memeLog=[];
function reactPedestrian(){let best=null;for(const p of pedestrians){const z=p.mesh.position.z;if(z<6&&z>-40&&(!best||z>best.mesh.position.z))best=p;}if(best)best.react=1.4;}
function nearMiss(o){score+=15;A.say('near',{p:.9});triggerMeme('near');}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1800);}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));if(id)$('#'+id).classList.add('active');$('#app').dataset.screen=id||'';}
function startGame(){if(!session||!accounts[session]){showScreen('login-screen');return;}A.unlock();resetGame();memeNext=14;pedNext=9;stepT=0;A.startMusic();showScreen(null);running=true;paused=false;$('#hud').classList.remove('hidden');$('#pause-btn').classList.remove('hidden');$('#mobile-hint').style.display='block';}
function resetGame(){
 lastHit='';jetUses=0;jetSecs=0;flying=false;landing=false;jetCharges=0;jetTime=0;jetCd=0;landDip=0;graceT=0;player.scale.y=1;player.rotation.x=0;hideJetUI();
 resetWorld();
 for(const o of obstacles)scene.remove(o.mesh);
 for(const c of collectibles)scene.remove(c);
 for(const s of scenery)scene.remove(s);
 obstacles.length=0;collectibles.length=0;scenery.length=0;
 lane=1;player.position.set(0,0,4);adiba.position.set(0,0,7.2);
 distance=score=coins=chase=elapsed=spawnTimer=coinTimer=dialogueTimer=0;
 speed=17;jumpV=0;jumping=false;sliding=0;
 for(let i=0;i<trafficVehicles.length;i++){
  const v=trafficVehicles[i];v.mesh.position.z=-35-(i%3)*34;
 }
 updateHud();
}
function updateHud(){updateWalletHud();$('#distance').textContent=Math.floor(distance)+' m';$('#score').textContent=score;$('#coins').textContent=coins;}
function move(dir){if(!running||paused)return;lane=THREE.MathUtils.clamp(lane+dir,0,2);}
function jump(){if(!running||paused||jumping||flying||landing)return;jumping=true;jumpV=8.8;A.sfx('jump');A.say('jump',{p:.3});}
function slide(){if(!running||paused||flying||landing)return;sliding=.7;A.sfx('slide');A.say('slide',{p:.3});}
let shot=null;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const bn=n=>Number(n).toLocaleString('bn-BD');
const vehBn={bus:'বাস',car:'প্রাইভেট কার',truck:'ট্রাক',cng:'সিএনজি',rickshaw:'রিকশা',moto:'মোটরসাইকেল',van:'ডেলিভারি ভ্যান',barrier:'রাস্তার ব্যারিকেড'};
// --- Bangla news generator: headline x subheadline x opening x stats line x 2 quotes (thousands of combinations)
const H_GEN=['প্রেমের টানে ঢাকার রাস্তায় রেকর্ড দৌড়!','রিকশার সঙ্গে রেস দিতে গিয়ে বিপাকে যুবক!','ঢাকার যানজটকে হার মানালেন এক প্রেমিক!','দৌড়াতে দৌড়াতে নিজের এলাকাই ভুলে গেলেন!','মেমে বানাতে গিয়ে নিজেই মেমে হয়ে গেলেন!','বাসের সঙ্গে পাল্লা দিতে গিয়ে ভাইরাল!','ঢাকার রাস্তায় আজব দৌড়, পথচারীদের মধ্যে হাসির রোল!','আদিবার হাতে অবশেষে ধরা খেলেন পলাতক স্বামী!','প্রেমের টানে দৌড়, শেষ রক্ষা হলো না!','রিকশাকে ওভারটেক করতে গিয়ে ভাইরাল এক যুবক!','এক দৌড়ে পাঁচ এলাকা পার, শেষমেশ ধরা!','মোটরসাইকেলকে পাশ কাটিয়েও পার পেলেন না যুবক!','ফুচকার দোকানের সামনে থমকে গেল ঢাকার সবচেয়ে দ্রুততম স্বামী!','জ্যামের শহরে ফাঁকা রাস্তা খুঁজতে গিয়ে ধরা!','ঢাকায় অলিম্পিকের প্রস্তুতি? না, এটা শুধু বাসায় ফেরার দৌড়!','গলির মোড়ে থেমে গেল এক প্রেমিকের স্বপ্নের দৌড়','চায়ের কাপে ঝড়: ঢাকার রাস্তায় দৌড়ের গল্প এখন সবার মুখে','হেলমেট ছাড়াই হাওয়ার বেগে ছুটলেন এক যুবক!','দৌড়ের পর বললেন, “বিশ্বাস করো, আমি অফিসে যাচ্ছিলাম!”','ট্রাফিক সিগন্যাল না মেনে আদিবার সিগন্যাল মানলেন স্বামী!','রাজধানীর রাস্তায় ছুটন্ত প্রেমিকের পেছনে ছুটল গোটা পাড়া!','বাসের হেলপারও বললেন, “ভাই, আপনি তো আমাদের চেয়েও ফাস্ট!”','ধরা পড়ার পর বললেন, “আমি তো শুধু হাওয়া খেতে বেরিয়েছিলাম!”','মাঝরাস্তায় থামল দৌড়, শুরু হলো বোঝাপড়া'];
const H_JET=['জেটপ্যাক নিয়ে উড়তে গিয়ে চায়ের দোকানের সামনে অবতরণ!','১০০০ টাকা জমিয়ে আকাশে উড়লেন এক গেমার!','আকাশে উড়েও আদিবার নজর এড়ানো গেল না!','জেটপ্যাকে চড়ে ঢাকার আকাশে প্রেমিক, নিচে অপেক্ষায় আদিবা!','ঢাকার আকাশে উড়ন্ত স্বামী! ট্রাফিক পুলিশও হতবাক','জ্যাম এড়াতে জেটপ্যাকে ভর, তবু রক্ষা পেলেন না!','{j} সেকেন্ডের আকাশ ভ্রমণ শেষে মাটিতে নামতেই ধরা!'];
const H_COIN=['{t} টাকা কুড়িয়েও রক্ষা পেলেন না পলাতক স্বামী!','{c}টি কয়েন কুড়াতে গিয়ে ধরা খেলেন যুবক!','পকেটে {t} টাকা নিয়েও বাসার পথ চিনলেন না!','রাস্তায় টাকা কুড়িয়ে {t} টাকার মালিক, কিন্তু আদিবার কাছে হার!'];
const H_VEH=['{v}-এর সঙ্গে ধাক্কা খেয়েও থামলেন না, শেষে আদিবার কাছে হার!','{v}-এর সামনে নাটকীয় মুহূর্ত, ভাইরাল যুবক!','{v}-কে পাশ কাটাতে গিয়ে বিপাকে প্রেমিক!'];
const H_DIST=['{d} মিটার দৌড়ে রীতিমতো রেকর্ড!','এক নিঃশ্বাসে {d} মিটার! আদিবাও অবাক','{d} মিটার পেরিয়েও শেষ রক্ষা হলো না'];
const SUBS=['{d} মিটার দৌড়েও শেষ রক্ষা হলো না, জানালেন প্রত্যক্ষদর্শীরা।','{c}টি কয়েন কুড়িয়ে দৌড়েও পার পেলেন না তিনি।','চায়ের দোকানের আড্ডায় এখন শুধু এই দৌড়ের গল্প।','ট্রাফিক পুলিশ বললেন: এমন গতি আমরা জ্যামেও দেখি নাই!','{n} নামের এই যুবককে নিয়ে সামাজিক যোগাযোগমাধ্যমে হাসির ঝড়।','স্কোর {s}—এলাকাবাসী বলছেন, “এবার অন্তত বাসার পথ চিনবেন।”','ঘটনার সময় রাস্তায় ছিলেন শত শত মানুষ, সবাই ভিডিও করতে ব্যস্ত।','আদিবা বললেন: “আমি শুধু একটা প্রশ্ন করতে চেয়েছিলাম!”','বিশেষজ্ঞদের মতে, প্রেম আর রিকশার ঘণ্টা—দুটোই থামানো কঠিন।','দৌড় শেষে ঘেমে নেয়ে একাকার, তবু মুখে হাসি।'];
const OPEN=['গতকাল রাজধানীর ব্যস্ততম সড়কে এক অভূতপূর্ব দৃশ্যের অবতারণা হয়।','বিকেলের জ্যামে আটকে থাকা মানুষ হঠাৎ দেখতে পান ছুটন্ত এক যুবককে।','চায়ের কাপে চুমুক দিতে গিয়ে থমকে যান পথচারীরা—কারণ রাস্তায় তখন চলছে এক অঘোষিত দৌড় প্রতিযোগিতা।','সকাল থেকেই ঢাকার আকাশে মেঘ, কিন্তু রাস্তায় ঝড় তুললেন {n}।','প্রত্যক্ষদর্শীরা জানান, শুরুতে সবাই ভেবেছিলেন কোনো সিনেমার শুটিং চলছে।','রাজধানীর গলি থেকে মেইন রোড—সবখানে এক নামই ঘুরছে: {n}।','ফুটপাতের দোকানিরা জানান, এমন দৌড় তাঁরা জীবনে দেখেননি।','ঢাকার রিকশার ঘণ্টা আর বাসের হর্নের মাঝেই ছুটে চলেন {n}।'];
const STATS=['তিনি মোট {d} মিটার পথ পাড়ি দেন এবং স্কোর করেন {s}।','দৌড়ের পথে কুড়িয়ে নেন {c}টি কয়েন, অর্থাৎ ভার্চুয়াল {t} টাকা (আসল টাকা নয়)।','হিসাব বলছে, {d} মিটার দৌড়ে তাঁর সঞ্চয় দাঁড়ায় {t} টাকা—তবে সবই গেমের মুদ্রা!','পথে {c}টি কয়েন আর {s} পয়েন্ট জমিয়ে তিনি রীতিমতো ‘ঢাকার সেরা দৌড়বিদ’ বনে যান।'];
const JETLN=['{j}','জেটপ্যাক নিয়ে তিনি {u} বার আকাশে ওড়েন, মোট {j} সেকেন্ড—নিচে তখন রিকশাওয়ালারা হাঁ করে তাকিয়ে।','আকাশে {j} সেকেন্ড কাটিয়ে মাটিতে নামতেই শুনতে পান পরিচিত কণ্ঠ: “এবার কই যাবা?”'];
const NOJET='এদিন জেটপ্যাক ব্যবহার না করে পুরোটাই পায়ে হেঁটে (আসলে দৌড়ে) পাড়ি দেন তিনি।';
const HITLN=['শেষ মুহূর্তে {v}-এর সঙ্গে সংঘর্ষের জেরে গতি কমে যায় এবং আদিবা কাছে চলে আসেন।','{v}-এর পাশ কাটাতে গিয়েই মূলত নাটকের শুরু বলে জানান স্থানীয়রা।'];
const WIT=['রিকশাচালক','চায়ের দোকানি','ফুচকাওয়ালা','ট্রাফিক পুলিশ সদস্য','বাসের হেলপার','এক কলেজছাত্র','পাশের দোকানের মালিক','এক পথচারী','পানের দোকানি','এলাকার চাচা'];
const QUO=['এমন স্পিড তো বাসেও দেখি নাই!','ভাই, প্রেমের জন্য এত দৌড়?','এই স্পিডে বিসিএসেও চান্স পাওয়া যায়!','আজকে আর বাসায় ফেরা হবে না!','ধরা খাওয়ার আগে অন্তত একটা ফুচকা খেয়ে যান!','আমি তো ভাবলাম অলিম্পিক শুরু হইছে!','এই গতিতে গেলে চাঁদেও পৌঁছে যাবেন!','ঢাকার রাস্তায় এমন নাটক রোজ দেখা যায় না!','ভাইরে, আপনার মতো ফাস্ট প্রেমিক আগে দেখি নাই!','রাস্তা ফাঁকা পাইলে আরও জোরে দৌড়াইতেন!','ওনার পায়ে নিশ্চয়ই রকেট লাগানো আছে!','আদিবা আপার সাথে পাল্লা দেওয়া সহজ কথা না!'];
const CAPT=['ছবিতে: ঘটনাস্থলের পুরো দৃশ্য—রাস্তা, যানবাহন আর ধাওয়াকারী সবই স্পষ্ট।','ছবিতে: চূড়ান্ত মুহূর্তে ধরা পড়ল পুরো ঘটনা।','ছবিতে: এই দৃশ্যই এখন ভাইরাল পাড়ার চায়ের দোকানে।','ছবিতে: ঘটনার ঠিক আগের নাটকীয় মুহূর্ত।'];
const fillT=(t,o)=>t.replace(/\{(\w)\}/g,(m,k)=>o[k]??m);
let lastHeads=null;
function pickNew(a){lastHeads=lastHeads||LS('adibaLastHeads',[]);const pool=a.filter(x=>!lastHeads.includes(x));return pick(pool.length?pool:a);}
function buildNews(){
 const o={n:nameOf(session)||'অতিথি',d:bn(Math.floor(distance)),s:bn(score),c:bn(coins),t:'৳'+bn(coins*COIN_TAKA),j:bn(Math.round(jetSecs)),u:bn(jetUses),v:vehBn[lastHit]||'যানবাহন'};
 let heads=[...H_GEN];
 if(jetUses>0)heads.push(...H_JET,...H_JET);   // double weight when the jetpack was used
 if(coins>=5)heads.push(...H_COIN);
 if(lastHit)heads.push(...H_VEH);
 if(distance>=300)heads.push(...H_DIST);
 const raw=pickNew(heads);lastHeads.push(raw);while(lastHeads.length>6)lastHeads.shift();LSset('adibaLastHeads',lastHeads);
 const paras=[fillT(pick(OPEN),o)+' '+fillT(pick(STATS),o)];
 let mid=jetUses>0?fillT(pick(JETLN.slice(1)),o):NOJET;if(lastHit&&Math.random()<.6)mid+=' '+fillT(pick(HITLN),o);paras.push(mid);
 const w1=pick(WIT);let w2;do{w2=pick(WIT);}while(w2===w1);let q1=pick(QUO),q2;do{q2=pick(QUO);}while(q2===q1);
 paras.push(w1+' বললেন: “'+q1+'”');paras.push(w2+' হেসে বললেন: “'+q2+'”');
 return {head:fillT(raw,o),sub:fillT(pick(SUBS),o),caption:pick(CAPT),paras};
}
let lastNews=null;
function catchPlayer(){
 if(!running)return;running=false;hideJetUI();A.jet(false);A.stopMusic();A.sfx('gameover');A.say('caught');try{renderer.render(scene,camera);shot=canvas.toDataURL('image/jpeg',.75);}catch(e){shot=null;}$('#hud').classList.add('hidden');$('#pause-btn').classList.add('hidden');$('#mobile-hint').style.display='none';
 $('#final-distance').textContent=Math.floor(distance)+' m';$('#final-score').textContent=score;$('#final-coins').textContent=coins;
 $('#caught-line').textContent=chase>1.7?'Adiba: এতক্ষণ কোথায় পালাচ্ছিলা?':'Adiba: এবার বুঝছো?';
 endRun();showScreen('caught-screen');
}
function collision(type){
 lastHit=type||'';A.sfx('bump');A.say('hit',{p:.8});chase=Math.min(2.6,chase+.72);toast('উফ! আদিবা আরও কাছে চলে এসেছে!');if(chase>=2.45)catchPlayer();
}
function pauseGame(){if(!running)return;persist();paused=true;A.jet(false);A.suspend();showScreen('pause-screen');}
function resumeGame(){paused=false;A.resume();if(flying)A.jet(true);showScreen(null);}
function finishNews(){
 const best=Math.max(Number(localStorage.getItem('adibaBest')||0),score);localStorage.setItem('adibaBest',best);$('#best-score').textContent=best;
 const n=buildNews();lastNews=n;const now=new Date();
 $('#paper-date').textContent=now.toLocaleDateString('bn-BD',{day:'numeric',month:'long',year:'numeric'});
 $('#news-head').textContent=n.head;$('#news-sub').textContent=n.sub;$('#news-caption').textContent=n.caption;
 const body=$('#news-body');body.textContent='';for(const t of n.paras){const p=document.createElement('p');p.textContent=t;body.appendChild(p);}
 const ph=$('#paper-photo');ph.querySelectorAll('img').forEach(i=>i.remove());
 const fb=ph.querySelector('.photo-fallback');
 if(shot){const im=new Image();im.alt='ঘটনাস্থলের ছবি';im.src=shot;ph.appendChild(im);if(fb)fb.style.display='none';}else if(fb)fb.style.display='';
 const rows=[['খেলোয়াড়',nameOf(session)||'অতিথি'],['স্কোর',score],['দূরত্ব',Math.floor(distance)+' মি'],['কয়েন',coins],['এই রানে আয়',fmtTaka(coins)+' (ভার্চুয়াল)'],['মোট ওয়ালেট',fmtTaka(profile.coins)],['জেটপ্যাক',jetUses?jetUses+' বার • '+Math.round(jetSecs)+' সেকেন্ড':'ব্যবহার হয়নি'],['তারিখ ও সময়',now.toLocaleString('bn-BD',{dateStyle:'medium',timeStyle:'short'})]];
 const st=$('#paper-stats');st.textContent='';for(const [k,v] of rows){const d=document.createElement('div');const a=document.createElement('small');a.textContent=k;const b=document.createElement('b');b.textContent=v;d.append(a,b);st.appendChild(d);}
 const ex=$('#paper-extra');if(ex)ex.textContent='বিশেষ প্রতিনিধি: আদিবা নিউজ টিম • ১ কয়েন = ৳১০০ (গেম মুদ্রা, আসল টাকা নয়)';
 $('#news-screen .newspaper').scrollTop=0;
 showScreen('news-screen');
}
$('#start-btn').onclick=startGame;$('#how-btn').onclick=()=>showScreen('help-screen');document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>showScreen('menu-screen'));
$('#pause-btn').onclick=pauseGame;$('#resume-btn').onclick=resumeGame;$('#restart-btn').onclick=startGame;$('#quit-btn').onclick=()=>{running=false;hideJetUI();A.jet(false);A.stopMusic();$('#hud').classList.add('hidden');$('#pause-btn').classList.add('hidden');showScreen('menu-screen')};
$('#news-btn').onclick=finishNews;$('#play-again-btn').onclick=startGame;$('#menu-btn').onclick=()=>{showScreen('menu-screen');$('#best-score').textContent=localStorage.getItem('adibaBest')||0};
$('#best-score').textContent=localStorage.getItem('adibaBest')||0;
addEventListener('keydown',e=>{if(['ArrowLeft','a','A'].includes(e.key))move(-1);if(['ArrowRight','d','D'].includes(e.key))move(1);if(['ArrowUp','w','W',' '].includes(e.key)){e.preventDefault();jump();}if(['ArrowDown','s','S'].includes(e.key))slide();if(e.key==='Escape')running&&!paused?pauseGame():paused?resumeGame():null;});
let touchStart=null;addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchStart={x:t.clientX,y:t.clientY};},{passive:true});
addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>25){if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1);else if(dy<0)jump();else slide();}touchStart=null;},{passive:true});

const clock=new THREE.Clock();
document.addEventListener('visibilitychange',()=>{clock.getDelta();if(document.hidden&&running&&!paused)pauseGame();});
addEventListener('pageshow',()=>clock.getDelta());
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(running&&!paused)pauseGame();});
function frame(){const dt=Math.min(clock.getDelta(),.04);elapsed+=dt;
 if(running&&!paused){
  updateWorld(dt);
  distance+=speed*dt*.42;speed=Math.min(30,17+distance*.012);score=Math.floor(distance*3)+coins*10;chase=Math.max(0,chase-dt*.035);
  player.position.x=THREE.MathUtils.damp(player.position.x,lanes[lane],12,dt);
  if(jumping){player.position.y+=jumpV*dt;jumpV-=22*dt;if(player.position.y<=0){player.position.y=0;jumping=false;}}
  if(sliding>0)sliding-=dt;
  updateJet(dt);
  player.rotation.z=THREE.MathUtils.damp(player.rotation.z,(lanes[lane]-player.position.x)*-.035,8,dt);
  adiba.position.x=THREE.MathUtils.damp(adiba.position.x,player.position.x,2,dt);adiba.position.z=7.2-chase*1.35+Math.sin(elapsed*8)*.12;
  if(sliding>0&&!flying&&!landing)player.rotation.x=-.7;else player.rotation.x=THREE.MathUtils.damp(player.rotation.x,flying?-.45:(landing?-.12:0),9,dt);
  player.scale.y=1-landDip*.18;
  animateCharacter(player,elapsed,'run',sliding>0?.25:1);
  animateCharacter(adiba,elapsed*1.04,'run',1);
  for(const p of pedestrians){
   animateCharacter(p.mesh,elapsed*.55+p.phase,'run',.3);
   p.mesh.position.z+=(speed-1.4)*dt;if(p.mesh.position.z>14)p.mesh.position.z-=100;
   p.mesh.position.y=Math.abs(Math.sin(elapsed*5.5+p.phase))*.03;
    if(p.react>0){p.react-=dt;p.mesh.position.y=Math.abs(Math.sin(elapsed*14))*.3;for(const a of (p.mesh.userData.limbs?.arms||[]))a.shoulder.rotation.x=-2.7;}
  }
  for(const v of trafficVehicles){
   v.mesh.position.z+=dt*(v.side>0?speed-9:speed+9);
   for(const w of v.wheels)w.rotation.x+=dt*14;
   if(v.mesh.position.z>18)v.mesh.position.z=-120-v.offset*7;
  }
  stepT-=dt;if(stepT<=0){stepT=Math.max(.2,.34-speed*.004);if(!jumping&&!flying&&!landing&&sliding<=0)A.sfx('step',.1);}
   memeNext-=dt;if(memeNext<=0){memeNext=16+Math.random()*12;triggerMeme(Math.random()<.5?'shop':'ped');}
   pedNext-=dt;if(pedNext<=0){pedNext=9+Math.random()*7;A.say('ped',{gap:2.5});}
   spawnTimer-=dt;if(spawnTimer<=0){spawnTimer=trySpawn()?Math.max(.6,1.25-distance*.0007):.12;}
  coinTimer-=dt;if(coinTimer<=0){const l=Math.floor(Math.random()*3);for(let i=0;i<5;i++)spawnCoin(lanes[l],-65-i*2.1);coinTimer=2.1+Math.random()*1.3;}
  if(Math.random()<dt*.28)spawnStreetDetail(-75);
  for(let i=obstacles.length-1;i>=0;i--){const o=obstacles[i];o.mesh.position.z+=(speed-(o.vs||0))*dt;for(const w of (o.wheels||[]))w.rotation.x-=(o.vs||0)*dt*3.5;if(o.mesh.position.z>10){scene.remove(o.mesh);obstacles.splice(i,1);continue;}
    const dz=o.mesh.position.z-player.position.z;
    if(!o.snd&&dz<-8&&dz>-26){o.snd=true;const same=Math.abs(o.mesh.position.x-player.position.x)<2.2,r=Math.random();
     if(o.type==='rickshaw'){if(r<.7)A.sfx('bell',.6);}else if(o.type==='bus'){if(same||r<.3)A.sfx('busHorn',.6);}else if(o.type==='truck'){if(same||r<.3)A.sfx('truckHorn',.6);}
     else if(o.type==='moto'){if(r<.6)A.sfx('moto',.6);}else if(o.type!=='barrier'&&same&&r<.7)A.sfx('horn',.5);}
    if(!o.hit&&!o.passed&&dz>(o.hz||1.45)+.45){o.passed=true;const gap=Math.abs(o.mesh.position.x-player.position.x)-((o.hx||1.1)+.35);if(!flying&&!landing&&o.type!=='barrier'&&gap>0&&gap<1){nearMiss(o);}}
   if(!o.hit&&!flying&&!landing&&graceT<=0&&Math.abs(o.mesh.position.z-player.position.z)<(o.hz||1.45)+.45&&Math.abs(o.mesh.position.x-player.position.x)<(o.hx||1.1)+.35){
    const canClear=(o.type==='barrier'&&jumping)||(sliding>0);if(!canClear){o.hit=true;collision(o.type);}else{o.hit=true;score+=30;}
   }}
  for(let i=collectibles.length-1;i>=0;i--){const c=collectibles[i];c.position.z+=speed*dt;c.rotation.z+=dt*3;if(c.position.z>7){scene.remove(c);collectibles.splice(i,1);continue;}if(Math.abs(c.position.z-player.position.z)<1.1&&Math.abs(c.position.x-player.position.x)<.95&&Math.abs(player.position.y+1-c.position.y)<2){coins++;profile.coins++;if(coins%JET_EVERY===0){jetCharges++;unlockJet();}score+=10;scene.remove(c);collectibles.splice(i,1);floatText('+৳'+COIN_TAKA);A.sfx('coin',.03);A.say('coin',{p:.55});if(coins>=5&&coins%5===0&&(coins%10!==0||coins>=20))triggerMeme('money');persist();}}
  for(let i=scenery.length-1;i>=0;i--){scenery[i].position.z+=speed*dt;if(scenery[i].position.z>10){scene.remove(scenery[i]);scenery.splice(i,1);}}
  dialogueTimer-=dt;if(dialogueTimer<=0){let idx;do{idx=Math.floor(Math.random()*dialogues.length)}while(idx===lastDialogue);lastDialogue=idx;toast(dialogues[idx][1]);dialogueTimer=7+Math.random()*5;}
  updateHud();
 }
 camLook=THREE.MathUtils.damp(camLook,THREE.MathUtils.clamp(bend.U.value[2]*.5,-7,7),2.2,dt); // look into the bend; smoothed so the camera never snaps
  camera.position.x=THREE.MathUtils.damp(camera.position.x,player.position.x*.22+camLook*.25,2,dt);camera.lookAt(player.position.x*.12+camLook,1.2,-5);
 renderer.render(scene,camera);
}
let rafId=0;
function animate(){rafId=requestAnimationFrame(animate);try{frame();}catch(err){console.error('frame error',err);try{renderer.render(scene,camera);}catch(e){}}}
if(!window.__adibaLoop){window.__adibaLoop=true;animate();}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));});

// ================= v5: wallet, jetpack, local account, leaderboard =================
const COIN_TAKA=100,JET_EVERY=10,JET_TIME=10; // 1 coin = ৳100; every 10 coins in a run = 1 jetpack charge of 10 s
let stepT=0,pedNext=9,lastHit='',jetUses=0,jetSecs=0,flying=false,landing=false,jetTime=0,jetCharges=0,jetCd=0,landDip=0,graceT=0,lastTap=0,touchInfo=null;
const LS=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}};
const LSset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
let accounts=LS('adibaAccounts',{}),session=LS('adibaSession',null),runs=LS('adibaRuns',[]),profile={coins:0,best:0,dist:0,games:0};
const fmtTaka=c=>'৳'+(c*COIN_TAKA).toLocaleString('en-US'); // integer maths: 1 coin = ৳100
const jetUnlocked=()=>jetCharges>0||flying||landing;
function persist(){LSset('adibaAccounts',accounts);LSset('adibaRuns',runs);}
function updateWalletHud(){const a=$('#runtaka'),b=$('#wallet');if(a)a.textContent=fmtTaka(coins);if(b)b.textContent=fmtTaka(profile.coins);}
function refreshMenu(){const w=$('#who');if(w)w.textContent=session?('👤 '+nameOf(session)+' • '+fmtTaka(profile.coins)+' (ভার্চুয়াল)'):'';$('#best-score').textContent=profile.best||0;}
// audio (only after a user gesture)
let actx=null;function beep(f=440,d=.2){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const t=actx.currentTime,o=actx.createOscillator(),g=actx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*3,t+d);g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(actx.destination);o.start();o.stop(t+d);}catch(e){}}
// jetpack model on the player (visible once unlocked)
const jetpackMesh=new THREE.Group(),flames=[];
for(const x of [-.17,.17]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,.6,10),M(0x9aa3ad,.3,.8));c.position.set(x,1.3,.42);jetpackMesh.add(c);
 const f=new THREE.Mesh(new THREE.ConeGeometry(.1,.55,8),new THREE.MeshBasicMaterial({color:0xff8a1f}));f.rotation.x=Math.PI;f.position.set(x,.8,.42);f.visible=false;jetpackMesh.add(f);flames.push(f);}
jetpackMesh.visible=false;player.add(jetpackMesh);
function unlockJet(){const b=$('#unlock-banner');if(b){b.classList.remove('show');void b.offsetWidth;b.classList.add('show');}A.sfx('unlock');}
function floatText(t){const L=$('#float-layer');if(!L)return;const d=document.createElement('div');d.className='float-tk';d.textContent=t;L.appendChild(d);setTimeout(()=>d.remove(),900);const w=$('#wallet');if(w){w.classList.remove('pulse');void w.offsetWidth;w.classList.add('pulse');}}
function hideJetUI(){const h=$('#jet-hud'),c=$('#jet-count');if(h)h.classList.add('hidden');if(c)c.classList.add('hidden');}
function startJet(){if(!running||paused||flying||landing||jetCharges<=0)return;jetCharges--;jetUses++;flying=true;jetTime=JET_TIME;jumping=false;jumpV=0;sliding=0;A.sfx('whoosh');A.jet(true);A.say('jet');if(Math.random()<.6)triggerMeme('jet',true);}
// smoke puffs: small fixed pool, recycled
const smokes=[],smokeGeo=new THREE.SphereGeometry(.18,8,6);
for(let i=0;i<10;i++){const m=new THREE.Mesh(smokeGeo,new THREE.MeshBasicMaterial({color:0xb9bec4,transparent:true,opacity:0}));m.visible=false;scene.add(m);smokes.push({m,life:0});}
let smokeT=0;
function updateSmoke(dt){
 smokeT-=dt;
 if(flying&&smokeT<=0){smokeT=.07;const s=smokes.find(q=>q.life<=0);if(s){s.life=.7;s.m.visible=true;s.m.position.set(player.position.x+(Math.random()-.5)*.4,player.position.y+.8,player.position.z+.6);s.m.scale.setScalar(.6);}}
 for(const s of smokes){if(s.life<=0)continue;s.life-=dt;if(s.life<=0){s.m.visible=false;s.m.material.opacity=0;continue;}
  s.m.position.z+=speed*dt;s.m.position.y-=dt*.8;s.m.scale.addScalar(dt*2.2);s.m.material.opacity=Math.min(.5,s.life*.8);}
}
function updateJet(dt){
 if(graceT>0)graceT-=dt;
 if(landDip>0)landDip=Math.max(0,landDip-dt*3);
 if(flying){
  jetTime-=dt;jetSecs+=dt;player.position.y=THREE.MathUtils.damp(player.position.y,4.2,5,dt); // smooth rise
  if(jetTime<=0){jetTime=0;flying=false;landing=true;A.jet(false);}
 }else if(landing){ // smooth descent, still invulnerable
  player.position.y=THREE.MathUtils.damp(player.position.y,0,4.5,dt);
  if(player.position.y<.06){player.position.y=0;landing=false;landDip=1;graceT=.6;jumping=false;jumpV=0;A.sfx('land');A.say('land',{p:.7});if(Math.random()<.4)triggerMeme('land');}
 }
 jetpackMesh.visible=jetCharges>0||flying||landing;
 for(const f of flames){f.visible=flying||landing;if(f.visible)f.scale.set(1,(flying?.8:.4)+Math.random()*.9,1);}
 updateSmoke(dt);
 const h=$('#jet-hud'),fl=$('#jet-fill'),lb=$('#jet-label'),cn=$('#jet-count');
 if(h){h.classList.toggle('hidden',!running);h.classList.toggle('ready',jetCharges>0&&!flying);
  if(flying){lb.textContent='🔥 '+Math.ceil(jetTime)+'s';fl.style.width=(jetTime/JET_TIME*100)+'%';}
  else if(landing){lb.textContent='LANDING…';fl.style.width='0%';}
  else if(jetCharges>0){lb.textContent='READY ×'+jetCharges+' • DOUBLE-TAP';fl.style.width='100%';}
  else{lb.textContent=(coins%JET_EVERY)+'/'+JET_EVERY+' coins';fl.style.width=((coins%JET_EVERY)/JET_EVERY*100)+'%';}}
 if(cn){const show=flying;cn.classList.toggle('hidden',!show);if(show)cn.textContent=Math.ceil(jetTime);}
}
addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchInfo={x:t.clientX,y:t.clientY,t:performance.now(),ui:!!(e.target.closest&&e.target.closest('button,input,.screen'))};},{passive:true});
addEventListener('touchend',e=>{const t=e.changedTouches[0],i=touchInfo;touchInfo=null;if(!i||i.ui)return;
 const now=performance.now();if(Math.hypot(t.clientX-i.x,t.clientY-i.y)<12&&now-i.t<260){if(now-lastTap<320){lastTap=0;startJet();}else lastTap=now;}},{passive:true});
addEventListener('keydown',e=>{if(e.key==='f'||e.key==='F')startJet();});
// ---- local demo account (device-only; NOT secure online auth)
async function hashPw(pw,salt){const d=salt+':'+pw;if(window.crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(d));return 's256:'+[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}let h=5381;for(const ch of d)h=((h<<5)+h+ch.charCodeAt(0))>>>0;return 'dj:'+h;}
function rndPw(n=10){const al='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789',a=new Uint32Array(n);crypto.getRandomValues(a);return [...a].map(v=>al[v%al.length]).join('');}
const nameOf=u=>(accounts[u]&&accounts[u].name)||u;
function setSession(u){session=u;LSset('adibaSession',u);profile=accounts[u].stats;
 for(const k of ['coins','best','dist','games'])if(!(profile[k]>=0))profile[k]=0;
 const q=new URLSearchParams(location.search).get('testwallet');if(q&&/^\d+$/.test(q)){profile.coins=Math.min(+q,1000000);persist();}
 refreshMenu();showScreen('menu-screen');}
let authMode='login';
function setAuthMode(m){authMode=m;document.querySelectorAll('#auth-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));
 $('#auth-btn').textContent=m==='login'?'LOG IN':'CREATE ACCOUNT';$('#li-p').autocomplete=m==='login'?'current-password':'new-password';$('#login-msg').textContent='';}
document.querySelectorAll('#auth-tabs button').forEach(b=>b.onclick=()=>setAuthMode(b.dataset.mode));
$('#pw-eye').onclick=()=>{const i=$('#li-p');i.type=i.type==='password'?'text':'password';};
$('#auth-btn').onclick=async()=>{
 const btn=$('#auth-btn'),m=$('#login-msg'),raw=$('#li-u').value.trim(),pw=$('#li-p').value,key=raw.toUpperCase();
 if(!raw||!pw){m.textContent='ইউজারনেম ও পাসওয়ার্ড দুটোই দিন। (Fields cannot be empty)';return;}
 if(!/^[A-Za-z0-9_]{3,16}$/.test(raw)){m.textContent='ইউজারনেম ৩–১৬ অক্ষরের হতে হবে (A-Z, 0-9, _)।';return;}
 if(pw.length<4){m.textContent='পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।';return;}
 btn.disabled=true;
 try{
  accounts=LS('adibaAccounts',accounts); // pick up changes from another tab
  if(authMode==='register'){
   if(accounts[key]){m.textContent='এই ইউজারনেম আগে থেকেই আছে — অন্যটি বেছে নিন। (Username taken)';return;}
   const salt=rndPw();accounts[key]={name:raw,salt,hash:await hashPw(pw,salt),created:Date.now(),stats:{coins:0,best:0,dist:0,games:0}};persist();
  }else{
   const a=accounts[key];
   if(!a||(await hashPw(pw,a.salt))!==a.hash){m.textContent='ইউজারনেম বা পাসওয়ার্ড ভুল। (এই ডিভাইসের অ্যাকাউন্ট)';return;}
  }
  m.textContent='';$('#li-p').value='';setSession(key);
 }catch(e){m.textContent='কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন।';console.error(e);}
 finally{btn.disabled=false;}
};
$('#li-p').addEventListener('keydown',e=>{if(e.key==='Enter')$('#auth-btn').click();});
// ---- audio settings UI ----
let settingsFrom='menu-screen';
function syncSettings(){const st=A.settings;$('#set-sound').checked=st.sound;$('#set-voice').checked=st.voice;$('#set-music').checked=st.music;$('#set-vol').value=st.vol;
 $('#voice-status').textContent=A.voiceName?('বাংলা ভয়েস পাওয়া গেছে: '+A.voiceName):'এই ডিভাইসে বাংলা টেক্সট-টু-স্পিচ ভয়েস নেই — সংলাপ ক্যাপশন হিসেবে দেখানো হবে। (No Bangla TTS voice found: lines are shown as captions.)';}
function openSettings(){A.unlock();const cur=document.querySelector('.screen.active');settingsFrom=cur&&cur.id!=='settings-screen'?cur.id:(running?'pause-screen':'menu-screen');if(running&&!paused){pauseGame();settingsFrom='pause-screen';}syncSettings();showScreen('settings-screen');}
function closeSettings(){showScreen(settingsFrom);}
$('#snd-btn').onclick=openSettings;$('#settings-close').onclick=closeSettings;$('#settings-done').onclick=closeSettings;
$('#set-sound').onchange=e=>A.set('sound',e.target.checked);$('#set-voice').onchange=e=>A.set('voice',e.target.checked);
$('#set-music').onchange=e=>{A.set('music',e.target.checked);if(e.target.checked&&running&&!paused)A.startMusic();};
$('#set-vol').oninput=e=>A.set('vol',+e.target.value);
addEventListener('pointerdown',()=>A.unlock(),{once:true,passive:true}); // mobile: audio only starts after a gesture
$('#logout-btn').onclick=()=>{persist();session=null;LSset('adibaSession',null);profile={coins:0,best:0,dist:0,games:0};refreshMenu();setAuthMode('login');showScreen('login-screen');};
// ---- leaderboard (local, this device only)
function endRun(){if(!session)return;const st=profile;st.games++;st.best=Math.max(st.best||0,score);st.dist=Math.max(st.dist||0,Math.floor(distance));
 runs.push({u:session,s:score,d:Math.floor(distance),c:coins,t:Date.now()});if(runs.length>300)runs.splice(0,runs.length-300);persist();refreshMenu();}
function boardRows(period){
 let list=[];
 if(period==='all'){ // one row per account → no duplicate entries per player
  for(const [u,a] of Object.entries(accounts)){const st=a.stats||{};if(!(st.games>0))continue;list.push({u,s:st.best||0,d:st.dist||0,c:st.coins||0,g:st.games||0});}
 }else{
  const now=Date.now(),lim=period==='day'?864e5:6048e5,m={};
  for(const r of runs){if(now-r.t>lim||!accounts[r.u])continue;const o=m[r.u]||(m[r.u]={u:r.u,s:0,d:0,c:0,g:0});o.s=Math.max(o.s,r.s);o.d=Math.max(o.d,r.d);o.c+=r.c;o.g++;}
  list=Object.values(m);
 }
 list.sort((a,b)=>b.s-a.s||b.d-a.d||a.u.localeCompare(b.u));
 return list.map((o,i)=>({...o,rank:i+1}));
}
let boardPeriod='all';
const MEDALS=['🥇','🥈','🥉'];
function renderBoard(){
 const list=$('#board-list');list.textContent='';const rows=boardRows(boardPeriod);
 document.querySelectorAll('#board-screen .tabs button').forEach(b=>b.classList.toggle('on',b.dataset.p===boardPeriod));
 const me=rows.find(r=>r.u===session);
 $('#prof').textContent=session?(nameOf(session)+' • র‍্যাঙ্ক '+(me?'#'+me.rank+' / '+rows.length:'—')+' • সেরা স্কোর '+(profile.best||0)+' • সর্বোচ্চ দূরত্ব '+(profile.dist||0)+' মি • মোট কয়েন '+profile.coins+' • মোট আয় '+fmtTaka(profile.coins)+' • রান '+(profile.games||0)):'';
 if(!rows.length){const d=document.createElement('div');d.className='empty';d.textContent='এখনো কেউ দৌড়ায়নি — প্রথম হও! 🏃';list.appendChild(d);return;}
 const show=rows.slice(0,10);if(me&&me.rank>10){show.push(me);}
 for(const r of show){
  const d=document.createElement('div');d.className='lrow'+(r.u===session?' me':'')+(r.rank<=3?' top'+r.rank:'');
  if(me&&r.rank===me.rank&&me.rank>10&&r===show[show.length-1]){const gap=document.createElement('div');gap.className='gap';gap.textContent='⋮';list.appendChild(gap);}
  const top=document.createElement('div');top.className='lr-top';
  const rk=document.createElement('span');rk.className='medal';rk.textContent=r.rank<=3?MEDALS[r.rank-1]:'#'+r.rank;
  const nm=document.createElement('b');nm.textContent=nameOf(r.u)+(r.u===session?' (তুমি)':'');
  const sc=document.createElement('em');sc.textContent=r.s.toLocaleString('en-US');
  top.append(rk,nm,sc);
  const sm=document.createElement('small');sm.textContent='সর্বোচ্চ দূরত্ব '+r.d+' মি • কয়েন '+r.c+' • আয় '+fmtTaka(r.c)+' • রান '+r.g;
  d.append(top,sm);list.appendChild(d);
 }
}
$('#board-btn').onclick=()=>{renderBoard();showScreen('board-screen');};
$('#news-board-btn').onclick=()=>{renderBoard();showScreen('board-screen');};
$('#refresh-btn').onclick=()=>{runs=LS('adibaRuns',runs);accounts=LS('adibaAccounts',accounts);if(session&&accounts[session])profile=accounts[session].stats;renderBoard();};
document.querySelectorAll('#board-screen .tabs button').forEach(b=>b.onclick=()=>{boardPeriod=b.dataset.p;renderBoard();});
// ---- share newspaper as image
async function shareNews(){
 try{
  if(!lastNews)return;
  const W=900,PAD=44,cv=document.createElement('canvas');cv.width=W;cv.height=3200;const x=cv.getContext('2d');
  x.fillStyle='#f1e9d6';x.fillRect(0,0,W,3200);x.fillStyle='#111';x.textAlign='center';
  const F='"Hind Siliguri",serif';
  x.font='900 60px '+F;x.fillText('দৈনিক আদিবা সংবাদ',W/2,90);
  const wrap=(t,y,size,lh,weight=700,align='center')=>{x.textAlign=align;x.font=weight+' '+size+'px '+F;const px=align==='center'?W/2:PAD;let line='';for(const w of t.split(' ')){const tt=line?line+' '+w:w;if(x.measureText(tt).width>W-2*PAD&&line){x.fillText(line,px,y);y+=lh;line=w;}else line=tt;}x.fillText(line,px,y);return y+lh;};
  let y=wrap(lastNews.head,170,46,58);y=wrap(lastNews.sub,y+6,26,36,500);
  if(shot){const im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=shot;});
   const bw=W-2*PAD,maxH=1100,sc=Math.min(bw/im.width,maxH/im.height),w=im.width*sc,h=im.height*sc; // contain: whole frame, never cropped or stretched
   x.fillStyle='#1c3045';x.fillRect(PAD,y+10,bw,h+20);x.drawImage(im,PAD+(bw-w)/2,y+20,w,h);y+=h+50;x.fillStyle='#111';}
  y=wrap(lastNews.caption,y+8,20,28,500);y+=8;
  for(const p of lastNews.paras)y=wrap(p,y+4,24,34,500,'left');
  y+=10;x.textAlign='left';
  for(const d of document.querySelectorAll('#paper-stats div')){const k=d.querySelector('small').textContent,v=d.querySelector('b').textContent;x.font='500 22px '+F;x.fillStyle='#555';x.fillText(k,PAD,y);x.fillStyle='#111';x.font='700 22px '+F;x.textAlign='right';x.fillText(v,W-PAD,y);x.textAlign='left';y+=34;}
  x.fillStyle='#777';x.textAlign='center';x.font='500 18px '+F;x.fillText('ADIBA CHASE — DHAKA LOVE RUN',W/2,y+24);y+=50;
  const out=document.createElement('canvas');out.width=W;out.height=y;out.getContext('2d').drawImage(cv,0,0);
  const blob=await new Promise(r=>out.toBlob(r,'image/png'));const file=new File([blob],'adiba-news.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({files:[file],title:'ADIBA CHASE'});
  else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='adiba-news.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
 }catch(e){if(e&&e.name!=='AbortError')toast('শেয়ার করা যায়নি');}
}
$('#share-btn').onclick=shareNews;
// ---- boot
if(session&&accounts[session]){profile=accounts[session].stats;refreshMenu();}else{session=null;showScreen('login-screen');}
