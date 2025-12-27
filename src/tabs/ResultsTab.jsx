/**
 * Results Tab Component
 * Displays analysis results in a dual-panel layout.
 * Left panel shows list of results, right panel shows details of selected result.
 * Supports result deletion, file downloads, and status display.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';
import { defaultColDef, commonGridProps, getGridContainerStyle } from '../lib/gridConfig.js';

export default function ResultsTab() {
  const { t } = useLanguage();

  // Left grid: results
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null);
  const leftRef = useRef(null);

  // Load results list
  const loadResults = async () => {
    try {
      const d = await fetchJSON('/api/v1/results');
      console.debug('LIST /results ->', d);
      setRows(d.items || []);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  // Delete selected results
  const handleDelete = async () => {
    const selectedNodes = leftRef.current?.api?.getSelectedNodes();
    if (!selectedNodes || selectedNodes.length === 0) {
      alert(t('noResultsSelected') || 'No results selected');
      return;
    }

    const selectedIds = selectedNodes.map(node => node.data.id);
    const confirmMessage = selectedIds.length === 1
      ? (t('confirmDeleteResult') || 'Really delete result?')
      : (t('confirmDeleteResults') || `Really delete ${selectedIds.length} results?`);

    if (!confirm(confirmMessage)) return;

    try {
      // Delete all selected results
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/v1/results/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          })
        )
      );

      // If active result was deleted, clear detail view
      if (active && selectedIds.includes(active.id)) {
        setActive(null);
      }

      // Reload results list
      await loadResults();
      alert(t('resultsDeleted') || 'Results deleted');
    } catch (error) {
      console.error('Error deleting results:', error);
      alert(t('errorDeletingResults') || 'Error deleting results');
    }
  };

  // Row click -> fetch detail
  const onRowClicked = async (e) => {
    const id = e.data.id;
    try {
      const detail = await fetchJSON(`/api/v1/results/${id}`);
      console.debug('DETAIL /results/:id ->', detail);
      setActive(detail);
    } catch {
      setActive(null);
    }
  };

  // Left grid columns
  const cols = useMemo(() => ([
    { headerName: t('id'), field: 'id', width: 90 },
    { headerName: t('analysisName'), field: 'analysisName', flex: 1, minWidth: 220 },
    { headerName: t('status'), field: 'status', width: 120 },
    { headerName: t('created'), field: 'created_at', width: 170 },
  ]), [t]);

  // Function for localized status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      'completed': t('statusCompleted'),
      'running': t('statusRunning'),
      'failed': t('statusFailed'),
      'pending': t('statusPending'),
    };
    return statusMap[status] || status;
  };

  // Function for status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return { background: '#dcfce7', color: '#166534' };
      case 'running':
        return { background: '#dbeafe', color: '#1d4ed8' };
      case 'failed':
        return { background: '#fee2e2', color: '#991b1b' };
      case 'pending':
        return { background: '#fef3c7', color: '#92400e' };
      default:
        return { background: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div style={{ height: 'calc(100% - 20px)' , display: 'flex', gap: 12 }}>
      {/* LEFT: results list */}
      <section
        style={{
          width: 600, minWidth: 500, height: '100%',
          border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, 
          overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Delete button */}
        <div style={{ marginBottom: 8 }}>
          <button
            className="btn btn-delete"
            onClick={handleDelete}
            title={t('deleteSelectedResults') || 'Delete selected results'}
          >
            🗑 {t('deleteSelected') || 'Delete selected'}
          </button>
        </div>

        <div className="ag-theme-quartz" style={getGridContainerStyle({ flex: 1 })}>
          <AgGridReact
            {...commonGridProps}
            ref={leftRef}
            rowData={rows}
            columnDefs={cols}
            defaultColDef={defaultColDef}
            rowSelection={{ mode: 'multiRow' }}
            onRowClicked={onRowClicked}
            tooltipShowDelay={300}
          />
        </div>
      </section>

      {/* RIGHT: result detail */}
      <section
        style={{
          flex: 1, minWidth: 0, minHeight: 0, height: '100%',
          border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, 
          background: '#fff'
        }}
      >
        {!active && <div style={{ color: '#6b7280' }}>{t('selectResult')}</div>}
        
        {active && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>
              {t('analysisResultTitle')}: {active.analysisName}
            </h2>
            
            <div>
              <label style={{ color: '#4b5563', display: 'block', marginBottom: 4 }}>
                {t('status')}
              </label>
              <div style={{ 
                padding: '4px 12px',
                ...getStatusColor(active.status),
                borderRadius: 0,
                display: 'inline-block'
              }}>
                {getStatusDisplay(active.status)}
              </div>
            </div>

            {/* Download link - now for all analyses */}
            {active && (
              <div>
                <label style={{ color: '#4b5563', display: 'block', marginBottom: 4 }}>
                  {t('downloadResult')}
                </label>
                <a 
                  href={`/api/v1/results/${active.id}/download`}
                  download
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                >
                  📦 {t('downloadZip')}
                </a>
              </div>
            )}

            {/* List of individual files to download */}
            {active.files && active.files.length > 0 && (
              <div>
                <label style={{ color: '#4b5563', display: 'block', marginBottom: 8 }}>
                  {t('resultFiles') || 'Result files'}
                </label>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6
                }}>
                  {active.files.map((file, index) => (
                    <a
                      key={index}
                      href={file.downloadUrl || `/api/v1/results/${active.id}/files/${encodeURIComponent(file.name)}`}
                      download={file.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        textDecoration: 'none',
                        color: '#374151',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>
                          {file.extension === '.docx' ? '📄' : 
                           file.extension === '.pdf' ? '📑' : 
                           file.extension === '.xlsx' ? '📊' : 
                           file.extension === '.png' || file.extension === '.jpg' ? '🖼️' : 
                           '📎'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''} 
                            {file.mtime ? ` • ${new Date(file.mtime).toLocaleString()}` : ''}
                          </div>
                        </div>
                      </div>
                      <span style={{ color: '#3b82f6', fontSize: 20 }}>⬇</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {active.output && (
              <div>
                <label style={{ color: '#4b5563', display: 'block', marginBottom: 4 }}>
                  {t('output')}
                </label>
                <pre style={{ 
                  margin: 0,
                  padding: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {active.output}
                </pre>
              </div>
            )}

            {active.report && (
              <div>
                <label style={{ color: '#4b5563', display: 'block', marginBottom: 4 }}>
                  {t('report')}
                </label>
                <div style={{
                  padding: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6
                }}>
                  {active.report}
                </div>
              </div>
            )}

            {/* Additional result information */}
            {active.created_at && (
              <div>
                <label style={{ color: '#4b5563', display: 'block', marginBottom: 4 }}>
                  {t('created')}
                </label>
                <div style={{ color: '#6b7280' }}>
                  {new Date(active.created_at).toLocaleString()}
                </div>
              </div>
            )}

            {active.completed_at && (
              <div>
                <label style={{ color: '#4b5563', display: 'block', marginBottom: 4 }}>
                  {t('completed')}
                </label>
                <div style={{ color: '#6b7280' }}>
                  {new Date(active.completed_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}