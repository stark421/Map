import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 扫描光组件
export default function ScanLight({ radius = 10.1 }) {
  const ref = useRef();
  const angleRef = useRef(0);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x00aaff) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          // 计算经度角度
          float angle = atan(vPosition.z, vPosition.x);
          float normalizedAngle = (angle + 3.14159) / (2.0 * 3.14159);
          
          // 扫描光效果
          float scanPos = fract(time * 0.1);
          float dist = abs(normalizedAngle - scanPos);
          dist = min(dist, 1.0 - dist);
          
          float intensity = smoothstep(0.05, 0.0, dist);
          intensity *= 0.8;
          
          // 渐变效果
          float gradient = smoothstep(0.0, 0.02, dist) * intensity;
          
          gl_FragColor = vec4(color, gradient);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    material.uniforms.time.value = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={ref} material={material}>
      <sphereGeometry args={[radius, 64, 64]} />
    </mesh>
  );
}
