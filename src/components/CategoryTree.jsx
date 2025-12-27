/**
 * Category Tree Component
 * Displays a hierarchical tree of product categories with checkboxes.
 * Supports multi-selection for filtering products and single-selection for activation.
 * Categories are fetched from the API and rendered recursively.
 */
import React, { useEffect, useState } from 'react';
import { fetchJSON } from '../lib/fetchJSON.js';

export function CategoryTree({ selectedPaths, onTogglePath, activePath, onActivate }) {
  const [tree, setTree] = useState([]);

  useEffect(() => {
    let abort = false;
    fetchJSON('/api/v1/categories/tree')
      .then(d => { if (!abort) setTree(d || []); })
      .catch(() => { if (!abort) setTree([]); });
    return () => { abort = true; };
  }, []);

  return (
    <div style={{ fontSize: 14 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Kategorie</div>
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
          display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px',
          borderRadius: 8, cursor: 'default', paddingLeft: depth * 16,
          background: isActive ? '#eef2ff' : 'transparent'
        }}
      >
        <div
          onClick={() => hasChildren && setOpen(o => !o)}
          disabled={!hasChildren}
          title={hasChildren ? (open ? 'Collapse' : 'Expand') : 'No subcategories'}
          style={{ width: 20, height: 20, border: 'none', background: 'transparent' }}
        >
          {hasChildren ? (open ? '▾' : '▸') : '•'}
        </div>

        <input
          type="checkbox"
          style={{ width: 16, height: 16 }}
          checked={checked}
          onChange={() => onTogglePath(node.path)}
          title="Select category (subtree will be included in query)"
        />

        <div
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
        </div>
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
