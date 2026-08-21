import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 地球组件
export default function Earth({ children }) {
  const earthRef = useRef();
  const cloudsRef = useRef();

  // 创建地球纹理 - 深色海洋底色，不含绿色大陆
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 海洋底色 - 深蓝色渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.3, '#0d2847');
    gradient.addColorStop(0.5, '#0f3460');
    gradient.addColorStop(0.7, '#0d2847');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2048, 1024);

    // 细微网格线
    ctx.strokeStyle = 'rgba(0, 100, 200, 0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 36; i++) {
      ctx.beginPath();
      ctx.moveTo((i / 36) * 2048, 0);
      ctx.lineTo((i / 36) * 2048, 1024);
      ctx.stroke();
    }
    for (let i = 0; i <= 18; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i / 18) * 1024);
      ctx.lineTo(2048, (i / 18) * 1024);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }, []);

  // 云层纹理
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 1024, 512);

    // 随机云层
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = 15 + Math.random() * 50;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.12)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.02;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.025;
    }
  });

  // 大气层着色器
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 color = vec3(0.1, 0.4, 1.0);
          gl_FragColor = vec4(color, intensity * 0.5);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  return (
    <group>
      {/* 地球本体 */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[10, 64, 64]} />
        <meshPhongMaterial
          map={earthTexture}
          specular={new THREE.Color(0x222222)}
          shininess={20}
        />
        {children}
      </mesh>

      {/* 云层 */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[10.08, 64, 64]} />
        <meshPhongMaterial
          map={cloudTexture}
          transparent
          opacity={0.35}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 大气层边缘光 */}
      <mesh material={atmosphereMaterial}>
        <sphereGeometry args={[10.4, 64, 64]} />
      </mesh>
    </group>
  );
}
