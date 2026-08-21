import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 网格交点组件
export default function GridLines({ radius = 10.05, opacity = 0.3 }) {
  const ref = useRef();
  
  const geometry = useMemo(() => {
    const points = [];
    const latLines = 18;
    const lonLines = 36;
    
    // 纬线
    for (let i = 1; i < latLines; i++) {
      const lat = (Math.PI * i) / latLines - Math.PI / 2;
      for (let j = 0; j <= 180; j++) {
        const lon = (2 * Math.PI * j) / 180;
        const x = radius * Math.cos(lat) * Math.cos(lon);
        const y = radius * Math.sin(lat);
        const z = radius * Math.cos(lat) * Math.sin(lon);
        points.push(new THREE.Vector3(x, y, z));
      }
    }
    
    // 经线
    for (let j = 0; j < lonLines; j++) {
      const lon = (2 * Math.PI * j) / lonLines;
      for (let i = 0; i <= 180; i++) {
        const lat = (Math.PI * i) / 180 - Math.PI / 2;
        const x = radius * Math.cos(lat) * Math.cos(lon);
        const y = radius * Math.sin(lat);
        const z = radius * Math.cos(lat) * Math.sin(lon);
        points.push(new THREE.Vector3(x, y, z));
      }
    }
    
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <line ref={ref} geometry={geometry}>
      <lineBasicMaterial
        color={0x00aaff}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
}
