// GeoJSON 数据加载器
const CHINA_GEO_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';
const WORLD_GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

let chinaGeoCache = null;
let worldGeoCache = null;

export async function loadChinaGeo() {
  if (chinaGeoCache) return chinaGeoCache;
  try {
    const resp = await fetch(CHINA_GEO_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    chinaGeoCache = await resp.json();
    console.log('中国地图数据加载成功');
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
    console.log('世界地图数据加载成功');
    return worldGeoCache;
  } catch (e) {
    console.error('加载世界地图数据失败:', e);
    return null;
  }
}
