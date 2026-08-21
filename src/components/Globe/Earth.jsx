import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 简化的大陆轮廓数据 (经纬度路径)
const CONTINENTS = [
  // 亚洲
  [[25, 40], [30, 42], [35, 45], [40, 42], [45, 40], [50, 38], [55, 40], [60, 42], [65, 40], [70, 38], [75, 35], [80, 30], [85, 28], [90, 25], [95, 22], [100, 20], [105, 18], [110, 20], [115, 22], [120, 25], [125, 30], [130, 35], [135, 38], [140, 40], [142, 42], [140, 45], [135, 48], [130, 50], [125, 52], [120, 55], [115, 58], [110, 60], [105, 62], [100, 65], [95, 68], [90, 70], [85, 72], [80, 70], [75, 68], [70, 65], [65, 60], [60, 55], [55, 50], [50, 45], [45, 42], [40, 40], [35, 38], [30, 35], [28, 32], [25, 30], [22, 28], [20, 25], [25, 20], [30, 18], [35, 20], [40, 22], [45, 25], [48, 28], [50, 30], [52, 35], [55, 38], [50, 40], [45, 42], [40, 43], [35, 42], [30, 40], [28, 38], [25, 40]],
  // 欧洲
  [[0, 40], [5, 42], [10, 45], [15, 48], [20, 50], [25, 52], [30, 55], [35, 58], [30, 60], [25, 62], [20, 65], [15, 68], [10, 70], [5, 68], [0, 65], [-5, 60], [-10, 55], [-8, 50], [-5, 45], [0, 42], [0, 40]],
  // 非洲
  [[-10, 35], [-5, 32], [0, 30], [5, 28], [10, 25], [15, 22], [20, 18], [25, 15], [30, 10], [35, 5], [40, 0], [42, -5], [40, -10], [38, -15], [35, -20], [32, -25], [30, -30], [28, -33], [25, -35], [22, -33], [18, -28], [15, -22], [12, -15], [10, -8], [8, 0], [5, 5], [2, 10], [0, 15], [-5, 20], [-10, 25], [-12, 28], [-10, 32], [-10, 35]],
  // 北美洲
  [[-170, 65], [-165, 68], [-160, 70], [-155, 72], [-150, 70], [-145, 68], [-140, 65], [-135, 60], [-130, 55], [-125, 50], [-120, 45], [-118, 40], [-115, 35], [-112, 32], [-110, 30], [-108, 28], [-105, 25], [-100, 22], [-95, 20], [-90, 18], [-88, 16], [-86, 14], [-84, 12], [-82, 10], [-80, 12], [-78, 15], [-76, 18], [-74, 20], [-72, 22], [-70, 25], [-68, 28], [-70, 32], [-72, 35], [-74, 38], [-76, 40], [-78, 42], [-80, 45], [-82, 48], [-85, 50], [-88, 52], [-90, 55], [-95, 58], [-100, 60], [-105, 62], [-110, 65], [-115, 68], [-120, 70], [-130, 72], [-140, 70], [-150, 68], [-160, 65], [-165, 62], [-170, 60], [-172, 58], [-170, 55], [-168, 52], [-165, 50], [-162, 48], [-160, 45], [-158, 42], [-155, 40], [-152, 38], [-150, 35], [-148, 32], [-145, 30], [-142, 28], [-140, 30], [-138, 32], [-135, 35], [-132, 38], [-130, 42], [-128, 45], [-126, 48], [-124, 50], [-122, 52], [-120, 55], [-118, 58], [-120, 60], [-125, 62], [-130, 65], [-140, 68], [-150, 70], [-160, 68], [-165, 65], [-170, 65]],
  // 南美洲
  [[-80, 10], [-75, 8], [-72, 5], [-70, 2], [-68, 0], [-65, -5], [-60, -10], [-55, -15], [-50, -20], [-48, -22], [-46, -25], [-48, -28], [-50, -30], [-52, -33], [-55, -35], [-58, -38], [-60, -42], [-62, -45], [-65, -48], [-68, -50], [-70, -52], [-72, -48], [-74, -45], [-76, -42], [-78, -38], [-80, -35], [-82, -30], [-80, -25], [-78, -20], [-76, -15], [-74, -10], [-72, -5], [-70, 0], [-68, 5], [-66, 8], [-65, 10], [-68, 12], [-70, 10], [-72, 8], [-75, 6], [-78, 5], [-80, 8], [-80, 10]],
  // 澳大利亚
  [[115, -20], [118, -18], [120, -15], [122, -12], [125, -10], [128, -12], [130, -15], [132, -12], [135, -10], [138, -12], [140, -15], [142, -12], [145, -15], [148, -18], [150, -22], [152, -25], [153, -28], [152, -32], [150, -35], [148, -38], [145, -40], [142, -38], [140, -35], [138, -32], [135, -30], [132, -28], [130, -30], [128, -32], [125, -30], [122, -28], [120, -25], [118, -22], [115, -20]],
];

// 将经纬度转换为纹理坐标
function latLonToUV(lon, lat) {
  const u = (lon + 180) / 360;
  const v = (90 - lat) / 180;
  return [u, v];
}

// 地球组件
export default function Earth({ children }) {
  const earthRef = useRef();
  const cloudsRef = useRef();

  // 创建带大陆轮廓的纹理
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

    // 绘制大陆（深绿色填充）
    ctx.fillStyle = 'rgba(20, 60, 40, 0.6)';
    CONTINENTS.forEach(continent => {
      ctx.beginPath();
      continent.forEach(([lon, lat], idx) => {
        const [u, v] = latLonToUV(lon, lat);
        const x = u * 2048;
        const y = v * 1024;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    });

    // 绘制大陆边框（亮绿色）
    ctx.strokeStyle = 'rgba(0, 255, 128, 0.4)';
    ctx.lineWidth = 1.5;
    CONTINENTS.forEach(continent => {
      ctx.beginPath();
      continent.forEach(([lon, lat], idx) => {
        const [u, v] = latLonToUV(lon, lat);
        const x = u * 2048;
        const y = v * 1024;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    });

    // 绘制网格线
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.1)';
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

  // 发光纹理 - 城市灯光
  const emissiveTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 1024, 512);

    // 城市灯光点
    const cities = [
      [512, 256], [520, 260], [530, 255], // 中国
      [540, 250], [545, 255], // 韩国/日本
      [180, 200], [175, 205], // 北美东海岸
      [140, 210], // 北美西海岸
      [510, 180], [515, 185], // 欧洲
      [560, 280], [570, 275], // 东南亚
      [530, 280], // 南亚
    ];

    cities.forEach(([x, y]) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 12);
      grad.addColorStop(0, 'rgba(255, 200, 100, 0.6)');
      grad.addColorStop(0.5, 'rgba(255, 150, 50, 0.2)');
      grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - 12, y - 12, 24, 24);
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
          emissiveMap={emissiveTexture}
          emissive={new THREE.Color(0xffaa44)}
          emissiveIntensity={0.5}
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
