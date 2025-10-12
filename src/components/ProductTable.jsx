import React, { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { fetchJSON } from '../lib/fetchJSON.js';

const columnHelper = createColumnHelper();

export default function ProductTable({ mode, activePath, selectedPaths, onActiveChange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // --- column resizing state (TanStack v8)
  const [columnSizing, setColumnSizing] = useState({});
  const [columnSizingInfo, setColumnSizingInfo] = useState({});

  // stáhni větší balík dat, bez pagination
  useEffect(() => {
    const cats = mode === 'active' ? (activePath ? [activePath] : []) : selectedPaths;
    if (cats.length === 0) { setData([]); setError(null); return; }
    const usp = new URLSearchParams();
    for (const c of cats) usp.append('category', c);
    usp.set('mode', 'subtree');
    usp.set('limit', '5000');
    usp.set('offset', '0');

    let abort = false;
    setLoading(true);
    setError(null);
    fetchJSON(`/api/v1/products?${usp.toString()}`)
      .then(d => { if (!abort) setData(d.items || []); })
      .catch(e => { if (!abort) setError(e); })
      .finally(() => { if (!abort) setLoading(false); });
    return () => { abort = true; };
  }, [mode, activePath, selectedPaths]);

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="size-4"
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected() ? 'true' : undefined}
          onChange={table.getToggleAllRowsSelectedHandler()}
          title="Vybrat vše"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="size-4"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          onClick={e => e.stopPropagation()}
          title="Vybrat záznam"
        />
      ),
      size: 36,
      enableResizing: false,
    }),
    columnHelper.accessor('id', {
      header: () => 'ID',
      cell: info => info.getValue(),
      size: 80,
    }),
    columnHelper.accessor('name', {
      header: () => 'Název',
      cell: info => <span className="font-medium">{info.getValue()}</span>,
      size: 240,
    }),
    columnHelper.accessor('brand', {
      header: () => 'Značka',
      cell: info => info.getValue(),
      size: 160,
    }),
    columnHelper.accessor('category', {
      header: () => 'Kategorie (celá cesta)',
      cell: info => <div className="truncate" title={info.getValue()}>{info.getValue()}</div>,
      size: 520,
    }),
    columnHelper.accessor('minDate', {
      header: () => 'Nejstarší cena',
      cell: info => {
        const value = info.getValue();
        if (!value) return '-';
        try {
          return new Date(value).toISOString().split('T')[0];
        } catch {
          return value;
        }
      },
      size: 120,
    }),
    columnHelper.accessor('maxDate', {
      header: () => 'Nejnovější cena',
      cell: info => {
        const value = info.getValue();
        if (!value) return '-';
        try {
          return new Date(value).toISOString().split('T')[0];
        } catch {
          return value;
        }
      },
      size: 120,
    }),
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection, sorting, columnSizing, columnSizingInfo },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    columnResizeMode: 'onChange', // plynulé resize
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const onRowClick = (row) => {
    const id = row.original.id;
    setActiveId(id);
    onActiveChange?.(row.original);
  };

  return (
    <div className="h-full flex flex-col">
      {/* toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-neutral-600 dark:text-neutral-300 flex items-center gap-3">
          {mode === 'active'
            ? <span>Aktivní kategorie: {activePath ? <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">{activePath}</code> : '(nic)'}</span>
            : <span>Označené kategorie: {selectedPaths.length}</span>}
          <span>|</span>
          <span>Vybráno: {Object.keys(rowSelection).length}</span>
          {activeId && <span>| Aktivní záznam: <code>{activeId}</code></span>}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded border hover:bg-neutral-50 dark:hover:bg-neutral-800" onClick={() => setRowSelection({})}>Zrušit výběr</button>
          <button className="px-3 py-1.5 rounded border hover:bg-neutral-50 dark:hover:bg-neutral-800" onClick={() => setSorting([])}>Zrušit třídění</button>
        </div>
      </div>

      {/* jen tabulka scroluje */}
      <div className="relative flex-1 border rounded-2xl overflow-auto">
        <table className="w-full text-sm">
          {/* sticky, světlejší hlavička */}
          <thead className="sticky top-0 z-10 bg-neutral-50/95 backdrop-blur border-b">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="text-left">
                {hg.headers.map(header => {
                  const canResize = header.column.getCanResize?.() ?? true;
                  return (
                    <th
                      key={header.id}
                      className="p-2 select-none whitespace-nowrap align-bottom font-semibold text-neutral-700"
                      style={{ width: header.getSize() }}
                    >
                      <div
                        className="flex items-end gap-1 cursor-pointer"
                        onClick={header.column.getToggleSortingHandler()}
                        title="Klik pro třídění, Shift+klik pro sekundární třídění"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: '▲', desc: '▼' }[header.column.getIsSorted()] || null}
                      </div>

                      {/* resizer */}
                      {canResize && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none opacity-40 hover:opacity-80"
                          style={{ transform: 'translateX(50%)' }}
                          aria-label="Resize column"
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* striped, světlejší řádky */}
          <tbody className="[&>tr:nth-child(odd)]:bg-white [&>tr:nth-child(even)]:bg-neutral-50">
            {loading && (
              <tr><td colSpan={table.getAllLeafColumns().length} className="p-3">Načítám…</td></tr>
            )}
            {error && (
              <tr><td colSpan={table.getAllLeafColumns().length} className="p-3 text-red-600">Chyba: {String(error.message)}</td></tr>
            )}
            {!loading && !error && table.getRowModel().rows.length === 0 && (
              <tr><td colSpan={table.getAllLeafColumns().length} className="p-3 text-neutral-500">Žádná data</td></tr>
            )}
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row)}
                className={
                  'hover:bg-neutral-100 transition-colors border-b border-neutral-100 ' +
                  (row.original.id === activeId ? 'ring-2 ring-blue-500 relative' : '')
                }
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-2 align-top text-neutral-800">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
