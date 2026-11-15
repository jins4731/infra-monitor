import { useEffect, useRef, useState } from 'react';
import './App.css'
import { fetchChildren, fetchClusters } from './api';
import type { Resource } from './types';
import { useVirtualizer } from '@tanstack/react-virtual';

// 화면에 그릴 한 줄: 어떤 리소스를, 몇 단계 들여쓰기로
type Row = { id: number; depth: number };

const ROW_HEIGHT = 30; // 한 줄 높이(px)

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

  const scrollRef = useRef<HTMLDivElement>(null);       // 스크롤 박스를 가리킬 참조

  const virtualizer = useVirtualizer({
    count: rows.length,                          // 전체 줄 수
    getScrollElement: () => scrollRef.current,   // 어떤 박스가 스크롤되는지
    estimateSize: () => ROW_HEIGHT,              // 한 줄 높이
    overscan: 10,                                // 화면 위아래로 10줄 여유
  });

  return (
    <div className="App">
      <h1>Infra Monitor</h1>
      <div ref={scrollRef} style={{ height: 600, overflow: 'auto', border: '1px solid #ddd' }}>
        {/* 전체 높이만큼 빈 공간 → 스크롤바가 전체 줄 수만큼 생김 */}
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            const node = nodes.get(row.id);
            return (
              <div
                key={row.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '100%',
                  height: ROW_HEIGHT,
                  transform: `translateY(${item.start}px)`,   // 이 줄이 있어야 할 위치로 이동
                  paddingLeft: row.depth * 20,
                }}
              >
                {/* Pod는 자식이 없으므로 펼치기 버튼을 숨긴다 */}
                {node?.type !== 'POD' && (
                  <button onClick={() => toggle(row.id)}>{expanded.has(row.id) ? '▾' : '▸'}</button>
                )}
                {node?.name}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )  
}

export default App
