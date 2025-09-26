import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';

export default function ResultsTab() {
  const { t } = useLanguage();

  // Levý grid: výsledky
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null);
  const leftRef = useRef(null);

  // Načtení seznamu
  useEffect(() => {
    fetchJSON('/api/v1/results')
      .then(d => {
        console.debug('LIST /results ->', d);
        setRows(d.items || []);
      })
      .catch(() => setRows([]));
  }, []);

  // Klik na řádek → stáhni detail
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

  // Sloupce levého gridu
  const cols = useMemo(() => ([
    { headerName: t('id'), field: 'id', width: 90 },
    { headerName: t('analysisName'), field: 'analysisName', flex: 1, minWidth: 220 },
    { headerName: t('status'), field: 'status', width: 120 },
    { headerName: t('created'), field: 'created_at', width: 170 },
  ]), [t]);
  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true }), []);

  // Funkce pro lokalizovaný status
  const getStatusDisplay = (status) => {
    const statusMap = {
      'completed': t('statusCompleted'),
      'running': t('statusRunning'),
      'failed': t('statusFailed'),
      'pending': t('statusPending'),
    };
    return statusMap[status] || status;
  };

  // Funkce pro barvu statusu
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
    <div style={{ height: '100%', display: 'flex', gap: 12 }}>
      {/* LEFT: seznam výsledků */}
      <section
        style={{
          width: 600, minWidth: 500, height: '100%',
          border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, 
          overflow: 'hidden', background: '#fff'
        }}
      >
        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            theme="legacy"
            ref={leftRef}
            rowData={rows}
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

      {/* RIGHT: detail výsledku */}
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
                borderRadius: 4,
                display: 'inline-block'
              }}>
                {getStatusDisplay(active.status)}
              </div>
            </div>

            {/* Link na stažení */}
            {active.status === 'completed' && (
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

            {/* Další informace o výsledku */}
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