import * as THREE from "three";

// Factory function to build and return the composite 3D car model
export function createCar() {
  const car = new THREE.Group();

  // Car body
  const bodyGeometry = new THREE.BoxGeometry(4, 1, 2);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    roughness: 0.4,
    metalness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 1, 0);
  car.add(body);

  // Car cabin
  const cabinGeometry = new THREE.BoxGeometry(2.5, 1, 1.9);
  const cabinMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3333,
    roughness: 0.4,
    metalness: 0.3,
  });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.set(0, 1.8, 0);
  car.add(cabin);

  // Windows Material (Glass)
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0xa5d8ee,
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.7,
  });

  // Front Window (Windshield)
  const frontWindowGeometry = new THREE.BoxGeometry(0.08, 0.65, 1.6);
  const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
  frontWindow.position.set(1.25, 1.85, 0);
  car.add(frontWindow);

  // Back Window
  const backWindowGeometry = new THREE.BoxGeometry(0.08, 0.65, 1.6);
  const backWindow = new THREE.Mesh(backWindowGeometry, windowMaterial);
  backWindow.position.set(-1.25, 1.85, 0);
  car.add(backWindow);

  // Side Windows
  const sideWindowGeometry = new THREE.BoxGeometry(0.08, 0.6, 0.9);

  // Front-Left Side Window
  const frontLeftSideWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  frontLeftSideWindow.position.set(0.5, 1.85, 1);
  frontLeftSideWindow.rotation.y = Math.PI / 2;
  car.add(frontLeftSideWindow);

  // Front-Right Side Window
  const frontRightSideWindow = frontLeftSideWindow.clone();
  frontRightSideWindow.position.z = -1;
  car.add(frontRightSideWindow);

  // Rear-Left Side Window
  const rearLeftSideWindow = frontLeftSideWindow.clone();
  rearLeftSideWindow.position.set(-0.5, 1.85, 1);
  car.add(rearLeftSideWindow);

  // Rear-Right Side Window
  const rearRightSideWindow = rearLeftSideWindow.clone();
  rearRightSideWindow.position.z = -1;
  car.add(rearRightSideWindow);

  // Car wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.65, 0.65, 0.45, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.8,
  });

  function createWheel(x, z) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.x = -Math.PI / 2;
    wheel.position.set(x, 0.65, z);
    car.add(wheel);
    return wheel;
  }

  const frontLeftWheel = createWheel(1, 1);
  const frontRightWheel = createWheel(1, -1);
  const rearLeftWheel = createWheel(-1, 1);
  const rearRightWheel = createWheel(-1, -1);

  // Headlights
  const lightGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.1);
  const lightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffaa,
    emissive: 0xffff00,
    emissiveIntensity: 1,
  });

  const leftHeadlight = new THREE.Mesh(lightGeometry, lightMaterial);
  leftHeadlight.rotation.z = -Math.PI / 2;
  leftHeadlight.position.set(2.05, 1.1, 0.65);
  car.add(leftHeadlight);

  const rightHeadlight = leftHeadlight.clone();
  rightHeadlight.position.z = -0.65;
  car.add(rightHeadlight);

  // Taillights
  const tailLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.8,
  });
  const leftTailLight = new THREE.Mesh(lightGeometry, tailLightMaterial);
  leftTailLight.rotation.z = Math.PI / 2;
  leftTailLight.position.set(-2.05, 1.1, 0.65);
  car.add(leftTailLight);

  const rightTailLight = leftTailLight.clone();
  rightTailLight.position.z = -0.65;
  car.add(rightTailLight);

  return {
    car,
    wheels: { frontLeftWheel, frontRightWheel, rearLeftWheel, rearRightWheel },
  };
}
