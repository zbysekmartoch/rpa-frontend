import React, { useMemo, useRef, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([AllCommunityModule]);

// --- Category tree connected to data (active category + selected categories)
function CategoryTree({ selectedPaths, onTogglePath, activePath, onActivate }) {
  const [tree, setTree] = useState([]);
  useEffect(() => {
    fetch('/api/v1/categories/tree')
      .then(r => (r.ok ? r.json() : []))
      .then(setTree)
      .catch(() => setTree([]));
  }, []);

  return (
    <div style={{ fontSize: 14 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Categories</div>
      <div>
        {tree.map(n => (
          <TreeNode
            key={n.path}
            node={n}
            depth={0}
            selectedPaths={selectedPaths}
            onTogglePath={onTogglePath}
            activePath={activePath}
            onActivate={onActivate}
          />
        ))}
      </div>
    </div>
  );
}

function TreeNode({ node, depth, selectedPaths, onTogglePath, activePath, onActivate }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;
  const checked = selectedPaths.includes(node.path);
  const isActive = activePath === node.path;
  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px',
          borderRadius: 8, cursor: 'default', paddingLeft: depth * 16,
          background: isActive ? '#eef2ff' : 'transparent'
        }}
      >
        <button
          onClick={() => hasChildren && setOpen(o => !o)}
          disabled={!hasChildren}
          title={hasChildren ? (open ? 'Collapse' : 'Expand') : 'No subcategories'}
          style={{ width: 20, height: 20, border: 'none', background: 'transparent' }}
        >
          {hasChildren ? (open ? '▾' : '▸') : '•'}
        </button>
        <input
          type="checkbox"
          style={{ width: 16, height: 16 }}
          checked={checked}
          onChange={() => onTogglePath(node.path)}
          title="Select category (subtree will be included in query)"
        />
        <button
          onClick={() => onActivate(node.path)}
          title={node.path}
          style={{
            flex: 1,
            textAlign: 'left',
            border: 'none',
            background: 'transparent',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 220,
            fontWeight: isActive ? 600 : 400
          }}
        >
          {node.name} <span style={{ color: '#6b7280' }}>({node.productCount})</span>
        </button>
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map(ch => (
            <TreeNode
              key={ch.path}
              node={ch}
              depth={depth + 1}
              selectedPaths={selectedPaths}
              onTogglePath={onTogglePath}
              activePath={activePath}
              onActivate={onActivate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);

  // Counts displayed above the grid
  const [displayedCount, setDisplayedCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);

  // UI state: active vs. selected categories
  const [mode, setMode] = useState('active'); // 'active' | 'selected'
  const [activePath, setActivePath] = useState('');
  const [selectedPaths, setSelectedPaths] = useState([]);

  // Toggle one category in the selected list (just the path; backend handles subtree)
  const onTogglePath = (path) => {
    setSelectedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };

  // Fetch products based on mode
  useEffect(() => {
    const cats = mode === 'active' ? (activePath ? [activePath] : []) : selectedPaths;
    if (cats.length === 0) { setRowData([]); setDisplayedCount(0); setSelectedCount(0); return; }

    const usp = new URLSearchParams();
    cats.forEach(c => usp.append('category', c));
    usp.set('mode', 'subtree');
    usp.set('limit', '5000');
    usp.set('offset', '0');

    let abort = false;
    fetch(`/api/v1/products?${usp.toString()}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`${r.status} ${r.statusText}`))))
      .then(d => { if (!abort) setRowData(d.items || []); })
      .catch(() => { if (!abort) setRowData([]); })
      .finally(() => { /* no-op */ });
    return () => { abort = true; };
  }, [mode, activePath, selectedPaths]);

  // When data changes and grid exists, recalculate counts
  useEffect(() => {
    if (gridRef.current?.api) {
      setDisplayedCount(gridRef.current.api.getDisplayedRowCount());
      setSelectedCount(gridRef.current.api.getSelectedNodes().length);
    } else {
      setDisplayedCount(rowData.length);
      setSelectedCount(0);
    }
  }, [rowData]);

  const columnDefs = useMemo(() => [
    {
      headerName: '',
      field: '__sel__',
      width: 42,
      checkboxSelection: true,
      sortable: false,
      resizable: false,
      suppressMenu: true,
    },
    { headerName: 'ID', field: 'id', width: 90 },
    { headerName: 'Name', field: 'name', flex: 2, minWidth: 240 },
    { headerName: 'Brand', field: 'brand', width: 160 },
    { headerName: 'Category', field: 'category', flex: 3, minWidth: 320 },
  ], []);

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true }), []);

  return (
    <div style={{ height: '100vh', width: '100vw', boxSizing: 'border-box', padding: '12px', background: '#fff' }}>
      {/* Toolbar with mode switcher + counts */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Product Category Explorer</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <span style={{ fontSize: 14 }}>Display</span>
            <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none' }}>
              <option value="active">Active category</option>
              <option value="selected">Selected categories</option>
            </select>
          </div>
          {/* Counts above the grid */}
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#374151', background: '#f3f4f6', padding: '4px 8px', borderRadius: 8 }}>
              Displayed: <b>{displayedCount}</b>
            </span>
            <span style={{ fontSize: 13, color: '#374151', background: '#eef2ff', padding: '4px 8px', borderRadius: 8 }}>
              Selected: <b>{selectedCount}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout: tree on the left (fixed), grid on the right (flex:1) */}
      <div style={{ height: 'calc(100vh - 56px)', display: 'flex', gap: 12 }}>
        <aside
          style={{
            width: 340, minWidth: 300, maxWidth: 420, height: '100%',
            overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 12, padding: 10,
            background: '#fff'
          }}
        >
          <CategoryTree
            selectedPaths={selectedPaths}
            onTogglePath={onTogglePath}
            activePath={activePath}
            onActivate={setActivePath}
          />

          {/* Status overview */}
          <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
            <div style={{ marginBottom: 6 }}>
              Active: {activePath ? <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6 }}>{activePath}</code> : '(none)'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              Selected ({selectedPaths.length}):
              {selectedPaths.map(p => (
                <code key={p} style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6 }}>{p}</code>
              ))}
            </div>
          </div>
        </aside>

        <section
          style={{ flex: 1, minWidth: 0, height: '100%', border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, background: '#fff', overflow: 'hidden' }}
        >
          <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
            <AgGridReact
              theme="legacy"
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowSelection={{ mode: 'multiRow', headerCheckbox: true }}
              suppressRowClickSelection={true}
              rowMultiSelectWithClick={false}
              multiSortKey="shift"
              headerHeight={36}
              animateRows={false}
              domLayout="normal"
              onGridReady={(params) => {
                gridRef.current = { api: params.api, columnApi: params.columnApi };
                setDisplayedCount(params.api.getDisplayedRowCount());
                setSelectedCount(params.api.getSelectedNodes().length);
              }}
              onModelUpdated={(e) => setDisplayedCount(e.api.getDisplayedRowCount())}
              onSelectionChanged={(e) => setSelectedCount(e.api.getSelectedNodes().length)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
