import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { loadChinaGeo } from '../../data/geoLoader';

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

// 中国3D高程组件 - 带侧边厚度
export default function ChinaElevation() {
  const groupRef = useRef();
  const [chinaGeo, setChinaGeo] = useState(null);
  
  useEffect(() => {
    loadChinaGeo().then(setChinaGeo);
  }, []);
  
  const elevationMeshes = useMemo(() => {
    if (!chinaGeo || !chinaGeo.features) return [];
    
    const meshes = [];
    const radius = 10;
    const elevationHeight = 0.15;
    
    chinaGeo.features.forEach((feature) => {
      if (!feature.geometry) return;
      
      const geometries = [];
      const coordinates = feature.geometry.type === 'MultiPolygon'
        ? feature.geometry.coordinates
        : [feature.geometry.coordinates];
      
      coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          if (ring.length < 3) return;
          
          const shape = new THREE.Shape();
          const projectedPoints = [];
          
          ring.forEach((coord, idx) => {
            const lon = coord[0];
            const lat = coord[1];
            const pos = latLonToVector3(lon, lat, radius);
            projectedPoints.push(pos);
            
            // 投影到球面坐标系用于Shape
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            const x = theta * 5;
            const y = phi * 5;
            
            if (idx === 0) {
              shape.moveTo(x, y);
            } else {
              shape.lineTo(x, y);
            }
          });
          
          // 创建挤出几何体（带侧边厚度）
          const extrudeSettings = {
            depth: elevationHeight,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 2,
          };
          
          const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          
          // 变形到球面上
          const positions = extrudeGeometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            const theta = x / 5;
            const phi = y / 5;
            const r = radius + z;
            
            positions.setXYZ(
              i,
              -r * Math.sin(phi) * Math.cos(theta),
              r * Math.cos(phi),
              r * Math.sin(phi) * Math.sin(theta)
            );
          }
          
          extrudeGeometry.computeVertexNormals();
          geometries.push(extrudeGeometry);
        });
      });
      
      // 合并几何体
      if (geometries.length > 0) {
        const merged = mergeGeometries(geometries);
        if (merged) {
          meshes.push(merged);
        }
      }
    });
    
    return meshes;
  }, [chinaGeo]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  if (!chinaGeo) return null;

  return (
    <group ref={groupRef}>
      {elevationMeshes.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshPhongMaterial
            color={0x00cc88}
            emissive={0x004422}
            emissiveIntensity={0.3}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            depthWrite={true}
          />
        </mesh>
      ))}
      
      {/* 中国区域发光边框 */}
      {chinaGeo.features.slice(0, 1).map((feature, i) => {
        if (!feature.geometry) return null;
        const coords = feature.geometry.type === 'MultiPolygon'
          ? feature.geometry.coordinates[0][0]
          : feature.geometry.coordinates[0];
        
        if (!coords || coords.length < 3) return null;
        
        const points = coords.map(([lon, lat]) => 
          latLonToVector3(lon, lat, 10.01)
        );
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <line key={`border-${i}`} geometry={lineGeometry}>
            <lineBasicMaterial
              color={0x00ff88}
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
            />
          </line>
        );
      })}
    </group>
  );
}

// 简单的几何体合并函数
function mergeGeometries(geometries) {
  if (geometries.length === 0) return null;
  if (geometries.length === 1) return geometries[0];
  
  let totalPositions = 0;
  let totalIndices = 0;
  
  geometries.forEach((geo) => {
    totalPositions += geo.attributes.position.count;
    if (geo.index) {
      totalIndices += geo.index.count;
    }
  });
  
  const positions = new Float32Array(totalPositions * 3);
  const normals = new Float32Array(totalPositions * 3);
  const indices = new Uint32Array(totalIndices);
  
  let posOffset = 0;
  let normOffset = 0;
  let idxOffset = 0;
  let vertexOffset = 0;
  
  geometries.forEach((geo) => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    
    for (let i = 0; i < pos.count; i++) {
      positions[posOffset++] = pos.getX(i);
      positions[posOffset++] = pos.getY(i);
      positions[posOffset++] = pos.getZ(i);
    }
    
    if (norm) {
      for (let i = 0; i < norm.count; i++) {
        normals[normOffset++] = norm.getX(i);
        normals[normOffset++] = norm.getY(i);
        normals[normOffset++] = norm.getZ(i);
      }
    }
    
    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices[idxOffset++] = geo.index.array[i] + vertexOffset;
      }
    }
    
    vertexOffset += pos.count;
  });
  
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  if (totalIndices > 0) {
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
  }
  merged.computeVertexNormals();
  
  return merged;
}
