
  // File: src/hooks/useCategoryTree.js
  import { useEffect, useMemo, useState } from 'react';
  import { fetchJSON } from '../lib/fetchJSON.js';
  
  export function useCategoryTree() {
    const [tree, setTree] = useState([]);
    const [selected, setSelected] = useState(() => new Set());
    const [active, setActive] = useState('');
  
    useEffect(() => {
      fetchJSON('/api/v1/categories/tree').then(setTree).catch(console.error);
    }, []);
  
    // Build index path->node (without converting children arrays)
    const index = useMemo(() => {
      const map = new Map();
      function walk(nodes) {
        for (const n of nodes) {
          map.set(n.path, n);
          if (n.children?.length) walk(n.children);
        }
      }
      walk(tree);
      return map;
    }, [tree]);
  
    function getDescendantPaths(path) {
      const node = index.get(path);
      const out = [];
      if (!node) return out;
      function rec(n) {
        out.push(n.path);
        for (const ch of n.children || []) rec(ch);
      }
      for (const ch of node.children || []) rec(ch);
      return out;
    }
  
    function toggleSubtree(path) {
      const next = new Set(selected);
      const all = [path, ...getDescendantPaths(path)];
      const isSelected = next.has(path);
      if (isSelected) {
        for (const p of all) next.delete(p);
      } else {
        for (const p of all) next.add(p);
      }
      setSelected(next);
    }
  
    function clearSelection() { setSelected(new Set()); }
  
    // compute checkbox state: 'checked' | 'indeterminate' | 'unchecked'
    function stateOf(path) {
      const node = index.get(path);
      if (!node) return 'unchecked';
      const all = [path, ...getDescendantPaths(path)];
      let have = 0;
      for (const p of all) if (selected.has(p)) have++;
      if (have === 0) return 'unchecked';
      if (have === all.length) return 'checked';
      return 'indeterminate';
    }
  
    return { tree, selected, active, setActive, toggleSubtree, clearSelection, stateOf };
  }
  