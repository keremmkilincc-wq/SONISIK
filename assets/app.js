import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const overlay = document.getElementById('overlay');
const gameOverEl = document.getElementById('gameOver');
const goTitle = document.getElementById('goTitle');
const goDesc = document.getElementById('goDesc');
const batteryVal = document.getElementById('batteryVal');
const pickupsEl = document.getElementById('pickups');
const doorStatusEl = document.getElementById('doorStatus');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x020205, 8, 28);
scene.background = new THREE.Color(0x020205);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 1.7, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

function tryLock(){
  // must be called from user gesture
  try{ controls.lock(); } catch(e){ console.error('lock fail',e); overlay.style.display='none'; }
}
startBtn.addEventListener('click', (e)=>{ e.stopPropagation(); tryLock(); });
overlay.addEventListener('click', (e)=>{ if(e.target===overlay) tryLock(); });
restartBtn.onclick = () => location.reload();
controls.addEventListener('lock', () => { overlay.style.display = 'none'; gameOverEl.classList.add('hidden'); console.log('locked'); });
controls.addEventListener('unlock', () => { if(!gameEnded) overlay.style.display = 'flex'; console.log('unlocked'); });
document.addEventListener('click', ()=>{
  // fallback: canvas click also locks if game started
  if(overlay.style.display==='none' && !controls.isLocked && !gameEnded) tryLock();
});

// lights
scene.add(new THREE.AmbientLight(0x1a1a2e, 0.35));
const flashlight = new THREE.SpotLight(0xfff6cc, 42, 20, Math.PI/5, 0.3, 1);
flashlight.castShadow = true;
flashlight.shadow.mapSize.set(1024,1024);
camera.add(flashlight);
scene.add(camera);

// floor
const floor = new THREE.Mesh(new THREE.PlaneGeometry(36,36), new THREE.MeshStandardMaterial({color:0x0f0f14, roughness:0.9}));
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);

// walls
const wallMat = new THREE.MeshStandardMaterial({color:0x1e1e28, roughness:0.8});
function wall(w,h,x,y,z,ry=0){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.3), wallMat); m.position.set(x,y,z); m.rotation.y=ry; m.castShadow=true; m.receiveShadow=true; scene.add(m); return m; }
wall(36,5,0,2.5,-18); wall(36,5,0,2.5,18); wall(36,5,-18,2.5,0,Math.PI/2); wall(36,5,18,2.5,0,Math.PI/2);
// inner pillars + crates
const crateMat = new THREE.MeshStandardMaterial({color:0x2a2a3a});
for(let i=0;i<10;i++){
  const b=new THREE.Mesh(new THREE.BoxGeometry(0.7+Math.random()*1, 1+Math.random()*1.2, 0.7+Math.random()*1), i%2?wallMat:crateMat);
  b.position.set((Math.random()-0.5)*28, b.geometry.parameters.height/2, (Math.random()-0.5)*28);
  if(b.position.distanceTo(new THREE.Vector3(0,0,6))<4) b.position.z+=6;
  b.castShadow=true; b.receiveShadow=true; scene.add(b);
}

// Door - north wall center
const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4,3,0.4), new THREE.MeshStandardMaterial({color:0x22c55e, emissive:0x14532d, emissiveIntensity:0.6}));
doorFrame.position.set(0,1.5,-17.85);
scene.add(doorFrame);
const doorLight = new THREE.PointLight(0x22c55e, 6, 8);
doorLight.position.set(0,1.5,-16.5); scene.add(doorLight);
const doorText = (()=>{ const c=document.createElement('canvas'); c.width=256; c.height=64; const g=c.getContext('2d'); g.fillStyle='#22c55e'; g.font='bold 32px sans-serif'; g.fillText('ÇIKIŞ',70,42); const t=new THREE.CanvasTexture(c); const m=new THREE.SpriteMaterial({map:t}); const s=new THREE.Sprite(m); s.scale.set(2,0.5,1); s.position.set(0,2.9,-17); scene.add(s); return s; })();

// Battery pickups
const pickups = [];
const pickupGroup = new THREE.Group(); scene.add(pickupGroup);
function spawnBattery(x,z){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.5,12), new THREE.MeshStandardMaterial({color:0xfacc15, emissive:0xb45309, emissiveIntensity:0.7, roughness:0.4}));
  body.castShadow=true;
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.08,12), new THREE.MeshStandardMaterial({color:0x1f2937}));
  cap.position.y=0.28; body.add(cap);
  const light=new THREE.PointLight(0xfacc15, 2.2, 5); light.position.y=0.3;
  g.add(body); g.add(light);
  g.position.set(x,0.45,z);
  g.userData={ collected:false, baseY:0.45, t:Math.random()*Math.PI*2 };
  pickupGroup.add(g); pickups.push(g);
}
const batteryPos=[[ -10,-10],[10,-8],[-12,10],[11,11],[0,-6]];
batteryPos.forEach(([x,z])=> spawnBattery(x,z));

// Creature
const creature = new THREE.Group();
const cBody=new THREE.Mesh(new THREE.CapsuleGeometry(0.35,1.0,4,10), new THREE.MeshStandardMaterial({color:0x0a0a0a, roughness:0.9}));
cBody.position.y=1.0;
const cHead=new THREE.Mesh(new THREE.SphereGeometry(0.32,16,12), new THREE.MeshStandardMaterial({color:0x111111}));
cHead.position.set(0,1.75,0.1);
const eyeMat=new THREE.MeshStandardMaterial({color:0xff0000, emissive:0xff0000, emissiveIntensity:2});
const eye1=new THREE.Mesh(new THREE.SphereGeometry(0.06,8,8), eyeMat); eye1.position.set(-0.12,1.78,0.28);
const eye2=eye1.clone(); eye2.position.x=0.12;
const cLight=new THREE.PointLight(0xff0000, 1.8, 4); cLight.position.set(0,1.2,0);
creature.add(cBody,cHead,eye1,eye2,cLight);
creature.position.set(12,0,-12);
scene.add(creature);
let creatureState='patrol'; // patrol, chase, flee
let patrolTarget=new THREE.Vector3((Math.random()-0.5)*20,(0),(Math.random()-0.5)*20);
let fleeUntil=0;
let lastCreatureGrowl=0;

// State
let battery = 100;
let flashOn = true;
let collected = 0;
let gameEnded=false;
flashlight.intensity=42;
let lastDrain=performance.now();
const keys={};
addEventListener('keydown', e=>{
  keys[e.code]=true;
  if(e.code==='KeyF'){ flashOn=!flashOn; flashlight.intensity=flashOn?42:0; if(flashOn) lastDrain=performance.now(); }
});
addEventListener('keyup', e=> keys[e.code]=false);

function clampPlayer(){
  const p=controls.getObject().position;
  p.x=Math.max(-17,Math.min(17,p.x));
  p.z=Math.max(-17,Math.min(17,p.z));
  p.y=1.7;
}

function move(dt){
  const sprint = keys['ShiftLeft']||keys['ShiftRight'] ? 1.65 : 1;
  const speed = 3.8 * sprint * dt;
  if(keys['KeyW']) controls.moveForward(speed);
  if(keys['KeyS']) controls.moveForward(-speed);
  if(keys['KeyA']) controls.moveRight(-speed);
  if(keys['KeyD']) controls.moveRight(speed);
  clampPlayer();
}

function updatePickups(dt, now){
  pickups.forEach(g=>{
    if(g.userData.collected) return;
    g.userData.t+= dt*2;
    g.position.y = g.userData.baseY + Math.sin(g.userData.t)*0.18;
    g.rotation.y += dt*1.2;
    const dist = g.position.distanceTo(controls.getObject().position);
    if(dist<1.6){
      g.userData.collected=true;
      g.visible=false;
      collected++;
      battery=Math.min(100, battery+38);
      pickupsEl.textContent=`${collected}/5`;
      batteryVal.textContent=battery.toFixed(0);
      if(collected>=5){ doorStatusEl.textContent='AÇIK'; doorStatusEl.classList.add('open'); doorFrame.material.emissiveIntensity=1.2; doorLight.intensity=10; }
      // flash feedback
      flashlight.intensity=60; setTimeout(()=> flashlight.intensity=flashOn?42:0,120);
    }
  });
}

function updateCreature(dt, now){
  const playerPos=controls.getObject().position;
  const cPos=creature.position;
  const dist=cPos.distanceTo(playerPos);
  // light stun: if flash on and looking at creature and close
  let inLight=false;
  if(flashOn && dist<9){
    const dir=new THREE.Vector3(); camera.getWorldDirection(dir);
    const toC=new THREE.Vector3().subVectors(cPos, camera.position).normalize();
    const ang=dir.dot(toC);
    if(ang>0.82){ // ~35deg cone
      // raycast simple: no wall check for now
      inLight=true;
    }
  }
  if(inLight){
    creatureState='flee'; fleeUntil=now+1200;
  } else if(now > fleeUntil){
    const moving = keys['KeyW']||keys['KeyA']||keys['KeyS']||keys['KeyD'];
    const noise = moving || !flashOn;
    if(dist<13 && noise){
      creatureState='chase';
    } else {
      creatureState='patrol';
    }
  } else {
    creatureState='flee';
  }

  let speed=0;
  let target=null;
  if(creatureState==='flee'){
    const away=new THREE.Vector3().subVectors(cPos, playerPos).normalize().multiplyScalar(6);
    target=new THREE.Vector3().addVectors(cPos, away);
    speed=3.2;
    creature.children.forEach(c=> c.material && (c.material.emissiveIntensity=0.6));
  } else if(creatureState==='chase'){
    target=playerPos.clone(); speed=1.85 + (collected*0.07); // gets faster
  } else {
    target=patrolTarget; speed=1.0;
    if(cPos.distanceTo(patrolTarget)<1.2){
      patrolTarget.set((Math.random()-0.5)*22,0,(Math.random()-0.5)*22);
    }
  }
  if(target){
    const dir=new THREE.Vector3().subVectors(target, cPos); dir.y=0;
    const len=dir.length(); if(len>0.01){ dir.normalize().multiplyScalar(speed*dt); cPos.add(dir);
      // face movement
      if(len>0.05) creature.lookAt(target.x, creature.position.y, target.z);
    }
  }
  // bob
  cBody.position.y=1.0 + Math.sin(now*0.005)*(creatureState==='chase'?0.08:0.03);
  // catch
  if(dist<1.25 && !gameEnded){
    endGame(false);
  }
}

function checkWin(){
  if(collected>=5 && controls.getObject().position.distanceTo(doorFrame.position)<2.2){
    endGame(true);
  }
}

function endGame(won){
  gameEnded=true;
  controls.unlock();
  gameOverEl.classList.remove('hidden');
  overlay.style.display='none';
  if(won){
    goTitle.textContent='KAÇTIN! 🎉';
    goTitle.style.color='#22c55e';
    goDesc.textContent=`${collected}/5 pil ile çıkışa ulaştın. Pil: ${battery.toFixed(0)}%`;
  } else {
    goTitle.textContent='YAKALANDIN ☠️';
    goTitle.style.color='#ef4444';
    goDesc.textContent='Yaratık karanlıkta seni buldu. Fenerini açık tutmalıydın!';
  }
}

let last=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  if(controls.isLocked && !gameEnded){
    move(dt);
    if(flashOn && now-lastDrain>160){
      battery=Math.max(0,battery-0.045);
      batteryVal.textContent=battery.toFixed(0);
      if(battery<=0){ flashlight.intensity=0; flashOn=false; }
      lastDrain=now;
      if(battery<18 && Math.random()<0.05) flashlight.intensity=Math.random()<0.5?0:16;
    }
    updatePickups(dt, now);
    updateCreature(dt, now);
    checkWin();
  } else {
    // still animate pickups bob when paused for visual
    pickups.forEach(g=>{ if(!g.userData.collected){ g.rotation.y+=0.005; }});
  }
  // low battery vignette via fog
  if(battery<30) scene.fog = new THREE.Fog(0x1a0505, 6, 22); else scene.fog = new THREE.Fog(0x020205, 8, 28);
  renderer.render(scene, camera);
}
animate(performance.now());

addEventListener('resize', ()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
