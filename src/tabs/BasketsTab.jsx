/**
 * Baskets Tab Component
 * Manages shopping baskets (collections of products) with CRUD operations.
 * Features dual-grid layout: left grid shows baskets, right grid shows products in selected basket.
 * Supports private and shared baskets with ownership management.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { defaultColDef, commonGridProps, getGridContainerStyle } from '../lib/gridConfig.js';

const asItems = (d) => (Array.isArray(d) ? d : (d?.items ?? []));

// Custom cell renderer for URL
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
  const { user } = useAuth();

  const [baskets, setBaskets] = useState([]);
  const [activeBasket, setActiveBasket] = useState(null);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIsShared, setNewIsShared] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [editingOwnership, setEditingOwnership] = useState(false);
  const [editIsShared, setEditIsShared] = useState(false);

  const leftRef = useRef(null);
  const rightRef = useRef(null);

  // --- Load baskets
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

  // --- Load basket products
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

  // --- Left grid: baskets
  const basketCols = useMemo(() => ([
    { headerName: t('id'), field: 'id', width: 90 },
    { headerName: t('name'), field: 'name', flex: 1, minWidth: 180 },
    { headerName: t('itemCount'), field: 'itemCount', width: 110 },
    { 
      headerName: t('ownership'), 
      field: 'isShared', 
      width: 120,
      cellRenderer: (params) => {
        if (params.data.isShared || params.data.usr_id === 0) {
          return '🌐 ' + t('shared');
        }
        return '🔒 ' + t('private');
      }
    },
  ]), [t]);
  const onBasketRowClicked = useCallback((e) => setActiveBasket(e.data), []);

  // --- Right grid: products in basket
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

  // Selected IDs from right grid (for enabling delete button)
  const [selectedIds, setSelectedIds] = useState([]);
  const onRightSelectionChanged = useCallback((e) => {
    setSelectedIds(e.api.getSelectedRows().map(r => r.id));
  }, []);

  // --- Delete selected products from basket
  const handleRemoveSelected = useCallback(async () => {
    const bid = activeBasket?.id;
    if (!bid) { alert(t('selectBasketFirst')); return; }
    if (selectedIds.length === 0) { alert(t('noProductsSelectedRight')); return; }

    // Confirmation (optional)
    if (!confirm(t('confirmRemoveProducts', { count: selectedIds.length, basketName: activeBasket.name }))) return;

    try {
      await Promise.all(
        selectedIds.map(pid =>
          fetch(`/api/v1/baskets/${bid}/products/${pid}`, { 
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          })
            .then(r => { if (!r.ok) throw new Error(`${r.status}`); })
        )
      );
      // Refresh right grid + update counts in left grid
      await reloadProducts(bid);
      await reloadBaskets();
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      alert(t('errorRemovingFromBasket'));
    }
  }, [activeBasket, selectedIds, reloadProducts, reloadBaskets, t]);

  // --- Add basket
  const handleAddBasket = useCallback(async () => {
    if (!newName.trim()) return;
    try {
      const payload = { name: newName.trim() };
      // If basket is shared, set usr_id to 0
      if (newIsShared) {
        payload.usr_id = 0;
      }
      // Otherwise backend automatically sets usr_id to current user
      
      await fetchJSON('/api/v1/baskets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setNewName('');
      setNewIsShared(false);
      setAdding(false);
      await reloadBaskets();
    } catch {
      alert(t('errorAddingBasket'));
    }
  }, [newName, newIsShared, reloadBaskets, t]);

  // --- Delete basket
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

  // --- Change basket ownership
  const handleUpdateOwnership = useCallback(async () => {
    if (!activeBasket) return;
    try {
      await fetchJSON(`/api/v1/baskets/${activeBasket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          usr_id: editIsShared ? 0 : user.id 
        }),
      });
      setEditingOwnership(false);
      await reloadBaskets();
      // Refresh activeBasket to reflect new ownership
      try {
        const all = await fetchJSON('/api/v1/baskets');
        const found = (Array.isArray(all) ? all : (all?.items ?? [])).find(b => b.id === activeBasket.id);
        if (found) setActiveBasket(found);
      } catch {
        // Ignore
      }
      setStatus(t('ownershipUpdated'));
    } catch (error) {
      if (error.message.includes('403')) {
        alert(t('errorPermissionDenied'));
      } else {
        alert(t('errorUpdatingOwnership'));
      }
    }
  }, [activeBasket, editIsShared, user, reloadBaskets, t]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{t('baskets')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Add basket */}
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
                  if (e.key === 'Escape') { setAdding(false); setNewName(''); setNewIsShared(false); }
                }}
                style={{ padding: 4, borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={newIsShared}
                  onChange={e => setNewIsShared(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>{t('sharedBasket')}</span>
              </label>
              <button
                className="btn btn-add"
                onClick={handleAddBasket}
                disabled={!newName.trim()}
              >
                {t('add')}
              </button>
              <button
                className="btn btn-cancel"
                onClick={() => { setAdding(false); setNewName(''); setNewIsShared(false); }}
              >
                {t('cancel')}
              </button>
            </>
          ) : (
            <button
              className="btn btn-add"
              onClick={() => setAdding(true)}
              title={t('addBasketTooltip')}
            >
              + {t('addBasket')}
            </button>
          )}
          
          {/* Delete basket */}
          <button
            className="btn btn-delete"
            onClick={handleDeleteBasket}
            disabled={!activeBasket}
            title={t('deleteBasketTooltip')}
          >
            {t('deleteBasket')}
          </button>

          {/* Rename basket */}
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
                className="btn btn-edit"
                onClick={handleRenameBasket}
                disabled={!renameValue.trim()}
              >
                {t('save')}
              </button>
              <button
                className="btn btn-cancel"
                onClick={() => { setRenaming(false); setRenameValue(''); }}
              >
                {t('cancel')}
              </button>
            </>
          ) : (
            <button
              className="btn btn-edit"
              onClick={() => { setRenaming(true); setRenameValue(activeBasket?.name || ''); }}
              disabled={!activeBasket}
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
          
          {/* Remove selected products */}
          <button
            className="btn btn-delete"
            onClick={handleRemoveSelected}
            disabled={!activeBasket || selectedIds.length === 0}
            title={t('removeSelectedTooltip')}
          >
            {t('removeSelected')}
          </button>
        </div>
      </div>

      {/* Two columns: baskets | products */}
      <div style={{ height: 'calc(100% - 60px)', display: 'flex', gap: 12 }}>
        {/* LEFT */}
        <section
          style={{
            width: 380, minWidth: 320, height: '100%',
            border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, overflow: 'hidden', background: '#fff'
          }}
        >
          <div className="ag-theme-quartz" style={getGridContainerStyle()}>
            <AgGridReact
              {...commonGridProps}
              ref={leftRef}
              rowData={baskets}
              columnDefs={basketCols}
              defaultColDef={defaultColDef}
              rowSelection={{ mode: 'singleRow', checkboxes: false }}
              onRowClicked={onBasketRowClicked}
              getRowClass={(params) => params.data?.id === activeBasket?.id ? 'ag-row-active' : ''}
              tooltipShowDelay={300}
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

          {/* Ownership / sharing controls */}
          {activeBasket && (
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 13 }}>
                <strong>{t('ownership')}:</strong>
                <span style={{ marginLeft: 8, color: '#374151' }}>
                  {(activeBasket.isShared || activeBasket.usr_id === 0) ? `🌐 ${t('shared')}` : `🔒 ${t('private')}`}
                </span>
              </div>

              {/* Edit ownership button (only if user is owner or basket is shared) */}
              {((activeBasket.usr_id === 0) || (activeBasket.usr_id === user?.id)) && (
                editingOwnership ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={editIsShared}
                        onChange={e => setEditIsShared(e.target.checked)}
                      />
                      <span style={{ fontSize: 13 }}>{t('shared')}</span>
                    </label>
                    <button
                      className="btn btn-add"
                      onClick={handleUpdateOwnership}
                    >{t('save')}</button>
                    <button
                      className="btn btn-cancel"
                      onClick={() => { setEditingOwnership(false); setEditIsShared(false); }}
                    >{t('cancel')}</button>
                  </div>
                ) : (
                  <button
                    className="btn btn-cancel"
                    onClick={() => { setEditingOwnership(true); setEditIsShared(activeBasket.isShared || activeBasket.usr_id === 0); }}
                  >{t('editOwnership')}</button>
                )
              )}
            </div>
          )}
          <div className="ag-theme-quartz" style={getGridContainerStyle({ height: 'calc(100% - 24px)' })}>
            <AgGridReact
              {...commonGridProps}
              ref={rightRef}
              rowData={products}
              columnDefs={prodCols}
              defaultColDef={defaultColDef}
              rowSelection={{ mode: 'multiRow', headerCheckbox: true, checkboxes: true }}
              selectionColumnDef={{ width: 42, suppressMenu: true, resizable: false }}
              suppressRowClickSelection={true}
              rowMultiSelectWithClick={false}
              multiSortKey="shift"
              onSelectionChanged={onRightSelectionChanged}
              tooltipShowDelay={300}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
