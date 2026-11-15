import { useEffect, useRef, useState } from 'react';
import './App.css'
import { fetchChildren, fetchClusters } from './api';
import type { Resource, Status } from './types';
import { useVirtualizer } from '@tanstack/react-virtual';

// 화면에 그릴 한 줄: 어떤 리소스를, 몇 단계 들여쓰기로
type Row = { id: number; depth: number };

const ROW_HEIGHT = 30; // 한 줄 높이(px)

// 상태별 표시 색
const STATUS_COLOR: Record<Status, string> = {
  HEALTHY: '#16a34a', // 초록
  WARNING: '#d97706', // 주황
  ERROR: '#dc2626',   // 빨강
};

function App() {
  const [nodes, setNodes] = useState<Map<number, Resource>>(new Map());
  const [rootIds, setRootIds] = useState<number[]>([]);

  const [childrenOf, setChildrenOf] = useState<Map<number, number[]>>(new Map()); 
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // 선택된 리소스 id (선택 안 했으면 null). 데이터는 nodes에 이미 있으므로 id만 기억한다
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = selectedId !== null ? nodes.get(selectedId) : undefined;

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
    <div className="app">
      <h1>Infra Monitor</h1>

      <div className="main">
        {/* 왼쪽: 트리 (가상 스크롤) */}
        <div ref={scrollRef} className="tree">
          {/* 전체 높이만큼 빈 공간 → 스크롤바가 전체 줄 수만큼 생김 */}
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((item) => {
              const row = rows[item.index];
              const node = nodes.get(row.id);
              if (!node) return null;
              return (
                <div
                  key={row.id}
                  className={`row ${selectedId === row.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(row.id)}
                  style={{
                    height: ROW_HEIGHT,
                    transform: `translateY(${item.start}px)`,   // 이 줄이 있어야 할 위치로 이동
                    paddingLeft: 8 + row.depth * 20,
                  }}
                >
                  {/* Pod는 자식이 없으므로 펼치기 버튼 자리만 비워 둔다 (들여쓰기 맞추기) */}
                  <button
                    className="toggle"
                    style={{ visibility: node.type === 'POD' ? 'hidden' : 'visible' }}
                    onClick={(e) => {
                      e.stopPropagation(); // 버튼 클릭이 줄 선택(onClick)으로 번지지 않게
                      toggle(row.id);
                    }}
                  >
                    {expanded.has(row.id) ? '▾' : '▸'}
                  </button>
                  <span className="dot" style={{ background: STATUS_COLOR[node.status] }} />
                  <span className="type">{node.type}</span>
                  {node.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* 오른쪽: 선택한 리소스 상세 */}
        <aside className="detail">
          {selected ? <Detail resource={selected} /> : <p className="muted">리소스를 선택하세요.</p>}
        </aside>
      </div>
    </div>
  )
}

/** 상세 정보. 값이 없는(null) 항목은 그 리소스 종류에 해당하지 않으므로 숨긴다 */
function Detail({ resource: r }: { resource: Resource }) {
  return (
    <dl>
      <dt>이름</dt>
      <dd>{r.name}</dd>

      <dt>종류</dt>
      <dd>{r.type}</dd>

      <dt>상태</dt>
      <dd>
        <span className="dot" style={{ background: STATUS_COLOR[r.status] }} /> {r.status}
      </dd>

      <dt>마지막 갱신</dt>
      <dd>{r.updatedAt.replace('T', ' ').slice(0, 19)}</dd>

      {/* 0도 유효한 값이라 `r.cpu &&` 대신 `!== null` 로 확인 (0 && → 화면에 "0"이 그려짐) */}
      {r.phase !== null && (
        <>
          <dt>Phase</dt>
          <dd>{r.phase}</dd>
        </>
      )}
      {r.cpu !== null && (
        <>
          <dt>CPU</dt>
          <dd>{r.cpu}%</dd>
        </>
      )}
      {r.memory !== null && (
        <>
          <dt>메모리</dt>
          <dd>{r.memory}%</dd>
        </>
      )}
      {r.restarts !== null && (
        <>
          <dt>재시작 횟수</dt>
          <dd>{r.restarts}</dd>
        </>
      )}
    </dl>
  );
}

export default App
