import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { InstancedRigidBodies, RapierRigidBody, BallCollider, type InstancedRigidBodyProps, Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { useMemo, useRef } from 'react';
import { Color, Euler, PCFSoftShadowMap, Quaternion, Spherical, Vector3 } from 'three';

const SQRT_BALL_AMOUNT = 40;
const COUNT = SQRT_BALL_AMOUNT ** 2;
const SPHERE_RADIUS = 0.1;

const GFORCE = 6.67408e-11;

const CORE_MASS = 2.0;
const SPHERE_MASS = 1.0;
const OBJECT_RESTITUTION = 0.01;

const GRAVITY_CENTER = new Vector3(0, 0, 0);

const BG_COLOR = new Color(0x232428);

const _pos = new Vector3();
const _impulse = new Vector3();
const _q = new Quaternion();

const SwarmCanvaComponentBody = () => { 
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
        coreCirlceVect.setFromSpherical(coreCirlce);

        inst.push({
          key: `inst_${i}_${j}`,
          position: [coreCirlceVect.x, coreCirlceVect.y, coreCirlceVect.z]
        });
      }
    }
    return inst;
  }, []);

  // Apply gravitational impulses every frame
  useFrame((_rs, _delta) => {
    if (!ballsRigidBodiesRef.current || !coreRef.current) return;

    // rotate the core slowly
    coreRotationEuler.current.y = coreRotationEuler.current.y > 180 ? -180 : coreRotationEuler.current.y + 0.1;
    _q.setFromEuler(coreRotationEuler.current);
    coreRef.current.setRotation(_q, true);

    for (const ballRB of ballsRigidBodiesRef.current) {
      const t = ballRB.translation();
      _pos.set(t.x, t.y, t.z);
      const dist = _pos.distanceTo(GRAVITY_CENTER);
      if (dist < 0.001) continue; // skip bodies at origin

      // Newtonian-ish force
      const scale = (GFORCE * CORE_MASS * SPHERE_MASS) / Math.pow(_pos.distanceTo(GRAVITY_CENTER), 2);
      _impulse.copy(GRAVITY_CENTER).sub(_pos).normalize().multiplyScalar(scale).normalize();
      ballRB.applyImpulse(_impulse, true);
    }
  });

  return (
    <>
      <pointLight color={0xFFFFFF} position={[0, -10, 0]} intensity={1} />
      <Physics gravity={[GRAVITY_CENTER.x, GRAVITY_CENTER.y, GRAVITY_CENTER.z]} timeStep="vary">
        <RigidBody
          type='fixed'
          ref={coreRef}
          position={[0, 0, 0]}
          mass={CORE_MASS}
          restitution={OBJECT_RESTITUTION}
          colliders={false}
        >
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <CuboidCollider args={[0.6, 0.6, 0.6]} />
        </RigidBody>
        <InstancedRigidBodies
          type='dynamic'
          ref={ballsRigidBodiesRef}
          instances={instances}
          colliders={false}
          colliderNodes={[<BallCollider args={[SPHERE_RADIUS]} />]}
          mass={SPHERE_MASS}
          restitution={OBJECT_RESTITUTION}
        >
          <instancedMesh args={[undefined, undefined, COUNT]} castShadow receiveShadow>
            <sphereGeometry args={[SPHERE_RADIUS, 16, 16]} />
            <meshPhongMaterial color={0xdcdbd7} />
          </instancedMesh>
        </InstancedRigidBodies>
      </Physics>
    </>
  );
};

const SwarmCanvaComponent = () => {
  return (
    <div style={{ width: "100%", height: "100%", touchAction: "none" }}>
      <Canvas 
        shadows={{ type: PCFSoftShadowMap }}>
        <PerspectiveCamera makeDefault position={[0, -5, 0]} fov={75} near={0.1} far={1000}>
          <directionalLight color={0xffffff} intensity={0.1} castShadow />
        </PerspectiveCamera>
        <scene background={BG_COLOR}>
          <SwarmCanvaComponentBody />
        </scene>
      </Canvas>
    </div>
  );
};

export default SwarmCanvaComponent;