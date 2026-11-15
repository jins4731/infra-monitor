import { ROW_HEIGHT, STATUS_COLOR } from '../constants';
import type { Resource } from '../types';

type Props = {
  node: Resource;
  depth: number; // 들여쓰기 단계
  top: number; // 가상 스크롤이 계산한 위치(px)
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (id: number) => void;
  onSelect: (id: number) => void;
};

/** Presentational: 트리 한 줄 */
const TreeRow = ({ node, depth, top, isExpanded, isSelected, onToggle, onSelect }: Props) => {
  return (
    <div
      className={`row ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(node.id)}
      style={{
        height: ROW_HEIGHT,
        transform: `translateY(${top}px)`, // 이 줄이 있어야 할 위치로 이동
        paddingLeft: 8 + depth * 20,
      }}
    >
      {/* Pod 는 자식이 없으므로 펼치기 버튼 자리만 비워 둔다 (들여쓰기 맞추기) */}
      <button
        className="toggle"
        style={{ visibility: node.type === 'POD' ? 'hidden' : 'visible' }}
        onClick={(e) => {
          e.stopPropagation(); // 버튼 클릭이 줄 선택(onClick)으로 번지지 않게
          onToggle(node.id);
        }}
      >
        {isExpanded ? '▾' : '▸'}
      </button>
      <span className="dot" style={{ background: STATUS_COLOR[node.status] }} />
      <span className="type">{node.type}</span>
      {node.name}
    </div>
  );
};

export default TreeRow;
