import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';

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

// 世界国界线组件
export default function CountryBorders() {
  const groupRef = useRef();
  const [geoData, setGeoData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(topoData => {
        import('topojson-client').then(topojson => {
          const geo = topojson.feature(topoData, topoData.objects.countries);
          console.log('世界地图数据加载成功，国家数量:', geo.features?.length);
          setGeoData(geo);
        });
      })
      .catch(err => {
        console.error('加载世界地图失败:', err);
        setError(err.message);
      });
  }, []);

  const lineData = useMemo(() => {
    if (!geoData || !geoData.features) return [];

    const lines = [];
    const radius = 10.01;

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

    console.log('世界国界线段数量:', lines.length);
    return lines;
  }, [geoData]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  if (error) {
    console.warn('国界线组件错误:', error);
    return null;
  }

  if (lineData.length === 0) return null;

  return (
    <group ref={groupRef}>
      {lineData.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#00aaff"
          lineWidth={1}
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      ))}
    </group>
  );
}
