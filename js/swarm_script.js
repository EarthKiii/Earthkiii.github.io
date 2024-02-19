import RAPIER from 'rapier3d-compat';

var scene, camera, renderer, core, world, boxCollider;

const coreCircle = new THREE.Spherical(2);
const coreCircleVect = new THREE.Vector3();
const coreRotation = new THREE.Euler(45, 45, 45);

const center = new THREE.Vector3(0, 0, 0);
const GFORCE = 6.67408e-11;
const sqrtBallAmount = 40;
const spheresBodies = new Array();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

const ballGeometry = new THREE.SphereGeometry(0.1, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xAAFF00 }); //MeshLambertMaterial

// Create the Three.js scene
function initGraphics() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x232428);

  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
  camera.position.set(0, -5, 0);
  camera.lookAt(center);
  scene.add(camera);

  const pointLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
  pointLight.castShadow = true;
  camera.add(pointLight);


  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("swarm-container"),
    alpha: true
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

function createBoxCore(pos) {
  const coreConfig = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Fixed);
  coreConfig.setTranslation(pos.x, pos.y, pos.z);
  core = world.createRigidBody(coreConfig);
  const boxColliderDesc = RAPIER.ColliderDesc.cuboid(0.6, 0.6, 0.6).setMass(2.0).setRestitution(0.01).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  boxCollider = world.createCollider(boxColliderDesc, core);
  core.setRotation(new THREE.Quaternion(0, 0, 0, 0), true);
}

function createSphere(pos) {
  const bodyConfig = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic);
  bodyConfig.setTranslation(pos.x, pos.y, pos.z);
  const sphereBody = world.createRigidBody(bodyConfig);
  const sphereColliderDesc = RAPIER.ColliderDesc.ball(0.1).setMass(1.0).setRestitution(0.01).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  world.createCollider(sphereColliderDesc, sphereBody);
  addBallMesh(sphereBody)
}

function addBallMesh(sphereBody) {
  const sphereMesh = new THREE.Mesh(ballGeometry, ballMaterial);
  sphereMesh.position.set(sphereBody.translation().x, sphereBody.translation().y, sphereBody.translation().z);
  sphereMesh.castShadow = true;
  sphereMesh.receiveShadow = true;
  sphereBody.userData = sphereMesh;
  spheresBodies.push(sphereBody);
  scene.add(sphereMesh);
}

// Create the RAPIER physics world

// Update the box's position and rotation based on the physics simulation
function update() {
  requestAnimationFrame(update);
  world.step();
  coreRotation.y = coreRotation.y > 180 ? -180 : coreRotation.y + 0.1;
  const rotationQuaternions  = new THREE.Quaternion(0, 0, 0, 0).setFromEuler(coreRotation);
  core.setRotation(rotationQuaternions, true);
  for (let i = 0; i < spheresBodies.length; ++i) {
    const sphereBody = spheresBodies[i];
    let threeSpherePosition = new THREE.Vector3(sphereBody.translation().x, sphereBody.translation().y, sphereBody.translation().z);
    const scale =
      (GFORCE * core.mass() * sphereBody.mass()) / Math.pow(threeSpherePosition.distanceTo(center), 2);
    const force = center.clone().sub(threeSpherePosition).normalize().multiplyScalar(scale).normalize(); //scale
    sphereBody.applyImpulse(force, true);
    const sphereMesh = sphereBody.userData;
    sphereMesh.position.set(sphereBody.translation().x, sphereBody.translation().y, sphereBody.translation().z);
    sphereMesh.quaternion.set(
      sphereBody.rotation().x,
      sphereBody.rotation().y,
      sphereBody.rotation().z,
      sphereBody.rotation().w
    );
  }
  
  renderer.render(scene, camera);
}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

async function main() {
  await RAPIER.init();
  world = new RAPIER.World(center);

  createBoxCore(center);
  console.log("generated the core")
  update();
  for (let i = 0; i < sqrtBallAmount; ++i) {
    for (let j = 0; j < sqrtBallAmount; ++j) { //32
      coreCircle.theta += j * 20;
      coreCircle.phi += i * 20;
      coreCircleVect.setFromSpherical(coreCircle);
      createSphere(coreCircleVect);
    }
  }
  console.log(`generated ${sqrtBallAmount**2} balls`)
  window.addEventListener("resize", onWindowResize);
}

initGraphics();
main();