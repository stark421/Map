import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Earth from './Earth';
import Stars from './Stars';
import GridLines from './GridLines';
import ScanLight from './ScanLight';
import FlightLines from './FlightLines';
import Ripples from './Ripples';
import ChinaElevation from './ChinaElevation';

// 加载中组件
function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[10, 32, 32]} />
      <meshBasicMaterial color={0x0d2847} wireframe />
    </mesh>
  );
}

// 3D地球组件
export default function Globe3D({ onSwitchChina, onSwitchWorld }) {
  const controlsRef = useRef();

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 控制按钮 */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        gap: '15px',
      }}>
        <button
          onClick={onSwitchChina}
          style={{
            background: 'rgba(0, 100, 200, 0.8)',
            border: '1px solid #00aaff',
            color: '#fff',
            padding: '10px 25px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 'bold',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 150, 255, 0.9)';
            e.target.style.boxShadow = '0 0 15px rgba(0, 150, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 100, 200, 0.8)';
            e.target.style.boxShadow = 'none';
          }}
        >
          中国地图
        </button>
        <button
          onClick={onSwitchWorld}
          style={{
            background: 'rgba(0, 100, 200, 0.8)',
            border: '1px solid #00aaff',
            color: '#fff',
            padding: '10px 25px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 'bold',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 150, 255, 0.9)';
            e.target.style.boxShadow = '0 0 15px rgba(0, 150, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 100, 200, 0.8)';
            e.target.style.boxShadow = 'none';
          }}
        >
          世界地图
        </button>
      </div>

      {/* 信息面板 */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 100,
        background: 'rgba(0, 20, 40, 0.8)',
        border: '1px solid rgba(0, 150, 255, 0.3)',
        borderRadius: '8px',
        padding: '15px',
        color: '#fff',
        fontSize: 13,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ marginBottom: '8px', color: '#00aaff', fontWeight: 'bold' }}>
          地球可视化系统
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)' }}>
          <div>鼠标拖拽：旋转地球</div>
          <div>滚轮：缩放视角</div>
          <div>右键拖拽：平移视角</div>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0, 25], fov: 45 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: '#000' }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* 灯光 */}
          <ambientLight intensity={0.2} />
          <directionalLight
            position={[5, 3, 5]}
            intensity={1.5}
            color={0xffffff}
          />
          <pointLight position={[-10, -5, -10]} intensity={0.3} color={0x0088ff} />

          {/* 星空背景 */}
          <Stars />

          {/* 地球本体 + 云层 + 大气层 */}
          <Earth>
            {/* 中国3D高程 */}
            <ChinaElevation />
          </Earth>

          {/* 网格交点 */}
          <GridLines />

          {/* 扫描光 */}
          <ScanLight />

          {/* 国际飞线 */}
          <FlightLines />

          {/* 常态涟漪 */}
          <Ripples />

          {/* 相机控制 */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={15}
            maxDistance={50}
            autoRotate={false}
            zoomSpeed={0.6}
            rotateSpeed={0.4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
