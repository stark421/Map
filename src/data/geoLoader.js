// GeoJSON 数据加载器

// 中国地图数据源
const CHINA_GEO_URL = 'https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/china.json';
// 世界地图数据源
const WORLD_GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

let chinaGeoCache = null;
let worldGeoCache = null;

export async function loadChinaGeo() {
  if (chinaGeoCache) return chinaGeoCache;
  try {
    const resp = await fetch(CHINA_GEO_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    chinaGeoCache = await resp.json();
    console.log('中国地图数据加载成功，省份数量:', chinaGeoCache.features?.length);
    return chinaGeoCache;
  } catch (e) {
    console.error('加载中国地图数据失败:', e);
    return null;
  }
}

// 将坐标裁剪到 [-180, 180] 范围，并在反子午线处拆分多边形
function clampLon(lon) {
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return lon;
}

// 检测并修复跨越反子午线的环
function fixRing(ring) {
  if (ring.length < 3) return [ring];

  let hasCrossing = false;
  for (let i = 0; i < ring.length - 1; i++) {
    const lonDiff = Math.abs(ring[i + 1][0] - ring[i][0]);
    if (lonDiff > 180) {
      hasCrossing = true;
      break;
    }
  }

  // 没有跨越反子午线，直接返回
  if (!hasCrossing) return [ring];

  // 有跨越，将经度 < 0 的点移到 +360 使其连续
  const adjusted = ring.map(([lon, lat]) => [lon < 0 ? lon + 360 : lon, lat]);

  // 拆分为两个环：一个在 [0, 180]，一个在 [180, 360]
  const leftRing = [];
  const rightRing = [];

  for (const [lon, lat] of adjusted) {
    if (lon <= 180) {
      leftRing.push([lon, lat]);
    } else {
      rightRing.push([lon - 360, lat]);
    }
  }

  const result = [];
  if (leftRing.length >= 3) result.push(leftRing);
  if (rightRing.length >= 3) result.push(rightRing);
  return result.length > 0 ? result : [ring];
}

// 修复 GeoJSON 中跨越反子午线的多边形，并过滤南极洲
function fixGeoAntimeridian(geojson) {
  if (!geojson || !geojson.features) return geojson;

  // 南极洲 id = "010"，在等矩形投影下严重变形，过滤掉
  const SKIP_IDS = new Set(['010']);

  const newFeatures = [];

  geojson.features.forEach(feature => {
    // 跳过南极洲
    if (SKIP_IDS.has(feature.id)) return;
    if (!feature.geometry) {
      newFeatures.push(feature);
      return;
    }

    const { type, coordinates } = feature.geometry;

    if (type === 'Polygon') {
      const newRings = [];
      coordinates.forEach((ring, idx) => {
        if (idx === 0) {
          // 外环可能需要拆分
          const fixed = fixRing(ring);
          fixed.forEach(r => newRings.push(r));
        } else {
          newRings.push(ring);
        }
      });
      newFeatures.push({
        ...feature,
        geometry: { type: 'Polygon', coordinates: newRings }
      });
    } else if (type === 'MultiPolygon') {
      const allPolygons = [];
      coordinates.forEach(polygon => {
        const newRings = [];
        polygon.forEach((ring, idx) => {
          if (idx === 0) {
            const fixed = fixRing(ring);
            fixed.forEach(r => newRings.push([r]));
          } else {
            if (newRings.length > 0) {
              newRings[newRings.length - 1].push(ring);
            }
          }
        });
        newRings.forEach(r => allPolygons.push(r));
      });
      newFeatures.push({
        ...feature,
        geometry: { type: 'MultiPolygon', coordinates: allPolygons }
      });
    } else {
      newFeatures.push(feature);
    }
  });

  return { ...geojson, features: newFeatures };
}

export async function loadWorldGeo() {
  if (worldGeoCache) return worldGeoCache;
  try {
    const resp = await fetch(WORLD_GEO_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const topoData = await resp.json();
    const topojson = await import('topojson-client');
    let geo = topojson.feature(topoData, topoData.objects.countries);
    // 修复反子午线跨越问题
    geo = fixGeoAntimeridian(geo);
    worldGeoCache = geo;
    console.log('世界地图数据加载成功，国家数量:', worldGeoCache.features?.length);
    return worldGeoCache;
  } catch (e) {
    console.error('加载世界地图数据失败:', e);
    return null;
  }
}
