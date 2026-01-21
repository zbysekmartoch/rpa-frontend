/**
 * Analysis Execution Tab
 * Configure and run analyses with form-based or JSON settings editor
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { getAnalysisSettingsSchema, getAnalysisSettingsUiSchema } from '../schemas/analysisSettings.js';
import WorkflowSelector from '../components/WorkflowSelector.jsx';
import BasketSelector from '../components/BasketSelector.jsx';
import { defaultColDef, commonGridProps, getGridContainerStyle } from '../lib/gridConfig.js';
import { useToast } from '../components/Toast';

// Optional simple JSON editor (can be replaced with jsoneditor/Monaco if needed)
function JsonTextarea({ value, onChange }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  useEffect(() => { setText(JSON.stringify(value ?? {}, null, 2)); }, [value]);
  return (
    <textarea
      style={{ width: '100%', height: '100%', fontFamily: 'monospace', fontSize: 13 }}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        try { onChange(JSON.parse(e.target.value)); } catch { /* ignore until valid JSON */ }
      }}
    />
  );
}

// Component for "Analysis Execution" sub-tab
export default function AnalysisExecutionTab() {
  const { t, language } = useLanguage();
  const { showAdvancedUI } = useSettings();
  const toast = useToast();
  
  // Left grid: analyses list
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null); // {id, name, settings, schema?}
  const leftRef = useRef(null);

  // Right panel - display mode
  const [mode, setMode] = useState('form'); // 'form' | 'json'
  const [draftName, setDraftName] = useState('');
  const [draftSettings, setDraftSettings] = useState({});

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  // Dynamic schema based on language
  const baseSchema = useMemo(() => getAnalysisSettingsSchema(language), [language]);
  const baseUiSchema = useMemo(() => getAnalysisSettingsUiSchema(language), [language]);

  // Use active schema if provided, otherwise use base schema
  const schema = useMemo(() => active?.schema ?? baseSchema, [active, baseSchema]);
  const uiSchema = baseUiSchema;

  // Custom widgets for RJSF
  const widgets = useMemo(() => ({
    WorkflowWidget: WorkflowSelector,
    BasketWidget: BasketSelector
  }), []);

  // Load analyses list
  useEffect(() => {
    fetchJSON('/api/v1/analyses')
      .then(d => {
        console.debug('LIST /analyses ->', d);
        setRows(d.items || []);
      })
      .catch(() => setRows([]));
  }, []);

  // Row click -> fetch detail (settings, schema)
  const onRowClicked = async (e) => {
    const id = e.data.id;
    
    try {
      const detail = await fetchJSON(`/api/v1/analyses/${id}`);
      console.debug('DETAIL /analyses/:id ->', detail);
      setActive(detail);
      setDraftName(detail.name || '');
      setDraftSettings(detail.settings || {});
    } catch {
      setActive(null);
      setDraftName('');
      setDraftSettings({});
    }
  };
  
  // Redraw rows when active analysis changes to update row styling
  useEffect(() => {
    if (leftRef.current?.api) {
      leftRef.current.api.redrawRows();
    }
  }, [active]);

  // Left grid columns
  const cols = useMemo(() => {
    const columns = [];
    if (showAdvancedUI) {
      columns.push({ headerName: t('id'), field: 'id', width: 90 });
    }
    columns.push(
      { headerName: t('name'), field: 'name', flex: 1, minWidth: 220 },
      { headerName: t('created'), field: 'created_at', width: 170 }
    );
    return columns;
  }, [t, showAdvancedUI]);

  // Cross-field validation for dates
  const customValidate = (formData, errors) => {
    const { dateFrom, dateTo } = formData || {};
    if (dateFrom && dateTo && dateFrom > dateTo) {
      errors.dateTo.addError(t('dateValidationError'));
    }
    return errors;
  };

  // Auto-save: save settings silently when form data changes
  const saveTimeoutRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving' | 'saved' | 'error' | ''

  const autoSave = useCallback(async (name, settings) => {
    if (!active?.id) return;
    setSaveStatus('saving');
    try {
      await fetch(`/api/v1/analyses/${active.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ name, settings }),
      }).then(r => { if (!r.ok) throw new Error(`${r.status}`); });

      // Refresh list silently
      const d = await fetchJSON('/api/v1/analyses');
      setRows(d.items || []);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }, [active?.id]);

  // Debounced auto-save on form change
  const handleFormChange = useCallback((e) => {
    const newSettings = e.formData;
    setDraftSettings(newSettings);
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(draftName, newSettings);
    }, 500);
  }, [draftName, autoSave]);

  // Save on name change
  const handleNameChange = useCallback((e) => {
    const newName = e.target.value;
    setDraftName(newName);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newName, draftSettings);
    }, 500);
  }, [draftSettings, autoSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // JSON editor change handler with auto-save
  const handleJsonChange = useCallback((newSettings) => {
    setDraftSettings(newSettings);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(draftName, newSettings);
    }, 500);
  }, [draftName, autoSave]);

  // Add new analysis
  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await fetchJSON('/api/v1/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      setAdding(false);
      setNewName('');
      const d = await fetchJSON('/api/v1/analyses');
      setRows(d.items || []);
    } catch  {
      toast.error(t('errorCreatingAnalysis'));
    }
  };

  const handleRun = async () => {
    if (!active?.id) return;
    try {
      await fetchJSON(`/api/v1/analyses/${active.id}/run`, {
        method: 'POST'
      });
      toast.success(t('analysisStarted'));
    } catch (e) {
      toast.error(t('errorStartingAnalysis') + ': ' + (e.message || e));
    }
  };

  // Delete analysis
  const handleDelete = async () => {
    if (!active?.id) return;
    if (!confirm(t('confirmDeleteAnalysis') || `Opravdu smazat analýzu "${active.name}"?`)) return;
    
    try {
      await fetchJSON(`/api/v1/analyses/${active.id}`, {
        method: 'DELETE'
      });
      setActive(null);
      setDraftName('');
      setDraftSettings({});
      const d = await fetchJSON('/api/v1/analyses');
      setRows(d.items || []);
      toast.success(t('analysisDeleted') || 'Analýza smazána');
    } catch {
      toast.error(t('errorDeletingAnalysis') || 'Chyba při mazání analýzy');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', gap: 12 }}>
      {/* LEFT: analyses list */}
      <section
        style={{
          width: 420, minWidth: 360,  height: 'calc(100% - 20px)' ,
          border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, overflow: 'hidden', background: '#fff'
        }}
      >
        {/* Add analysis */}
        <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
          {adding ? (
            <>
              <input
                autoFocus
                type="text"
                placeholder={t('newAnalysisPlaceholder')}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') { setAdding(false); setNewName(''); }
                }}
                style={{ padding: 4, borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}
              />
              <button
                className="btn btn-add"
                onClick={handleAdd}
                disabled={!newName.trim()}
              >
                {t('add')}
              </button>
              <button
                className="btn btn-cancel"
                onClick={() => { setAdding(false); setNewName(''); }}
              >
                {t('cancel')}
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-add"
                onClick={() => setAdding(true)}
                title={t('addAnalysisTooltip')}
              >
                + {t('addAnalysis')}
              </button>
              <button
                className="btn btn-delete"
                onClick={handleDelete}
                disabled={!active}
                title={t('deleteAnalysisTooltip') || 'Smazat analýzu'}
              >
                {t('deleteAnalysis') || 'Smazat'}
              </button>
            </>
          )}
        </div>

        <div className="ag-theme-quartz" style={{...getGridContainerStyle(),height: 'calc(100% - 40px)' }}>
          <AgGridReact
            {...commonGridProps}
            ref={leftRef}
            rowData={rows}
            columnDefs={cols}
            defaultColDef={defaultColDef}
            rowSelection={{ mode: 'singleRow' , checkboxes: false}}
            onRowClicked={onRowClicked}
            getRowClass={(params) => params.data?.id === active?.id ? 'ag-row-active' : ''}
            tooltipShowDelay={300}
          />
        </div>
      </section>

      {/* RIGHT: configuration editor */}
      <section
        style={{
          flex: 1, minWidth: 0, minHeight: 0, height: 'calc(100% - 20px)',
          border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, background: '#fff', display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {active && (
              <span style={{ 
                fontSize: 12, 
                color: '#6b7280',
                background: '#f3f4f6',
                padding: '4px 8px',
                borderRadius: 4
              }}>
                ID: {active.id}
              </span>
            )}
            <input
              type="text"
              placeholder={t('analysisNamePlaceholder')}
              value={draftName}
              onChange={handleNameChange}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', minWidth: 260 }}
              disabled={!active}
            />
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px' }}
              disabled={!active}
            >
              <option value="form">{t('form')}</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleRun}
              disabled={!active}
              title={t('runAnalysisTooltip')}
            >
              {t('runAnalysis')}
            </button>

            {/* Auto-save status indicator */}
            {saveStatus && (
              <span style={{ 
                fontSize: 13, 
                color: saveStatus === 'error' ? '#dc2626' : saveStatus === 'saving' ? '#6b7280' : '#16a34a',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                {saveStatus === 'saving' && '⏳ ' + t('saving')}
                {saveStatus === 'saved' && '✓ ' + t('saved')}
                {saveStatus === 'error' && '✗ ' + t('saveFailed')}
              </span>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {!active && <div style={{ color: '#6b7280' }}>{t('selectAnalysis')}</div>}

          {active && mode === 'form' && schema && (
            <Form
              formData={draftSettings}
              schema={schema}
              uiSchema={uiSchema}
              validator={validator}
              customValidate={customValidate}
              onChange={handleFormChange}
              widgets={widgets}
            >
              {/* No submit button - auto-save on change */}
              <></>
            </Form>
          )}

          {active && mode === 'json' && (
            <JsonTextarea value={draftSettings} onChange={handleJsonChange} />
          )}
        </div>
      </section>
    </div>
  );
}
