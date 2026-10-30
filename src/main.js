import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x9bc9d9, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc9d9);
scene.fog = new THREE.Fog(0x9bc9d9, 65, 170);
const camera = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, .1, 220);
camera.position.set(0, 5.2, 13.8);
camera.lookAt(0, 1.05, -4.5);

scene.add(new THREE.HemisphereLight(0xe6f7ff,0x657b56,2.35));
const sun = new THREE.DirectionalLight(0xffe1b3,2.6); sun.position.set(-8,14,8); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);
const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
const roadMat=mat(0x454d55), sidewalkMat=mat(0xc2b49a), laneMat=mat(0xf5d38a), skinMat=mat(0xc98762), shirtMat=mat(0x8e2638), pantsMat=mat(0x202b39), blackMat=mat(0x111923), goldMat=mat(0xe7ad51), tealMat=mat(0x1c6e70), redMat=mat(0xc74338);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),mat(0x6c9b68));ground.rotation.x=-Math.PI/2;ground.position.y=-.18;ground.receiveShadow=true;scene.add(ground);
const road=new THREE.Mesh(new THREE.PlaneGeometry(10,150),roadMat);road.rotation.x=-Math.PI/2;road.position.y=-.12;road.receiveShadow=true;scene.add(road);
for(const x of [-5.5,5.5]){const s=new THREE.Mesh(new THREE.BoxGeometry(1.1,.25,150),sidewalkMat);s.position.set(x,-.03,0);scene.add(s);}
for(const x of [-1.65,1.65]) for(let z=-65;z<40;z+=8){const d=new THREE.Mesh(new THREE.BoxGeometry(.09,.025,3.4),laneMat);d.position.set(x,-.095,z);scene.add(d);}
const city=new THREE.Group();scene.add(city);
for(let side of [-1,1]) for(let i=0;i<22;i++){
 const z=-75+i*7.2, h=4+Math.random()*13, w=2+Math.random()*3;
 const building=new THREE.Mesh(new THREE.BoxGeometry(w,h,3+Math.random()*3),mat([0xd99c69,0xf0c47a,0x82b8a4,0xd77c70,0x9db8d6][i%4]));
 building.position.set(side*(8+Math.random()*4),h/2-.1,z);building.castShadow=true;city.add(building);
 for(let y=1.5;y<h-.5;y+=2) for(let x=-w/2+.45;x<w/2-.2;x+=.85){const win=new THREE.Mesh(new THREE.PlaneGeometry(.42,.65),mat(Math.random()>.35?0x8ab6c4:0x293b4b));win.position.set(building.position.x+x,y,z+2.02);city.add(win);}
}

function makePerson(topColor, bottomColor, scale=1, isAdiba=false){
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
   const hip=new THREE.Group();hip.position.set(x,.78,0);g.add(hip);
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
const player=makePerson(0x8c293c,0x222b39,1,false);player.position.set(0,0,2.6);scene.add(player);
const adiba=makePerson(0x171d28,0x171d28,.93,true);adiba.position.set(0,0,5.8);scene.add(adiba);
// Adiba's dupatta-like trailing accent
const scarf=new THREE.Mesh(new THREE.ConeGeometry(.48,1.6,8),mat(0xb18a4c));scarf.position.set(0,1.5,1.0);scarf.rotation.x=1.1;adiba.add(scarf);

const lanes=[-3.1,0,3.1];let lane=1, running=false, paused=false, distance=0, score=0, coins=0, chase=0, speed=17, jumpV=0, jumping=false, sliding=0, elapsed=0, spawnTimer=0, coinTimer=0, dialogueTimer=0, lastDialogue=-1;
const obstacles=[], collectibles=[], scenery=[];
function boxObstacle(x,z,type){
 const g=new THREE.Group();let body;
 if(type==='bus'){body=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.6,4.3),mat(0x287b83));body.position.y=1.35;const stripe=new THREE.Mesh(new THREE.BoxGeometry(2.22,.25,4.32),goldMat);stripe.position.y=1.25;g.add(stripe);}
 else if(type==='cng'){body=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.55,2.2),mat(0x2d8b62));body.position.y=.85;const roof=new THREE.Mesh(new THREE.BoxGeometry(1.25,.25,1.5),goldMat);roof.position.y=1.7;g.add(roof);}
 else if(type==='rickshaw'){body=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.25,2.3),mat(0xc77b38));body.position.y=.7;const hood=new THREE.Mesh(new THREE.BoxGeometry(1.8,.15,1.5),redMat);hood.position.set(0,1.5,-.1);g.add(hood);}
 else {body=new THREE.Mesh(new THREE.BoxGeometry(1.45,1.15,1.3),mat(0xc16a43));body.position.y=.65;}
 body.castShadow=true;g.add(body);
 if(type==='bus'||type==='cng'){
   const glass=mat(0x9bd0dc,.22),trim=mat(0xf2c45f,.45);
   const windshield=new THREE.Mesh(new THREE.BoxGeometry(type==='bus'?1.72:.92,.62,.045),glass);
   windshield.position.set(0,type==='bus'?2.02:1.18,type==='bus'?2.17:1.12);g.add(windshield);
   for(let wx of [-.48,.48]){const lamp=new THREE.Mesh(new THREE.BoxGeometry(.22,.16,.06),mat(0xffe6a0));lamp.position.set(wx,.62,type==='bus'?2.18:1.13);g.add(lamp);}
   if(type==='bus')for(let wz of [-1.35,-.45,.45,1.35]){const win=new THREE.Mesh(new THREE.BoxGeometry(.045,.58,.65),glass);win.position.set(1.115,1.72,wz);g.add(win);}
 }

 if(type!=='barrier'){for(let wx of [-.72,.72])for(let wz of [-.7,.7]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.14,12),blackMat);wheel.rotation.z=Math.PI/2;wheel.position.set(wx,.28,wz);g.add(wheel);}}
 g.position.set(x,0,z);scene.add(g);obstacles.push({mesh:g,type,hit:false});
}
function spawnCoin(x,z){const m=new THREE.Mesh(new THREE.TorusGeometry(.34,.11,8,16),goldMat);m.position.set(x,1.15,z);m.rotation.y=Math.PI/2;scene.add(m);collectibles.push(m);}
function spawnStreetDetail(z){
 const side=Math.random()>.5?1:-1, x=side*(6.2+Math.random()*1.4);
 const g=new THREE.Group();const stall=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.2,1.2),mat(Math.random()>.5?0x9c5735:0x27736b));stall.position.y=.65;g.add(stall);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(1.1,.65,4),goldMat);roof.position.y=1.55;roof.rotation.y=Math.PI/4;g.add(roof);
 g.position.set(x,0,z);scene.add(g);scenery.push(g);
}
const dialogues=[
 ['husband','আরে বাবা! একটু শান্তি দাও!'],['husband','আমি নির্দোষ, বিশ্বাস করো!'],['husband','আজকে বাসায় ফিরবো না!'],['husband','ভাই, কেউ আমাকে বাঁচাও!'],['husband','আম্মু, তোমার ছেলেকে বাঁচাও!'],['husband','আর দৌড়াতে পারছি না!'],
 ['adiba','এই দাঁড়াও! আজকে তোমার খবর আছে!'],['adiba','কোথায় পালাও দেখি!'],['adiba','বাসায় চলো, তারপর বুঝাচ্ছি!'],['adiba','আজকে তোমার শেষ রক্ষা নাই!'],['adiba','আর কত দৌড়াবা?'],['adiba','ধরতে পারলেই বুঝবা!']
];
const $=s=>document.querySelector(s);
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1800);}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));if(id)$('#'+id).classList.add('active');}
function startGame(){resetGame();showScreen(null);running=true;paused=false;$('#hud').classList.remove('hidden');$('#pause-btn').classList.remove('hidden');$('#mobile-hint').style.display='block';}
function resetGame(){for(const o of obstacles)scene.remove(o.mesh);for(const c of collectibles)scene.remove(c);for(const s of scenery)scene.remove(s);obstacles.length=0;collectibles.length=0;scenery.length=0;lane=1;player.position.set(0,0,2.6);adiba.position.set(0,0,5.8);distance=score=coins=chase=elapsed=spawnTimer=coinTimer=dialogueTimer=0;speed=17;jumpV=0;jumping=false;sliding=0;updateHud();}
function updateHud(){$('#distance').textContent=Math.floor(distance)+' m';$('#score').textContent=score;$('#coins').textContent=coins;}
function move(dir){if(!running||paused)return;lane=THREE.MathUtils.clamp(lane+dir,0,2);}
function jump(){if(!running||paused||jumping)return;jumping=true;jumpV=8.8;}
function slide(){if(!running||paused)return;sliding=.7;}
function catchPlayer(){
 try{window.__adibaGameShot=renderer.domElement.toDataURL('image/png');}catch(e){window.__adibaGameShot='';}
 if(!running)return;running=false;$('#hud').classList.add('hidden');$('#pause-btn').classList.add('hidden');$('#mobile-hint').style.display='none';
 $('#final-distance').textContent=Math.floor(distance)+' m';$('#final-score').textContent=score;$('#final-coins').textContent=coins;
 $('#caught-line').textContent=chase>1.7?'Adiba: এতক্ষণ কোথায় পালাচ্ছিলা?':'Adiba: এবার বুঝছো?';
 showScreen('caught-screen');
}
function collision(){
 chase=Math.min(2.6,chase+.72);toast('উফ! আদিবা আরও কাছে চলে এসেছে!');if(chase>=2.45)catchPlayer();
}
function pauseGame(){if(!running)return;paused=true;showScreen('pause-screen');}
function resumeGame(){paused=false;showScreen(null);}
function finishNews(){
 const paperImg=$('#paper-character-shot');if(paperImg&&window.__adibaGameShot)paperImg.src=window.__adibaGameShot;
 const best=Math.max(Number(localStorage.getItem('adibaBest')||0),score);localStorage.setItem('adibaBest',best);$('#best-score').textContent=best;
 $('#paper-distance').textContent=Math.floor(distance);$('#paper-score').textContent=score;
 $('#paper-date').textContent=new Date().toLocaleDateString('bn-BD',{day:'numeric',month:'long',year:'numeric'});
 showScreen('news-screen');
}
$('#start-btn').onclick=startGame;$('#how-btn').onclick=()=>showScreen('help-screen');document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>showScreen('menu-screen'));
$('#pause-btn').onclick=pauseGame;$('#resume-btn').onclick=resumeGame;$('#restart-btn').onclick=startGame;$('#quit-btn').onclick=()=>{running=false;$('#hud').classList.add('hidden');$('#pause-btn').classList.add('hidden');showScreen('menu-screen')};
$('#news-btn').onclick=finishNews;$('#play-again-btn').onclick=startGame;$('#menu-btn').onclick=()=>{showScreen('menu-screen');$('#best-score').textContent=localStorage.getItem('adibaBest')||0};
$('#best-score').textContent=localStorage.getItem('adibaBest')||0;
addEventListener('keydown',e=>{if(['ArrowLeft','a','A'].includes(e.key))move(-1);if(['ArrowRight','d','D'].includes(e.key))move(1);if(['ArrowUp','w','W',' '].includes(e.key)){e.preventDefault();jump();}if(['ArrowDown','s','S'].includes(e.key))slide();if(e.key==='Escape')running&&!paused?pauseGame():paused?resumeGame():null;});
let touchStart=null;addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchStart={x:t.clientX,y:t.clientY};},{passive:true});
addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>25){if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1);else if(dy<0)jump();else slide();}touchStart=null;},{passive:true});


function animateCharacter(character,t,mode='run',blend=1){
 const rig=character.userData.limbs;if(!rig)return;
 const runningPose=mode==='run';
 for(const leg of rig.legs){
   const phase=t*10+(leg.side>0?Math.PI:0);
   leg.hip.rotation.x=runningPose?Math.sin(phase)*.72*blend:0;
   leg.knee.rotation.x=runningPose?Math.max(0,-Math.sin(phase))*.95*blend:0;
 }
 for(const arm of rig.arms){
   const phase=t*10+(arm.side>0?0:Math.PI);
   arm.shoulder.rotation.x=runningPose?Math.sin(phase+Math.PI)*.58*blend:0;
   arm.shoulder.rotation.z=arm.side*(runningPose?.12:.04);
   arm.elbow.rotation.x=runningPose?-.35-Math.max(0,Math.sin(phase))*.45:0;
 }
 rig.torso.rotation.x=runningPose?-.06+Math.sin(t*20)*.018:0;
 rig.head.rotation.x=Math.sin(t*4)*.025;
}

const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);elapsed+=dt;
 if(running&&!paused){
  distance+=speed*dt*.42;speed=Math.min(30,17+distance*.012);score=Math.floor(distance*3)+coins*10;chase=Math.max(0,chase-dt*.035);
  player.position.x=THREE.MathUtils.damp(player.position.x,lanes[lane],12,dt);
  if(jumping){player.position.y+=jumpV*dt;jumpV-=22*dt;if(player.position.y<=0){player.position.y=0;jumping=false;}}
  if(sliding>0)sliding-=dt;
  player.rotation.z=THREE.MathUtils.damp(player.rotation.z,(lanes[lane]-player.position.x)*-.035,8,dt);
  adiba.position.x=THREE.MathUtils.damp(adiba.position.x,player.position.x,2,dt);adiba.position.z=5.8-chase*1.35+Math.sin(elapsed*8)*.12;
  player.rotation.x=sliding>0?.8:0;
  animateCharacter(player,elapsed,'run',sliding>0?.25:1);animateCharacter(adiba,elapsed*1.04,'run',1);
  spawnTimer-=dt;if(spawnTimer<=0){const l=Math.floor(Math.random()*3),type=['bus','cng','rickshaw','barrier'][Math.floor(Math.random()*4)];boxObstacle(lanes[l],-75,type);spawnTimer=Math.max(.48,1.15-distance*.0007);}
  coinTimer-=dt;if(coinTimer<=0){const l=Math.floor(Math.random()*3);for(let i=0;i<5;i++)spawnCoin(lanes[l],-65-i*2.1);coinTimer=2.1+Math.random()*1.3;}
  if(Math.random()<dt*.28)spawnStreetDetail(-75);
  for(let i=obstacles.length-1;i>=0;i--){const o=obstacles[i];o.mesh.position.z+=speed*dt;if(o.mesh.position.z>7){scene.remove(o.mesh);obstacles.splice(i,1);continue;}
   if(!o.hit&&Math.abs(o.mesh.position.z-player.position.z)<1.45&&Math.abs(o.mesh.position.x-player.position.x)<1.25){
    const canClear=(o.type==='barrier'&&sliding>0)||(o.type==='rickshaw'&&jumping);if(!canClear){o.hit=true;collision();}else{o.hit=true;score+=30;}
   }}
  for(let i=collectibles.length-1;i>=0;i--){const c=collectibles[i];c.position.z+=speed*dt;c.rotation.z+=dt*3;if(c.position.z>7){scene.remove(c);collectibles.splice(i,1);continue;}if(Math.abs(c.position.z-player.position.z)<1.1&&Math.abs(c.position.x-player.position.x)<.95){coins++;score+=10;scene.remove(c);collectibles.splice(i,1);toast('+1 coin ✨');}}
  for(let i=scenery.length-1;i>=0;i--){scenery[i].position.z+=speed*dt;if(scenery[i].position.z>10){scene.remove(scenery[i]);scenery.splice(i,1);}}
  dialogueTimer-=dt;if(dialogueTimer<=0){let idx;do{idx=Math.floor(Math.random()*dialogues.length)}while(idx===lastDialogue);lastDialogue=idx;toast(dialogues[idx][1]);dialogueTimer=7+Math.random()*5;}
  updateHud();
 }
 if(!running){animateCharacter(player,elapsed*.7,'run',.18);animateCharacter(adiba,elapsed*.7,'run',.18);}
 camera.position.x=THREE.MathUtils.damp(camera.position.x,player.position.x*.22,2,1/60);camera.lookAt(player.position.x*.12,1.2,-5);
 renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));});
