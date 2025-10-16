// src/App.jsx
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import AuthPage from './components/AuthPage';
import ProductsTab from './tabs/ProductsTab.jsx';
import BasketsTab from './tabs/BasketsTab.jsx';
import AnalysesTab from './tabs/AnalysesTab.jsx';
import ResultsTab from './tabs/ResultsTab';
import HarvestTab from './tabs/HarvestTab.jsx';
import SettingsTab from './tabs/SettingsTab';

function AppContent() {
  const [tab, setTab] = useState('produkty');
  const [healthInfo, setHealthInfo] = useState(null);
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { showAdvancedUI } = useSettings();

  // Load health info on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthInfo(data))
      .catch(err => console.error('Failed to load health info:', err));
  }, []);

  const TabButton = ({ id, children }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '8px 12px',
        border: '1px solid #e5e7eb',
        borderBottom: 'none',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        background: tab === id ? '#fff' : '#f3f4f6',
        fontWeight: tab === id ? 600 : 400,
        color: '#111827'
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ height: '100vh', width: '100vw', boxSizing: 'border-box', padding: 12, background: '#fff' }}>
      {/* Header s user info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>{t('appTitle')}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>{t('loggedInAs')} {user.firstName} {user.lastName}</span>
            <button
              onClick={logout}
              style={{
                padding: '6px 12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              {t('logout')}
            </button>
          </div>
          {healthInfo && (
            <div style={{ fontSize: 11, color: '#6b7280', display: 'flex', gap: 12 }}>
              <span title="Backend Server">
                🖥️ {healthInfo.server?.host}:{healthInfo.server?.port}
              </span>
              <span title="Database">
                🗄️ {healthInfo.database?.host} / {healthInfo.database?.name}
              </span>
              <span title="Version">
                📦 v{healthInfo.version}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: -1 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <TabButton id="produkty">{t('tabProducts')}</TabButton>
          <TabButton id="kosiky">{t('tabBaskets')}</TabButton>
          <TabButton id="analytika">{t('tabAnalyses')}</TabButton>
          <TabButton id="vysledky">{t('tabResults')}</TabButton>
          {showAdvancedUI && <TabButton id="sber">{t('tabHarvest')}</TabButton>}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <TabButton id="nastaveni">{t('tabSettings')}</TabButton>
        </div>
      </div>

      {/* Tab content wrapper */}
      <div style={{ border: '1px solid #e5e7eb', padding: 10, background: '#fff', height: 'calc(100vh - 160px)' }}>
        {tab === 'produkty' && <ProductsTab />}
        {tab === 'kosiky' && <BasketsTab />}
        {tab === 'analytika' && <AnalysesTab />}
        {tab === 'vysledky' && <ResultsTab />}
        {tab === 'sber' && <HarvestTab />}
        {tab === 'nastaveni' && <SettingsTab />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <SettingsProvider>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </SettingsProvider>
    </LanguageProvider>
  );
}

function AuthApp() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <AuthPage />;
  }
  
  return <AppContent />;
}
