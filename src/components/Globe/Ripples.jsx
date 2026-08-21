import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { rippleCities } from '../../data/flights';

// 经纬度转3D坐标
function latLonToVector3(lon, lat, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// 涟漪效果组件
function RippleRing({ position, size, color = 0x00aaff, delay = 0 }) {
  const ringRef = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();
  
  useFrame((state) => {
    const t = (state.clock.elapsedTime + delay) % 3;
    const scale1 = 0.5 + t * 0.5;
    const opacity1 = Math.max(0, 1 - t / 3);
    
    if (ringRef.current) {
      ringRef.current.scale.setScalar(scale1 * size);
      ringRef.current.material.opacity = opacity1 * 0.6;
    }
    if (ring2Ref.current) {
      const t2 = (t + 1) % 3;
      const scale2 = 0.5 + t2 * 0.5;
      ring2Ref.current.scale.setScalar(scale2 * size);
      ring2Ref.current.material.opacity = Math.max(0, 1 - t2 / 3) * 0.4;
    }
    if (ring3Ref.current) {
      const t3 = (t + 2) % 3;
      const scale3 = 0.5 + t3 * 0.5;
      ring3Ref.current.scale.setScalar(scale3 * size);
      ring3Ref.current.material.opacity = Math.max(0, 1 - t3 / 3) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* 中心点 */}
      <mesh>
        <sphereGeometry args={[0.03 * size, 8, 8]} />
        <meshBasicMaterial
          color={0x00ffff}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* 涟漪环 */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      <mesh ref={ring3Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// 常态涟漪组件
export default function Ripples() {
  const groupRef = useRef();
  
  const cities = useMemo(() => {
    return rippleCities.map((city, i) => ({
      position: latLonToVector3(city.position[0], city.position[1], 10.02),
      size: city.size,
      delay: i * 0.3,
      name: city.name,
    }));
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {cities.map((city, i) => (
        <RippleRing
          key={i}
          position={city.position}
          size={city.size}
          delay={city.delay}
        />
      ))}
    </group>
  );
}
