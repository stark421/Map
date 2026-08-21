import { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { loadChinaGeo } from '../../data/geoLoader';

// 中国地图组件 - 分省边界
export default function ChinaMap({ onBack }) {
  const [option, setOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadChinaGeo()
      .then((data) => {
        if (!data) {
          setError('无法加载地图数据');
          setLoading(false);
          return;
        }
        
        console.log('注册中国地图，数据类型:', data.type);
        
        // 注册地图
        echarts.registerMap('china', data);
        
        // 模拟数据
        const mapData = [
          { name: '北京市', value: 100 },
          { name: '上海市', value: 95 },
          { name: '广东省', value: 90 },
          { name: '江苏省', value: 85 },
          { name: '浙江省', value: 80 },
          { name: '山东省', value: 75 },
          { name: '四川省', value: 70 },
          { name: '湖北省', value: 65 },
          { name: '湖南省', value: 60 },
          { name: '河南省', value: 55 },
          { name: '河北省', value: 50 },
          { name: '福建省', value: 45 },
          { name: '安徽省', value: 40 },
          { name: '辽宁省', value: 35 },
          { name: '陕西省', value: 30 },
          { name: '重庆市', value: 25 },
          { name: '天津市', value: 20 },
          { name: '云南省', value: 15 },
          { name: '贵州省', value: 10 },
          { name: '广西壮族自治区', value: 5 },
        ];
        
        setOption({
          backgroundColor: '#0a1628',
          title: {
            text: '中国地图 - 省级行政区',
            left: 'center',
            top: 20,
            textStyle: {
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
            },
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}<br/>数值: {c}',
          },
          visualMap: {
            min: 0,
            max: 100,
            left: 'left',
            top: 'bottom',
            text: ['高', '低'],
            textStyle: {
              color: '#fff',
            },
            inRange: {
              color: ['#0d2847', '#0f5298', '#00aaff', '#00ffff'],
            },
            calculable: true,
          },
          series: [
            {
              name: '中国',
              type: 'map',
              map: 'china',
              roam: true,
              zoom: 1.2,
              label: {
                show: true,
                color: '#fff',
                fontSize: 10,
              },
              emphasis: {
                label: {
                  show: true,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 'bold',
                },
                itemStyle: {
                  areaColor: '#00aaff',
                  shadowBlur: 10,
                  shadowColor: 'rgba(0, 150, 255, 0.5)',
                },
              },
              itemStyle: {
                areaColor: '#0d2847',
                borderColor: '#00aaff',
                borderWidth: 1,
              },
              data: mapData,
            },
          ],
        });
        
        setLoading(false);
      })
      .catch((err) => {
        console.error('加载中国地图失败:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: '#00aaff',
        fontSize: 18,
        background: '#0a1628',
      }}>
        加载中国地图数据...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: '#ff4444',
        fontSize: 16,
        background: '#0a1628',
      }}>
        <div>加载失败: {error}</div>
        <button
          onClick={onBack}
          style={{
            marginTop: 20,
            background: 'rgba(0, 100, 200, 0.8)',
            border: '1px solid #00aaff',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          返回地球
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a1628' }}>
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 100,
          background: 'rgba(0, 100, 200, 0.8)',
          border: '1px solid #00aaff',
          color: '#fff',
          padding: '8px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        返回地球
      </button>
      {option && (
        <ReactECharts
          option={option}
          style={{ width: '100%', height: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      )}
    </div>
  );
}
