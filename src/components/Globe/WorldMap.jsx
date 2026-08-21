import { useEffect, useState } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { loadWorldGeo } from '../../data/geoLoader';

// 世界地图组件 - 分国边界
export default function WorldMap({ onBack }) {
  const [option, setOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadWorldGeo()
      .then((data) => {
        if (!data) {
          setError('无法加载地图数据');
          setLoading(false);
          return;
        }
        
        console.log('注册世界地图，数据类型:', data.type);
        
        // 注册地图
        echarts.registerMap('world', data);
        
        // 模拟数据
        const mapData = [
          { name: 'China', value: 100 },
          { name: 'United States of America', value: 95 },
          { name: 'Russia', value: 90 },
          { name: 'Canada', value: 85 },
          { name: 'Brazil', value: 80 },
          { name: 'Australia', value: 75 },
          { name: 'India', value: 70 },
          { name: 'Argentina', value: 65 },
          { name: 'Kazakhstan', value: 60 },
          { name: 'Algeria', value: 55 },
          { name: 'France', value: 50 },
          { name: 'Germany', value: 45 },
          { name: 'United Kingdom', value: 40 },
          { name: 'Japan', value: 35 },
          { name: 'South Korea', value: 30 },
          { name: 'Mexico', value: 25 },
          { name: 'Indonesia', value: 20 },
          { name: 'Saudi Arabia', value: 15 },
          { name: 'Turkey', value: 10 },
          { name: 'Egypt', value: 5 },
        ];
        
        setOption({
          backgroundColor: '#0a1628',
          title: {
            text: '世界地图 - 国家/地区',
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
              name: '世界',
              type: 'map',
              map: 'world',
              roam: true,
              zoom: 1.2,
              label: {
                show: false,
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
                borderWidth: 0.5,
              },
              data: mapData,
            },
          ],
        });
        
        setLoading(false);
      })
      .catch((err) => {
        console.error('加载世界地图失败:', err);
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
        加载世界地图数据...
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
