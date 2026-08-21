import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 经纬度转3D球面坐标
function latLonToVector3(lon, lat, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// 从GeoJSON坐标创建3D线段
function createLineFromCoords(coords, radius) {
  const points = [];
  for (let i = 0; i < coords.length; i++) {
    const [lon, lat] = coords[i];
    if (typeof lon === 'number' && typeof lat === 'number') {
      points.push(latLonToVector3(lon, lat, radius));
    }
  }
  return points;
}

// 中国省界线组件
export default function ChinaProvinces() {
  const groupRef = useRef();
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    // 加载中国省份GeoJSON
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      .then(r => r.json())
      .then(data => {
        setGeoData(data);
      })
      .catch(err => {
        console.warn('加载中国地图失败', err);
      });
  }, []);

  const lineGeometries = useMemo(() => {
    if (!geoData || !geoData.features) return [];

    const geometries = [];
    const radius = 10.015; // 略高于国界线

    geoData.features.forEach(feature => {
      if (!feature.geometry) return;

      const { type, coordinates } = feature.geometry;

      if (type === 'Polygon') {
        coordinates.forEach(ring => {
          const points = createLineFromCoords(ring, radius);
          if (points.length > 2) {
            geometries.push(new THREE.BufferGeometry().setFromPoints(points));
          }
        });
      } else if (type === 'MultiPolygon') {
        coordinates.forEach(polygon => {
          polygon.forEach(ring => {
            const points = createLineFromCoords(ring, radius);
            if (points.length > 2) {
              geometries.push(new THREE.BufferGeometry().setFromPoints(points));
            }
          });
        });
      }
    });

    return geometries;
  }, [geoData]);

  // 中国区域填充（半透明绿色）
  const chinaFillGeometry = useMemo(() => {
    if (!geoData || !geoData.features) return null;

    const radius = 10.005;
    const shapes = [];

    geoData.features.forEach(feature => {
      if (!feature.geometry) return;

      const { type, coordinates } = feature.geometry;
      const rings = type === 'Polygon' ? coordinates : 
                    type === 'MultiPolygon' ? coordinates.flat() : [];

      rings.forEach(ring => {
        const points = createLineFromCoords(ring, radius);
        if (points.length > 5) {
          // 创建一个近似的填充面
          const shape = new THREE.Shape();
          const projectedPoints = [];

          points.forEach((p, idx) => {
            // 投影到球面坐标
            const theta = Math.atan2(p.z, -p.x);
            const phi = Math.acos(p.y / radius);
            const x = theta * 3;
            const y = (Math.PI - phi) * 3;

            projectedPoints.push({ x, y });
            if (idx === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
          });

          const geo = new THREE.ShapeGeometry(shape);
          // 变形到球面上
          const pos = geo.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const theta = x / 3;
            const phi = Math.PI - y / 3;
            const r = radius;
            pos.setXYZ(
              i,
              -r * Math.sin(phi) * Math.cos(theta),
              r * Math.cos(phi),
              r * Math.sin(phi) * Math.sin(theta)
            );
          }
          geo.computeVertexNormals();
          shapes.push(geo);
        }
      });
    });

    return shapes;
  }, [geoData]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  if (lineGeometries.length === 0) return null;

  return (
    <group ref={groupRef}>
      {/* 中国区域半透明填充 */}
      {chinaFillGeometry && chinaFillGeometry.map((geometry, i) => (
        <mesh key={`fill-${i}`} geometry={geometry}>
          <meshBasicMaterial
            color={0x00cc88}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* 省界线 */}
      {lineGeometries.map((geometry, i) => (
        <line key={i} geometry={geometry}>
          <lineBasicMaterial
            color={0x00ff88}
            transparent
            opacity={0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
    </group>
  );
}
