import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { flightRoutes } from '../../data/flights';

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

// 创建飞线弧线
function createFlightArc(from, to, radius = 10) {
  const start = latLonToVector3(from[0], from[1], radius);
  const end = latLonToVector3(to[0], to[1], radius);
  
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  mid.normalize().multiplyScalar(radius + distance * 0.3);
  
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return curve.getPoints(50);
}

// 国际飞线组件
export default function FlightLines() {
  const groupRef = useRef();
  const dashOffsetRef = useRef(0);
  
  const arcs = useMemo(() => {
    return flightRoutes.map((route) => {
      const points = createFlightArc(route.from, route.to);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return { geometry, name: route.name };
    });
  }, []);

  useFrame((_, delta) => {
    dashOffsetRef.current += delta * 2;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {arcs.map((arc, i) => (
        <line key={i} geometry={arc.geometry}>
          <lineDashedMaterial
            color={0x00ffff}
            dashSize={0.5}
            gapSize={0.3}
            transparent
            opacity={0.6}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
      
      {/* 飞行粒子效果 */}
      {arcs.map((arc, i) => {
        const points = arc.geometry.attributes.position;
        const count = points.count;
        const midIndex = Math.floor(count / 2);
        return (
          <mesh
            key={`particle-${i}`}
            position={[
              points.getX(midIndex),
              points.getY(midIndex),
              points.getZ(midIndex),
            ]}
          >
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial
              color={0x00ffff}
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
}
