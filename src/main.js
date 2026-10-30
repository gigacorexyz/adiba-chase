import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

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
const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
const roadMat=mat(0x303b45), sidewalkMat=mat(0x69727a), laneMat=mat(0xf5d38a), skinMat=mat(0xc98762), shirtMat=mat(0x8e2638), pantsMat=mat(0x202b39), blackMat=mat(0x111923), goldMat=mat(0xe7ad51), tealMat=mat(0x1c6e70), redMat=mat(0xc74338);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(300,420),mat(0x233d42));ground.rotation.x=-Math.PI/2;ground.position.set(0,-.18,-110);ground.receiveShadow=true;scene.add(ground);

// ---------- Endless scrolling street: pooled, recycled segments ----------
const SEG_L=30,SEG_N=6,segs=[];
const bGeo=new THREE.BoxGeometry(1,1,1),pGeo=new THREE.PlaneGeometry(1,1),poleGeo=new THREE.CylinderGeometry(.06,.08,5,6),trunkGeo=new THREE.CylinderGeometry(.12,.16,1.6,6),leafGeo=new THREE.SphereGeometry(1,10,8);
const themes=[
 {n:'ব্যস্ত ঢাকা মেইন রোড',c:[0x586a79,0x8b9294,0x647b82],h:[6,18],x:11},
 {n:'পুরান ঢাকা',c:[0xb7794f,0xa86f5a,0xc9a05b],h:[4,9],x:9.6},
 {n:'বাণিজ্যিক এলাকা',c:[0x3f6c8f,0x5b7f9a,0x7e8fa0],h:[12,26],x:11.5,tall:1},
 {n:'আবাসিক সড়ক',c:[0xd7c6a3,0x9fb59a,0xc58f7a],h:[7,14],x:10.5,trees:1},
 {n:'বাজার স্ট্রিট',c:[0xd1553f,0xe0a53a,0x2f9c8a],h:[4,8],x:9.8}];
const _ac=document.createElement('canvas');_ac.width=_ac.height=128;{const c=_ac.getContext('2d');c.fillStyle='#3a444d';c.fillRect(0,0,128,128);for(let i=0;i<1800;i++){const v=40+Math.random()*50|0;c.fillStyle='rgb('+v+','+(v+6)+','+(v+12)+')';c.fillRect(Math.random()*128,Math.random()*128,2,2);}}
const asphaltTex=new THREE.CanvasTexture(_ac);asphaltTex.wrapS=asphaltTex.wrapT=THREE.RepeatWrapping;asphaltTex.repeat.set(5,15);asphaltTex.colorSpace=THREE.SRGBColorSpace;asphaltTex.anisotropy=4;roadMat.map=asphaltTex;roadMat.color.set(0xffffff);roadMat.needsUpdate=true;
const themeMats=themes.map(t=>t.c.map(c=>mat(c,.85)));
const signMats=[0xd1553f,0xe0a53a,0x2f9c8a,0x6a4fa3,0x2b73b8].map(c=>mat(c,.6));
const winMat=new THREE.MeshStandardMaterial({color:0x9ccbd8,emissive:0x1d3344,roughness:.3});
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
 const road=new THREE.Mesh(pGeo,roadMat);road.scale.set(10,SEG_L,1);road.rotation.x=-Math.PI/2;road.position.y=-.12;road.receiveShadow=true;g.add(road);
 for(const x of [-1.65,1.65])for(let k=0;k<4;k++){const d=new THREE.Mesh(bGeo,laneMat);d.scale.set(.09,.025,3.4);d.position.set(x,-.095,-SEG_L/2+3.75+k*7.5);g.add(d);}
 const slots=[],lamps=[],trees=[];
 for(const s of [-1,1]){
  const w=new THREE.Mesh(bGeo,sidewalkMat);w.scale.set(1.1,.25,SEG_L);w.position.set(s*5.5,-.03,0);g.add(w);
  for(const z of [-7,8]){const pole=new THREE.Mesh(poleGeo,blackMat);pole.position.set(s*5.2,2.4,z);const lamp=new THREE.Mesh(bGeo,lampMat);lamp.scale.set(.5,.15,.3);lamp.position.set(s*4.9,4.9,z);g.add(pole,lamp);}
  const tr=new THREE.Group();const tk=new THREE.Mesh(trunkGeo,trunkMat);tk.position.y=.8;const lf=new THREE.Mesh(leafGeo,leafMat);lf.position.y=2.3;lf.scale.set(1.1,1.2,1.1);tr.add(tk,lf);tr.position.set(s*6.7,0,0);g.add(tr);trees.push(tr);
  for(let i=0;i<3;i++){
   const b=new THREE.Mesh(bGeo,themeMats[0][0]);b.castShadow=true;
   const f=new THREE.Mesh(pGeo,winMat);f.rotation.y=-s*Math.PI/2;
   const po=new THREE.Mesh(pGeo,posterMats[0]);po.rotation.y=-s*Math.PI/2;po.scale.set(2,2.8,1);
   const aw=new THREE.Mesh(bGeo,signMats[0]);
   g.add(b,f,po,aw);slots.push({s,z:-10+i*10,b,f,po,aw});
  }
 }
 g.userData={slots,trees};scene.add(g);return g;
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
  sl.aw.material=signMats[(Math.random()*signMats.length)|0];sl.aw.scale.set(.7,.3,6.6);sl.aw.position.set(near-s*.35,3.9,sl.z);
 }
 for(const tr of g.userData.trees)tr.visible=!!t.trees||Math.random()<.3;
}
for(let i=0;i<SEG_N;i++){const g=makeSeg();g.position.z=15-i*SEG_L;buildSeg(g,themes[0]);segs.push(g);}
let themeIdx=0;
function updateWorld(dt){
 const ti=Math.floor(distance/300)%themes.length;
 for(const g of segs){g.position.z+=speed*dt;if(g.position.z>27){g.position.z-=SEG_N*SEG_L;buildSeg(g,themes[ti]);}}
 if(ti!==themeIdx){themeIdx=ti;toast('📍 '+themes[ti].n);}
}
function resetWorld(){segs.forEach((g,i)=>{g.position.z=15-i*SEG_L;buildSeg(g,themes[0]);});themeIdx=0;}

function makePersonRaw(topColor, bottomColor, scale=1, isAdiba=false){
 const g=new THREE.Group();
 const shirt=mat(topColor,.68), pants=mat(bottomColor,.82), skin=mat(isAdiba?0xd99a78:0xc98762,.72);
 const gold=mat(0xe6b45d,.48), hairMat=mat(isAdiba?0x15131a:0x17151b,.38), shoeMat=mat(0xf1eee8,.55);
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
const M=(c,r=.55,m=.1)=>mc[c+','+r+','+m]||(mc[c+','+r+','+m]=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}));
const glassMat=new THREE.MeshStandardMaterial({color:0x9fd0e0,roughness:.1,metalness:.4,transparent:true,opacity:.78});
const headMat=new THREE.MeshBasicMaterial({color:0xfff2c0}),tailMat=new THREE.MeshBasicMaterial({color:0xff2a2a});
const tireMat=mat(0x15191e,.9),chromeMat=M(0xc8ccd0,.25,.8);
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
 else {addB(g,1.45,1.15,1.3,M(0xc16a43,.8,0),0,.65,0);addB(g,1.5,.2,1.35,M(0xf5f5f5),0,1.1,0);hz=.8;hx=.8;}
 g.position.set(x,0,z);scene.add(g);obstacles.push({mesh:g,type,hit:false,wheels:ws,vs,hz,hx});
}
const vtypes=['moto','car','car','bus','truck','cng','rickshaw','barrier'];
const vsp={moto:[11,14],car:[8,11],bus:[5,7],truck:[4,6],cng:[6,8],rickshaw:[3,5],barrier:[0,0]};
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
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1800);}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));if(id)$('#'+id).classList.add('active');}
function startGame(){if(!session||!accounts[session]){showScreen('login-screen');return;}resetGame();showScreen(null);running=true;paused=false;$('#hud').classList.remove('hidden');$('#pause-btn').classList.remove('hidden');$('#mobile-hint').style.display='block';}
function resetGame(){
 flying=false;jetCd=0;graceT=0;
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
function jump(){if(!running||paused||jumping||flying)return;jumping=true;jumpV=8.8;}
function slide(){if(!running||paused||flying)return;sliding=.7;}
let shot=null;
const heads=['ঢাকার রাস্তায় প্রেমের পেছনে দৌড়, শেষ পর্যন্ত ধরা!','অবিশ্বাস্য গতিতে দৌড়ে ভাইরাল এক যুবক!','রিকশার সঙ্গে প্রতিযোগিতায় নেমে বিপাকে গেমার!','প্রেমের টানে যানজটকেও হার মানালেন!','ঢাকার রাস্তায় আজব দৌড়, পথচারীদের মধ্যে হাসির রোল!','আদিবার হাতে অবশেষে ধরা খেলেন পলাতক স্বামী!','প্রেমের টানে ঢাকার রাস্তায় দৌড়, শেষ রক্ষা হলো না!','জেটপ্যাক নিয়ে উড়তে গিয়ে বাসের সামনে বিপাকে!','রিকশাকে ওভারটেক করতে গিয়ে ভাইরাল এক যুবক!','ঢাকার যানজটকে হার মানিয়েও আদিবার হাত থেকে রক্ষা নেই!','এক দৌড়ে পাঁচটি এলাকা পার, শেষমেশ ধরা!','মোটরসাইকেলের পাশ কাটিয়েও পার পেলেন না যুবক!'];
const subs=['{d} মিটার দৌড়েও শেষ রক্ষা হলো না, জানালেন প্রত্যক্ষদর্শীরা।','{c}টি কয়েন কুড়িয়ে দৌড়েও পার পেলেন না তিনি।','চায়ের দোকানের আড্ডায় এখন শুধু এই দৌড়ের গল্প।','ট্রাফিক পুলিশ বললেন: এমন গতি আমরা জ্যামেও দেখি নাই!'];
const bodies=['রিকশাচালক বললেন: এমন স্পিড তো বাসেও দেখি নাই!','দোকানি হেসে বললেন: ভাই, প্রেমের জন্য এত দৌড়?','এক ছাত্র বলল: এই স্পিডে বিসিএসেও চান্স পাওয়া যায়!','এক পথচারী বললেন: আজকে আর বাসায় ফেরা হবে না!','ফুচকাওয়ালা বললেন: ধরা খাওয়ার আগে অন্তত একটা ফুচকা খেয়ে যান!'];
const lastPick=new Map();function pickNew(a){let v;do{v=pick(a);}while(v===lastPick.get(a)&&a.length>1);lastPick.set(a,v);return v;}
const pick=a=>a[Math.floor(Math.random()*a.length)];
function catchPlayer(){
 if(!running)return;running=false;try{renderer.render(scene,camera);shot=canvas.toDataURL('image/jpeg',.75);}catch(e){shot=null;}$('#hud').classList.add('hidden');$('#pause-btn').classList.add('hidden');$('#mobile-hint').style.display='none';
 $('#final-distance').textContent=Math.floor(distance)+' m';$('#final-score').textContent=score;$('#final-coins').textContent=coins;
 $('#caught-line').textContent=chase>1.7?'Adiba: এতক্ষণ কোথায় পালাচ্ছিলা?':'Adiba: এবার বুঝছো?';
 endRun();showScreen('caught-screen');
}
function collision(){
 chase=Math.min(2.6,chase+.72);toast('উফ! আদিবা আরও কাছে চলে এসেছে!');if(chase>=2.45)catchPlayer();
}
function pauseGame(){if(!running)return;persist();paused=true;showScreen('pause-screen');}
function resumeGame(){paused=false;showScreen(null);}
function finishNews(){
 const best=Math.max(Number(localStorage.getItem('adibaBest')||0),score);localStorage.setItem('adibaBest',best);$('#best-score').textContent=best;
 $('#paper-distance').textContent=Math.floor(distance);$('#paper-score').textContent=score;
 $('#paper-date').textContent=new Date().toLocaleDateString('bn-BD',{day:'numeric',month:'long',year:'numeric'});
 const fill=t=>t.replace('{d}',Math.floor(distance)).replace('{c}',coins);
 document.querySelector('#news-screen h2').textContent=pickNew(heads);document.querySelector('#news-screen h3').textContent=fill(pickNew(subs));
 const cols=document.querySelectorAll('.paper-columns p');cols[0].innerHTML='<b>প্রত্যক্ষদর্শীর বক্তব্য</b><br>'+pick(bodies);cols[1].innerHTML='<b>ট্রাফিক পুলিশের মন্তব্য</b><br>'+pick(bodies);
 const ph=document.querySelector('.paper-photo');if(shot){ph.innerHTML='';const im=new Image();im.src=shot;im.style.cssText='width:100%;height:100%;object-fit:cover';ph.style.padding='0';ph.style.height='130px';ph.appendChild(im);}
 const ex=document.querySelector('#paper-extra');if(ex)ex.textContent=(session||'অতিথি')+' • ধরা পড়ে মোট আয়: '+fmtTaka(coins)+' (গেম মুদ্রা) • কয়েন '+coins+' • সেরা স্কোর '+(profile.best||0)+' • '+new Date().toLocaleString('bn-BD');
 showScreen('news-screen');
}
$('#start-btn').onclick=startGame;$('#how-btn').onclick=()=>showScreen('help-screen');document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>showScreen('menu-screen'));
$('#pause-btn').onclick=pauseGame;$('#resume-btn').onclick=resumeGame;$('#restart-btn').onclick=startGame;$('#quit-btn').onclick=()=>{running=false;$('#hud').classList.add('hidden');$('#pause-btn').classList.add('hidden');showScreen('menu-screen')};
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
  player.rotation.x=flying?-.45:(sliding>0?-.7:0);
  animateCharacter(player,elapsed,'run',sliding>0?.25:1);
  animateCharacter(adiba,elapsed*1.04,'run',1);
  for(const p of pedestrians){
   animateCharacter(p.mesh,elapsed*.55+p.phase,'run',.3);
   p.mesh.position.z+=(speed-1.4)*dt;if(p.mesh.position.z>14)p.mesh.position.z-=100;
   p.mesh.position.y=Math.abs(Math.sin(elapsed*5.5+p.phase))*.03;
  }
  for(const v of trafficVehicles){
   v.mesh.position.z+=dt*(v.side>0?speed-9:speed+9);
   for(const w of v.wheels)w.rotation.x+=dt*14;
   if(v.mesh.position.z>18)v.mesh.position.z=-120-v.offset*7;
  }
  spawnTimer-=dt;if(spawnTimer<=0){spawnTimer=trySpawn()?Math.max(.6,1.25-distance*.0007):.12;}
  coinTimer-=dt;if(coinTimer<=0){const l=Math.floor(Math.random()*3);for(let i=0;i<5;i++)spawnCoin(lanes[l],-65-i*2.1);coinTimer=2.1+Math.random()*1.3;}
  if(Math.random()<dt*.28)spawnStreetDetail(-75);
  for(let i=obstacles.length-1;i>=0;i--){const o=obstacles[i];o.mesh.position.z+=(speed-(o.vs||0))*dt;for(const w of (o.wheels||[]))w.rotation.x-=(o.vs||0)*dt*3.5;if(o.mesh.position.z>10){scene.remove(o.mesh);obstacles.splice(i,1);continue;}
   if(!o.hit&&!flying&&graceT<=0&&Math.abs(o.mesh.position.z-player.position.z)<(o.hz||1.45)+.45&&Math.abs(o.mesh.position.x-player.position.x)<(o.hx||1.1)+.35){
    const canClear=(o.type==='barrier'&&jumping)||(sliding>0);if(!canClear){o.hit=true;collision();}else{o.hit=true;score+=30;}
   }}
  for(let i=collectibles.length-1;i>=0;i--){const c=collectibles[i];c.position.z+=speed*dt;c.rotation.z+=dt*3;if(c.position.z>7){scene.remove(c);collectibles.splice(i,1);continue;}if(Math.abs(c.position.z-player.position.z)<1.1&&Math.abs(c.position.x-player.position.x)<.95){coins++;profile.coins++;if(profile.coins===JET_UNLOCK)unlockJet();score+=10;scene.remove(c);collectibles.splice(i,1);toast('+1 coin ✨');}}
  for(let i=scenery.length-1;i>=0;i--){scenery[i].position.z+=speed*dt;if(scenery[i].position.z>10){scene.remove(scenery[i]);scenery.splice(i,1);}}
  dialogueTimer-=dt;if(dialogueTimer<=0){let idx;do{idx=Math.floor(Math.random()*dialogues.length)}while(idx===lastDialogue);lastDialogue=idx;toast(dialogues[idx][1]);dialogueTimer=7+Math.random()*5;}
  updateHud();
 }
 camera.position.x=THREE.MathUtils.damp(camera.position.x,player.position.x*.22,2,dt);camera.lookAt(player.position.x*.12,1.2,-5);
 renderer.render(scene,camera);
}
let rafId=0;
function animate(){rafId=requestAnimationFrame(animate);try{frame();}catch(err){console.error('frame error',err);try{renderer.render(scene,camera);}catch(e){}}}
if(!window.__adibaLoop){window.__adibaLoop=true;animate();}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));});

// ================= v5: wallet, jetpack, local account, leaderboard =================
const JET_UNLOCK=100000,JET_FUEL=4,JET_CD=12;
let flying=false,jetFuel=0,jetCd=0,graceT=0,lastTap=0,touchInfo=null;
const LS=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}};
const LSset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
let accounts=LS('adibaAccounts',{}),session=LS('adibaSession',null),runs=LS('adibaRuns',[]),profile={coins:0,best:0,dist:0,games:0};
const fmtTaka=c=>'৳'+Math.floor(c/100).toLocaleString('en-US')+'.'+String(c%100).padStart(2,'0'); // integer maths: 1 coin = 1 paisa
const jetUnlocked=()=>profile.coins>=JET_UNLOCK;
function persist(){LSset('adibaAccounts',accounts);LSset('adibaRuns',runs);}
function updateWalletHud(){const a=$('#runtaka'),b=$('#wallet');if(a)a.textContent=fmtTaka(coins);if(b)b.textContent='৳'+Math.floor(profile.coins/100).toLocaleString('en-US');}
function refreshMenu(){const w=$('#who');if(w)w.textContent=session?('👤 '+session+' • '+fmtTaka(profile.coins)+' (ভার্চুয়াল)'):'';$('#best-score').textContent=profile.best||0;}
// audio (only after a user gesture)
let actx=null;function beep(f=440,d=.2){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const t=actx.currentTime,o=actx.createOscillator(),g=actx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*3,t+d);g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(actx.destination);o.start();o.stop(t+d);}catch(e){}}
// jetpack model on the player (visible once unlocked)
const jetpackMesh=new THREE.Group(),flames=[];
for(const x of [-.17,.17]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,.6,10),M(0x9aa3ad,.3,.8));c.position.set(x,1.3,.42);jetpackMesh.add(c);
 const f=new THREE.Mesh(new THREE.ConeGeometry(.1,.55,8),new THREE.MeshBasicMaterial({color:0xff8a1f}));f.rotation.x=Math.PI;f.position.set(x,.8,.42);f.visible=false;jetpackMesh.add(f);flames.push(f);}
jetpackMesh.visible=false;player.add(jetpackMesh);
function unlockJet(){const b=$('#unlock-banner');if(b){b.classList.remove('show');void b.offsetWidth;b.classList.add('show');}beep(300,.7);}
function startJet(){if(!running||paused||flying||jetCd>0||!jetUnlocked())return;flying=true;jetFuel=JET_FUEL;jumping=false;sliding=0;beep(180,.5);}
function updateJet(dt){
 jetpackMesh.visible=jetUnlocked();
 if(jetCd>0)jetCd-=dt;if(graceT>0)graceT-=dt;
 if(flying){jetFuel-=dt;player.position.y=THREE.MathUtils.damp(player.position.y,4.2,6,dt);
  if(jetFuel<=0){flying=false;jetCd=JET_CD;graceT=.9;jumping=true;jumpV=0;}}
 for(const f of flames){f.visible=flying;if(flying)f.scale.set(1,.8+Math.random()*.9,1);}
 const h=$('#jet-hud');if(h){h.classList.toggle('hidden',!(running&&jetUnlocked()));const fl=$('#jet-fill');if(fl)fl.style.width=(flying?jetFuel/JET_FUEL*100:(1-Math.max(0,jetCd)/JET_CD)*100)+'%';}
}
addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchInfo={x:t.clientX,y:t.clientY,t:performance.now(),ui:!!(e.target.closest&&e.target.closest('button,input,.screen'))};},{passive:true});
addEventListener('touchend',e=>{const t=e.changedTouches[0],i=touchInfo;touchInfo=null;if(!i||i.ui)return;
 const now=performance.now();if(Math.hypot(t.clientX-i.x,t.clientY-i.y)<12&&now-i.t<260){if(now-lastTap<320){lastTap=0;startJet();}else lastTap=now;}},{passive:true});
addEventListener('keydown',e=>{if(e.key==='f'||e.key==='F')startJet();});
// ---- local demo account (device-only; NOT secure online auth)
async function hashPw(pw,salt){const d=salt+':'+pw;if(window.crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(d));return 's256:'+[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}let h=5381;for(const ch of d)h=((h<<5)+h+ch.charCodeAt(0))>>>0;return 'dj:'+h;}
function rndPw(n=10){const al='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789',a=new Uint32Array(n);crypto.getRandomValues(a);return [...a].map(v=>al[v%al.length]).join('');}
let pending=null,entered=false;
function setSession(u){session=u;LSset('adibaSession',u);profile=accounts[u].stats;
 const q=new URLSearchParams(location.search).get('testwallet');if(q&&/^\d+$/.test(q)){profile.coins=Math.min(+q,10000000);persist();}
 refreshMenu();showScreen('menu-screen');}
$('#gen-btn').onclick=async()=>{if(pending&&!entered)delete accounts[pending];let u;do{u='ADIBA_RUN_'+(1000+Math.floor(Math.random()*9000));}while(accounts[u]);
 const p=rndPw(),salt=rndPw();accounts[u]={salt,hash:await hashPw(p,salt),created:Date.now(),stats:{coins:0,best:0,dist:0,games:0}};persist();pending=u;entered=false;
 $('#cred-u').textContent=u;$('#cred-p').textContent=p;$('#cred').classList.remove('hidden');};
$('#copy-btn').onclick=()=>{const t='Username: '+$('#cred-u').textContent+'\nPassword: '+$('#cred-p').textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('কপি হয়েছে ✓'),()=>toast('কপি করা যায়নি — হাতে লিখে রাখুন'));};
$('#enter-btn').onclick=()=>{if(!pending)return;entered=true;$('#cred-p').textContent='';$('#cred').classList.add('hidden');setSession(pending);};
$('#pw-eye').onclick=()=>{const i=$('#li-p');i.type=i.type==='password'?'text':'password';};
$('#login-btn').onclick=async()=>{const u=$('#li-u').value.trim().toUpperCase(),a=accounts[u],m=$('#login-msg');
 if(!a||(await hashPw($('#li-p').value,a.salt))!==a.hash){m.textContent='ইউজারনেম বা পাসওয়ার্ড ভুল (এই ডিভাইসের অ্যাকাউন্ট)';return;}
 m.textContent='';$('#li-p').value='';setSession(u);};
$('#logout-btn').onclick=()=>{persist();session=null;LSset('adibaSession',null);profile={coins:0,best:0,dist:0,games:0};refreshMenu();showScreen('login-screen');};
$('#regen-btn').onclick=async()=>{if(!session)return;const p=rndPw(),a=accounts[session];a.salt=rndPw();a.hash=await hashPw(p,a.salt);persist();$('#prof-msg').textContent='নতুন পাসওয়ার্ড (আর দেখানো হবে না): '+p;};
// ---- leaderboard (local, this device only)
function endRun(){if(!session)return;const st=profile;st.games++;st.best=Math.max(st.best||0,score);st.dist=Math.max(st.dist||0,Math.floor(distance));
 runs.push({u:session,s:score,d:Math.floor(distance),c:coins,t:Date.now()});if(runs.length>300)runs.splice(0,runs.length-300);persist();refreshMenu();}
function boardRows(period){const now=Date.now(),lim=period==='day'?864e5:period==='week'?6048e5:Infinity,m={};
 for(const r of runs){if(now-r.t>lim)continue;const o=m[r.u]||(m[r.u]={u:r.u,s:0,d:0,c:0,g:0});o.s=Math.max(o.s,r.s);o.d=Math.max(o.d,r.d);o.c+=r.c;o.g++;}
 return Object.values(m).sort((a,b)=>b.s-a.s).map((o,i)=>({...o,rank:i+1}));}
let boardPeriod='all';
function renderBoard(){
 const list=$('#board-list');list.textContent='';const rows=boardRows(boardPeriod);
 document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.p===boardPeriod));
 const me=rows.find(r=>r.u===session);$('#prof').textContent=session?(session+' • র‍্যাঙ্ক '+(me?'#'+me.rank:'—')+' • ওয়ালেট '+fmtTaka(profile.coins)+' • কয়েন '+profile.coins+' • গেম '+(profile.games||0)+' • জেটপ্যাক '+(jetUnlocked()?'আনলকড 🚀':Math.floor(profile.coins/JET_UNLOCK*100)+'%')):'';
 if(!rows.length){const d=document.createElement('div');d.className='empty';d.textContent='এখনো কেউ দৌড়ায়নি — প্রথম হও! 🏃';list.appendChild(d);return;}
 const show=rows.slice(0,10);if(me&&me.rank>10)show.push(me);
 for(const r of show){const d=document.createElement('div');d.className='lrow'+(r.u===session?' me':'');
  const a=document.createElement('b');a.textContent='#'+r.rank+' '+r.u+' — '+r.s;const b=document.createElement('small');b.textContent='সর্বোচ্চ '+r.d+' মি • কয়েন '+r.c+' • '+fmtTaka(r.c)+' • গেম '+r.g;d.append(a,b);list.appendChild(d);}
}
$('#board-btn').onclick=()=>{renderBoard();showScreen('board-screen');};
$('#refresh-btn').onclick=()=>{runs=LS('adibaRuns',runs);accounts=LS('adibaAccounts',accounts);if(session&&accounts[session])profile=accounts[session].stats;renderBoard();};
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{boardPeriod=b.dataset.p;renderBoard();});
// ---- share newspaper as image
async function shareNews(){
 try{const W=900,H=1300,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
 x.fillStyle='#f1e9d6';x.fillRect(0,0,W,H);x.fillStyle='#111';x.textAlign='center';x.font='900 60px "Hind Siliguri",serif';x.fillText('দৈনিক আদিবা সংবাদ',W/2,90);
 const wrap=(t,y,size,lh)=>{x.font='700 '+size+'px "Hind Siliguri",serif';let line='';for(const w of t.split(' ')){const tt=line?line+' '+w:w;if(x.measureText(tt).width>W-80&&line){x.fillText(line,W/2,y);y+=lh;line=w;}else line=tt;}x.fillText(line,W/2,y);return y+lh;};
 let y=wrap(document.querySelector('#news-screen h2').textContent,170,46,58);y=wrap(document.querySelector('#news-screen h3').textContent,y+10,26,36);
 if(shot){const im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=shot;});const bw=W-80,bh=520,sc=Math.min(bw/im.width,bh/im.height),w=im.width*sc,h=im.height*sc;x.fillStyle='#1c3045';x.fillRect(40,y+10,bw,bh);x.drawImage(im,40+(bw-w)/2,y+10+(bh-h)/2,w,h);y+=bh+50;}
 y=wrap((document.querySelector('#paper-extra')||{}).textContent||'',y+10,24,34);
 const blob=await new Promise(r=>cv.toBlob(r,'image/png'));const file=new File([blob],'adiba-news.png',{type:'image/png'});
 if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({files:[file],title:'ADIBA CHASE'});
 else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='adiba-news.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
 }catch(e){toast('শেয়ার করা যায়নি');}
}
$('#share-btn').onclick=shareNews;
// ---- boot
if(session&&accounts[session]){profile=accounts[session].stats;refreshMenu();}else{session=null;showScreen('login-screen');}
