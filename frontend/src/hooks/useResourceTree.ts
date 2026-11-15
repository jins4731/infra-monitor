import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchChildren, fetchClusters } from '../api';
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
    setSelectedId(target.id);
    setScrollTargetId(target.id);
  }, [saveChildren]);

  const clearScrollTarget = useCallback(() => setScrollTargetId(null), []);

  /**
   * 트리 평탄화: 펼쳐진 것만 따라 내려가며 "지금 보여야 하는 줄"을 순서대로 담는다.
   * useMemo: 펼침 상태나 자식 목록이 바뀔 때만 다시 계산한다 (선택만 바뀌었을 때는 재계산 안 함)
   */
  const rows = useMemo(() => {
    const result: Row[] = [];
    const walk = (ids: number[], depth: number) => {
      for (const id of ids) {
        result.push({ id, depth });

        const kids = childrenOf.get(id);
        if (expanded.has(id) && kids) {
          walk(kids, depth + 1);
        }
      }
    };
    walk(rootIds, 0); // 맨 위 Cluster 부터 시작
    return result;
  }, [rootIds, childrenOf, expanded]);

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
    toggle,
    reveal,
    select: setSelectedId,
    clearScrollTarget,
  };
};

export default useResourceTree;
