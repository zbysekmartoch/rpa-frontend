import React, { useState } from 'react';
import HarvestersTab from './HarvestersTab.jsx';
import DataSourcesTab from './DataSourcesTab.jsx';
import HarvestScheduleTab from './HarvestScheduleTab.jsx';
import ToolsTab from './ToolsTab.jsx';

export default function HarvestTab() {
  const [activeSubTab, setActiveSubTab] = useState('harvesters');

  const SubTabButton = ({ id, children }) => (
    <button
      onClick={() => setActiveSubTab(id)}
      style={{
        padding: '8px 16px',
        border: '1px solid #e5e7eb',
        borderBottom: 'none',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        background: activeSubTab === id ? '#fff' : '#f3f4f6',
        fontWeight: activeSubTab === id ? 600 : 400,
        color: '#111827',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-tabs navigation */}
      <div style={{ display: 'flex', gap: 2, marginBottom: -1 }}>
        <SubTabButton id="harvesters">Harvesters</SubTabButton>
        <SubTabButton id="datasources">Data Sources</SubTabButton>
        <SubTabButton id="schedule">Harvest Schedule</SubTabButton>
        <SubTabButton id="tools">Tools</SubTabButton>
      </div>

      {/* Sub-tab content */}
      <div style={{
        flex: 1,
        border: '1px solid #e5e7eb',
        borderRadius: '0 8px 8px 8px',
        background: '#fff',
        overflow: 'hidden'
      }}>
        {activeSubTab === 'harvesters' && <HarvestersTab />}
        {activeSubTab === 'datasources' && <DataSourcesTab />}
        {activeSubTab === 'schedule' && <HarvestScheduleTab />}
        {activeSubTab === 'tools' && <ToolsTab />}
      </div>
    </div>
  );
}