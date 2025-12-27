/**
 * Analysis Execution Tab
 * Configure and run analyses with form-based or JSON settings editor
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';
import { getAnalysisSettingsSchema, getAnalysisSettingsUiSchema } from '../schemas/analysisSettings.js';
import WorkflowSelector from '../components/WorkflowSelector.jsx';
import { defaultColDef, commonGridProps, getGridContainerStyle } from '../lib/gridConfig.js';

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

  const [baskets, setBaskets] = useState([]);

  // Load baskets list
  useEffect(() => {
    fetchJSON('/api/v1/baskets')
      .then(data => setBaskets(data.items || []))
      .catch(() => setBaskets([]));
  }, []);

  // Dynamic schema based on language
  const baseSchema = useMemo(() => getAnalysisSettingsSchema(language), [language]);
  const baseUiSchema = useMemo(() => getAnalysisSettingsUiSchema(language), [language]);

  // Dynamic schema for basket select
  const schema = useMemo(() => {
    if (!baskets.length) return active?.schema ?? baseSchema;
    const base = { ...(active?.schema ?? baseSchema) };
    return {
      ...base,
      properties: {
        ...base.properties,
        basketId: {
          ...base.properties.basketId,
          enum: baskets.map(b => b.id),
          enumNames: baskets.map(b => b.name)
        }
      }
    };
  }, [baskets, active, baseSchema]);

  // Dynamic uiSchema for basket select
  const uiSchema = useMemo(() => {
    if (!baskets.length) return baseUiSchema;
    return {
      ...baseUiSchema,
      basketId: {
        ...baseUiSchema.basketId,
        "ui:options": {
          ...baseUiSchema.basketId?.["ui:options"],
          enumOptions: baskets.map(b => ({
            value: b.id,
            label: b.name
          }))
        }
      }
    };
  }, [baskets, baseUiSchema]);

  // Custom widgets for RJSF
  const widgets = useMemo(() => ({
    WorkflowWidget: WorkflowSelector
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
  const cols = useMemo(() => ([
    { headerName: t('id'), field: 'id', width: 90 },
    { headerName: t('name'), field: 'name', flex: 1, minWidth: 220 },
    { headerName: t('created'), field: 'created_at', width: 170 },
  ]), [t]);

  // Cross-field validation for dates
  const customValidate = (formData, errors) => {
    const { dateFrom, dateTo } = formData || {};
    if (dateFrom && dateTo && dateFrom > dateTo) {
      errors.dateTo.addError(t('dateValidationError'));
    }
    return errors;
  };

  // Save from form
  const handleSubmit = async ({ formData }) => {
    if (!active?.id) return;
    try {
      await fetch(`/api/v1/analyses/${active.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ name: draftName, settings: formData }),
      }).then(r => { if (!r.ok) throw new Error(`${r.status}`); });

      // Refresh list and detail
      const d = await fetchJSON('/api/v1/analyses');
      setRows(d.items || []);
      const detail = await fetchJSON(`/api/v1/analyses/${active.id}`);
      setActive(detail);
      setDraftSettings(detail.settings || {});
      alert(t('saved'));
    } catch (e) {
      console.error(e);
      alert(t('saveFailed'));
    }
  };

  // Save from JSON editor
  const handleSaveJson = async () => {
    if (!active?.id) return;
    try {
      await fetch(`/api/v1/analyses/${active.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ name: draftName, settings: draftSettings }),
      }).then(r => { if (!r.ok) throw new Error(`${r.status}`); });

      const d = await fetchJSON('/api/v1/analyses');
      setRows(d.items || []);
      const detail = await fetchJSON(`/api/v1/analyses/${active.id}`);
      setActive(detail);
      setDraftSettings(detail.settings || {});
      alert(t('saved'));
    } catch (e) {
      console.error(e);
      alert(t('saveFailed'));
    }
  };

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
      alert(t('errorCreatingAnalysis'));
    }
  };

  const handleRun = async () => {
    if (!active?.id) return;
    try {
      await fetchJSON(`/api/v1/analyses/${active.id}/run`, {
        method: 'POST'
      });
      alert(t('analysisStarted'));
    } catch (e) {
      alert(t('errorStartingAnalysis') + ': ' + (e.message || e));
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
            <button
              className="btn btn-add"
              onClick={() => setAdding(true)}
              title={t('addAnalysisTooltip')}
            >
              + {t('addAnalysis')}
            </button>
          )}
        </div>

        <div className="ag-theme-quartz" style={{...getGridContainerStyle(),height: 'calc(100% - 40px)' }}>
          <AgGridReact
            {...commonGridProps}
            ref={leftRef}
            rowData={rows}
            columnDefs={cols}
            defaultColDef={defaultColDef}
            rowSelection={{ mode: 'singleRow' }}
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
            <input
              type="text"
              placeholder={t('analysisNamePlaceholder')}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
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

            {mode === 'form' ? (
              <button
                className="btn btn-edit"
                onClick={() => document.getElementById('analysis-rjsf-save')?.click()}
                disabled={!active}
              >
                {t('save')}
              </button>
            ) : (
              <button
                className="btn btn-edit"
                onClick={handleSaveJson}
                disabled={!active}
              >
                {t('saveJson')}
              </button>
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
              onChange={(e) => setDraftSettings(e.formData)}
              onSubmit={handleSubmit}
              widgets={widgets}
            >
              <button id="analysis-rjsf-save" type="submit" style={{ display: 'none' }}>Save</button>
            </Form>
          )}

          {active && mode === 'json' && (
            <JsonTextarea value={draftSettings} onChange={setDraftSettings} />
          )}
        </div>
      </section>
    </div>
  );
}
