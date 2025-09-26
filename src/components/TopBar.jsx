// src/components/TopBar.jsx
import React from 'react';

export default function TopBar({ mode, onModeChange, displayedCount, selectedCount }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{ fontSize: 18, fontWeight: 600 }}>Product Category Explorer</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <span style={{ fontSize: 14 }}>Zobrazení</span>
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none' }}
          >
            <option value="active">Aktivní kategorie</option>
            <option value="selected">Označené kategorie</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#374151', background: '#f3f4f6', padding: '4px 8px', borderRadius: 8 }}>
            Zobrazeno: <b>{displayedCount}</b>
          </span>
          <span style={{ fontSize: 13, color: '#374151', background: '#eef2ff', padding: '4px 8px', borderRadius: 8 }}>
            Označeno: <b>{selectedCount}</b>
          </span>
        </div>
      </div>
    </div>
  );
}
