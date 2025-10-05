import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { fetchJSON } from '../lib/fetchJSON.js';

export default function DataSourcesTab() {
  const [dataSources, setDataSources] = useState([]);
  const [activeSource, setActiveSource] = useState(null);
  const [status, setStatus] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', urls: '' });

  const leftRef = useRef(null);

  // Load data sources
  const reloadDataSources = useCallback(async () => {
    try {
      const d = await fetchJSON('/api/v1/data-sources');
      const items = Array.isArray(d) ? d : (d?.items ?? []);
      setDataSources(items);
      setStatus(`Data sources loaded: ${items.length}`);
    } catch {
      setDataSources([]);
      setStatus('Error loading data sources');
    }
  }, []);

  useEffect(() => { reloadDataSources(); }, [reloadDataSources]);

  // Grid columns
  const cols = useMemo(() => ([
    { headerName: 'ID', field: 'id', width: 90 },
    { headerName: 'Name', field: 'name', flex: 1, minWidth: 200 },
    { 
      headerName: 'URLs', 
      field: 'urls', 
      flex: 2, 
      minWidth: 300,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        // Handle both array and string formats
        const urlList = Array.isArray(params.value) 
          ? params.value.filter(url => url.trim())
          : params.value.split('\n').filter(url => url.trim());
        return urlList.length > 1 
          ? `${urlList[0]} (+${urlList.length - 1} more)`
          : urlList[0] || '-';
      }
    },
  ]), []);
  
  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true }), []);
  const onRowClicked = useCallback((e) => {
    setActiveSource(e.data);
    // Convert urls array to string for editing
    setEditData({
      ...e.data,
      urls: Array.isArray(e.data.urls) ? e.data.urls.join('\n') : (e.data.urls || '')
    });
  }, []);

  // Add data source
  const handleAdd = useCallback(async () => {
    if (!newName.trim()) return;
    try {
      await fetchJSON('/api/v1/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName.trim(),
          urls: []
        }),
      });
      setNewName('');
      setAdding(false);
      await reloadDataSources();
    } catch {
      alert('Error adding data source');
    }
  }, [newName, reloadDataSources]);

  // Delete data source
  const handleDelete = useCallback(async () => {
    if (!activeSource) return;
    if (!confirm(`Delete data source "${activeSource.name}"?`)) return;
    try {
      await fetchJSON(`/api/v1/data-sources/${activeSource.id}`, { method: 'DELETE' });
      setActiveSource(null);
      await reloadDataSources();
    } catch {
      alert('Error deleting data source');
    }
  }, [activeSource, reloadDataSources]);

  // Update data source
  const handleUpdate = useCallback(async () => {
    if (!activeSource || !editData.name?.trim()) return;
    try {
      // Convert URLs string to array for API
      const urlsArray = editData.urls ? editData.urls.split('\n').filter(url => url.trim()) : [];
      const updateData = {
        name: editData.name.trim(),
        urls: urlsArray
      };
      
      await fetchJSON(`/api/v1/data-sources/${activeSource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      setEditing(false);
      await reloadDataSources();
      // Update active source with new data
      setActiveSource({...activeSource, ...updateData});
    } catch {
      alert('Error updating data source');
    }
  }, [activeSource, editData, reloadDataSources]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 12px' }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Data Sources</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Add data source */}
          {adding ? (
            <>
              <input
                autoFocus
                type="text"
                placeholder="Data source name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') { setAdding(false); setNewName(''); }
                }}
                style={{ padding: 4, borderRadius: 6, border: '1px solid #ccc', minWidth: 150 }}
              />
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#22c55e', color: '#fff', border: 'none' }}
              >
                Add
              </button>
              <button
                onClick={() => { setAdding(false); setNewName(''); }}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#f3f4f6', color: '#374151', border: 'none' }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{ padding: '6px 12px', borderRadius: 8, background: '#22c55e', color: '#fff', border: 'none' }}
            >
              + Add Data Source
            </button>
          )}
          
          <button
            onClick={handleDelete}
            disabled={!activeSource}
            style={{
              padding: '6px 12px',
              border: '1px solid #dc2626',
              background: !activeSource ? '#fecaca' : '#dc2626',
              color: '#fff',
              borderRadius: 8,
              cursor: !activeSource ? 'not-allowed' : 'pointer'
            }}
          >
            Delete
          </button>

          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {status || (activeSource ? `Selected: ${activeSource.name}` : 'Select data source')}
          </div>
        </div>
      </div>

      {/* Two columns: data sources list | details */}
      <div style={{ height: 'calc(100% - 40px)', display: 'flex', gap: 12, padding: '0 12px' }}>
        {/* LEFT - Data sources list */}
        <section
          style={{
            width: 700, minWidth: 600, height: '100%',
            border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, overflow: 'hidden', background: '#fff'
          }}
        >
          <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
            <AgGridReact
              theme="legacy"
              ref={leftRef}
              rowData={dataSources}
              columnDefs={cols}
              defaultColDef={defaultColDef}
              animateRows={false}
              headerHeight={36}
              domLayout="normal"
              rowSelection={{ mode: 'singleRow' }}
              onRowClicked={onRowClicked}
            />
          </div>
        </section>

        {/* RIGHT - Data source details */}
        <section
          style={{
            flex: 1, minWidth: 0, minHeight: 0, height: '100%',
            border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff'
          }}
        >
          {!activeSource && <div style={{ color: '#6b7280' }}>Select a data source to view details...</div>}
          
          {activeSource && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Data Source Details</h3>
                <button
                  onClick={() => setEditing(!editing)}
                  style={{
                    padding: '6px 12px',
                    background: editing ? '#f59e0b' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4
                  }}
                >
                  {editing ? 'View' : 'Edit'}
                </button>
              </div>

              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Name</label>
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>URLs (one per line)</label>
                    <textarea
                      value={editData.urls || ''}
                      onChange={(e) => setEditData({...editData, urls: e.target.value})}
                      placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://api.example.com/data"
                      rows={6}
                      style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontFamily: 'monospace' }}
                    />
                  </div>
                  <button
                    onClick={handleUpdate}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '8px 16px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <strong>ID:</strong> {activeSource.id}
                  </div>
                  <div>
                    <strong>Name:</strong> {activeSource.name}
                  </div>
                  <div>
                    <strong>URLs:</strong>
                    <div style={{ marginTop: 8 }}>
                      {activeSource.urls && activeSource.urls.length > 0 ? (
                        Array.isArray(activeSource.urls) 
                          ? activeSource.urls.filter(url => url.trim()).map((url, index) => (
                              <div key={index} style={{ marginBottom: 4 }}>
                                {url.trim().startsWith('#') ? (
                                  <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>
                                    {url.trim()}
                                  </span>
                                ) : (
                                  <a href={url.trim()} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: 14 }}>
                                    {url.trim()}
                                  </a>
                                )}
                              </div>
                            ))
                          : activeSource.urls.split('\n').filter(url => url.trim()).map((url, index) => (
                              <div key={index} style={{ marginBottom: 4 }}>
                                {url.trim().startsWith('#') ? (
                                  <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>
                                    {url.trim()}
                                  </span>
                                ) : (
                                  <a href={url.trim()} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: 14 }}>
                                    {url.trim()}
                                  </a>
                                )}
                              </div>
                            ))
                      ) : (
                        <div style={{ color: '#6b7280', fontStyle: 'italic' }}>No URLs configured</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}