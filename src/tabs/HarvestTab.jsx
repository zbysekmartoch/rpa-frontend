/**
 * Harvest Tab Container
 * Main component with sub-tabs for harvesters, data sources, scheduling, and tools
 */
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
        padding: '8px 12px',
        border: '1px solid #012345',
        borderBottom: 'none',
        //borderBottom: tab === id ? 'none' : '1px solid #012345',
        marginBottom: activeSubTab === id ? -1 : 0,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        background: activeSubTab === id ? '#fff' : '#f3f4f6',
        fontWeight: activeSubTab === id ? 600 : 400,
        color: '#111827',
        zIndex: activeSubTab === id ? 1 : 0
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-tabs navigation */}
      <div style={{ display: 'flex', gap: 2 }}>
        <SubTabButton id="harvesters">Harvesters</SubTabButton>
        <SubTabButton id="datasources">Data Sources</SubTabButton>
        <SubTabButton id="schedule">Harvest Schedule</SubTabButton>
        <SubTabButton id="tools">Tools</SubTabButton>
      </div>

      {/* Sub-tab content */}
      <div style={{
        flex: 1,
        border: '1px solid #012345',
        borderRadius: '0 8px 8px 8px',
        background: '#fff',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* All tabs rendered but hidden to preserve state */}
        <div style={{ height: '100%', display: activeSubTab === 'harvesters' ? 'block' : 'none' }}>
          <HarvestersTab />
        </div>
        <div style={{ height: '100%', display: activeSubTab === 'datasources' ? 'block' : 'none' }}>
          <DataSourcesTab />
        </div>
        <div style={{ height: '100%', display: activeSubTab === 'schedule' ? 'block' : 'none' }}>
          <HarvestScheduleTab />
        </div>
        <div style={{ height: '100%', display: activeSubTab === 'tools' ? 'block' : 'none' }}>
          <ToolsTab />
        </div>
      </div>
    </div>
  );
}