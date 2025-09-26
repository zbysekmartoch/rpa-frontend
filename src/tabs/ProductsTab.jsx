// src/tabs/ProductsTab.jsx
import React, { useEffect, useState } from 'react';
import { CategoryTree } from '../components/CategoryTree.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';

export default function ProductsTab() {
  const { t } = useLanguage();
  
  // UI stav
  const [mode, setMode] = useState('active');     // 'active' | 'selected'
  const [activePath, setActivePath] = useState('');
  const [selectedPaths, setSelectedPaths] = useState([]);

  // počty z gridu (zobrazí se vpravo nahoře)
  const [displayedCount, setDisplayedCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchJSON('/api/v1/baskets')
      .then(d => setBaskets(d.items || []))
      .catch(() => setBaskets([]));
  }, []);

  // 🔹 košíky pro výběr cíle
  const [baskets, setBaskets] = useState([]);
  const [targetBasketId, setTargetBasketId] = useState('');

  const onTogglePath = (path) => {
    setSelectedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };

  const handleAddToBasket = async () => {
    const bid = Number(targetBasketId);
    if (!bid) { alert(t('selectTargetBasket')); return; }
    if (selectedIds.length === 0) { alert(t('noProductsSelected')); return; }

    try {
      await fetch(`/api/v1/baskets/${bid}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedIds }),
      }).then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      });
      alert(t('productsAddedToBasket', { count: selectedIds.length }));
      // nic dalšího dělat nemusíme; v Baskets tabu se to načte při otevření
    } catch (e) {
      console.error(e);
      alert(t('errorAddingToBasket'));
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar s přepínačem módu + počty */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <span style={{ fontSize: 14 }}>{t('displayMode')}</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none' }}
            >
              <option value="active">{t('activeCategory')}</option>
              <option value="selected">{t('selectedCategories')}</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#374151', background: '#f3f4f6', padding: '4px 8px', borderRadius: 8 }}>
              {t('displayed')}: <b>{displayedCount}</b>
            </span>
            <span style={{ fontSize: 13, color: '#374151', background: '#eef2ff', padding: '4px 8px', borderRadius: 8 }}>
              {t('selected')}: <b>{selectedCount}</b>
            </span>

            {/* 🔹 výběr cílového košíku + akce */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
              <select
                value={targetBasketId}
                onChange={(e) => setTargetBasketId(e.target.value)}
                style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px' }}
              >
                <option value="">{t('selectBasketPlaceholder')}</option>
                {baskets.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.itemCount})</option>
                ))}
              </select>

              <button
                onClick={handleAddToBasket}
                disabled={!targetBasketId || selectedIds.length === 0}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #16a34a', color: '#fff',
                  background: !targetBasketId || selectedIds.length === 0 ? '#a7f3d0' : '#16a34a',
                  borderRadius: 8, cursor: !targetBasketId || selectedIds.length === 0 ? 'not-allowed' : 'pointer'
                }}
                title={t('addToBasketTooltip')}
              >
                {t('addToBasket')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dvousloupcový layout: strom vlevo, grid vpravo */}
      <div style={{ height: 'calc(100% - 40px)', display: 'flex', gap: 12 }}>
        <aside
          style={{
            width: 340, minWidth: 300, maxWidth: 420, height: '100%',
            overflow: 'auto', border: '1px solid #e5e7eb', padding: 10,
            background: '#fff'
          }}
        >
          <CategoryTree
            selectedPaths={selectedPaths}
            onTogglePath={onTogglePath}
            activePath={activePath}
            onActivate={setActivePath}
          />

          {/* Přehled stavů */}
          <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
            <div style={{ marginBottom: 6 }}>
              {t('activeCategory')}: {activePath ? <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6 }}>{activePath}</code> : t('none')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {t('selectedCategories')} ({selectedPaths.length}):
              {selectedPaths.map(p => (
                <code key={p} style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6 }}>{p}</code>
              ))}
            </div>
          </div>
        </aside>

        <section
          style={{
            flex: 1, minWidth: 0, minHeight: 0, height: '100%',
            border: '1px solid #e5e7eb', padding: 0,
            background: '#fff', overflow: 'hidden'
          }}
        >
          <ProductGrid
            mode={mode}
            activePath={activePath}
            selectedPaths={selectedPaths}
            onCountsChange={({ displayed, selected }) => {
              setDisplayedCount(displayed);
              setSelectedCount(selected);
            }}
            onSelectionIdsChange={setSelectedIds}
          />
        </section>
      </div>
    </div>
  );
}
