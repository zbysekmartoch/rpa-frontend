// src/App.jsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import AuthPage from './components/AuthPage';
import ProductsTab from './tabs/ProductsTab.jsx';
import BasketsTab from './tabs/BasketsTab.jsx';
import AnalysesTab from './tabs/AnalysesTab.jsx';
import ResultsTab from './tabs/ResultsTab';
import HarvestTab from './tabs/HarvestTab.jsx';
import SettingsTab from './tabs/SettingsTab';

function AppContent() {
  const [tab, setTab] = useState('produkty');
  const { user, logout } = useAuth();
  const { t } = useLanguage();

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
      </div>

      {/* Tabs bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: -1 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <TabButton id="produkty">{t('tabProducts')}</TabButton>
          <TabButton id="kosiky">{t('tabBaskets')}</TabButton>
          <TabButton id="analytika">{t('tabAnalyses')}</TabButton>
          <TabButton id="vysledky">{t('tabResults')}</TabButton>
          <TabButton id="sber">{t('tabHarvest')}</TabButton>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <TabButton id="nastaveni">{t('tabSettings')}</TabButton>
        </div>
      </div>

      {/* Tab content wrapper */}
      <div style={{ border: '1px solid #e5e7eb', padding: 10, background: '#fff', height: 'calc(100vh - 140px)' }}>
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
      <AuthProvider>
        <AuthApp />
      </AuthProvider>
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
