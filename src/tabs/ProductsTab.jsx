/**
 * Products Tab Component
 * 
 * Main product catalog browser with:
 * - Category tree navigation (left panel)
 * - Product grid with filtering, sorting, and selection (right panel)
 * - Add to basket functionality
 * - Display modes: active category or selected categories
 */
import React, { useCallback, useState } from 'react';
import { CategoryTree } from '../components/CategoryTree.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/Toast';

export default function ProductsTab() {
  const { t } = useLanguage();
  const toast = useToast();
  
  // UI state
  const [mode, setMode] = useState('active');     // 'active' | 'selected'
  const [activePath, setActivePath] = useState('');
  const [selectedPaths, setSelectedPaths] = useState([]);

  // Grid counts displayed in toolbar
  const [displayedCount, setDisplayedCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  // Basket selection for adding products
  const [baskets, setBaskets] = useState([]);
  const [targetBasketId, setTargetBasketId] = useState('');

  // Load baskets when dropdown is opened
  const handleBasketsDropdownOpen = async () => {
    try {
      const d = await fetchJSON('/api/v1/baskets');
      setBaskets(d.items || []);
    } catch {
      setBaskets([]);
    }
  };

  // Toggle category path in selected paths list
  const onTogglePath = (path) => {
    setSelectedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };

  // Memoized callbacks for ProductGrid - prevents unnecessary re-renders
  const handleCountsChange = useCallback(({ displayed, selected }) => {
    setDisplayedCount(displayed);
    setSelectedCount(selected);
  }, []);

  const handleSelectionIdsChange = useCallback((ids) => {
    setSelectedIds(ids);
  }, []);

  // Add selected products to target basket
  const handleAddToBasket = async () => {
    const bid = Number(targetBasketId);
    if (!bid) { toast.warning(t('selectTargetBasket')); return; }
    if (selectedIds.length === 0) { toast.warning(t('noProductsSelected')); return; }

    try {
      await fetch(`/api/v1/baskets/${bid}/products`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ productIds: selectedIds }),
      }).then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      });
      toast.success(t('productsAddedToBasket', { count: selectedIds.length }));
      // No further action needed; Baskets tab will reload data when opened
    } catch (e) {
      console.error(e);
      toast.error(t('errorAddingToBasket'));
    }
  };

  return (
    <div style={{ height: 'calc(100% - 50px)', display: 'flex', flexDirection: 'column' }}>
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
            <span style={{ fontSize: 13, color: '#374151', background: '#eef2ff', padding: '4px 8px' }}>
              {t('displayed')}: <b>{displayedCount}</b>
            </span>
            <span style={{ fontSize: 13, color: '#374151', background: '#eef2ff', padding: '4px 8px' }}>
              {t('selected')}: <b>{selectedCount}</b>
            </span>

            {/* 🔹 výběr cílového košíku + akce */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
              <select
                value={targetBasketId}
                onChange={(e) => setTargetBasketId(e.target.value)}
                onFocus={handleBasketsDropdownOpen}
                style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px' }}
              >
                <option value="">{t('selectBasketPlaceholder')}</option>
                {baskets.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.itemCount})</option>
                ))}
              </select>

              <button
                className="btn btn-add"
                onClick={handleAddToBasket}
                disabled={!targetBasketId || selectedIds.length === 0}
                title={t('addToBasketTooltip')}
              >
                {t('addToBasket')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dvousloupcový layout: strom vlevo, grid vpravo */}
      <div style={{ height: 'calc(100% - 00px)', display: 'flex', gap: 12 }}>
        <aside
          style={{
            width: 340, minWidth: 300, maxWidth: 420, height: 'calc(100% - 20px)',
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

  
        </aside>

        <section
          style={{
            flex: 1, minWidth: 0, minHeight: 0, height: '100%',
          //  border: '1px solid #e5e7eb', padding: 0,
            background: '#fff', overflow: 'hidden'
          }}
        >
          <ProductGrid
            mode={mode}
            activePath={activePath}
            selectedPaths={selectedPaths}
            onCountsChange={handleCountsChange}
            onSelectionIdsChange={handleSelectionIdsChange}
          />
        </section>
      </div>
    </div>
  );
}
