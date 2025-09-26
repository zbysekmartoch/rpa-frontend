// src/components/ProductGrid.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';

// registrace komunitních modulů (řeší chybu #272)
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ProductGrid({
  mode,             // 'active' | 'selected'
  activePath,       // string nebo ''
  selectedPaths,    // string[]
  onCountsChange,   // ({displayed, selected}) => void
  onSelectionIdsChange,  // (ids:number[])
}) {
  const gridRef = useRef(null);
  const [rowData, setRowData] = useState([]);
  const { t } = useLanguage();

  // načti data podle módu
  useEffect(() => {
    const cats = mode === 'active' ? (activePath ? [activePath] : []) : selectedPaths;
    if (cats.length === 0) { setRowData([]); onCountsChange?.({ displayed: 0, selected: 0 }); return; }

    const usp = new URLSearchParams();
    cats.forEach(c => usp.append('category', c));
    usp.set('mode', 'subtree'); // bez limitu/offsetu → natáhneme vše co vrátí backend

    let abort = false;
    fetchJSON(`/api/v1/products?${usp.toString()}`)
      .then(d => { if (!abort) setRowData(d.items || []); })
      .catch(() => { if (!abort) setRowData([]); })
      .finally(() => { /* noop */ });

    return () => { abort = true; };
  }, [mode, activePath, selectedPaths, onCountsChange]);

  // definice sloupců (checkbox sloupec přidá AG Grid automaticky)
  const columnDefs = useMemo(() => ([
    { headerName: t('productId'), field: 'id', width: 90 },
    { headerName: t('productName'), field: 'name', flex: 1, minWidth: 200 },
    { headerName: t('category'), field: 'category_path', width: 180 },
    { headerName: t('brand'), field: 'brand', width: 120 },
    { headerName: t('price'), field: 'price', width: 100 },
  ]), [t]);

  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true }), []);

  const getRowId = useCallback(params => String(params.data.id), []);
  const updateCounts = useCallback((api) => {
    onCountsChange?.({
      displayed: api.getDisplayedRowCount(),
      selected: api.getSelectedNodes().length,
    });
  }, [onCountsChange]);

  const updateSelectedIds = useCallback((api) => {
    const ids = api.getSelectedRows().map(r => r.id);
    onSelectionIdsChange?.(ids);
  }, [onSelectionIdsChange]);


  return (
    <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        theme="legacy"                               // sjednocení s CSS tématy
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection={{ mode: 'multiRow', headerCheckbox: true, checkboxes: true }}
        selectionColumnDef={{ width: 42, suppressMenu: true, resizable: false }}
        suppressRowClickSelection={true}
        rowMultiSelectWithClick={false}
        multiSortKey="shift"
        headerHeight={36}
        getRowId={getRowId}
        animateRows={false}
        domLayout="normal"


        onGridReady={(p) => { updateCounts(p.api); updateSelectedIds(p.api); }}
        onModelUpdated={(e) => updateCounts(e.api)}
        onSelectionChanged={(e) => { updateCounts(e.api); updateSelectedIds(e.api); }}
      />
    </div>
  );
}
