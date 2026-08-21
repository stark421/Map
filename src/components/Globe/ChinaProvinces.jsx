import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { loadChinaGeo } from '../../data/geoLoader';

// 经纬度转3D球面坐标
function latLonToVector3(lon, lat, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  ];
}

// 中国省界线组件
export default function ChinaProvinces() {
  const groupRef = useRef();
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    loadChinaGeo()
      .then(data => {
        if (data) {
          console.log('中国省界: 数据加载成功');
          setGeoData(data);
        }
      })
      .catch(err => {
        console.error('中国省界: 加载失败', err);
      });
  }, []);

  const lineData = useMemo(() => {
    if (!geoData || !geoData.features) return [];

    const lines = [];
    const radius = 10.02;

    geoData.features.forEach(feature => {
      if (!feature.geometry) return;

      const { type, coordinates } = feature.geometry;

      const processRing = (ring) => {
        const points = [];
        for (let i = 0; i < ring.length; i++) {
          const [lon, lat] = ring[i];
          if (typeof lon === 'number' && typeof lat === 'number') {
            points.push(latLonToVector3(lon, lat, radius));
          }
        }
        if (points.length > 2) {
          lines.push(points);
        }
      };

      if (type === 'Polygon') {
        coordinates.forEach(processRing);
      } else if (type === 'MultiPolygon') {
        coordinates.forEach(polygon => {
          polygon.forEach(processRing);
        });
      }
    });

    console.log('中国省界: 线段数量', lines.length);
    return lines;
  }, [geoData]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  if (lineData.length === 0) return null;

  return (
    <group ref={groupRef}>
      {lineData.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#00ff88"
          lineWidth={1.5}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      ))}
    </group>
  );
}
