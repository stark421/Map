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

// 修复跨越反子午线的多边形
function fixAntimeridian(geojson) {
  if (!geojson || !geojson.features) return geojson;

  const newFeatures = [];

  geojson.features.forEach(feature => {
    if (!feature.geometry) {
      newFeatures.push(feature);
      return;
    }

    const { type, coordinates } = feature.geometry;

    if (type === 'Polygon') {
      const fixed = fixPolygon(coordinates);
      newFeatures.push({
        ...feature,
        geometry: { type: 'Polygon', coordinates: fixed }
      });
    } else if (type === 'MultiPolygon') {
      const fixed = [];
      coordinates.forEach(polygon => {
        const result = fixPolygon(polygon);
        result.forEach(r => fixed.push(r));
      });
      newFeatures.push({
        ...feature,
        geometry: { type: 'MultiPolygon', coordinates: fixed }
      });
    } else {
      newFeatures.push(feature);
    }
  });

  return { ...geojson, features: newFeatures };
}

// 修复单个多边形中的反子午线跨越
function fixPolygon(rings) {
  return rings.map(ring => {
    const newRing = [];
    for (let i = 0; i < ring.length; i++) {
      const curr = ring[i];
      const next = ring[(i + 1) % ring.length];
      newRing.push(curr);

      // 检测经度跳跃超过180度的情况
      const lonDiff = next[0] - curr[0];
      if (Math.abs(lonDiff) > 180) {
        // 在反子午线处插入裁剪点
        const sign = lonDiff > 0 ? -1 : 1;
        const latInterp = (curr[1] + next[1]) / 2;
        newRing.push([sign * 180, latInterp]);
        // 插入断开标记（用NaN分隔）
        newRing.push([NaN, NaN]);
        newRing.push([-sign * 180, latInterp]);
      }
    }
    // 过滤掉NaN标记
    return newRing.filter(p => !isNaN(p[0]) && !isNaN(p[1]));
  });
}

export async function loadWorldGeo() {
  if (worldGeoCache) return worldGeoCache;
  try {
    const resp = await fetch(WORLD_GEO_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const topoData = await resp.json();
    // 动态导入topojson-client
    const topojson = await import('topojson-client');
    let geo = topojson.feature(topoData, topoData.objects.countries);
    // 修复反子午线问题
    geo = fixAntimeridian(geo);
    worldGeoCache = geo;
    console.log('世界地图数据加载成功，国家数量:', worldGeoCache.features?.length);
    return worldGeoCache;
  } catch (e) {
    console.error('加载世界地图数据失败:', e);
    return null;
  }
}
