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

// 世界国界线组件
export default function CountryBorders() {
  const groupRef = useRef();
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    // 使用内置的简化世界边界数据
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(topoData => {
        // 动态导入topojson-client
        import('topojson-client').then(topojson => {
          const geo = topojson.feature(topoData, topoData.objects.countries);
          setGeoData(geo);
        });
      })
      .catch(err => {
        console.warn('加载世界地图失败，使用备用数据', err);
        setGeoData(null);
      });
  }, []);

  const lineGeometries = useMemo(() => {
    if (!geoData || !geoData.features) return [];

    const geometries = [];
    const radius = 10.01;

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

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  if (lineGeometries.length === 0) return null;

  return (
    <group ref={groupRef}>
      {lineGeometries.map((geometry, i) => (
        <line key={i} geometry={geometry}>
          <lineBasicMaterial
            color={0x00aaff}
            transparent
            opacity={0.6}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
    </group>
  );
}
