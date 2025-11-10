import { Canvas, useFrame } from '@react-three/fiber';
import { InstancedRigidBodies, RapierRigidBody, BallCollider, type InstancedRigidBodyProps, Physics, RigidBody } from "@react-three/rapier";
import { useMemo, useRef, type FC } from 'react';
import { Color, Euler, Quaternion, Spherical, Vector3 } from 'three';

const SQRT_BALL_AMOUNT = 40;
const COUNT = SQRT_BALL_AMOUNT ** 2;
const SPHERE_RADIUS = 0.1;

const GFORCE = 6.67408e-11;

const CORE_MASS = 2.0;
const SPHERE_MASS = 1.0;
const OBJECT_RESTITUTION = 0.01;

const GRAVITY_CENTER = new Vector3(0, 0, 0);

const BG_COLOR = new Color(0x232428);

const SwarmCanvaComponentBody: FC = () => { 
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
    const q = new Quaternion().setFromEuler(coreRotationEuler.current);
    coreRef.current.setRotation(q, true);

    Promise.all(
      ballsRigidBodiesRef.current?.map((ballRB) => new Promise((resolve) => {
        const translation = ballRB.translation();
        const pos: Vector3 = new Vector3(translation.x, translation.y, translation.z);

        // Newtonian-ish force
        const scale = (GFORCE * CORE_MASS * SPHERE_MASS) / Math.pow(pos.distanceTo(GRAVITY_CENTER), 2);
        const impulse = GRAVITY_CENTER.clone().sub(pos).normalize().multiplyScalar(scale).normalize();
        ballRB.applyImpulse(impulse, true);
        resolve(true);
      }
    )));
  });

  return (
    <>
      <pointLight color={0xFFFFFF} position={[0, -10, 0]} intensity={1} />
      <Physics gravity={[GRAVITY_CENTER.x, GRAVITY_CENTER.y, GRAVITY_CENTER.z]}>
        <RigidBody
          type='fixed'
          colliders='cuboid'
          ref={coreRef}
          position={[0, 0, 0]}
          mass={CORE_MASS}
          restitution={OBJECT_RESTITUTION}
        >
          <boxGeometry args={[0.6, 0.6, 0.6]} />
        </RigidBody>
        <InstancedRigidBodies
          type='dynamic'
          ref={ballsRigidBodiesRef}
          instances={instances}
          colliders='ball'
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
  const canvaRef = useRef<HTMLCanvasElement>(null);

  return (
    <div style={{ width: "100%", height: "100%", touchAction: "none" }}>
      <Canvas 
        ref={canvaRef}
        shadows>
        <scene background={BG_COLOR}>
            <perspectiveCamera aspect={canvaRef.current ? canvaRef.current.clientWidth / canvaRef.current.clientHeight : 1} position={[0, -5, 0]} fov={75} near={0.1} far={1000} >
              <directionalLight color={0xffffff} intensity={0.1} />
            </perspectiveCamera>
            <SwarmCanvaComponentBody />
          </scene>
      </Canvas>
    </div>
  );
};

export default SwarmCanvaComponent;