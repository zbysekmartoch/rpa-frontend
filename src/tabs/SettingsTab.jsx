import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function SettingsTab() {
  const { t } = useLanguage();

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h2 style={{ marginBottom: 24, color: '#111827' }}>{t('tabSettings')}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <LanguageSelector />
      </div>
    </div>
  );
}