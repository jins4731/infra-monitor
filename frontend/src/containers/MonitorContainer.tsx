import { useEffect, useState } from 'react';
import { fetchChildren, fetchClusters } from '../api';
import type { Resource, Row } from '../types';
import { ancestorIdsOf } from '../utils';
import TreeView from '../components/TreeView';
import DetailPanel from '../components/DetailPanel';
import SearchContainer from './SearchContainer';

/**
 * Container: 트리 상태 관리와 서버 요청을 담당한다.
 * 화면을 그리는 일은 Presentational 컴포넌트(TreeView, DetailPanel)에 props 로 넘긴다.
 */
const MonitorContainer = () => {
  // 서랍 ① id → 리소스 (받아온 리소스는 모두 여기에 한 번만 저장)
  const [nodes, setNodes] = useState<Map<number, Resource>>(new Map());
  // 서랍 ② 맨 위 Cluster 들의 id
  const [rootIds, setRootIds] = useState<number[]>([]);
  // 서랍 ③ 부모 id → 자식 id 목록 (한 번 받아온 자식은 캐시)
  const [childrenOf, setChildrenOf] = useState<Map<number, number[]>>(new Map());
  // 서랍 ④ 펼쳐진 id
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // 선택된 리소스 id. 데이터는 nodes 에 있으므로 id 만 기억한다
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // 검색으로 고른 리소스: 트리에 나타나면 그 줄로 스크롤
  const [scrollTargetId, setScrollTargetId] = useState<number | null>(null);

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

  /** 펼치기/접기. 처음 펼칠 때만 서버에서 자식을 가져온다 */
  const handleToggle = (id: number) => {
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
  };

  /**
   * 검색 결과 위치까지 펼치기
   * 1) path 에서 상위 id(Cluster, Node, Namespace)를 꺼낸다
   * 2) 아직 자식을 받아오지 않은 상위만 서버에 요청 (여러 개를 동시에)
   * 3) 받은 자식을 저장하고, 상위를 모두 펼치고, 대상을 선택한 뒤 그 줄로 스크롤
   */
  const handleReveal = async (target: Resource) => {
    const ancestorIds = ancestorIdsOf(target);
    const missing = ancestorIds.filter((id) => !childrenOf.has(id));
    const lists = await Promise.all(missing.map((id) => fetchChildren(id)));

    setNodes((prev) => {
      const next = new Map(prev);
      lists.flat().forEach((child) => next.set(child.id, child));
      next.set(target.id, target);
      return next;
    });
    setChildrenOf((prev) => {
      const next = new Map(prev);
      missing.forEach((id, i) => next.set(id, lists[i].map((child) => child.id)));
      return next;
    });
    setExpanded((prev) => {
      const next = new Set(prev);
      ancestorIds.forEach((id) => next.add(id));
      return next;
    });
    setSelectedId(target.id);
    setScrollTargetId(target.id);
  };

  // 트리 평탄화: 펼쳐진 것만 따라 내려가며 "지금 보여야 하는 줄"을 순서대로 담는다
  const rows: Row[] = [];
  const walk = (ids: number[], depth: number) => {
    for (const id of ids) {
      rows.push({ id, depth });

      const kids = childrenOf.get(id);
      if (expanded.has(id) && kids) {
        walk(kids, depth + 1);
      }
    }
  };
  walk(rootIds, 0); // 맨 위 Cluster 부터 시작

  // 상세에 보여줄 경로: 상위 id 를 이름으로 바꾼다 (펼쳐져 있으면 nodes 에 이미 있음)
  const selected = selectedId !== null ? nodes.get(selectedId) : undefined;
  const breadcrumb = selected
    ? ancestorIdsOf(selected).map((id) => nodes.get(id)?.name ?? '…').join(' › ')
    : '';

  return (
    <div className="app">
      <header className="header">
        <h1>Infra Monitor</h1>
        <SearchContainer onPick={handleReveal} />
      </header>

      <div className="main">
        <TreeView
          rows={rows}
          nodes={nodes}
          expanded={expanded}
          selectedId={selectedId}
          scrollTargetId={scrollTargetId}
          onToggle={handleToggle}
          onSelect={setSelectedId}
          onScrolled={() => setScrollTargetId(null)}
        />
        <DetailPanel resource={selected} breadcrumb={breadcrumb} />
      </div>
    </div>
  );
};

export default MonitorContainer;
