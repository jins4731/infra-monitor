import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ROW_HEIGHT } from '../constants';
import type { Resource, Row } from '../types';
import TreeRow from './TreeRow';

type Props = {
  rows: Row[]; // 평탄화된 줄 목록
  nodes: Map<number, Resource>;
  expanded: Set<number>;
  selectedId: number | null;
  scrollTargetId: number | null; // 이 id 가 나타나면 그 줄로 스크롤
  onToggle: (id: number) => void;
  onSelect: (id: number) => void;
  onScrolled: () => void; // 스크롤을 마쳤음을 알림
};

/**
 * Presentational: 가상 스크롤 트리.
 * 전체 높이만큼 빈 공간을 만들고, 실제 DOM 은 화면에 보이는 줄 + 여유분만 그린다.
 */
const TreeView = ({ rows, nodes, expanded, selectedId, scrollTargetId, onToggle, onSelect, onScrolled }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null); // 스크롤 박스를 가리킬 참조

  const virtualizer = useVirtualizer({
    count: rows.length, // 전체 줄 수
    getScrollElement: () => scrollRef.current, // 어떤 박스가 스크롤되는지
    estimateSize: () => ROW_HEIGHT, // 한 줄 높이
    overscan: 10, // 화면 위아래로 10줄 여유
  });

  // 스크롤 대상이 rows 에 나타나면 그 줄로 이동 (아직 펼쳐지는 중이면 다음 렌더링에서 다시 확인)
  useEffect(() => {
    if (scrollTargetId === null) return;
    const index = rows.findIndex((row) => row.id === scrollTargetId);
    if (index === -1) return;
    virtualizer.scrollToIndex(index, { align: 'center' });
    onScrolled();
  }, [rows, scrollTargetId, virtualizer, onScrolled]);

  return (
    <div ref={scrollRef} className="tree">
      {/* 전체 높이만큼 빈 공간 → 스크롤바가 전체 줄 수만큼 생김 */}
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => {
          const row = rows[item.index];
          const node = nodes.get(row.id);
          if (!node) return null;
          return (
            <TreeRow
              key={row.id}
              node={node}
              depth={row.depth}
              top={item.start}
              isExpanded={expanded.has(row.id)}
              isSelected={selectedId === row.id}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TreeView;
