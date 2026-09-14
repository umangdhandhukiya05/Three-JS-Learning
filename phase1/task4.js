import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color("white");

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

camera.position.set(8, 5, 10);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Orbit Controls: Mouse interaction (rotate, zoom, pan)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// const axisHelper = new THREE.AxesHelper();
// axisHelper.scale.set(3, 3, 3);
// scene.add(axisHelper);

//ambient light
const ambientLight = new THREE.AmbientLight("orange", 2);
scene.add(ambientLight);

// Directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

//surface
const groundGeometry = new THREE.PlaneGeometry(300, 10);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x444444,
  side: THREE.DoubleSide,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
scene.add(ground);

import { createCar } from "./car.js";

// Instantiate car for Task 4
const { car, wheels } = createCar();
car.position.set(0, 0, 0);
car.scale.set(2.5, 2.5, 2.5);
scene.add(car);

function animate() {
  requestAnimationFrame(animate);

  // Update controls for damping effect
  controls.update();

  // Rotate wheels
  frontLeftWheel.rotation.y += 0.05;
  frontRightWheel.rotation.y += 0.05;
  rearLeftWheel.rotation.y += 0.05;
  rearRightWheel.rotation.y += 0.05;
  //   car.rotation.y += 0.05

  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
