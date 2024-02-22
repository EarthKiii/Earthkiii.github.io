import RAPIER from 'rapier3d-compat';

var scene, camera, mainRenderer, core, world;
const canvas = document.getElementById("main-canva")

const coreCircle = new THREE.Spherical(2);
const coreCircleVect = new THREE.Vector3();
const coreRotation = new THREE.Euler(45, 45, 45);

const center = new THREE.Vector3(0, 0, 0);
const gravityCenter = center.clone();
const GFORCE = 6.67408e-11;
const sqrtBallAmount = 40;
const spheresBodies = new Array();

const sizes = {
  width: canvas.clientWidth,
  height: canvas.clientHeight 
};

const ballGeometry = new THREE.SphereGeometry(0.1, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xdcdbd7}); //MeshPhongMaterial //, emissive: 0xffffff 

// Create the Three.js scene
function initGraphics() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x232428);

  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
  camera.position.set(0, -5, 0);
  camera.lookAt(center);
  scene.add(camera);

  const shadowLight = new THREE.DirectionalLight(0xFFFFFF, 0.1);
  shadowLight.castShadow = true;
  camera.add(shadowLight);
  const light = new THREE.PointLight(0xFFFFFF, 1);
  light.position.set(0, -10, 0);
  scene.add(light);

  mainRenderer = new THREE.WebGLRenderer({
    canvas: canvas
  });
  mainRenderer.setSize(sizes.width, sizes.height);
  mainRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mainRenderer.shadowMap.enabled = true;
  mainRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

function createBoxCore(pos) {
  const coreConfig = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Fixed);
  coreConfig.setTranslation(pos.x, pos.y, pos.z);
  core = world.createRigidBody(coreConfig);
  const boxColliderDesc = RAPIER.ColliderDesc.cuboid(0.6, 0.6, 0.6).setMass(2.0).setRestitution(0.01).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  world.createCollider(boxColliderDesc, core);
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
    const rapierSpherePosition = sphereBody.translation();
    const threeSpherePosition = new THREE.Vector3(rapierSpherePosition.x, rapierSpherePosition.y, rapierSpherePosition.z);
    const scale =
      (GFORCE * core.mass() * sphereBody.mass()) / Math.pow(threeSpherePosition.distanceTo(gravityCenter), 2);
    const force = gravityCenter.clone().sub(threeSpherePosition).normalize().multiplyScalar(scale).normalize(); //scale
    sphereBody.applyImpulse(force, true);
    const sphereMesh = sphereBody.userData;
    sphereMesh.position.copy(threeSpherePosition)
  }
  
  mainRenderer.render(scene, camera);
}

function onWindowResize() {
    // Update sizes
    sizes.width = canvas.clientWidth;
    sizes.height = canvas.clientHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    mainRenderer.setSize(sizes.width, sizes.height);
}

function getMousePos(event) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - sizes.width * 0.5)/100,
    y: (event.clientY - rect.top - sizes.height * 0.5)/100
  };
}

function mouseDown(event) {
  const mousePos = getMousePos(event);
  gravityCenter.x = mousePos.x
  gravityCenter.z = -mousePos.y
}

function mouseUp(event) {
  gravityCenter.copy(center);
}

canvas.addEventListener("mousedown", mouseDown)
canvas.addEventListener("touchstart", mouseDown)

canvas.addEventListener("mouseup", mouseUp)
canvas.addEventListener("touchend", mouseUp)

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