import { Canvas } from '@react-three/fiber';
import { InstancedRigidBodies, RapierRigidBody, BallCollider, type InstancedRigidBodyProps, Physics, RigidBody, CuboidCollider, useBeforePhysicsStep } from "@react-three/rapier";
import { useMemo, useRef } from 'react';
import { Euler, PCFSoftShadowMap, Quaternion, Spherical, Vector3 } from 'three';

const SQRT_BALL_AMOUNT = 40;
const COUNT = SQRT_BALL_AMOUNT ** 2;
const SPHERE_RADIUS = 0.1;

const GFORCE = 6.67408e-11;

const CORE_MASS = 2.0;
const CORE_DENSITY = CORE_MASS / (1.2 * 1.2 * 1.2);

const SPHERE_MASS = 1.0;
const SPHERE_DENSITY = SPHERE_MASS / ((4/3) * Math.PI * Math.pow(SPHERE_RADIUS, 3));

const OBJECT_RESTITUTION = 0.01;

const GRAVITY_CENTER = new Vector3(0, 0, 0);

// const BG_COLOR = new Color(0x232428);

const _pos = new Vector3();
const _impulse = new Vector3();
const _q = new Quaternion();

const SwarmScene = () => {
  const coreRef = useRef<RapierRigidBody | null>(null);
  const coreRotationEuler = useRef(new Euler(45, 45, 45));

  const ballsRigidBodiesRef = useRef<RapierRigidBody[] | null>(null);

  // build positions on a spherical distribution (porting the spherical packing from your script)
  const instances = useMemo(() => {
    const inst: InstancedRigidBodyProps[] = [];
    const coreCirlce = new Spherical(2);
    const coreCirlceVect = new Vector3();

    for (let i = 0; i < SQRT_BALL_AMOUNT; ++i) {
      for (let j = 0; j < SQRT_BALL_AMOUNT; ++j) {
        coreCirlce.theta += j * 20;
        coreCirlce.phi += i * 20;

        coreCirlce.radius = 4 + Math.random() * 0.85;
        coreCirlceVect.setFromSpherical(coreCirlce);

        inst.push({
          key: `inst_${i}_${j}`,
          position: [coreCirlceVect.x, coreCirlceVect.y, coreCirlceVect.z]
        });
      }
    }
    return inst;
  }, []);

  useBeforePhysicsStep(() => {
    if (!ballsRigidBodiesRef.current || !coreRef.current) return;

    // rotate the core slowly
    coreRotationEuler.current.y = coreRotationEuler.current.y > 180 ? -180 : coreRotationEuler.current.y + 0.1;
    _q.setFromEuler(coreRotationEuler.current);
    coreRef.current.setRotation(_q, true);

    for (const ballRB of ballsRigidBodiesRef.current) {
      const t = ballRB.translation();
      _pos.set(t.x, t.y, t.z);
      const dist = _pos.distanceTo(GRAVITY_CENTER);

      // Newtonian-ish force
      const scale = (GFORCE * CORE_MASS * SPHERE_MASS) / Math.pow(dist, 2);
      _impulse.copy(GRAVITY_CENTER).sub(_pos).normalize().multiplyScalar(scale).normalize();
      ballRB.applyImpulse(_impulse, true);
    }
  });

  return (
    <>
      <RigidBody
        type='kinematicPosition'
        ref={coreRef}
        position={[0, 0, 0]}
        colliders={false}
      >
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <CuboidCollider args={[0.6, 0.6, 0.6]} restitution={OBJECT_RESTITUTION} density={CORE_DENSITY}/>
      </RigidBody>
      <InstancedRigidBodies
        type='dynamic'
        ref={ballsRigidBodiesRef}
        instances={instances}
        colliders={false}
        colliderNodes={[<BallCollider args={[SPHERE_RADIUS]} restitution={OBJECT_RESTITUTION} density={SPHERE_DENSITY}/>]}
      >
        <instancedMesh args={[undefined, undefined, COUNT]} castShadow receiveShadow>
          <sphereGeometry args={[SPHERE_RADIUS, 16, 16]} />
          <meshPhongMaterial color={0xdcdbd7} />
        </instancedMesh>
      </InstancedRigidBodies>
    </>
  );
};

const SwarmCanvaComponentBody = () => { 
  return (
    <>
      <pointLight color={0xFFFFFF} position={[0, -10, 0]} intensity={1} />
      <Physics gravity={[GRAVITY_CENTER.x, GRAVITY_CENTER.y, GRAVITY_CENTER.z]}>
        <SwarmScene />
      </Physics>
    </>
  );
};

const SwarmCanvaComponent = () => {
  return (
    <div style={{ width: "100%", height: "100%", touchAction: "none" }}>
      <Canvas
        shadows={{ type: PCFSoftShadowMap }}
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, -5, 0] }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      >
        <SwarmCanvaComponentBody />
      </Canvas>
    </div>
  );
};

export default SwarmCanvaComponent;