import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { DirectionalLight } from 'three';

export const CameraLight = () => {
  const { camera, scene } = useThree();
  const lightRef = useRef<DirectionalLight>(new DirectionalLight(0xFFFFFF, 0.1));

  useEffect(() => {
    lightRef.current.castShadow = true;
    camera.add(lightRef.current);
    scene.add(camera);
    return () => { 
      camera.remove(lightRef.current);
      scene.remove(camera);
    };
  }, [camera, scene]);

  return null;
};