// src/tabs/BasketsTab.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';

const asItems = (d) => (Array.isArray(d) ? d : (d?.items ?? []));

// Custom cell renderer pro URL
const UrlCellRenderer = (props) => {
  if (!props.value) return <span>-</span>;
  return (
    <a 
      href={props.value} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{
        color: '#3b82f6',
        textDecoration: 'none',
        cursor: 'pointer'
      }}
      onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
      onMouseOut={(e) => e.target.style.textDecoration = 'none'}
    >
      🔗 Open
    </a>
  );
};

export default function BasketsTab() {
  const { t } = useLanguage();

  const [baskets, setBaskets] = useState([]);
  const [activeBasket, setActiveBasket] = useState(null);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const leftRef = useRef(null);
  const rightRef = useRef(null);

  // --- načtení košíků
  const reloadBaskets = useCallback(async () => {
    try {
      const d = await fetchJSON('/api/v1/baskets');
      const items = asItems(d);
      setBaskets(items);
      setStatus(t('basketsLoaded', { count: items.length }));
    } catch {
      setBaskets([]);
      setStatus(t('errorLoadingBaskets'));
    }
  }, [t]);

  useEffect(() => { reloadBaskets(); }, [reloadBaskets]);

  // --- načtení produktů košíku
  const reloadProducts = useCallback(async (basketId) => {
    if (!basketId) { setProducts([]); return; }
    try {
      const d = await fetchJSON(`/api/v1/baskets/${basketId}/products`);
      const items = asItems(d);
      setProducts(items);
      setStatus(t('basketProducts', { basketId, count: items.length }));
    } catch {
      setProducts([]);
      setStatus(t('errorLoadingProducts', { basketId }));
    }
  }, [t]);

  useEffect(() => { reloadProducts(activeBasket?.id); }, [activeBasket?.id, reloadProducts]);

  // --- levý grid: košíky
  const basketCols = useMemo(() => ([
    { headerName: t('id'), field: 'id', width: 90 },
    { headerName: t('name'), field: 'name', flex: 1, minWidth: 180 },
    { headerName: t('itemCount'), field: 'itemCount', width: 110 },
  ]), [t]);
  const basketDefault = useMemo(() => ({ sortable: true, resizable: true }), []);
  const onBasketRowClicked = useCallback((e) => setActiveBasket(e.data), []);

  // --- pravý grid: produkty v košíku
  const prodCols = useMemo(() => ([
    { headerName: t('id'), field: 'id', width: 90 },
    { headerName: t('name'), field: 'name', flex: 2, minWidth: 240 },
    { headerName: t('brand'), field: 'brand', width: 160 },
    { headerName: t('category'), field: 'category', flex: 3, minWidth: 320 },
    { headerName: t('priceCount'), field: 'priceCount', width: 110 },
    { headerName: t('sellerCount'), field: 'sellerCount', width: 120 },
    { 
      headerName: t('oldestPrice'), 
      field: 'minDate', 
      width: 130,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        try {
          return new Date(params.value).toISOString().split('T')[0];
        } catch {
          return params.value;
        }
      }
    },
    { 
      headerName: t('newestPrice'), 
      field: 'maxDate', 
      width: 130,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        try {
          return new Date(params.value).toISOString().split('T')[0];
        } catch {
          return params.value;
        }
      }
    },
    {
      headerName: t('productUrl'),
      field: 'url',
      width: 100,
      cellRenderer: UrlCellRenderer
    },
  ]), [t]);
  const prodDefault = useMemo(() => ({ sortable: true, resizable: true }), []);

  // vybrané ID z pravého gridu (pro povolení tlačítka)
  const [selectedIds, setSelectedIds] = useState([]);
  const onRightSelectionChanged = useCallback((e) => {
    setSelectedIds(e.api.getSelectedRows().map(r => r.id));
  }, []);

  // --- mazání vybraných
  const handleRemoveSelected = useCallback(async () => {
    const bid = activeBasket?.id;
    if (!bid) { alert(t('selectBasketFirst')); return; }
    if (selectedIds.length === 0) { alert(t('noProductsSelectedRight')); return; }

    // potvrzení (volitelné)
    if (!confirm(t('confirmRemoveProducts', { count: selectedIds.length, basketName: activeBasket.name }))) return;

    try {
      await Promise.all(
        selectedIds.map(pid =>
          fetch(`/api/v1/baskets/${bid}/products/${pid}`, { method: 'DELETE' })
            .then(r => { if (!r.ok) throw new Error(`${r.status}`); })
        )
      );
      // refresh pravého gridu + vlevo aktualizuj počty
      await reloadProducts(bid);
      await reloadBaskets();
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      alert(t('errorRemovingFromBasket'));
    }
  }, [activeBasket, selectedIds, reloadProducts, reloadBaskets, t]);

  // --- přidání košíku
  const handleAddBasket = useCallback(async () => {
    if (!newName.trim()) return;
    try {
      await fetchJSON('/api/v1/baskets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName('');
      setAdding(false);
      await reloadBaskets();
    } catch {
      alert(t('errorAddingBasket'));
    }
  }, [newName, reloadBaskets, t]);

  // --- mazání košíku
  const handleDeleteBasket = useCallback(async () => {
    if (!activeBasket) return;
    if (!confirm(t('confirmDeleteBasket', { basketName: activeBasket.name }))) return;
    try {
      await fetchJSON(`/api/v1/baskets/${activeBasket.id}`, { method: 'DELETE' });
      
      setActiveBasket(null);
      setProducts([]);
      await reloadBaskets();
    } catch {
      alert(t('errorDeletingBasket'));
    }
  }, [activeBasket, reloadBaskets, t]);

  const handleRenameBasket = useCallback(async () => {
    if (!activeBasket || !renameValue.trim()) return;
    try {
      await fetchJSON(`/api/v1/baskets/${activeBasket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      setRenaming(false);
      setRenameValue('');
      await reloadBaskets();
    } catch {
      alert(t('errorRenamingBasket'));
    }
  }, [activeBasket, renameValue, reloadBaskets, t]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{t('baskets')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Přidat košík */}
          {adding ? (
            <>
              <input
                autoFocus
                type="text"
                placeholder={t('newBasketPlaceholder')}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddBasket();
                  if (e.key === 'Escape') { setAdding(false); setNewName(''); }
                }}
                style={{ padding: 4, borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}
              />
              <button
                onClick={handleAddBasket}
                disabled={!newName.trim()}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#22c55e', color: '#fff', border: 'none' }}
              >
                {t('add')}
              </button>
              <button
                onClick={() => { setAdding(false); setNewName(''); }}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#f3f4f6', color: '#374151', border: 'none' }}
              >
                {t('cancel')}
              </button>
            </>
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{ padding: '6px 12px', borderRadius: 8, background: '#22c55e', color: '#fff', border: 'none' }}
              title={t('addBasketTooltip')}
            >
              + {t('addBasket')}
            </button>
          )}
          
          {/* Smazat košík */}
          <button
            onClick={handleDeleteBasket}
            disabled={!activeBasket}
            style={{
              padding: '6px 12px',
              border: '1px solid #dc2626',
              background: !activeBasket ? '#fecaca' : '#dc2626',
              color: '#fff',
              borderRadius: 8,
              cursor: !activeBasket ? 'not-allowed' : 'pointer'
            }}
            title={t('deleteBasketTooltip')}
          >
            {t('deleteBasket')}
          </button>

          {/* Přejmenovat košík */}
          {renaming ? (
            <>
              <input
                autoFocus
                type="text"
                value={renameValue}
                placeholder={t('newBasketNamePlaceholder')}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRenameBasket();
                  if (e.key === 'Escape') { setRenaming(false); setRenameValue(''); }
                }}
                style={{ padding: 4, borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}
              />
              <button
                onClick={handleRenameBasket}
                disabled={!renameValue.trim()}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none' }}
              >
                {t('save')}
              </button>
              <button
                onClick={() => { setRenaming(false); setRenameValue(''); }}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#f3f4f6', color: '#374151', border: 'none' }}
              >
                {t('cancel')}
              </button>
            </>
          ) : (
            <button
              onClick={() => { setRenaming(true); setRenameValue(activeBasket?.name || ''); }}
              disabled={!activeBasket}
              style={{
                padding: '6px 12px',
                border: '1px solid #3b82f6',
                background: !activeBasket ? '#dbeafe' : '#3b82f6',
                color: '#fff',
                borderRadius: 8,
                cursor: !activeBasket ? 'not-allowed' : 'pointer'
              }}
              title={t('renameBasketTooltip')}
            >
              {t('renameBasket')}
            </button>
          )}

          <div style={{ color: '#6b7280', fontSize: 13, marginRight: 8 }}>
            {status || (activeBasket ? 
              t('activeBasketStatus', { basketName: activeBasket.name, basketId: activeBasket.id }) : 
              t('selectBasket')
            )}
          </div>
          
          {/* Odebrat vybrané produkty */}
          <button
            onClick={handleRemoveSelected}
            disabled={!activeBasket || selectedIds.length === 0}
            style={{
              padding: '6px 12px',
              border: '1px solid #dc2626',
              background: (!activeBasket || selectedIds.length === 0) ? '#fecaca' : '#dc2626',
              color: '#fff',
              borderRadius: 8,
              cursor: (!activeBasket || selectedIds.length === 0) ? 'not-allowed' : 'pointer'
            }}
            title={t('removeSelectedTooltip')}
          >
            {t('removeSelected')}
          </button>
        </div>
      </div>

      {/* Two columns: baskets | products */}
      <div style={{ height: 'calc(100% - 40px)', display: 'flex', gap: 12 }}>
        {/* LEFT */}
        <section
          style={{
            width: 380, minWidth: 320, height: '100%',
            border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, overflow: 'hidden', background: '#fff'
          }}
        >
          <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
            <AgGridReact
              theme="legacy"
              ref={leftRef}
              rowData={baskets}
              columnDefs={basketCols}
              defaultColDef={basketDefault}
              animateRows={false}
              headerHeight={36}
              domLayout="normal"
              rowSelection={{ mode: 'singleRow', checkboxes: false }}
              onRowClicked={onBasketRowClicked}
            />
          </div>
        </section>

        {/* RIGHT */}
        <section
          style={{
            flex: 1, minWidth: 0, minHeight: 0, height: '100%',
            border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, overflow: 'hidden', background: '#fff'
          }}
        >
          <div style={{ marginBottom: 6, fontSize: 13, color: '#6b7280' }}>
            {activeBasket ? 
              t('productsInBasket', { basketName: activeBasket.name, count: products.length }) : 
              t('selectBasket')
            }
          </div>
          <div className="ag-theme-quartz" style={{ height: 'calc(100% - 24px)', width: '100%' }}>
            <AgGridReact
              theme="legacy"
              ref={rightRef}
              rowData={products}
              columnDefs={prodCols}
              defaultColDef={prodDefault}
              animateRows={false}
              headerHeight={36}
              domLayout="normal"
              rowSelection={{ mode: 'multiRow', headerCheckbox: true, checkboxes: true }}
              selectionColumnDef={{ width: 42, suppressMenu: true, resizable: false }}
              suppressRowClickSelection={true}
              rowMultiSelectWithClick={false}
              multiSortKey="shift"
              onSelectionChanged={onRightSelectionChanged}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
