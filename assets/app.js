import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';


const overlay = document.getElementById('overlay');
const gameOverEl = document.getElementById('gameOver');
const goTitle = document.getElementById('goTitle');
const goDesc = document.getElementById('goDesc');
const batteryVal = document.getElementById('batteryVal');
const pickupsEl = document.getElementById('pickups');
const doorStatusEl = document.getElementById('doorStatus');
const staminaBar = document.getElementById('staminaBar');
const staminaVal = document.getElementById('staminaVal');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const bgm = document.getElementById('bgm');
const bgmOpening = document.getElementById('bgmOpening');
const loseBgm = document.getElementById('loseBgm');
const spiderAlert = document.getElementById('spiderAlert');
const muteBtn = document.getElementById('muteBtn');
const loadingEl = document.getElementById('loading');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const modeDark = document.getElementById('modeDark');
const modeLight = document.getElementById('modeLight');
const closeSettings = document.getElementById('closeSettings');

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x1a0a0a, 12, 42);
scene.background = new THREE.Color(0x0a0505);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 1.7, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = false; // kasma icin kapatildi, gerekirse acilir
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

let musicStarted=false;
let openingStarted=false;
async function startOpening(){ try{ bgmOpening.volume=0.50; bgmOpening.loop=true; await bgmOpening.play(); openingStarted=true; } catch(e){ console.log('opening engellendi',e); } }
async function startMusic(){ try{ bgm.volume=0.55; bgm.loop=true; await bgm.play(); musicStarted=true; muteBtn.textContent='🔊'; } catch(e){ console.log('bgm engellendi',e); } }
function stopOpening(){ bgmOpening.pause(); bgmOpening.currentTime=0; }
setTimeout(()=> startOpening(), 500);
document.addEventListener('click', ()=>{ if(!openingStarted && !musicStarted) startOpening(); }, {once:true});
function tryLock(){ try{ controls.lock(); } catch(e){ console.error(e); overlay.style.display='none'; } }
startBtn.addEventListener('click', e=>{ e.stopPropagation(); tryLock(); stopOpening(); startMusic(); });
overlay.addEventListener('click', e=>{ if(e.target===overlay) tryLock(); });
restartBtn.onclick = () => location.reload();
muteBtn.onclick = async ()=>{
  const openingActive = overlay.style.display!=='none' && !controls.isLocked;
  bgm.muted=!bgm.muted; bgmOpening.muted=bgm.muted; loseBgm.muted=bgm.muted;
  muteBtn.textContent=bgm.muted?'🔇':'🔊'; muteBtn.classList.toggle('muted', bgm.muted);
  if(!openingActive && !musicStarted && !bgm.muted) await startMusic();
  if(openingActive && !openingStarted && !bgmOpening.muted) await startOpening();
};
settingsBtn.onclick = ()=> settingsPanel.classList.remove('hidden');
closeSettings.onclick = ()=> settingsPanel.classList.add('hidden');
settingsPanel.addEventListener('click', e=>{ if(e.target===settingsPanel) settingsPanel.classList.add('hidden'); });
function setMode(light){
  isLightMode=light;
  localStorage.setItem('sonisik_mode', light?'light':'dark');
  modeDark.classList.toggle('active', !light); modeLight.classList.toggle('active', light);
  applyMode();
}
modeDark.onclick=()=> setMode(false);
modeLight.onclick=()=> setMode(true);
controls.addEventListener('lock', () => { overlay.style.display='none'; gameOverEl.classList.add('hidden'); settingsPanel.classList.add('hidden'); stopOpening(); if(!musicStarted) startMusic(); if(!gameStartTime) gameStartTime=performance.now(); });
controls.addEventListener('unlock', () => { if(!gameEnded && settingsPanel.classList.contains('hidden')){ overlay.style.display='flex'; bgm.pause(); startOpening(); } });
document.addEventListener('click', ()=>{ if(overlay.style.display==='none' && !controls.isLocked && !gameEnded && settingsPanel.classList.contains('hidden')) tryLock(); });

// --- KORKU EVI TEMALI DOKULAR ---
function makeWoodTexture(){
  const c=document.createElement('canvas'); c.width=512; c.height=512;
  const g=c.getContext('2d');
  g.fillStyle='#2b1a0e'; g.fillRect(0,0,512,512);
  for(let i=0;i<512;i+=32){
    g.fillStyle= i%64===0 ? '#3d2411' : '#1e0f08';
    g.fillRect(0,i,512,6);
    // damar
    g.strokeStyle='rgba(60,30,15,0.4)'; g.beginPath(); g.moveTo(0,i+16); g.bezierCurveTo(170,i+8, 340,i+24, 512,i+16); g.stroke();
  }
  g.fillStyle='rgba(0,0,0,0.15)';
  for(let i=0;i<20;i++){ g.fillRect(Math.random()*512,Math.random()*512, 80,2); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(6,6); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function makeWallTexture(){
  const c=document.createElement('canvas'); c.width=512; c.height=512;
  const g=c.getContext('2d');
  g.fillStyle='#1a1512'; g.fillRect(0,0,512,512);
  g.fillStyle='#2a201c'; 
  for(let y=0;y<512;y+=64){ g.fillRect(0,y,512,2); }
  for(let x=0;x<512;x+=128){ g.fillRect(x,0,2,512); }
  // kan lekesi
  g.fillStyle='rgba(90,10,10,0.18)';
  for(let i=0;i<6;i++){ const x=Math.random()*400+50, y=Math.random()*400+50; g.beginPath(); g.arc(x,y, 12+Math.random()*18,0,Math.PI*2); g.fill(); g.fillRect(x-2,y,4,30); }
  // kir
  g.fillStyle='rgba(0,0,0,0.25)'; for(let i=0;i<30;i++) g.fillRect(Math.random()*512,Math.random()*512, 20,20);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(4,1.2); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function makeColumnTexture(){
  const c=document.createElement('canvas'); c.width=256; c.height=512;
  const g=c.getContext('2d');
  g.fillStyle='#2b2018'; g.fillRect(0,0,256,512);
  // dikey oluklar
  for(let x=0;x<256;x+=32){ g.fillStyle= x%64===0 ? '#3d2b1e' : '#1a120c'; g.fillRect(x,0,4,512); }
  // yosun / kir
  g.fillStyle='rgba(20,40,20,0.22)'; for(let i=0;i<40;i++) g.fillRect(Math.random()*256, Math.random()*512, 18, 30);
  g.fillStyle='rgba(60,10,10,0.16)'; for(let i=0;i<8;i++){ const x=Math.random()*200+20, y=Math.random()*400+40; g.beginPath(); g.arc(x,y,10,0,Math.PI*2); g.fill(); }
  // catlak
  g.strokeStyle='rgba(0,0,0,0.35)'; g.lineWidth=1;
  for(let i=0;i<6;i++){ g.beginPath(); g.moveTo(Math.random()*256,0); g.bezierCurveTo(Math.random()*256,170, Math.random()*256,340, Math.random()*256,512); g.stroke(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1,1); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function makeDoorTexture(){
  const c=document.createElement('canvas'); c.width=512; c.height=512;
  const g=c.getContext('2d');
  // eski 90lar ahsap kapi
  g.fillStyle='#3b2314'; g.fillRect(0,0,512,512);
  g.fillStyle='#4a2e1a'; g.fillRect(18,18,476,476);
  g.fillStyle='#2b1a0e'; g.fillRect(30,30,452,452);
  // panel cizgileri
  g.strokeStyle='#1a0f07'; g.lineWidth=4;
  g.strokeRect(46,46,420,190); g.strokeRect(46,260,420,200);
  g.fillStyle='#5a341e'; g.fillRect(60,60,392,162); g.fillRect(60,274,392,172);
  // soyulmus boya
  g.fillStyle='rgba(210,210,200,0.18)';
  for(let i=0;i<12;i++){ const x=50+Math.random()*400, y=50+Math.random()*400; g.beginPath(); g.ellipse(x,y, 18+Math.random()*22, 10+Math.random()*12, Math.random()*0.6,0,Math.PI*2); g.fill(); }
  // pasli kol
  g.fillStyle='#8a5a1a'; g.beginPath(); g.arc(420,256,18,0,Math.PI*2); g.fill();
  g.fillStyle='#4a3000'; g.beginPath(); g.arc(420,256,8,0,Math.PI*2); g.fill();
  // kan izi
  g.fillStyle='rgba(90,10,10,0.22)'; g.fillRect(380,80,6,120); g.beginPath(); g.arc(383,200,10,0,Math.PI*2); g.fill();
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function makeCrateTexture(){
  const c=document.createElement('canvas'); c.width=256; c.height=256;
  const g=c.getContext('2d');
  g.fillStyle='#2e1e14'; g.fillRect(0,0,256,256);
  g.strokeStyle='#4a3020'; g.lineWidth=3;
  g.strokeRect(4,4,248,248); g.beginPath(); g.moveTo(0,85); g.lineTo(256,85); g.moveTo(0,170); g.lineTo(256,170); g.stroke();
  g.fillStyle='rgba(0,0,0,0.3)'; g.font='bold 22px sans-serif'; g.fillText('FRAGILE',70,45);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
const woodTex=makeWoodTexture();
const wallTex=makeWallTexture();
const crateTex=makeCrateTexture();
const columnTex=makeColumnTexture();
const doorTex=makeDoorTexture();
const columnMat=new THREE.MeshStandardMaterial({map:columnTex, roughness:0.8});
const doorWoodMat=new THREE.MeshStandardMaterial({map:doorTex, roughness:0.7});

// lights
const ambientLight = new THREE.AmbientLight(0x301010, 0.22); scene.add(ambientLight);
let isLightMode = localStorage.getItem('sonisik_mode')==='light';
let ceilingLights=[];
const flashlight = new THREE.SpotLight(0xfff6cc, 70, 22, Math.PI/6, 0.4, 1.2);
flashlight.position.set(0.35, -0.35, -0.1);
flashlight.castShadow = false;
flashlight.target.position.set(0, -0.2, -1);
camera.add(flashlight); camera.add(flashlight.target); scene.add(camera);
const playerFill = new THREE.PointLight(0x442222, 0.5, 5); playerFill.position.set(0,0,0); camera.add(playerFill);
// tavan titreyen isiklar - azaltildi kasma icin 4->2
const flickerLights=[];
for(let i=0;i<2;i++){
  const pl=new THREE.PointLight(0xff4400, 0.7, 16);
  pl.position.set((Math.random()-0.5)*50, 4.2, (Math.random()-0.5)*50);
  scene.add(pl); flickerLights.push(pl);
}
// aydinlik mod - pointLight yerine tek hemiLight
const hemiLight=new THREE.HemisphereLight(0xfff2cc, 0x222222, 0);
scene.add(hemiLight);
function applyMode(){
  if(isLightMode){
    ambientLight.color.set(0xffffff); ambientLight.intensity=0.85;
    hemiLight.intensity=0.9;
    scene.background=new THREE.Color(0xd6c7a8);
    scene.fog=new THREE.Fog(0xd6c7a8, 18, 55);
    flashlight.intensity=0; playerFill.intensity=0.1;
    flickerLights.forEach(l=> l.intensity=0);
    floor.material.color.set(0xffffff);
    if(flashlightModel) flashlightModel.visible=false;
  } else {
    ambientLight.color.set(0x301010); ambientLight.intensity=0.22;
    hemiLight.intensity=0;
    scene.background=new THREE.Color(0x0a0505);
    scene.fog=new THREE.Fog(0x0a0505, 12, 42);
    flashlight.intensity=flashOn?70:0; playerFill.intensity=flashOn?0.5:0.12;
    // flicker geri gelecek animate ile
    if(flashlightModel) flashlightModel.visible=flashOn;
  }
}
// ilk mod uygula
setTimeout(()=>{ modeDark.classList.toggle('active', !isLightMode); modeLight.classList.toggle('active', isLightMode); applyMode(); }, 100);

// floor korku evi
const floor = new THREE.Mesh(new THREE.PlaneGeometry(90,90), new THREE.MeshStandardMaterial({map:woodTex, roughness:0.85, metalness:0.05}));
floor.rotation.x = -Math.PI/2; floor.receiveShadow=false; floor.position.y=0.01; scene.add(floor);
// halilar
for(let i=0;i<6;i++){
  const rug=new THREE.Mesh(new THREE.PlaneGeometry(6+Math.random()*4, 4+Math.random()*3), new THREE.MeshStandardMaterial({color:0x4a1010, roughness:1}));
  rug.rotation.x=-Math.PI/2; rug.position.set((Math.random()-0.5)*50,0.02,(Math.random()-0.5)*50); rug.receiveShadow=false; scene.add(rug);
}

const wallMat = new THREE.MeshStandardMaterial({map:wallTex, roughness:0.9, color:0xdddddd});
const colliders=[]; // duvar + engel kutulari
function wall(w,h,x,y,z,ry=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.4), wallMat);
  m.position.set(x,y,z); m.rotation.y=ry; m.castShadow=false; m.receiveShadow=false; scene.add(m);
  // collider AABB
  const halfW = (ry===0? w:0.4)/2, halfD=(ry===0?0.4:w)/2;
  colliders.push({ minX:x-halfW-0.45, maxX:x+halfW+0.45, minZ:z-halfD-0.45, maxZ:z+halfD+0.45 });
  return m;
}
wall(90,5,0,2.5,-45); wall(90,5,0,2.5,45); wall(90,5,-45,2.5,0,Math.PI/2); wall(90,5,45,2.5,0,Math.PI/2);
// kolonlar - tavana kadar, eski ve urpertici
function addColumn(x,z){
  const col=new THREE.Mesh(new THREE.BoxGeometry(0.85,5,0.85), columnMat);
  col.position.set(x,2.5,z); col.castShadow=false; col.receiveShadow=false; scene.add(col);
  colliders.push({ minX:x-0.62, maxX:x+0.62, minZ:z-0.62, maxZ:z+0.62 });
}
for(let x=-40;x<=40;x+=10){ if(x!==0) addColumn(x,-44.6); addColumn(x,44.6); }
for(let z=-35;z<=35;z+=10){ addColumn(-44.6,z); addColumn(44.6,z); }
// kose buyuk kolonlar
[[-44.6,-44.6],[44.6,-44.6],[-44.6,44.6],[44.6,44.6]].forEach(([x,z])=>{
  const big=new THREE.Mesh(new THREE.BoxGeometry(1.2,5,1.2), columnMat);
  big.position.set(x,2.5,z); scene.add(big);
});

// 4 odacik - kapilari acik
const roomCenters=[[-28,-28],[28,28],[-28,28],[28,-28]];
function createRoom(cx,cz,size,doorSide){
  const half=size/2; const h=3.2;
  // kuzey duvar
  if(doorSide==='north'){
    const seg=(size-2.6)/2;
    wall(seg,h,cx - (size/2 - seg/2),h/2,cz-half);
    wall(seg,h,cx + (size/2 - seg/2),h/2,cz-half);
  } else wall(size,h,cx,h/2,cz-half);
  // guney
  if(doorSide==='south'){
    const seg=(size-2.6)/2;
    wall(seg,h,cx - (size/2 - seg/2),h/2,cz+half);
    wall(seg,h,cx + (size/2 - seg/2),h/2,cz+half);
  } else wall(size,h,cx,h/2,cz+half);
  // dogu
  if(doorSide==='east'){
    const seg=(size-2.6)/2;
    wall(seg,h,cx+half,h/2,cz - (size/2 - seg/2),Math.PI/2);
    wall(seg,h,cx+half,h/2,cz + (size/2 - seg/2),Math.PI/2);
  } else wall(size,h,cx+half,h/2,cz,Math.PI/2);
  // bati
  if(doorSide==='west'){
    const seg=(size-2.6)/2;
    wall(seg,h,cx-half,h/2,cz - (size/2 - seg/2),Math.PI/2);
    wall(seg,h,cx-half,h/2,cz + (size/2 - seg/2),Math.PI/2);
  } else wall(size,h,cx-half,h/2,cz,Math.PI/2);
  // zemin halisi
  const rug=new THREE.Mesh(new THREE.PlaneGeometry(size-0.6,size-0.6), new THREE.MeshStandardMaterial({color:0x1a0a0a, roughness:1}));
  rug.rotation.x=-Math.PI/2; rug.position.set(cx,0.015,cz); rug.receiveShadow=false; scene.add(rug);
}
createRoom(-28,-28,9,'north');
createRoom(28,28,9,'south');
createRoom(-28,28,9,'east');
createRoom(28,-28,9,'west');

// masa pozisyonlari - crate oncesi tanimli olmali
const tablePositions=[
  [-12,-8],[12,-12],[-18,18],[18,16],[6,6],[-28,-22],[28,-24],[-8,30]
];
function isRoomInside(x,z){
  for(const r of roomCenters){ if(Math.abs(x-r[0])<6.5 && Math.abs(z-r[1])<6.5) return true; }
  return false;
}
function isNearPickup(x,z){
  const picks=[[-42,-42],[42,-42],[-42,42],[42,42],[0,-38],[-20,34],[22,36],[-36,-18],[36,-20],[-38,10],[38,12],[-10,-30],[10,-32],[-30,22],[30,24],[-18,-28],[18,-26],[-42,0],[42,2],[0,38],[-34,34],[34,-34],[-26,-10],[26,10],[-12,18],[12,20],[-36,28],[36,28],[-8,-42],[8,-42],[-14,40],[14,40],[-28,-32],[28,-32],[-6,30],[6,32],[-18,0],[18,0],[0,12],[0,-12]];
  for(const p of picks){ if(Math.hypot(x-p[0], z-p[1])<3.2) return true; }
  for(const t of tablePositions){ if(Math.hypot(x-t[0], z-t[1])<3.0) return true; }
  return false;
}

const crateBoxes=[];
for(let i=0;i<22;i++){
  const sx=0.9+Math.random()*1.4, sy=1+Math.random()*1.6, sz=0.9+Math.random()*1.4;
  const mat = i%3===0 ? new THREE.MeshStandardMaterial({map:crateTex}) : (i%3===1? new THREE.MeshStandardMaterial({color:0x3a2518, roughness:0.9}) : wallMat);
  let x,y,z; let tries=0; do{ x=(Math.random()-0.5)*74; z=(Math.random()-0.5)*74; tries++; if(tries>40) break; } while( isRoomInside(x,z) || isNearPickup(x,z) );
  const b=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), mat);
  b.position.set(x, sy/2, z);
  if(b.position.distanceTo(new THREE.Vector3(0,0,10))<6) b.position.z+=10;
  b.castShadow=false; b.receiveShadow=false; scene.add(b);
  colliders.push({ minX:b.position.x-sx/2-0.45, maxX:b.position.x+sx/2+0.45, minZ:b.position.z-sz/2-0.45, maxZ:b.position.z+sz/2+0.45 });
  crateBoxes.push(b);
}
// masa+sandalye engelleri (FBX)
const fbxLoader=new FBXLoader();
fbxLoader.load('assets/models/table.fbx', (fbx)=>{
  fbx.traverse(c=>{ if(c.isMesh){ c.castShadow=false; c.receiveShadow=false; }});
  tablePositions.forEach(([x,z],i)=>{
    const clone=fbx.clone(true);
    clone.scale.set(0.015,0.015,0.015);
    clone.position.set(x,0,z);
    clone.rotation.y=Math.random()*Math.PI*2;
    scene.add(clone);
    // collider ~1.8m capinda masa+sandalye
    colliders.push({ minX:x-1.1, maxX:x+1.1, minZ:z-1.1, maxZ:z+1.1 });
  });
}, undefined, (e)=> console.log('table fbx load fail',e));

const doorMat = new THREE.MeshStandardMaterial({map:doorTex, roughness:0.7, emissive:0x1a0a0a, emissiveIntensity:0.12});
const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6,3.4,0.38), doorMat);
doorFrame.position.set(0,1.6,-44.85); scene.add(doorFrame);
const doorLight = new THREE.PointLight(0xef4444, 6, 11); doorLight.position.set(0,1.6,-43.2); scene.add(doorLight);
let doorSprite; (()=>{ const c=document.createElement('canvas'); c.width=256; c.height=64; const g=c.getContext('2d'); g.fillStyle='#ef4444'; g.font='bold 26px sans-serif'; g.fillText('KİLİTLİ',68,42); const t=new THREE.CanvasTexture(c); doorSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:t})); doorSprite.scale.set(2.2,0.55,1); doorSprite.position.set(0,3.0,-44); scene.add(doorSprite); })();
function openDoor(){
  doorMat.color.set(0x14532d); doorMat.emissive.set(0x22c55e); doorMat.emissiveIntensity=1.3;
  doorLight.color.set(0x22c55e); doorLight.intensity=12;
  const c=document.createElement('canvas'); c.width=256; c.height=64; const g=c.getContext('2d'); g.fillStyle='#22c55e'; g.font='bold 30px sans-serif'; g.fillText('AÇIK →',70,42);
  doorSprite.material.map=new THREE.CanvasTexture(c); doorSprite.material.needsUpdate=true;
}

const pickups=[]; const pickupGroup=new THREE.Group(); scene.add(pickupGroup);
function spawnBattery(x,z){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.52,10), new THREE.MeshStandardMaterial({color:0xfacc15, emissive:0xb45309, emissiveIntensity:0.65, roughness:0.4}));
  body.castShadow=false;
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.09,10), new THREE.MeshStandardMaterial({color:0x1f2937})); cap.position.y=0.29; body.add(cap);
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.35,0.42,12), new THREE.MeshBasicMaterial({color:0xfacc15, side:THREE.DoubleSide, transparent:true, opacity:0.35})); ring.rotation.x=Math.PI/2; ring.position.y=-0.1;
  // isik sadece yakinda acilacak, simdi kapali
  g.add(body,ring); g.position.set(x,0.48,z); g.userData={ collected:false, baseY:0.48, t:Math.random()*6 }; pickupGroup.add(g); pickups.push(g);
}
[
 [-42,-42],[42,-42],[-42,42],[42,42],[0,-38],[-20,34],[22,36],[-36,-18],[36,-20],[-38,10],
 [38,12],[-10,-30],[10,-32],[-30,22],[30,24],[-18,-28],[18,-26],[-42,0],[42,2],[0,38],
 [-34,34],[34,-34],[-26,-10],[26,10],[-12,18],[12,20],[-36,28],[36,28],[-8,-42],[8,-42],
 [-14,40],[14,40],[-28,-32],[28,-32],[-6,30],[6,32],[-18,0],[18,0],[0,12],[0,-12]
].forEach(([x,z])=> spawnBattery(x,z));

// --- EL FENERI 3D MODEL ---
let flashlightModel=null;
const mtlLoader=new MTLLoader(); const objLoader=new OBJLoader();
mtlLoader.load('assets/models/flashlight.mtl', (mtl)=>{
  mtl.preload();
  objLoader.setMaterials(mtl);
  objLoader.load('assets/models/flashlight.obj', (obj)=>{
    obj.scale.set(0.12,0.12,0.12);
    obj.position.set(0.35,-0.38,-0.55);
    obj.rotation.set(0, Math.PI, 0);
    obj.traverse(c=>{ if(c.isMesh){ c.castShadow=false; }});
      camera.add(obj); flashlightModel=obj;
    loadingEl.textContent='El feneri yüklendi';
    setTimeout(()=> loadingEl.classList.add('hidden'), 600);
  }, undefined, ()=>{ loadingEl.classList.add('hidden'); });
}, undefined, ()=>{ loadingEl.classList.add('hidden'); });
// fallback timeout
setTimeout(()=> loadingEl.classList.add('hidden'), 3500);

// --- CANAVAR JOKER MODEL ---
const creature=new THREE.Group();
let jokerMesh=null;
let cBody,cHead,cLight;
cLight=new THREE.PointLight(0xff0000, 3.5, 7); cLight.position.set(0,1.1,0);
creature.add(cLight);
creature.position.set(6,0,-6); scene.add(creature);
// placeholder kutu silinecek, joker gelince gizle
const placeholder = new THREE.Mesh(new THREE.BoxGeometry(0.7,1.2,0.45), new THREE.MeshStandardMaterial({color:0x050507})); placeholder.position.y=1.0; creature.add(placeholder);
const phHead=new THREE.Mesh(new THREE.SphereGeometry(0.33,12,10), new THREE.MeshStandardMaterial({color:0x111111})); phHead.position.set(0,1.82,0.08); creature.add(phHead);
let jokerMixer=null;
// direkt OBJ - FBX kutu yapiyor diye iptal
const textureLoader=new THREE.TextureLoader();
const jokerTex=textureLoader.load('assets/models/joker.png');
  // fallback OBJ
  mtlLoader.load('assets/models/joker.mtl', (mtl)=>{
    mtl.preload();
    objLoader.setMaterials(mtl);
    objLoader.load('assets/models/joker.obj', (obj)=>{
      obj.scale.set(0.705,0.705,0.705);
      obj.position.set(0,0,0);
      obj.traverse(c=>{ if(c.isMesh){ c.castShadow=false; c.receiveShadow=false; }});
      creature.remove(placeholder); creature.remove(phHead);
      creature.add(obj); jokerMesh=obj;
      jokerMesh.userData.baseY=0;
    });
  });
let creatureState='patrol'; let patrolTarget=new THREE.Vector3((Math.random()-0.5)*50,0,(Math.random()-0.5)*50); let fleeUntil=0;

const pet=new THREE.Group();
let spiderMesh=null; let spiderMixer=null;
const pLight=new THREE.PointLight(0xff6600, 2.6, 7); pLight.position.set(0,0.5,0); pet.add(pLight);
pet.position.set(1.5,0,-41); pet.visible=false; scene.add(pet);
// orumcek yukle (OBJ + MTL, FBX alternatif)
const spiderMtlLoader=new MTLLoader();
spiderMtlLoader.setPath('assets/models/spider/');
spiderMtlLoader.load('spider.mtl', (mtl)=>{
  mtl.preload();
  const spiderObjLoader=new OBJLoader();
  spiderObjLoader.setMaterials(mtl);
  spiderObjLoader.setPath('assets/models/spider/');
  spiderObjLoader.load('spider.obj', (obj)=>{
    obj.scale.set(0.018,0.018,0.018);
    obj.position.set(0,0.35,0);
    obj.rotation.y=Math.PI;
    obj.traverse(c=>{ if(c.isMesh){ c.castShadow=false; c.receiveShadow=false; }});
    pet.add(obj); spiderMesh=obj;
  }, undefined, ()=> console.log('spider obj fail'));
}, undefined, ()=> console.log('spider mtl fail'));
// yedek FBX dene
const spiderFbxLoader=new FBXLoader();
spiderFbxLoader.load('assets/models/spider/spider.fbx', (fbx)=>{
  if(spiderMesh) return;
  fbx.scale.set(0.014,0.014,0.014);
  fbx.position.set(0,0.3,0);
  fbx.traverse(c=>{ if(c.isMesh){ c.castShadow=false; }});
  if(!spiderMesh){ pet.add(fbx); spiderMesh=fbx; }
  if(fbx.animations && fbx.animations.length>0){
    spiderMixer=new THREE.AnimationMixer(fbx);
    spiderMixer.clipAction(fbx.animations[0]).play();
  }
}, undefined, ()=>{});
let petState='sleep'; let petFleeUntil=0;

let battery=100, flashOn=true, collected=0, gameEnded=false;
let stamina=100, canSprint=true;
let gameStartTime=0;
flashlight.intensity=55; let lastDrain=performance.now();
const keys={};
addEventListener('keydown', e=>{ keys[e.code]=true; if(e.code==='KeyF'){ flashOn=!flashOn; flashlight.intensity=flashOn?70:0; playerFill.intensity=flashOn?0.5:0.12; if(flashlightModel) flashlightModel.visible=flashOn; if(flashOn) lastDrain=performance.now(); }});
addEventListener('keyup', e=> keys[e.code]=false);

// --- CARPISMA ---
function isBlocked(x,z){
  for(const b of colliders){ if(x>=b.minX && x<=b.maxX && z>=b.minZ && z<=b.maxZ) return true; }
  return false;
}
function tryMove(oldPos, newPos){
  // x ve z ayri kontrol, duvara surtunme
  let nx=newPos.x, nz=newPos.z;
  if(!isBlocked(nx, oldPos.z)) oldPos.x=nx; 
  if(!isBlocked(oldPos.x, nz)) oldPos.z=nz;
  // clamp dis duvar
  oldPos.x=Math.max(-44,Math.min(44,oldPos.x));
  oldPos.z=Math.max(-44,Math.min(44,oldPos.z));
}
function tryMoveEntity(pos, target, speed, dt){
  const dir=new THREE.Vector3().subVectors(target,pos); dir.y=0; const len=dir.length();
  if(len<0.01) return false;
  dir.normalize().multiplyScalar(speed*dt);
  const next=new THREE.Vector3(pos.x+dir.x, pos.y, pos.z+dir.z);
  if(!isBlocked(next.x, next.z)){ pos.x=next.x; pos.z=next.z; return true; }
  // dene sadece x
  const nextX=new THREE.Vector3(pos.x+dir.x, pos.y, pos.z);
  if(!isBlocked(nextX.x, nextX.z)){ pos.x=nextX.x; return true; }
  const nextZ=new THREE.Vector3(pos.x, pos.y, pos.z+dir.z);
  if(!isBlocked(nextZ.x, nextZ.z)){ pos.z=nextZ.z; return true; }
  // takildiysa yeni patrol hedefi
  patrolTarget.set((Math.random()-0.5)*50,0,(Math.random()-0.5)*50);
  return false;
}

function updateStamina(dt){
  const moving = keys['KeyW']||keys['KeyA']||keys['KeyS']||keys['KeyD'];
  const wantSprint = (keys['ShiftLeft']||keys['ShiftRight']) && moving && canSprint && stamina>0;
  if(wantSprint){ stamina=Math.max(0, stamina - 28*dt); if(stamina<=0){ stamina=0; canSprint=false; } }
  else { stamina=Math.min(100, stamina + 18*dt); if(stamina>22) canSprint=true; }
  const pct=Math.round(stamina); staminaBar.style.width=pct+'%'; staminaVal.textContent=pct+'%'; staminaBar.classList.toggle('low', stamina<28); return wantSprint;
}
function move(dt){
  const sprinting=updateStamina(dt);
  const speed=(sprinting?7.2:5.2)*dt;
  const old=controls.getObject().position.clone();
  const forward=new THREE.Vector3(), right=new THREE.Vector3();
  camera.getWorldDirection(forward); forward.y=0; forward.normalize();
  right.crossVectors(forward, new THREE.Vector3(0,1,0));
  // manuel delta hesapla
  let dx=0, dz=0;
  if(keys['KeyW']){ dx+=forward.x*speed; dz+=forward.z*speed; }
  if(keys['KeyS']){ dx-=forward.x*speed; dz-=forward.z*speed; }
  if(keys['KeyA']){ dx-=right.x*speed; dz-=right.z*speed; }
  if(keys['KeyD']){ dx+=right.x*speed; dz+=right.z*speed; }
  const next=new THREE.Vector3(old.x+dx, old.y, old.z+dz);
  tryMove(old, next);
  controls.getObject().position.copy(old);
}

function updatePickups(dt){
  pickups.forEach(g=>{
    if(g.userData.collected) return;
    g.userData.t+=dt*2.2; g.position.y=g.userData.baseY + Math.sin(g.userData.t)*0.2; g.rotation.y+=dt*1.4;
    const dist=g.position.distanceTo(controls.getObject().position);
    if(dist<1.7){
      g.userData.collected=true; g.visible=false; collected++;
      battery=Math.min(100, battery+10);
      pickupsEl.textContent=`${collected}/40`; batteryVal.textContent=battery.toFixed(0);
      if(collected>=40){ doorStatusEl.textContent='AÇIK'; doorStatusEl.classList.add('open'); openDoor(); }
      flashlight.intensity=80; setTimeout(()=> flashlight.intensity=flashOn?70:0,140);
      if(collected===3) creature.position.lerp(controls.getObject().position, 0.12);
    }
  });
}
function updateCreature(dt, now){
  const playerPos=controls.getObject().position, cPos=creature.position, dist=cPos.distanceTo(playerPos);
  let inLight=false;
  if(flashOn && dist<10){ const dir=new THREE.Vector3(); camera.getWorldDirection(dir); const toC=new THREE.Vector3().subVectors(cPos, camera.position).normalize(); if(dir.dot(toC)>0.78) inLight=true; }
  if(inLight){ creatureState='flee'; fleeUntil=now+900; }
  else if(now > fleeUntil){ const moving=keys['KeyW']||keys['KeyA']||keys['KeyS']||keys['KeyD']; const noise=moving || !flashOn; if(dist<18 && noise) creatureState='chase'; else creatureState='patrol'; }
  else creatureState='flee';
  let speed, target;
  if(creatureState==='flee'){ const away=new THREE.Vector3().subVectors(cPos, playerPos).normalize().multiplyScalar(7); target=new THREE.Vector3().addVectors(cPos, away); speed=3.8; }
  else if(creatureState==='chase'){ target=playerPos.clone(); speed=3.4 + collected*0.09 + (battery<30?1.0:0); }
  else { target=patrolTarget; speed=1.85; if(cPos.distanceTo(patrolTarget)<1.0) patrolTarget.set((Math.random()-0.5)*52,0,(Math.random()-0.5)*52); }
  if(target){
    const moved=tryMoveEntity(cPos, target, speed, dt);
    if(moved){
      const ang=Math.atan2(target.x - cPos.x, target.z - cPos.z);
      creature.rotation.y = ang;
    }
  }
  // yurume animasyonu
  if(jokerMixer) jokerMixer.update(dt);
  if(jokerMesh){
    const walkSpeed = creatureState==='chase'? 0.014 : 0.007;
    jokerMesh.rotation.z = Math.sin(now*walkSpeed*1.2)*0.12;
    jokerMesh.rotation.x = Math.sin(now*walkSpeed)*0.06;
    jokerMesh.position.y = Math.abs(Math.sin(now*walkSpeed*2))*0.18;
  } else cLight.position.y=1.1 + Math.sin(now*0.006)*(creatureState==='chase'?0.11:0.04);
  if(dist<6 && creatureState==='chase' && Math.random()<0.04) cLight.intensity=Math.random()*4+1;
  const hDistCre = Math.hypot(cPos.x - playerPos.x, cPos.z - playerPos.z);
  if(hDistCre<1.15 && !gameEnded) endGame(false);
}
function updatePet(dt, now){
  if(collected<10){ if(pet.visible) pet.visible=false; petState='sleep'; if(spiderMesh) spiderMesh.position.y=0.35 + Math.sin(now*0.002)*0.04; return; }
  if(!pet.visible){ pet.visible=true; petFleeUntil=now+400; showSpiderAlert(); }
  const playerPos=controls.getObject().position, pPos=pet.position, dist=pPos.distanceTo(playerPos);
  let inLight=false;
  if(flashOn && dist<9){ const dir=new THREE.Vector3(); camera.getWorldDirection(dir); const toP=new THREE.Vector3().subVectors(pPos, camera.position).normalize(); if(dir.dot(toP)>0.78) inLight=true; }
  if(inLight){ petState='flee'; petFleeUntil=now+700; }
  else if(now>petFleeUntil){ const moving=keys['KeyW']||keys['KeyA']||keys['KeyS']||keys['KeyD']; if(dist<16 && (moving || !flashOn)) petState='chase'; else petState='patrol'; }
  else petState='flee';
  let speed, target;
  if(petState==='flee'){ const away=new THREE.Vector3().subVectors(pPos, playerPos).normalize().multiplyScalar(6); target=new THREE.Vector3().addVectors(pPos, away); speed=4.5; }
  else if(petState==='chase'){ target=playerPos.clone(); speed=4.3; }
  else { target=new THREE.Vector3().copy(patrolTarget); speed=1.6; if(pPos.distanceTo(patrolTarget)<1.2) patrolTarget.set((Math.random()-0.5)*46,0,(Math.random()-0.5)*46); }
  if(target){ const moved=tryMoveEntity(pPos, target, speed, dt); if(moved){ const ang=Math.atan2(target.x - pPos.x, target.z - pPos.z); pet.rotation.y = ang; } }
  if(spiderMixer) spiderMixer.update(dt);
  if(spiderMesh){
    const s = petState==='chase'? 0.022 : 0.010;
    spiderMesh.position.y = 0.35 + Math.abs(Math.sin(now*s*1.8))*0.14;
    spiderMesh.rotation.z = Math.sin(now*s)*0.10;
  }
  const hDistPet = Math.hypot(pPos.x - playerPos.x, pPos.z - playerPos.z);
  if(hDistPet<1.05 && !gameEnded) endGame(false);
}
function checkWin(){
  if(collected>=40 && controls.getObject().position.distanceTo(doorFrame.position)<2.8) endGame(true);
  else if(collected<40 && controls.getObject().position.distanceTo(doorFrame.position)<2.4){ doorFrame.material.emissiveIntensity=1.6; setTimeout(()=> doorFrame.material.emissiveIntensity=0.8,180); }
}
let spiderAlertShown=false;
function showSpiderAlert(){
  if(spiderAlertShown) return;
  spiderAlertShown=true;
  spiderAlert.classList.remove('hidden');
  setTimeout(()=> spiderAlert.classList.add('hidden'), 5000);
}
function endGame(won){
  gameEnded=true; controls.unlock(); gameOverEl.classList.remove('hidden'); gameOverEl.classList.toggle('win', won); gameOverEl.classList.toggle('lose', !won);
  overlay.style.display='none'; bgm.pause(); bgmOpening.pause();
  if(!won){
    loseBgm.currentTime=0; loseBgm.volume=0.75; loseBgm.play().catch(()=>{});
  }
  const goIcon=document.getElementById('goIcon'), goSub=document.getElementById('goSub'), goStat1=document.getElementById('goStat1'), goStat2=document.getElementById('goStat2');
  const elapsed = gameStartTime ? Math.floor((performance.now()-gameStartTime)/1000) : 0;
  const mins=String(Math.floor(elapsed/60)).padStart(2,'0'), secs=String(elapsed%60).padStart(2,'0');
  if(goStat1) goStat1.textContent=`🔋 ${collected}/40 pil`;
  if(goStat2) goStat2.textContent=`⏱️ ${mins}:${secs} • 🔋 ${battery.toFixed(0)}%`;
  if(won){
    if(goIcon) goIcon.textContent='🚪✨';
    goTitle.textContent='KAÇTIN!';
    if(goSub) goSub.textContent='Karanlığı yendin — ışık seninleydi';
    goDesc.textContent=`40 pili toplayıp 90×90 evden canlı çıktın. Joker ve örümcek arkanda kaldı.`;
  } else {
    if(goIcon) goIcon.textContent='☠️';
    goTitle.textContent='YAKALANDIN';
    if(goSub) goSub.textContent='Karanlık seni yuttu';
    const wasPet = pet.position.distanceTo(controls.getObject().position) < creature.position.distanceTo(controls.getObject().position);
    goDesc.textContent = wasPet ? 'Örümcek bacakları ensende hissettin... Feneri ve staminayı idareli kullanmalıydın.' : 'Joker fenerini söndürdüğün an ensendeydi... Bir dahaki sefere ışığı kapatma.';
  }
}
let last=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  // flicker titreme
  flickerLights.forEach((l,i)=>{ l.intensity = 0.6 + Math.sin(now*0.001*(1+i*0.3))*0.4 + Math.random()*0.3; });
  if(flashlightModel){ flashlightModel.rotation.z = Math.sin(now*0.004)*0.02; }
  if(controls.isLocked && !gameEnded){
    move(dt);
    if(flashOn && now-lastDrain>85){ battery=Math.max(0,battery-0.38); batteryVal.textContent=battery.toFixed(0); if(battery<=0){ flashlight.intensity=0; flashOn=false; playerFill.intensity=0.12; if(flashlightModel) flashlightModel.visible=false; } lastDrain=now; if(battery<20 && Math.random()<0.07) flashlight.intensity=Math.random()<0.5?0:14; }
    updatePickups(dt); updateCreature(dt, now); updatePet(dt, now); checkWin();
  } else {
    if(!gameEnded) updateStamina(dt);
    pickups.forEach(g=>{ if(!g.userData.collected) g.rotation.y+=0.006; });
  }
  if(battery<25) scene.fog=new THREE.Fog(0x1a0505, 6, 22); else scene.fog=new THREE.Fog(0x0f0505, 12, 42);
  if(!gameEnded && performance.now()%3000<100) cLight.intensity=4;
  renderer.render(scene, camera);
}
animate(performance.now());
addEventListener('resize', ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
