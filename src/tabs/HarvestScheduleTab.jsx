import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { fetchJSON } from '../lib/fetchJSON.js';

// Function to interpret cron expression into human-readable text
function interpretCronExpression(cron) {
  if (!cron || typeof cron !== 'string') return 'Invalid cron expression';
  
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid cron expression format (expected 5 parts)';
  
  const [minute, hour, day, month, dayOfWeek] = parts;
  
  try {
    let result = 'Runs ';
    
    // Determine frequency pattern
    const isEveryMinute = minute === '*';
    const isEveryHour = hour === '*';
    const isEveryDay = day === '*';
    const isEveryMonth = month === '*';
    const isEveryDayOfWeek = dayOfWeek === '*';
    
    // Handle specific day of week
    if (!isEveryDayOfWeek && isEveryDay) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (dayOfWeek.includes('-')) {
        const [start, end] = dayOfWeek.split('-').map(d => parseInt(d));
        result += `on ${dayNames[start]} through ${dayNames[end]} `;
      } else if (dayOfWeek.includes(',')) {
        const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)]);
        result += `on ${days.join(', ')} `;
      } else {
        const dayNum = parseInt(dayOfWeek);
        result += `on ${dayNames[dayNum]} `;
      }
    }
    
    // Handle specific day of month
    if (!isEveryDay && isEveryDayOfWeek) {
      if (day.includes(',')) {
        result += `on days ${day} of the month `;
      } else {
        result += `on day ${day} of the month `;
      }
    }
    
    // Handle month
    if (!isEveryMonth) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      if (month.includes(',')) {
        const months = month.split(',').map(m => monthNames[parseInt(m) - 1]);
        result += `in ${months.join(', ')} `;
      } else {
        result += `in ${monthNames[parseInt(month) - 1]} `;
      }
    }
    
    // Handle time
    if (isEveryHour && isEveryMinute) {
      result += 'every minute';
    } else if (isEveryHour) {
      result += `at minute ${minute} of every hour`;
    } else if (isEveryMinute) {
      if (hour.includes('*/')) {
        const interval = hour.split('*/')[1];
        result += `every ${interval} hours`;
      } else if (hour.includes(',')) {
        result += `every minute during hours ${hour}`;
      } else {
        result += `every minute during hour ${hour}`;
      }
    } else {
      // Specific time
      const h = parseInt(hour);
      const m = parseInt(minute);
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      
      if (hour.includes('*/')) {
        const interval = hour.split('*/')[1];
        result += `at minute ${minute} every ${interval} hours`;
      } else if (hour.includes(',')) {
        result += `at ${timeStr} during hours ${hour}`;
      } else {
        result += `at ${timeStr}`;
      }
    }
    
    // Add daily/weekly context if needed
    if (isEveryDay && isEveryDayOfWeek && isEveryMonth) {
      if (!isEveryHour || !isEveryMinute) {
        result += ' daily';
      }
    }
    
    return result;
  } catch {
    return 'Unable to parse cron expression';
  }
}

export default function HarvestScheduleTab() {
  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [status, setStatus] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ 
    harvester_id: '', 
    datasource_id: '', 
    cron_expression: '' 
  });

  // Lists for dropdowns
  const [harvesters, setHarvesters] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  
  // Import form state
  const [showingImportForm, setShowingImportForm] = useState(false);
  const [importData, setImportData] = useState({
    from: '',
    to: '',
    screenshots: false,
    images: false
  });
  const [importing, setImporting] = useState(false);

  const leftRef = useRef(null);

  // Load harvest schedules
  const reloadSchedules = useCallback(async () => {
    try {
      const d = await fetchJSON('/api/v1/harvest-schedule');
      const items = Array.isArray(d) ? d : (d?.items ?? []);
      setSchedules(items);
      setStatus(`Harvest schedules loaded: ${items.length}`);
    } catch {
      setSchedules([]);
      setStatus('Error loading harvest schedules');
    }
  }, []);

  // Load harvesters for dropdown with status check
  const loadHarvesters = useCallback(async () => {
    try {
      const d = await fetchJSON('/api/v1/harvesters');
      const items = Array.isArray(d) ? d : (d?.items ?? []);
      
      // Check status for each harvester
      const harvestersWithStatus = await Promise.all(
        items.map(async (harvester) => {
          try {
            const status = await fetchJSON(`/api/v1/harvesters/${harvester.id}/status`);
            return {
              ...harvester,
              status,
              isOnline: true
            };
          } catch {
            return {
              ...harvester,
              status: { error: "Harvester API unavailable" },
              isOnline: false
            };
          }
        })
      );
      
      setHarvesters(harvestersWithStatus);
    } catch {
      setHarvesters([]);
    }
  }, []);

  // Load data sources for dropdown
  const loadDataSources = useCallback(async () => {
    try {
      const d = await fetchJSON('/api/v1/data-sources');
      const items = Array.isArray(d) ? d : (d?.items ?? []);
      setDataSources(items);
    } catch {
      setDataSources([]);
    }
  }, []);

  useEffect(() => { 
    reloadSchedules(); 
    loadHarvesters();
    loadDataSources();
  }, [reloadSchedules, loadHarvesters, loadDataSources]);

  // Grid columns
  const cols = useMemo(() => ([
    { headerName: 'ID', field: 'id', width: 90 },
    { headerName: 'Harvester', field: 'harvester_name', flex: 1, minWidth: 150 },
    { headerName: 'Data Source', field: 'datasource_name', flex: 1, minWidth: 150 },
    { headerName: 'Cron Expression', field: 'cron_expression', width: 150 },
    { 
      headerName: 'Data Transferred', 
      field: 'lastImport', 
      width: 180,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        try {
          return new Date(params.value).toISOString().split('T').join(' ').split('.')[0];
        } catch {
          return params.value;
        }
      }
    },
  ]), []);
  
  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true }), []);
  const onRowClicked = useCallback((e) => {
    setActiveSchedule(e.data);
    setEditData({
      harvester_id: e.data.harvester_id || '',
      datasource_id: e.data.datasource_id || '',
      cron_expression: e.data.cron_expression || ''
    });
  }, []);

  // Add harvest schedule
  const handleAdd = useCallback(async () => {
    if (!editData.harvester_id || !editData.datasource_id || !editData.cron_expression?.trim()) return;
    try {
      await fetchJSON('/api/v1/harvest-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          harvester_id: parseInt(editData.harvester_id),
          datasource_id: parseInt(editData.datasource_id),
          cron_expression: editData.cron_expression.trim()
        }),
      });
      setEditData({ harvester_id: '', datasource_id: '', cron_expression: '' });
      setAdding(false);
      await reloadSchedules();
    } catch {
      alert('Error adding harvest schedule');
    }
  }, [editData, reloadSchedules]);

  // Delete harvest schedule
  const handleDelete = useCallback(async () => {
    if (!activeSchedule) return;
    if (!confirm(`Delete harvest schedule for "${activeSchedule.harvester_name}" -> "${activeSchedule.datasource_name}"?`)) return;
    try {
      await fetchJSON(`/api/v1/harvest-schedule/${activeSchedule.id}`, { method: 'DELETE' });
      setActiveSchedule(null);
      await reloadSchedules();
    } catch {
      alert('Error deleting harvest schedule');
    }
  }, [activeSchedule, reloadSchedules]);

  // Update harvest schedule
  const handleUpdate = useCallback(async () => {
    if (!activeSchedule || !editData.harvester_id || !editData.datasource_id || !editData.cron_expression?.trim()) return;
    try {
      const updateData = {
        harvester_id: parseInt(editData.harvester_id),
        datasource_id: parseInt(editData.datasource_id),
        cron_expression: editData.cron_expression.trim()
      };
      
      await fetchJSON(`/api/v1/harvest-schedule/${activeSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      setEditing(false);
      await reloadSchedules();
      // Update active schedule with new data
      setActiveSchedule({...activeSchedule, ...updateData});
    } catch {
      alert('Error updating harvest schedule');
    }
  }, [activeSchedule, editData, reloadSchedules]);

  // Import data from harvester
  const handleImport = useCallback(async () => {
    if (!activeSchedule) return;
    
    setImporting(true);
    try {
      const params = new URLSearchParams();
      // Convert datetime-local format to ISO 8601
      if (importData.from) {
        const fromDate = new Date(importData.from);
        params.append('from', fromDate.toISOString());
      }
      if (importData.to) {
        const toDate = new Date(importData.to);
        params.append('to', toDate.toISOString());
      }
      if (importData.screenshots) params.append('screenshots', 'true');
      if (importData.images) params.append('images', 'true');
      
      const queryString = params.toString();
      const url = `/api/v1/harvest-schedule/import/${activeSchedule.id}${queryString ? `?${queryString}` : ''}`;
      
      await fetchJSON(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      alert('Import started successfully!');
      setShowingImportForm(false);
      setImportData({ from: '', to: '', screenshots: false, images: false });
      await reloadSchedules();
    } catch (error) {
      alert('Error starting import: ' + (error.message || 'Unknown error'));
    } finally {
      setImporting(false);
    }
  }, [activeSchedule, importData, reloadSchedules]);

  // Get harvester status
  const getHarvesterStatus = useCallback(() => {
    if (!activeSchedule || !harvesters.length) return null;
    const harvester = harvesters.find(h => h.id === activeSchedule.harvester_id);
    return harvester;
  }, [activeSchedule, harvesters]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 12px' }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Harvest Schedules</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {adding ? (
            <>
              <button
                onClick={() => {
                  setAdding(false);
                  setEditData({ harvester_id: '', datasource_id: '', cron_expression: '' });
                }}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#6b7280', color: '#fff', border: 'none' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#22c55e', color: '#fff', border: 'none' }}
              >
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{ padding: '6px 12px', borderRadius: 8, background: '#22c55e', color: '#fff', border: 'none' }}
            >
              + Add Schedule
            </button>
          )}
          
          <button
            onClick={handleDelete}
            disabled={!activeSchedule}
            style={{
              padding: '6px 12px',
              border: '1px solid #dc2626',
              background: !activeSchedule ? '#fecaca' : '#dc2626',
              color: '#fff',
              borderRadius: 8,
              cursor: !activeSchedule ? 'not-allowed' : 'pointer'
            }}
          >
            Delete
          </button>

          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {status || (activeSchedule ? `Selected: ${activeSchedule.harvester_name} -> ${activeSchedule.datasource_name}` : 'Select schedule')}
          </div>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ margin: '0 12px 12px', padding: 16, border: '1px solid #d1d5db', borderRadius: 8, background: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Harvester</label>
              <select
                value={editData.harvester_id}
                onChange={(e) => setEditData({...editData, harvester_id: e.target.value})}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
              >
                <option value="">Select Harvester</option>
                {harvesters.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Data Source</label>
              <select
                value={editData.datasource_id}
                onChange={(e) => setEditData({...editData, datasource_id: e.target.value})}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
              >
                <option value="">Select Data Source</option>
                {dataSources.map(ds => (
                  <option key={ds.id} value={ds.id}>{ds.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Cron Expression
                <span 
                  style={{ 
                    marginLeft: 8, 
                    color: '#6b7280', 
                    fontSize: 12, 
                    cursor: 'help' 
                  }}
                  title="Format: minute hour day month dayOfWeek&#10;&#10;Examples:&#10;0 0 * * * - Every day at midnight&#10;0 9 * * 1-5 - Weekdays at 9 AM&#10;0 */6 * * * - Every 6 hours&#10;30 2 1 * * - 1st day of month at 2:30 AM&#10;0 8,20 * * * - Daily at 8 AM and 8 PM"
                >
                  (min hour day month day_of_week)
                </span>
              </label>
              <input
                type="text"
                value={editData.cron_expression}
                onChange={(e) => setEditData({...editData, cron_expression: e.target.value})}
                placeholder="0 0 * * *"
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Two columns: schedules list | details */}
      <div style={{ height: 'calc(100% - 40px)', display: 'flex', gap: 12, padding: '0 12px' }}>
        {/* LEFT - Schedules list */}
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
              rowData={schedules}
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

        {/* RIGHT - Schedule details */}
        <section
          style={{
            flex: 1, minWidth: 0, minHeight: 0, height: '100%',
            border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff'
          }}
        >
          {!activeSchedule && <div style={{ color: '#6b7280' }}>Select a harvest schedule to view details...</div>}
          
          {activeSchedule && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Schedule Details</h3>
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
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Harvester</label>
                    <select
                      value={editData.harvester_id}
                      onChange={(e) => setEditData({...editData, harvester_id: e.target.value})}
                      style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                    >
                      <option value="">Select Harvester</option>
                      {harvesters.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Data Source</label>
                    <select
                      value={editData.datasource_id}
                      onChange={(e) => setEditData({...editData, datasource_id: e.target.value})}
                      style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                    >
                      <option value="">Select Data Source</option>
                      {dataSources.map(ds => (
                        <option key={ds.id} value={ds.id}>{ds.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                      Cron Expression
                      <span 
                        style={{ 
                          marginLeft: 8, 
                          color: '#6b7280', 
                          fontSize: 12, 
                          cursor: 'help' 
                        }}
                        title="Format: minute hour day month dayOfWeek&#10;&#10;Examples:&#10;0 0 * * * - Every day at midnight&#10;0 9 * * 1-5 - Weekdays at 9 AM&#10;0 */6 * * * - Every 6 hours&#10;30 2 1 * * - 1st day of month at 2:30 AM&#10;0 8,20 * * * - Daily at 8 AM and 8 PM"
                      >
                        (min hour day month day_of_week)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={editData.cron_expression}
                      onChange={(e) => setEditData({...editData, cron_expression: e.target.value})}
                      placeholder="0 0 * * *"
                      style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
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
                    <strong>ID:</strong> {activeSchedule.id}
                  </div>
                  <div>
                    <strong>Harvester:</strong> {activeSchedule.harvester_name} (ID: {activeSchedule.harvester_id})
                  </div>
                  <div>
                    <strong>Data Source:</strong> {activeSchedule.datasource_name} (ID: {activeSchedule.datasource_id})
                  </div>
                  <div>
                    <strong>Cron Expression:</strong>
                    <span 
                      style={{ 
                        marginLeft: 8, 
                        color: '#6b7280', 
                        fontSize: 12, 
                        cursor: 'help' 
                      }}
                      title="Format: minute hour day month dayOfWeek&#10;&#10;Examples:&#10;0 0 * * * - Every day at midnight&#10;0 9 * * 1-5 - Weekdays at 9 AM&#10;0 */6 * * * - Every 6 hours&#10;30 2 1 * * - 1st day of month at 2:30 AM&#10;0 8,20 * * * - Daily at 8 AM and 8 PM"
                    >
                      (min hour day month day_of_week)
                    </span>
                    <br />
                    <code style={{ 
                      marginLeft: 0, 
                      padding: '2px 6px', 
                      background: '#f1f5f9', 
                      borderRadius: 4,
                      fontFamily: 'monospace'
                    }}>
                      {activeSchedule.cron_expression}
                    </code>
                    <div style={{ 
                      marginTop: 4, 
                      padding: '8px 12px', 
                      background: '#f0f9ff', 
                      border: '1px solid #bae6fd',
                      borderRadius: 4,
                      fontSize: 13,
                      color: '#0369a1'
                    }}>
                      {interpretCronExpression(activeSchedule.cron_expression)}
                    </div>
                  </div>
                  {activeSchedule.lastImport && (
                    <div>
                      <strong>Last Data Tranfer:</strong>
                      <div style={{ 
                        marginTop: 4, 
                        padding: '8px 12px', 
                        background: '#f0fdf4', 
                        border: '1px solid #bbf7d0',
                        borderRadius: 4,
                        fontSize: 14,
                        color: '#166534'
                      }}>
                        {new Date(activeSchedule.lastImport).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {!activeSchedule.lastImport && (
                    <div>
                      <strong>Last Data Trasfer:</strong>
                      <div style={{ 
                        marginTop: 4, 
                        padding: '8px 12px', 
                        background: '#fef3c7', 
                        border: '1px solid #fde68a',
                        borderRadius: 4,
                        fontSize: 14,
                        color: '#92400e'
                      }}>
                        No import yet
                      </div>
                    </div>
                  )}

                  {/* Import Data Section */}
                  <div style={{ 
                    marginTop: 16, 
                    paddingTop: 16, 
                    borderTop: '1px solid #e5e7eb' 
                  }}>
                    <strong>Import Data from Harvester</strong>
                    {(() => {
                      const harvester = getHarvesterStatus();
                      const isOnline = harvester?.isOnline || false;
                      
                      return (
                        <div style={{ marginTop: 8 }}>
                          <button
                            onClick={() => setShowingImportForm(true)}
                            disabled={!isOnline}
                            style={{
                              padding: '8px 16px',
                              background: isOnline ? '#3b82f6' : '#9ca3af',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              cursor: isOnline ? 'pointer' : 'not-allowed',
                              fontWeight: 500,
                            }}
                          >
                            Import Data from Harvester
                          </button>
                          {!isOnline && (
                            <div style={{ 
                              marginTop: 8, 
                              padding: '8px 12px',
                              background: '#fee2e2',
                              border: '1px solid #fecaca',
                              borderRadius: 4,
                              fontSize: 13,
                              color: '#991b1b'
                            }}>
                              Harvester API unavailable - harvester is offline
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Import Data Modal */}
      {showingImportForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Import Data from Harvester</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                  From (optional)
                </label>
                <input
                  type="datetime-local"
                  value={importData.from}
                  onChange={(e) => setImportData({...importData, from: e.target.value})}
                  style={{
                    width: '100%',
                    padding: 10,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
                <small style={{ color: '#6b7280', fontSize: 12, marginTop: 4, display: 'block' }}>
                  Start date for filtering data
                </small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                  To (optional)
                </label>
                <input
                  type="datetime-local"
                  value={importData.to}
                  onChange={(e) => setImportData({...importData, to: e.target.value})}
                  style={{
                    width: '100%',
                    padding: 10,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
                <small style={{ color: '#6b7280', fontSize: 12, marginTop: 4, display: 'block' }}>
                  End date for filtering data
                </small>
              </div>

              <div style={{ 
                padding: 12, 
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: 6
              }}>
                <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Content Types</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={importData.screenshots}
                      onChange={(e) => setImportData({...importData, screenshots: e.target.checked})}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14 }}>Include price screenshots</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={importData.images}
                      onChange={(e) => setImportData({...importData, images: e.target.checked})}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14 }}>Include product images</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    background: importing ? '#9ca3af' : '#22c55e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: importing ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    fontSize: 14
                  }}
                >
                  {importing ? 'Importing...' : 'Start Import'}
                </button>
                <button
                  onClick={() => {
                    setShowingImportForm(false);
                    setImportData({ from: '', to: '', screenshots: false, images: false });
                  }}
                  disabled={importing}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    background: '#fff',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    cursor: importing ? 'not-allowed' : 'pointer',
                    fontSize: 14
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}