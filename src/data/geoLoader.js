// GeoJSON 数据加载器

// 中国地图数据源（使用 jsdelivr CDN 托管的 ECharts 地图数据）
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

export async function loadWorldGeo() {
  if (worldGeoCache) return worldGeoCache;
  try {
    const resp = await fetch(WORLD_GEO_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const topoData = await resp.json();
    // 动态导入topojson-client
    const topojson = await import('topojson-client');
    worldGeoCache = topojson.feature(topoData, topoData.objects.countries);
    console.log('世界地图数据加载成功，国家数量:', worldGeoCache.features?.length);
    return worldGeoCache;
  } catch (e) {
    console.error('加载世界地图数据失败:', e);
    return null;
  }
}
