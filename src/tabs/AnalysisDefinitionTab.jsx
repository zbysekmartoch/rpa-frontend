/**
 * Analysis Definition Tab
 * Script file browser using FileManagerEditor component
 * Only visible in advanced UI mode
 */
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import FileManagerEditor from '../components/FileManagerEditor.jsx';

export default function AnalysisDefinitionTab() {
  const { t } = useLanguage();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <FileManagerEditor
        apiBasePath="/api/v1/scripts"
        showUpload={true}
        showDelete={true}
        readOnly={false}
        showModificationDate={true}
        title={t('scripts') || 'Skripty'}
        refreshTrigger={0}
      />
    </div>
  );
}
