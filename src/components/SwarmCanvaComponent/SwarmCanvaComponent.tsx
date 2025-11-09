import { Canvas, useFrame } from '@react-three/fiber';
import { InstancedRigidBodies, RapierRigidBody, BallCollider, type InstancedRigidBodyProps, Physics, RigidBody, type RigidBodyProps } from "@react-three/rapier";
import { useEffect, useMemo, useRef, type FC } from 'react';
import { Euler, Quaternion, Spherical, Vector3 } from 'three';

const SQRT_BALL_AMOUNT = 40;
const COUNT = SQRT_BALL_AMOUNT ** 2;

const GFORCE = 6.67408e-11;
const CORE_MASS = 2.0;
const SPHERE_MASS = 1.0;
const SPHERE_RADIUS = 0.1;


interface SwarmCanvaComponentProps {}

const SwarmCanvaComponent: FC<SwarmCanvaComponentProps> = () => { 
  const coreRef = useRef<RapierRigidBody | null>(null);

  // gravity center that spheres are attracted to
  const gravityCenter = useRef(new Vector3(0, 0, 0));
  const tmpVec = useRef(new Vector3());

  // build positions on a spherical distribution (porting the spherical packing from your script)
  const instances = useMemo(() => {
    const inst: InstancedRigidBodyProps[] = [];
    const s = new Spherical(2);
    const v = new Vector3();

    for (let i = 0; i < SQRT_BALL_AMOUNT; i++) {
      for (let j = 0; j < SQRT_BALL_AMOUNT; j++) {
        // spread points on a spherical pattern similar to original script
        s.theta = j * 0.2 + Math.random() * 0.05;
        s.phi = i * 0.2 + Math.random() * 0.05;
        v.setFromSpherical(s);
        inst.push({
          key: `inst_${i}_${j}`,
          position: [v.x, v.y, v.z]
        });
      }
    }
    return inst;
  }, []);

  // Apply gravitational impulses every frame
  useFrame((_, delta) => {
    if (!instances || !coreRef.current) return;

    // rotate the core slowly
    const euler = new Euler(0, performance.now() * 0.0001, 0);
    const q = new Quaternion().setFromEuler(euler);
    coreRef.current.quaternion = new Quaternion(q.x, q.y, q.z, q.w);

    for (let i = 0; i < instances.length; i++) {
      const ballInstance: InstancedRigidBodyProps | undefined = instances[i];
      if (!ballInstance) continue;

      const pos: Vector3 = ballInstance.position as Vector3 || new Vector3(); // { x, y, z }
      tmpVec.current.set(pos.x, pos.y, pos.z);

      const sphereMass = ballInstance.mass || 0;

      // Newtonian-ish force, scaled for visuals
      const scale = (GFORCE * coreRef.current.mass() * sphereMass) / Math.pow(tmpVec.current.distanceTo(gravityCenter.current), 2);
      const impulse = gravityCenter.current.clone().sub(tmpVec.current).normalize().multiplyScalar(scale);
      ballInstance.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);

      // Keep the associated instanced mesh updated is done by rapier + instanced api
    }
  });

  // small helper component to create the fixed core
  const CoreBox = () => {
    // We'll use a fixed RigidBody and keep a ref to its API
    return (
      <RigidBody
        type="fixed"
        colliders={false}
        ref={coreRef}
        position={[0, 0, 0]}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color={0xdddddd} />
        </mesh>
      </RigidBody>
    );
  };

  return (
    <div style={{ width: "100%", height: "100%", touchAction: "none" }}>
      <Canvas
        shadows
        camera={{ position: [0, -5, 0], fov: 75 }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[0, -10, 0]} intensity={1} castShadow />
        <Physics gravity={[0, 0, 0]}>
          <CoreBox />
          <InstancedRigidBodies
            ref={rigidBodiesRef}
            instances={instances}
            colliders="ball"
            colliderNodes={[<BallCollider args={[SPHERE_RADIUS]} />]}
            mass={SPHERE_MASS}
          >
            <instancedMesh args={[undefined, undefined, COUNT]} castShadow receiveShadow>
              <sphereGeometry args={[SPHERE_RADIUS, 16, 16]} />
              <meshStandardMaterial color={0xdcdbd7} />
            </instancedMesh>
          </InstancedRigidBodies>
        </Physics>
      </Canvas>
    </div>
  );
};

export default SwarmCanvaComponent;
