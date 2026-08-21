import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

// 地球组件 - 真实纹理 + 大气层 + 云层
export default function Earth({ children }) {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const atmosphereRef = useRef();

  // 加载地球纹理 (使用公开的 NASA 纹理)
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // 绘制海洋底色
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.3, '#0d2847');
    gradient.addColorStop(0.5, '#0f3460');
    gradient.addColorStop(0.7, '#0d2847');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2048, 1024);
    
    // 绘制网格线
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.15)';
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

  // 发光纹理
  const emissiveTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 城市灯光效果
    const cities = [
      [512, 256], [520, 260], [530, 255], // 中国
      [180, 200], [175, 205], // 北美
      [510, 180], [515, 185], // 欧洲
      [560, 280], [570, 275], // 日本
      [480, 350], [485, 355], // 东南亚
    ];
    
    cities.forEach(([x, y]) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 15);
      grad.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
      grad.addColorStop(0.5, 'rgba(255, 150, 50, 0.3)');
      grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - 15, y - 15, 30, 30);
    });
    
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
    
    // 绘制云层
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = 20 + Math.random() * 60;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.15)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
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
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 color = vec3(0.1, 0.4, 1.0);
          gl_FragColor = vec4(color, intensity * 0.6);
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
          emissiveMap={emissiveTexture}
          emissive={new THREE.Color(0xffaa44)}
          emissiveIntensity={0.5}
          specular={new THREE.Color(0x333333)}
          shininess={25}
          bumpScale={0.05}
        />
        {children}
      </mesh>

      {/* 云层 */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[10.1, 64, 64]} />
        <meshPhongMaterial
          map={cloudTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 大气层边缘光 */}
      <mesh ref={atmosphereRef} material={atmosphereMaterial}>
        <sphereGeometry args={[10.5, 64, 64]} />
      </mesh>
    </group>
  );
}
