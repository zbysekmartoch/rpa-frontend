/**
 * Product Grid Component
 * Displays products in an AG Grid table with filtering, sorting, and selection.
 * Supports two modes: 'active' (single category) and 'selected' (multiple categories).
 * Features client-side filtering with floating filter row.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';
import { 
    defaultColDefWithFilter, 
    commonGridProps, 
    getGridContainerStyle,
    textFilterParams,
    numberFilterParams,
    dateFilterParams
} from '../lib/gridConfig.js';

// Register community modules (fixes error #272)
ModuleRegistry.registerModules([AllCommunityModule]);

// Loading overlay component
const LoadingOverlay = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12
    }}>
        <div style={{
            width: 24,
            height: 24,
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: '#6b7280', fontSize: 14 }}>Loading products...</span>
        <style>{`
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

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

export default function ProductGrid({
    mode,             // 'active' | 'selected'
    activePath,       // string nebo ''
    selectedPaths,    // string[]
    onCountsChange,   // ({displayed, selected}) => void
    onSelectionIdsChange,  // (ids:number[])
}) {
    const gridRef = useRef(null);
    const [rowData, setRowData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { t } = useLanguage();

    // Load data based on mode
    useEffect(() => {
        const cats = mode === 'active' ? (activePath ? [activePath] : []) : selectedPaths;
        if (cats.length === 0) { setRowData([]); onCountsChange?.({ displayed: 0, selected: 0 }); return; }

        const usp = new URLSearchParams();
        cats.forEach(c => usp.append('category', c));
        usp.set('mode', 'subtree'); // no limit/offset - fetch all data returned by backend

        let abort = false;
        setIsLoading(true);
        
        fetchJSON(`/api/v1/products?${usp.toString()}`)
            .then(d => { 
                if (!abort) {
                    // Use startTransition for non-blocking update
                    startTransition(() => {
                        setRowData(d.items || []);
                    });
                }
            })
            .catch(() => { if (!abort) setRowData([]); })
            .finally(() => { if (!abort) setIsLoading(false); });

        return () => { abort = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, activePath, selectedPaths]);  // onCountsChange intentionally omitted - it's a callback, not a data dependency

    // Column definitions (checkbox column is added automatically by AG Grid)
    const columnDefs = useMemo(() => ([
        { 
            headerName: t('productId'), 
            field: 'id', 
            width: 90,
            filter: 'agNumberColumnFilter',
            filterParams: numberFilterParams
        },
        { 
            headerName: t('productName'), 
            field: 'name', 
            flex: 1, 
            minWidth: 200,
            filter: 'agTextColumnFilter',
            filterParams: textFilterParams
        },
        { 
            headerName: t('category'), 
            field: 'category', 
            width: 180,
            filter: 'agTextColumnFilter',
            filterParams: textFilterParams
        },
        { 
            headerName: t('brand'), 
            field: 'brand', 
            width: 120,
            filter: 'agTextColumnFilter',
            filterParams: textFilterParams
        },
        { 
            headerName: t('priceCount'), 
            field: 'priceCount', 
            width: 110,
            filter: 'agNumberColumnFilter',
            filterParams: numberFilterParams
        },
        { 
            headerName: t('sellerCount'), 
            field: 'sellerCount', 
            width: 120,
            filter: 'agNumberColumnFilter',
            filterParams: numberFilterParams
        },
        { 
            headerName: t('oldestPrice'), 
            field: 'minDate', 
            width: 130,
            filter: 'agDateColumnFilter',
            filterParams: dateFilterParams,
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
            filter: 'agDateColumnFilter',
            filterParams: dateFilterParams,
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
            filter: false,
            cellRenderer: UrlCellRenderer
        },
    ]), [t]);

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

    // Grid container style with centralized theme styles
    const gridContainerStyle = useMemo(() => getGridContainerStyle({ position: 'relative' }), []);

    return (
        <div className="ag-theme-quartz" style={gridContainerStyle}>
            {/* Loading overlay during data loading or pending transition */}
            {(isLoading || isPending) && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <LoadingOverlay />
                </div>
            )}
            <AgGridReact
                {...commonGridProps}
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDefWithFilter}
                rowSelection={{ mode: 'multiRow', headerCheckbox: true, checkboxes: true }}
                selectionColumnDef={{ width: 42, suppressMenu: true, resizable: false }}
                suppressRowClickSelection={true}
                rowMultiSelectWithClick={false}
                multiSortKey="shift"
                getRowId={getRowId}
                
                // Filters - display filter row below header
                floatingFilter={true}
                
                // Tooltip settings
                tooltipShowDelay={300}
                tooltipInteraction={true}

                onGridReady={(p) => { updateCounts(p.api); updateSelectedIds(p.api); }}
                onModelUpdated={(e) => updateCounts(e.api)}
                onSelectionChanged={(e) => { updateCounts(e.api); updateSelectedIds(e.api); }}
                onFilterChanged={(e) => updateCounts(e.api)}
            />
        </div>
    );
}
