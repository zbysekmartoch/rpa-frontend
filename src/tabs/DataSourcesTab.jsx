/**
 * Data Sources Tab
 * Manage data sources with URL configurations for harvesting
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { fetchJSON } from '../lib/fetchJSON.js';
import { defaultColDef, commonGridProps, getGridContainerStyle } from '../lib/gridConfig.js';

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
  
  const onRowClicked = useCallback((e) => {
    setActiveSource(e.data);
    // Convert urls array to string for editing
    setEditData({
      ...e.data,
      urls: Array.isArray(e.data.urls) ? e.data.urls.join('\n') : (e.data.urls || '')
    });
  }, []);
  
  // Redraw rows when active source changes to update row styling
  useEffect(() => {
    if (leftRef.current?.api) {
      leftRef.current.api.redrawRows();
    }
  }, [activeSource]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 , paddingTop: 4 }}>
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
                className="btn btn-add"
                onClick={handleAdd}
                disabled={!newName.trim()}
              >
                Add
              </button>
              <button
                className="btn btn-cancel"
                onClick={() => { setAdding(false); setNewName(''); }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="btn btn-add"
              onClick={() => setAdding(true)}
            >
              + Add Data Source
            </button>
          )}
          
          <button
            className="btn btn-delete"
            onClick={handleDelete}
            disabled={!activeSource}
          >
            Delete
          </button>

          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {status || (activeSource ? `Selected: ${activeSource.name}` : 'Select data source')}
          </div>
        </div>
      </div>

      {/* Two columns: data sources list | details */}
      <div style={{ height: 'calc(100% - 50px)', display: 'flex', gap: 12, padding: '0 12px' }}>
        {/* LEFT - Data sources list */}
        <section
          style={{
            width: 700, minWidth: 600, height: '100%',
      //      border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, overflow: 'hidden', background: '#fff'
          }}
        >
          <div className="ag-theme-quartz" style={getGridContainerStyle()}>
            <AgGridReact
              {...commonGridProps}
              ref={leftRef}
              rowData={dataSources}
              columnDefs={cols}
              defaultColDef={defaultColDef}
              rowSelection={{ mode: 'singleRow' }}
              onRowClicked={onRowClicked}
              getRowClass={(params) => params.data?.id === activeSource?.id ? 'ag-row-active' : ''}
              tooltipShowDelay={300}
            />
          </div>
        </section>

        {/* RIGHT - Data source details */}
        <section
          style={{
            flex: 1, minWidth: 0, minHeight: 0, height: 'calc(100% - 34px)',
            border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff'
          }}
        >
          {!activeSource && <div style={{ color: '#6b7280' }}>Select a data source to view details...</div>}
          
          {activeSource && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Data Source Details</h3>
                <button
                  className={editing ? "btn btn-warning" : "btn btn-edit"}
                  onClick={() => setEditing(!editing)}
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
                    className="btn btn-add"
                    onClick={handleUpdate}
                    style={{ alignSelf: 'flex-start' }}
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