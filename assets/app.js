import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

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

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x020205, 12, 40);
scene.background = new THREE.Color(0x020205);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 1.7, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

function tryLock(){ try{ controls.lock(); } catch(e){ console.error(e); overlay.style.display='none'; } }
startBtn.addEventListener('click', e=>{ e.stopPropagation(); tryLock(); });
overlay.addEventListener('click', e=>{ if(e.target===overlay) tryLock(); });
restartBtn.onclick = () => location.reload();
controls.addEventListener('lock', () => { overlay.style.display='none'; gameOverEl.classList.add('hidden'); });
controls.addEventListener('unlock', () => { if(!gameEnded) overlay.style.display='flex'; });
document.addEventListener('click', ()=>{ if(overlay.style.display==='none' && !controls.isLocked && !gameEnded) tryLock(); });

scene.add(new THREE.AmbientLight(0x1a1a2e, 0.18));
const flashlight = new THREE.SpotLight(0xfff6cc, 55, 18, Math.PI/6, 0.35, 1.2);
flashlight.position.set(0, -0.2, 0);
flashlight.castShadow = true; flashlight.shadow.mapSize.set(1024,1024);
flashlight.target.position.set(0, -0.2, -1);
camera.add(flashlight); camera.add(flashlight.target); scene.add(camera);
const playerFill = new THREE.PointLight(0x334155, 0.6, 4); playerFill.position.set(0,0,0); camera.add(playerFill);

// harita 90x90
const floor = new THREE.Mesh(new THREE.PlaneGeometry(90,90), new THREE.MeshStandardMaterial({color:0x0f0f14, roughness:0.9}));
floor.rotation.x = -Math.PI/2; floor.receiveShadow=true; scene.add(floor);
const wallMat = new THREE.MeshStandardMaterial({color:0x1e1e28, roughness:0.85});
function wall(w,h,x,y,z,ry=0){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.3), wallMat); m.position.set(x,y,z); m.rotation.y=ry; m.castShadow=true; m.receiveShadow=true; scene.add(m); return m; }
wall(90,5,0,2.5,-45); wall(90,5,0,2.5,45); wall(90,5,-45,2.5,0,Math.PI/2); wall(90,5,45,2.5,0,Math.PI/2);
const crateMat = new THREE.MeshStandardMaterial({color:0x2a2a3a});
for(let i=0;i<34;i++){
  const b=new THREE.Mesh(new THREE.BoxGeometry(0.8+Math.random()*1.6, 1+Math.random()*1.6, 0.8+Math.random()*1.6), i%2?wallMat:crateMat);
  b.position.set((Math.random()-0.5)*78, b.geometry.parameters.height/2, (Math.random()-0.5)*78);
  if(b.position.distanceTo(new THREE.Vector3(0,0,10))<5) b.position.z+=10;
  b.castShadow=true; b.receiveShadow=true; scene.add(b);
}

const doorMat = new THREE.MeshStandardMaterial({color:0x7f1d1d, emissive:0x450a0a, emissiveIntensity:0.8});
const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6,3.2,0.4), doorMat);
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
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.52,12), new THREE.MeshStandardMaterial({color:0xfacc15, emissive:0xb45309, emissiveIntensity:0.65, roughness:0.4}));
  body.castShadow=true;
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.09,12), new THREE.MeshStandardMaterial({color:0x1f2937})); cap.position.y=0.29; body.add(cap);
  const light=new THREE.PointLight(0xfacc15, 2.4, 6); light.position.y=0.3;
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.35,0.42,16), new THREE.MeshBasicMaterial({color:0xfacc15, side:THREE.DoubleSide, transparent:true, opacity:0.35})); ring.rotation.x=Math.PI/2; ring.position.y=-0.1;
  g.add(body,light,ring); g.position.set(x,0.48,z); g.userData={ collected:false, baseY:0.48, t:Math.random()*6 }; pickupGroup.add(g); pickups.push(g);
}
// 40 pil - dev harita daginik
[
 [-42,-42],[42,-42],[-42,42],[42,42],[0,-38],[-20,34],[22,36],[-36,-18],[36,-20],[-38,10],
 [38,12],[-10,-30],[10,-32],[-30,22],[30,24],[-18,-28],[18,-26],[-42,0],[42,2],[0,38],
 [-34,34],[34,-34],[-26,-10],[26,10],[-12,18],[12,20],[-36,28],[36,28],[-8,-42],[8,-42],
 [-14,40],[14,40],[-28,-32],[28,-32],[-6,30],[6,32],[-18,0],[18,0],[0,12],[0,-12]
].forEach(([x,z])=> spawnBattery(x,z));

const creature=new THREE.Group();
const cBody=new THREE.Mesh(new THREE.BoxGeometry(0.7,1.2,0.45), new THREE.MeshStandardMaterial({color:0x050507, roughness:1})); cBody.position.y=1.0;
const cHead=new THREE.Mesh(new THREE.SphereGeometry(0.33,16,12), new THREE.MeshStandardMaterial({color:0x0a0a0a})); cHead.position.set(0,1.82,0.08);
const eyeMat=new THREE.MeshStandardMaterial({color:0xff0000, emissive:0xff0000, emissiveIntensity:3});
const eye1=new THREE.Mesh(new THREE.SphereGeometry(0.07,10,8), eyeMat); eye1.position.set(-0.13,1.85,0.26); const eye2=eye1.clone(); eye2.position.x=0.13;
const cLight=new THREE.PointLight(0xff0000, 3.5, 7); cLight.position.set(0,1.1,0);
creature.add(cBody,cHead,eye1,eye2,cLight); creature.position.set(6,0,-6); scene.add(creature);
let creatureState='patrol'; let patrolTarget=new THREE.Vector3((Math.random()-0.5)*50,0,(Math.random()-0.5)*50); let fleeUntil=0;

const pet=new THREE.Group();
const pBody=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.65,0.35), new THREE.MeshStandardMaterial({color:0x1a0a0a})); pBody.position.y=0.62;
const pHead=new THREE.Mesh(new THREE.SphereGeometry(0.23,12,10), new THREE.MeshStandardMaterial({color:0x1a0a0a})); pHead.position.set(0,1.05,0.05);
const pEyeMat=new THREE.MeshStandardMaterial({color:0xffaa00, emissive:0xff6a00, emissiveIntensity:3});
const pEye1=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8), pEyeMat); pEye1.position.set(-0.09,1.07,0.18); const pEye2=pEye1.clone(); pEye2.position.x=0.09;
const pLight=new THREE.PointLight(0xff6a00, 2.8, 6); pLight.position.set(0,0.7,0);
pet.add(pBody,pHead,pEye1,pEye2,pLight); pet.position.set(1.5,0,-41); pet.visible=false; scene.add(pet);
let petState='sleep'; let petFleeUntil=0;

let battery=100, flashOn=true, collected=0, gameEnded=false;
let stamina=100, canSprint=true;
flashlight.intensity=55; let lastDrain=performance.now();
const keys={};
addEventListener('keydown', e=>{ keys[e.code]=true; if(e.code==='KeyF'){ flashOn=!flashOn; flashlight.intensity=flashOn?55:0; playerFill.intensity=flashOn?0.6:0.15; if(flashOn) lastDrain=performance.now(); }});
addEventListener('keyup', e=> keys[e.code]=false);

function clampPlayer(){ const p=controls.getObject().position; p.x=Math.max(-44,Math.min(44,p.x)); p.z=Math.max(-44,Math.min(44,p.z)); p.y=1.7; }

function updateStamina(dt){
  const moving = keys['KeyW']||keys['KeyA']||keys['KeyS']||keys['KeyD'];
  const wantSprint = (keys['ShiftLeft']||keys['ShiftRight']) && moving && canSprint && stamina>0;
  if(wantSprint){
    stamina = Math.max(0, stamina - 28*dt); // ~3.5sn kosu
    if(stamina<=0){ stamina=0; canSprint=false; }
  } else {
    stamina = Math.min(100, stamina + 18*dt); // durunca doluyor
    if(stamina>22) canSprint=true;
  }
  const pct = Math.round(stamina);
  staminaBar.style.width = pct+'%';
  staminaVal.textContent = pct+'%';
  staminaBar.classList.toggle('low', stamina<28);
  return wantSprint;
}

function move(dt){
  const sprinting = updateStamina(dt);
  const speed = (sprinting? 7.2 : 5.2) * dt;
  if(keys['KeyW']) controls.moveForward(speed);
  if(keys['KeyS']) controls.moveForward(-speed);
  if(keys['KeyA']) controls.moveRight(-speed);
  if(keys['KeyD']) controls.moveRight(speed);
  clampPlayer();
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
      flashlight.intensity=70; setTimeout(()=> flashlight.intensity=flashOn?55:0,140);
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
  if(target){ const dir=new THREE.Vector3().subVectors(target,cPos); dir.y=0; const len=dir.length(); if(len>0.01){ dir.normalize().multiplyScalar(speed*dt); cPos.add(dir); if(len>0.05) creature.lookAt(target.x, cPos.y, target.z); } }
  cBody.position.y=1.0 + Math.sin(now*0.006)*(creatureState==='chase'?0.11:0.04);
  if(dist<6 && creatureState==='chase' && Math.random()<0.04) cLight.intensity=Math.random()*4+1;
  const hDistCre = Math.hypot(cPos.x - playerPos.x, cPos.z - playerPos.z);
  if(hDistCre<1.05 && !gameEnded) endGame(false);
}
function updatePet(dt, now){
  if(collected<10){ if(pet.visible) pet.visible=false; petState='sleep'; pBody.position.y=0.62 + Math.sin(now*0.002)*0.04; return; }
  if(!pet.visible){ pet.visible=true; petFleeUntil=now+400; }
  const playerPos=controls.getObject().position, pPos=pet.position, dist=pPos.distanceTo(playerPos);
  let inLight=false;
  if(flashOn && dist<9){ const dir=new THREE.Vector3(); camera.getWorldDirection(dir); const toP=new THREE.Vector3().subVectors(pPos, camera.position).normalize(); if(dir.dot(toP)>0.78) inLight=true; }
  if(inLight){ petState='flee'; petFleeUntil=now+700; }
  else if(now>petFleeUntil){ const moving=keys['KeyW']||keys['KeyA']||keys['KeyS']||keys['KeyD']; if(dist<16 && (moving || !flashOn)) petState='chase'; else petState='patrol'; }
  else petState='flee';
  let speed, target;
  if(petState==='flee'){ const away=new THREE.Vector3().subVectors(pPos, playerPos).normalize().multiplyScalar(6); target=new THREE.Vector3().addVectors(pPos, away); speed=4.2; }
  else if(petState==='chase'){ target=playerPos.clone(); speed=4.0; }
  else { target=new THREE.Vector3().copy(patrolTarget); speed=1.4; if(pPos.distanceTo(patrolTarget)<1.2) patrolTarget.set((Math.random()-0.5)*46,0,(Math.random()-0.5)*46); }
  if(target){ const dir=new THREE.Vector3().subVectors(target,pPos); dir.y=0; const len=dir.length(); if(len>0.01){ dir.normalize().multiplyScalar(speed*dt); pPos.add(dir); if(len>0.05) pet.lookAt(target.x, pPos.y, target.z); } }
  pBody.position.y=0.62 + Math.sin(now*0.008)*(petState==='chase'?0.09:0.03);
  const hDistPet = Math.hypot(pPos.x - playerPos.x, pPos.z - playerPos.z);
  if(hDistPet<0.95 && !gameEnded) endGame(false);
}
function checkWin(){
  if(collected>=40 && controls.getObject().position.distanceTo(doorFrame.position)<2.8) endGame(true);
  else if(collected<40 && controls.getObject().position.distanceTo(doorFrame.position)<2.4){ doorFrame.material.emissiveIntensity=1.6; setTimeout(()=> doorFrame.material.emissiveIntensity=0.8,180); }
}
function endGame(won){
  gameEnded=true; controls.unlock(); gameOverEl.classList.remove('hidden'); overlay.style.display='none';
  if(won){ goTitle.textContent='KAÇTIN! 🎉'; goTitle.style.color='#22c55e'; goDesc.textContent=`${collected}/40 pil ile kaçtın! Kalan pil ${battery.toFixed(0)}%`; }
  else { goTitle.textContent='YAKALANDIN ☠️'; goTitle.style.color='#ef4444'; goDesc.textContent='Feneri ve staminayı idareli kullan!'; }
}
let last=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  if(controls.isLocked && !gameEnded){
    move(dt);
    if(flashOn && now-lastDrain>85){ battery=Math.max(0,battery-0.38); batteryVal.textContent=battery.toFixed(0); if(battery<=0){ flashlight.intensity=0; flashOn=false; playerFill.intensity=0.12; } lastDrain=now; if(battery<20 && Math.random()<0.07) flashlight.intensity=Math.random()<0.5?0:14; }
    updatePickups(dt); updateCreature(dt, now); updatePet(dt, now); checkWin();
  } else {
    // stamina de dolmaya devam etsin pause da bile hafif
    if(!gameEnded) updateStamina(dt);
    pickups.forEach(g=>{ if(!g.userData.collected) g.rotation.y+=0.006; });
  }
  if(battery<25) scene.fog=new THREE.Fog(0x1a0505, 6, 22); else scene.fog=new THREE.Fog(0x020205, 12, 40);
  if(!gameEnded && performance.now()%3000<100) cLight.intensity=4;
  renderer.render(scene, camera);
}
animate(performance.now());
addEventListener('resize', ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
