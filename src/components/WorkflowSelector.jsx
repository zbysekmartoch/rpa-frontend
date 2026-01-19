import React, { useEffect, useState } from 'react';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';

/**
 * WorkflowSelector - Custom widget for selecting a workflow by name
 * 
 * The selected workflow name is saved directly to settings as "workflow": "workflow_name"
 * No workflow content is loaded - just the name is stored.
 * 
 * Props from RJSF:
 * - value: current workflow name (string)
 * - onChange: callback to update the form data
 * - readonly: whether the field is readonly
 * - disabled: whether the field is disabled
 * - options: ui:options from uiSchema
 */
export default function WorkflowSelector({ value, onChange, readonly, disabled }) {
  const { t } = useLanguage();
  const [workflows, setWorkflows] = useState([]);
  const [error, setError] = useState('');

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

  // Handle workflow selection - just save the name, not the content
  const handleWorkflowSelect = (workflowName) => {
    onChange(workflowName);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Workflow selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select
          value={value || ''}
          onChange={(e) => handleWorkflowSelect(e.target.value)}
          disabled={disabled || readonly}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            minWidth: 250,
            background: (disabled || readonly) ? '#f3f4f6' : 'white'
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

      {/* Display selected workflow */}
      {value && (
        <div style={{ 
          padding: '8px 12px', 
          background: '#dcfce7', 
          color: '#166534', 
          borderRadius: 4,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>✓</span>
          <span>{t('selectedWorkflow') || 'Vybraný workflow'}: <strong>{value}</strong></span>
        </div>
      )}
    </div>
  );
}
