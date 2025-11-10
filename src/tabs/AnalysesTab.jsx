import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import AnalysisExecutionTab from './AnalysisExecutionTab.jsx';
import AnalysisDefinitionTab from './AnalysisDefinitionTab.jsx';

// Hlavní komponenta s podzáložkami
export default function AnalysisTab() {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState('execution'); // 'execution' | 'definition'

  const SubTabButton = ({ id, children }) => (
    <button
      onClick={() => setActiveSubTab(id)}
      style={{
        padding: '8px 12px',
        border: '1px solid #e5e7eb',
        borderBottom: 'none',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        background: activeSubTab === id ? '#fff' : '#f3f4f6',
        fontWeight: activeSubTab === id ? 600 : 400,
        color: '#111827',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Podzáložky */}
      <div style={{ display: 'flex', gap: 8, marginBottom: -1 }}>
        <SubTabButton id="execution">{t('analysisExecution')}</SubTabButton>
        <SubTabButton id="definition">{t('analysisDefinition')}</SubTabButton>
      </div>

      {/* Obsah podzáložek */}
      <div style={{ border: '1px solid #e5e7eb', padding: 10, background: '#fff', height: 'calc(100% - 40px)' }}>
        {activeSubTab === 'execution' && <AnalysisExecutionTab />}
        {activeSubTab === 'definition' && <AnalysisDefinitionTab />}
      </div>
    </div>
  );
}

