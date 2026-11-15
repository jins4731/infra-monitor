import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchChildren, fetchClusters, fetchDescendants } from '../api';
import { STATUS_FILTERS, type FilterKey } from '../filters';
import { resourceChangeObserver } from '../observer';
import type { Resource, Row } from '../types';
import { ancestorIdsOf } from '../utils';

/**
 * 리소스 트리 커스텀 훅 (퍼사드 패턴)
 *
 * 내부에는 Map/Set 4개, 서버 요청, 캐시, 평탄화가 얽혀 있지만
 * 사용하는 쪽(Container)은 rows, toggle, reveal 같은 단순한 인터페이스만 알면 된다.
 * - 퍼사드: "복잡한 시스템을 감싸서 간단한 인터페이스만 제공한다"
 */
const useResourceTree = () => {
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
  // 상태 필터 (전략 키)
  const [filterKey, setFilterKey] = useState<FilterKey>('ALL');

  /**
   * 자식을 요청한 적 있는 부모 id.
   * 화면에 그릴 값이 아니라 "중복 요청을 막기 위한 기록"이라 state 가 아닌 ref 에 둔다.
   * - 응답이 오기 전에 버튼을 두 번 눌러도 요청은 한 번만 간다
   * - toggle 이 state 를 읽지 않으므로 useCallback 으로 함수를 한 번만 만들 수 있다
   */
  const requestedRef = useRef<Set<number>>(new Set());

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

  /**
   * 폴링 변경분 구독 (옵저버 패턴)
   * 이미 받아온 리소스 중 updatedAt 이 바뀐 것만 교체한다.
   * - 바뀐 리소스만 새 객체가 되므로, React.memo 인 TreeRow 는 그 줄만 다시 그린다 (깜빡임 없음)
   * - 아직 펼치지 않아 받아오지 않은 리소스는 무시한다 (펼칠 때 최신 값을 받으므로)
   */
  useEffect(() => {
    const unsubscribe = resourceChangeObserver.subscribe((items) => {
      setNodes((prev) => {
        let next: Map<number, Resource> | null = null;
        for (const item of items) {
          const old = prev.get(item.id);
          if (!old || old.updatedAt === item.updatedAt) continue;
          if (!next) next = new Map(prev); // 바뀐 게 있을 때만 복사
          next.set(item.id, item);
        }
        return next ?? prev; // 바뀐 게 없으면 그대로 → 리렌더링 없음
      });
    });
    return unsubscribe; // 컴포넌트가 사라지면 구독 해제
  }, []);

  /** 받아온 자식들을 nodes 와 childrenOf 에 저장 (불변 컬렉션: 복사본을 만들어 교체) */
  const saveChildren = useCallback((parentId: number, list: Resource[]) => {
    setNodes((prev) => {
      const next = new Map(prev);
      list.forEach((child) => next.set(child.id, child));
      return next;
    });
    setChildrenOf((prev) => {
      const next = new Map(prev);
      next.set(parentId, list.map((child) => child.id));
      return next;
    });
  }, []);

  /** 펼치기/접기. 처음 펼칠 때만 서버에서 자식을 가져온다 */
  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    if (!requestedRef.current.has(id)) {
      requestedRef.current.add(id);
      fetchChildren(id).then((list) => saveChildren(id, list));
    }
  }, [saveChildren]);

  /**
   * 검색 결과 위치까지 펼치기
   * 1) path 에서 상위 id(Cluster, Node, Namespace)를 꺼낸다
   * 2) 아직 자식을 받아오지 않은 상위만 서버에 요청 (여러 개를 동시에)
   * 3) 받은 자식을 저장하고, 상위를 모두 펼치고, 대상을 선택한 뒤 그 줄로 스크롤
   */
  const reveal = useCallback(async (target: Resource) => {
    const ancestorIds = ancestorIdsOf(target);
    const missing = ancestorIds.filter((id) => !requestedRef.current.has(id));
    missing.forEach((id) => requestedRef.current.add(id));

    const lists = await Promise.all(missing.map((id) => fetchChildren(id)));
    missing.forEach((id, i) => saveChildren(id, lists[i]));

    setExpanded((prev) => {
      const next = new Set(prev);
      ancestorIds.forEach((id) => next.add(id));
      return next;
    });
    // 고른 Pod 가 현재 필터에 맞지 않으면 트리에서 숨겨져 찾아갈 수 없으므로 필터를 해제한다
    setFilterKey((prev) =>
      target.type === 'POD' && !STATUS_FILTERS[prev].match(target) ? 'ALL' : prev,
    );
    setSelectedId(target.id);
    setScrollTargetId(target.id);
  }, [saveChildren]);

  const clearScrollTarget = useCallback(() => setScrollTargetId(null), []);

  // 전체 펼치기 진행 중 (버튼 비활성화용)
  const [expandingAll, setExpandingAll] = useState(false);

  /**
   * 전체 펼치기: Cluster 마다 하위 전체를 요청 1번으로 받는다 (Materialized Path, 총 20번).
   * 10만 건을 한 번에 저장하므로 saveChildren 을 2,000번 부르지 않고 Map 을 한 번만 복사한다.
   */
  const expandAll = useCallback(async () => {
    setExpandingAll(true);
    try {
      const lists = await Promise.all(rootIds.map((id) => fetchDescendants(id)));
      const all = lists.flat();

      // 부모 id → 자식 id 목록 (id 순서로 왔으므로 원래 순서가 유지된다)
      const grouped = new Map<number, number[]>();
      for (const r of all) {
        if (r.parentId === null) continue;
        const siblings = grouped.get(r.parentId) ?? [];
        siblings.push(r.id);
        grouped.set(r.parentId, siblings);
      }

      setNodes((prev) => {
        const next = new Map(prev);
        all.forEach((r) => next.set(r.id, r));
        return next;
      });
      setChildrenOf((prev) => {
        const next = new Map(prev);
        grouped.forEach((ids, parentId) => next.set(parentId, ids));
        return next;
      });
      grouped.forEach((_, parentId) => requestedRef.current.add(parentId));
      setExpanded(new Set(grouped.keys())); // 자식이 있는 리소스를 모두 펼침
    } finally {
      setExpandingAll(false);
    }
  }, [rootIds]);

  /** 전체 접기 (받아온 데이터는 캐시로 남겨 둔다) */
  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  /**
   * 필터에 쓸 데이터. "전체"일 때는 줄 목록이 리소스 값과 상관없으므로 null 로 둔다.
   * → 폴링으로 nodes 가 바뀌어도 아래 평탄화(10만 줄)를 다시 계산하지 않는다.
   *   (바뀐 줄은 TreeRow 가 새 node 를 받아 그 줄만 다시 그린다)
   */
  const nodesForFilter = filterKey === 'ALL' ? null : nodes;

  /**
   * 트리 평탄화: 펼쳐진 것만 따라 내려가며 "지금 보여야 하는 줄"을 순서대로 담는다.
   * - 상태 필터는 Pod 에만 적용한다. (상위 리소스는 하위 상태를 모아 두지 않아서 항상 표시)
   * - useMemo: 펼침 상태, 자식 목록, 필터(필터가 걸렸을 때는 데이터)가 바뀔 때만 다시 계산한다
   */
  const rows = useMemo(() => {
    const strategy = STATUS_FILTERS[filterKey];
    const result: Row[] = [];
    const walk = (ids: number[], depth: number) => {
      for (const id of ids) {
        const node = nodesForFilter?.get(id);
        if (node?.type === 'POD' && !strategy.match(node)) continue; // 필터에 맞지 않는 Pod 는 건너뜀
        result.push({ id, depth });

        const kids = childrenOf.get(id);
        if (expanded.has(id) && kids) {
          walk(kids, depth + 1);
        }
      }
    };
    walk(rootIds, 0); // 맨 위 Cluster 부터 시작
    return result;
  }, [rootIds, childrenOf, expanded, nodesForFilter, filterKey]);

  // 상세에 보여줄 리소스와 경로 (상위 id 를 이름으로 바꾼다)
  const selected = selectedId !== null ? nodes.get(selectedId) : undefined;
  const breadcrumb = selected
    ? ancestorIdsOf(selected).map((id) => nodes.get(id)?.name ?? '…').join(' › ')
    : '';

  return {
    nodes,
    rows,
    expanded,
    selectedId,
    selected,
    breadcrumb,
    scrollTargetId,
    filterKey,
    setFilter: setFilterKey,
    toggle,
    reveal,
    expandAll,
    collapseAll,
    expandingAll,
    select: setSelectedId,
    clearScrollTarget,
  };
};

export default useResourceTree;
