import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const overlay = document.getElementById('overlay');
const batteryVal = document.getElementById('batteryVal');
const startBtn = document.getElementById('startBtn');

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x020205, 8, 28);
scene.background = new THREE.Color(0x020205);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 1.7, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

startBtn.onclick = () => controls.lock();
controls.addEventListener('lock', () => overlay.style.display = 'none');
controls.addEventListener('unlock', () => overlay.style.display = 'flex');

// lights
scene.add(new THREE.AmbientLight(0x1a1a2e, 0.35));
const flashlight = new THREE.SpotLight(0xfff6cc, 40, 22, Math.PI/5, 0.3, 1);
flashlight.position.set(0, 0, 0);
flashlight.castShadow = true;
camera.add(flashlight);
scene.add(camera);

// floor + walls (simple room)
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30,30), new THREE.MeshStandardMaterial({color:0x0f0f14, roughness:0.9}));
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
const wallMat = new THREE.MeshStandardMaterial({color:0x1e1e28, roughness:0.8});
function wall(w,h,x,y,z,ry=0){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.3), wallMat); m.position.set(x,y,z); m.rotation.y=ry; m.castShadow=true; m.receiveShadow=true; scene.add(m); return m; }
wall(30,5,0,2.5,-15); wall(30,5,0,2.5,15); wall(30,5,-15,2.5,0,Math.PI/2); wall(30,5,15,2.5,0,Math.PI/2);
// inner pillars for horror
for(let i=0;i<6;i++){ const b=new THREE.Mesh(new THREE.BoxGeometry(0.6,3,0.6), wallMat); b.position.set((Math.random()-0.5)*20,1.5,(Math.random()-0.5)*20); scene.add(b); }

// battery logic
let battery = 100;
let flashOn = true;
let lastDrain = performance.now();
addEventListener('keydown', e=>{
  if(e.code==='KeyF'){ flashOn=!flashOn; flashlight.intensity = flashOn?40:0; }
});
const keys={};
addEventListener('keydown', e=> keys[e.code]=true);
addEventListener('keyup', e=> keys[e.code]=false);

let vel = new THREE.Vector3();
function move(dt){
  const speed = 4.2 * dt;
  if(keys['KeyW']) controls.moveForward(speed);
  if(keys['KeyS']) controls.moveForward(-speed);
  if(keys['KeyA']) controls.moveRight(-speed);
  if(keys['KeyD']) controls.moveRight(speed);
}

let last=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  const dt = (now-last)/1000; last=now;
  if(controls.isLocked){
    move(dt);
    // drain battery when flashlight on
    if(flashOn && now - lastDrain > 180){
      battery = Math.max(0, battery - 0.05);
      batteryVal.textContent = battery.toFixed(0);
      if(battery<=0){ flashlight.intensity=0; flashOn=false; }
      lastDrain = now;
      // flicker under 20%
      if(battery<20 && Math.random()<0.04) flashlight.intensity = Math.random()<0.5?0:18;
    }
  }
  renderer.render(scene, camera);
}
animate(performance.now());

addEventListener('resize', ()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
