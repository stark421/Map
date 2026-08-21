import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 星空背景组件
export default function Stars() {
  const ref = useRef();
  
  const [positions, colors, sizes] = useMemo(() => {
    const count = 8000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // 随机分布在球面上
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 200 + Math.random() * 300;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      // 颜色变化 - 蓝白色系
      const brightness = 0.5 + Math.random() * 0.5;
      col[i * 3] = brightness * (0.8 + Math.random() * 0.2);
      col[i * 3 + 1] = brightness * (0.8 + Math.random() * 0.2);
      col[i * 3 + 2] = brightness;
      
      siz[i] = Math.random() * 2 + 0.5;
    }
    
    return [pos, col, siz];
  }, []);
  
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.005;
    }
  });
  
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
