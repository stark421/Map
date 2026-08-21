import { useState } from 'react';
import Globe3D from './components/Globe/Globe3D';
import ChinaMap from './components/Globe/ChinaMap';
import WorldMap from './components/Globe/WorldMap';
import './App.css';

// 主应用组件
function App() {
  const [view, setView] = useState('globe'); // 'globe' | 'china' | 'world'

  const handleBack = () => setView('globe');

  return (
    <div className="app">
      {view === 'globe' && (
        <Globe3D
          onSwitchChina={() => setView('china')}
          onSwitchWorld={() => setView('world')}
        />
      )}
      {view === 'china' && <ChinaMap onBack={handleBack} />}
      {view === 'world' && <WorldMap onBack={handleBack} />}
    </div>
  );
}

export default App;
