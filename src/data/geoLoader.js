import * as topojson from 'topojson-client';

// GeoJSON 数据加载器
const CHINA_GEO_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';
const WORLD_GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

let chinaGeoCache = null;
let worldGeoCache = null;

export async function loadChinaGeo() {
  if (chinaGeoCache) return chinaGeoCache;
  try {
    const resp = await fetch(CHINA_GEO_URL);
    chinaGeoCache = await resp.json();
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
    const topoData = await resp.json();
    // 转换 TopoJSON 为 GeoJSON
    worldGeoCache = topojson.feature(topoData, topoData.objects.countries);
    return worldGeoCache;
  } catch (e) {
    console.error('加载世界地图数据失败:', e);
    return null;
  }
}
