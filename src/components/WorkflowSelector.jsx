import React, { useEffect, useState } from 'react';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';

/**
 * WorkflowSelector - Custom widget for selecting and loading workflows
 * 
 * Props from RJSF:
 * - value: current workflow content (string)
 * - onChange: callback to update the form data
 * - readonly: whether the field is readonly
 * - disabled: whether the field is disabled
 * - options: ui:options from uiSchema
 */
export default function WorkflowSelector({ value, onChange, readonly, disabled, options }) {
  const { t } = useLanguage();
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rows = options?.rows || 20;

  // Load list of available workflows
  useEffect(() => {
    fetchJSON('/api/v1/workflows')
      .then(data => {
        // Expecting either an array or {items: [...]}
        const items = Array.isArray(data) ? data : (data?.items || data?.workflows || []);
        setWorkflows(items);
      })
      .catch(err => {
        console.error('Error loading workflows:', err);
        setError(t('errorLoadingWorkflows'));
      });
  }, [t]);

  // Handle workflow selection and load its content
  const handleWorkflowSelect = async (workflowName) => {
    if (!workflowName) {
      setSelectedWorkflow('');
      return;
    }

    setSelectedWorkflow(workflowName);
    setLoading(true);
    setError('');

    try {
      const data = await fetchJSON(`/api/v1/workflows/${encodeURIComponent(workflowName)}`);
      // Expecting {name: "...", content: "..."}
      const content = data.content || data.workflow || '';
      onChange(content);
      setError('');
    } catch (err) {
      console.error('Error loading workflow content:', err);
      setError(t('errorLoadingWorkflowContent'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Workflow selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontWeight: 500, minWidth: 'fit-content' }}>
          {t('loadWorkflow')}:
        </label>
        <select
          value={selectedWorkflow}
          onChange={(e) => handleWorkflowSelect(e.target.value)}
          disabled={disabled || readonly || loading}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            minWidth: 200,
            background: (disabled || readonly || loading) ? '#f3f4f6' : 'white'
          }}
        >
          <option value="">{t('selectWorkflow')}</option>
          {workflows.map((wf) => {
            // workflow can be either a string (name) or an object {name: "..."}
            const name = typeof wf === 'string' ? wf : (wf.name || wf.id);
            return (
              <option key={name} value={name}>
                {name}
              </option>
            );
          })}
        </select>
        {loading && (
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {t('loading')}...
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{ 
          padding: '8px 12px', 
          background: '#fee2e2', 
          color: '#991b1b', 
          borderRadius: 4,
          fontSize: 13
        }}>
          {error}
        </div>
      )}

      {/* Textarea for workflow content */}
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readonly}
        disabled={disabled}
        rows={rows}
        placeholder={t('workflowDescription')}
        style={{
          width: '100%',
          padding: 8,
          border: '1px solid #d1d5db',
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: 13,
          resize: 'vertical',
          background: (disabled || readonly) ? '#f3f4f6' : 'white'
        }}
      />
    </div>
  );
}
