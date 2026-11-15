import { useEffect, useState } from 'react';
import './App.css'
import { fetchChildren, fetchClusters } from './api';
import type { Resource } from './types';

function App() {
  const [nodes, setNodes] = useState<Map<number, Resource>>(new Map());
  const [rootIds, setRootIds] = useState<number[]>([]);

  const [childrenOf, setChildrenOf] = useState<Map<number, number[]>>(new Map()); 
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchClusters().then((list) => {
      const nodeMap = new Map<number, Resource>();
      const ids: number[] = [];
      list.forEach((node) => {
        ids.push(node.id);
        nodeMap.set(node.id, node);
      });
      setNodes(nodeMap);
      setRootIds(ids);
    });  
  }, []);

  function toggle(id: number) {
    if (expanded.has(id)) {
      setExpanded((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } else {
      setExpanded((prev) => new Set(prev).add(id));
    }

    if (!childrenOf.has(id)) {
      fetchChildren(id).then((list) => {
        setNodes((prev) => {
          const next = new Map(prev);
          list.forEach((child) => next.set(child.id, child));
          return next;
        });

        setChildrenOf((prev) => {
          const next = new Map(prev);
          next.set(id, list.map((child) => child.id));
          return next;
        });
      });
    }
  }

  console.log(childrenOf);

  // 화면에 그릴 한 줄: 어떤 리소스를, 몇 단계 들여쓰기로
  type Row = { id: number; depth: number };

  const rows: Row[] = [];

  function walk(ids: number[], depth: number) {
    for (const id of ids) {
      rows.push({ id, depth });

      const kids = childrenOf.get(id);
      if (expanded.has(id) && kids) {
        walk(kids, depth + 1);
      }
    }
  }

  walk(rootIds, 0);   // 맨 위 Cluster부터 시작

  return (
    <div className="App">
      <h1>Infra Monitor</h1>
      {
        rows.map((row) => {
          const node = nodes.get(row.id);
          return (
            <div key={row.id} style={{ marginLeft: `${row.depth * 20}px` }}>
              <button onClick={() => toggle(row.id)}>{expanded.has(row.id) ? '▾' : '▸'}</button>
              {node?.name}
            </div>
          );
        })
      }
    </div>
  )  
}

export default App
