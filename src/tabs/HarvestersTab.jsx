/**
 * Harvesters Tab
 * Manage and monitor data harvesters with status checking
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { fetchJSON } from '../lib/fetchJSON.js';
import { defaultColDef, commonGridProps, getGridContainerStyle } from '../lib/gridConfig.js';
import { useToast } from '../components/Toast';

// Status check interval in milliseconds (1 minute)
const STATUS_CHECK_INTERVAL = 60 * 1000;

export default function HarvestersTab() {
  const toast = useToast();
  const [harvesters, setHarvesters] = useState([]);
  const [activeHarvester, setActiveHarvester] = useState(null);
  const [status, setStatus] = useState('');

  const leftRef = useRef(null);
  const checkStatusRef = useRef(null);

  // Load harvesters
  const reloadHarvesters = useCallback(async () => {
    try {
      const d = await fetchJSON('/api/v1/harvesters');
      const items = Array.isArray(d) ? d : (d?.items ?? []);
      setHarvesters(items);
      setStatus(`Harvesters loaded: ${items.length}`);
    } catch {
      setHarvesters([]);
      setStatus('Error loading harvesters');
    }
  }, []);

  useEffect(() => { reloadHarvesters(); }, [reloadHarvesters]);

  // Check status of all harvesters
  const checkAllHarvestersStatus = useCallback(async () => {
    // Get current harvesters from state
    setHarvesters(currentHarvesters => {
      if (currentHarvesters.length === 0) return currentHarvesters;
      
      setStatus('Checking harvesters status...');
      
      // Check status for all harvesters in parallel
      const statusChecks = currentHarvesters.map(async (harvester) => {
        try {
          const response = await fetchJSON(`/api/v1/harvesters/${harvester.id}/status`);
          return {
            ...harvester,
            status: response, // Use response directly
            isOnline: true
          };
        } catch {
          // If API is unavailable, mark as offline
          return {
            ...harvester,
            status: { error: "Harvester API unavailable" },
            isOnline: false
          };
        }
      });

      Promise.all(statusChecks).then(updatedHarvesters => {
        setHarvesters(updatedHarvesters);
        
        const onlineCount = updatedHarvesters.filter(h => h.isOnline).length;
        const offlineCount = updatedHarvesters.length - onlineCount;
        setStatus(`Status updated: ${onlineCount} online, ${offlineCount} offline`);
      }).catch(() => {
        setStatus('Error checking harvesters status');
      });

      return currentHarvesters; // Return current state unchanged
    });
  }, []); // Remove harvesters dependency

  // Store reference to avoid useEffect dependency issues  
  checkStatusRef.current = checkAllHarvestersStatus;

  // Auto-refresh status on mount and every minute
  const hasHarvesters = harvesters.length > 0;
  useEffect(() => {
    // Initial status check after harvesters are loaded
    if (hasHarvesters && checkStatusRef.current) {
      checkStatusRef.current();
    }
  }, [hasHarvesters]); // Remove checkAllHarvestersStatus dependency

  useEffect(() => {
    // Set up interval for periodic status checks only once
    const interval = setInterval(() => {
      if (checkStatusRef.current) {
        checkStatusRef.current();
      }
    }, STATUS_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - interval set only once

  // Grid columns - updated for new API structure
  const cols = useMemo(() => ([
    { headerName: 'ID', field: 'id', width: 90 },
    { headerName: 'Name', field: 'name', flex: 1, minWidth: 180 },
    { 
      headerName: 'Host', 
      field: 'host', 
      width: 150,
      cellStyle: (params) => {
        if (params.data.isOnline === true) {
          return { backgroundColor: '#dcfce7', color: '#166534' }; // Green for online
        } else if (params.data.isOnline === false) {
          return { backgroundColor: '#fee2e2', color: '#991b1b' }; // Red for offline
        }
        return null; // Default styling for unknown status
      }
    },
    { headerName: 'Upload (MB/s)', field: 'upload', width: 120, cellRenderer: (params) => params.value ? `${params.value}` : '-' },
    { headerName: 'Download (MB/s)', field: 'download', width: 130, cellRenderer: (params) => params.value ? `${params.value}` : '-' },
    { headerName: 'Ping (ms)', field: 'ping', width: 100, cellRenderer: (params) => params.value ? `${params.value}` : '-' },
    { 
      headerName: 'Started At', 
      field: 'startedAt', 
      width: 150,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        try {
          return new Date(params.value).toLocaleString();
        } catch {
          return params.value;
        }
      }
    }
  ]), []);
  
  const onRowClicked = useCallback((e) => {
    setActiveHarvester(e.data);
  }, []);
  
  // Redraw rows when active harvester changes to update row styling
  useEffect(() => {
    if (leftRef.current?.api) {
      leftRef.current.api.redrawRows();
    }
  }, [activeHarvester]);

  // Delete harvester
  const handleDelete = useCallback(async () => {
    if (!activeHarvester) return;
    if (!confirm(`Delete harvester "${activeHarvester.name}"?`)) return;
    try {
      await fetchJSON(`/api/v1/harvesters/${activeHarvester.id}`, { method: 'DELETE' });
      setActiveHarvester(null);
      await reloadHarvesters();
    } catch {
      toast.error('Error deleting harvester');
    }
  }, [activeHarvester, reloadHarvesters, toast]);

  // Get live status from harvester API - renamed to Refresh Status
  const handleRefreshStatus = useCallback(async () => {
    if (!activeHarvester) return;
    try {
      setStatus('Refreshing status...');
      const response = await fetchJSON(`/api/v1/harvesters/${activeHarvester.id}/status`);
      setStatus('Status refreshed');
      
      // Update the active harvester with fresh status and online status
      const updatedHarvester = {
        ...activeHarvester, 
        status: response,
        isOnline: true
      };
      setActiveHarvester(updatedHarvester);
      
      // Also update in the harvesters list
      setHarvesters(prev => prev.map(h => 
        h.id === activeHarvester.id ? updatedHarvester : h
      ));
    } catch {
      setStatus('Failed to refresh status');
      
      // Mark as offline
      const updatedHarvester = {
        ...activeHarvester,
        status: { error: "Harvester API unavailable" },
        isOnline: false
      };
      setActiveHarvester(updatedHarvester);
      
      // Also update in the harvesters list
      setHarvesters(prev => prev.map(h => 
        h.id === activeHarvester.id ? updatedHarvester : h
      ));
    }
  }, [activeHarvester]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar with limited operations */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 12px' }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Data Harvesters</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 , paddingTop: 4 }}>
          
          <button
            className="btn btn-warning"
            onClick={handleRefreshStatus}
            disabled={!activeHarvester}
          >
            Refresh Status
          </button>

          <button
            className="btn btn-delete"
            onClick={handleDelete}
            disabled={!activeHarvester}
          >
            Delete
          </button>

          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {status || (activeHarvester ? `Selected: ${activeHarvester.name}` : 'Select harvester')}
          </div>
        </div>
      </div>

      {/* Two columns: harvesters list | details */}
      <div style={{ height: 'calc(100% - 50px)', display: 'flex', gap: 12, padding: '0 12px' }}>
        {/* LEFT - Harvesters list */}
        <section
          style={{
            width: 650, minWidth: 550, height: '100%',
          //  border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, overflow: 'hidden', background: '#fff'
          }}
        >
          <div className="ag-theme-quartz" style={getGridContainerStyle()}>
            <AgGridReact
              {...commonGridProps}
              ref={leftRef}
              rowData={harvesters}
              columnDefs={cols}
              defaultColDef={defaultColDef}
              rowSelection={{ mode: 'singleRow' }}
              onRowClicked={onRowClicked}
              getRowClass={(params) => params.data?.id === activeHarvester?.id ? 'ag-row-active' : ''}
              tooltipShowDelay={300}
            />
          </div>
        </section>

        {/* RIGHT - Harvester details with editing */}
        <section
          style={{
            flex: 1, minWidth: 0, minHeight: 0, height: 'calc(100% - 34px)' ,
            border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff'
          }}
        >
          {!activeHarvester && <div style={{ color: '#6b7280' }}>Select a harvester to view details...</div>}
          
          {activeHarvester && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Harvester Details</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <strong>ID:</strong> {activeHarvester.id}
                </div>
                  <div>
                    <strong>Name:</strong> {activeHarvester.name}
                  </div>
                  <div>
                    <strong>Host:</strong> {activeHarvester.host}
                  </div>
                  {activeHarvester.startedAt && (
                    <div>
                      <strong>Started At:</strong> {new Date(activeHarvester.startedAt).toLocaleString()}
                    </div>
                  )}
                  
                  {/* Status and Network Performance side by side */}
                  <div style={{ display: 'flex', gap: 16 }}>
                    {/* Status (without networkPerformance) */}
                    <div style={{ flex: 1 }}>
                      <strong>Status:</strong>
                      <pre style={{
                        marginTop: 4,
                        padding: 8,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 4,
                        fontSize: 12,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace'
                      }}>
                        {(() => {
                          if (!activeHarvester.status) return 'No status data';
                          // Remove networkPerformance from status display
                          const { networkPerformance: _networkPerformance, ...statusWithoutNetwork } = activeHarvester.status;
                          return JSON.stringify(statusWithoutNetwork, null, 2);
                        })()}
                      </pre>
                    </div>

                    {/* Network Performance */}
                    {activeHarvester.status?.networkPerformance && (
                      <div style={{ flex: 1 }}>
                        <strong>Network Performance:</strong>
                        <pre style={{
                          marginTop: 4,
                          padding: 8,
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: 4,
                          fontSize: 12,
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace'
                        }}>
                          {JSON.stringify(activeHarvester.status.networkPerformance, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}