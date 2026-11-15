import useResourceTree from '../hooks/useResourceTree';
import usePolling from '../hooks/usePolling';
import TreeView from '../components/TreeView';
import DetailPanel from '../components/DetailPanel';
import StatusFilter from '../components/StatusFilter';
import SearchContainer from './SearchContainer';

/**
 * Container: 훅(useResourceTree)에서 데이터와 동작을 받아
 * Presentational 컴포넌트(TreeView, DetailPanel)에 props 로 내려준다.
 */
const MonitorContainer = () => {
  const tree = useResourceTree();
  const lastSync = usePolling(); // 변경분을 받아 옵저버로 알림 → useResourceTree 가 구독해서 반영

  return (
    <div className="app">
      <header className="header">
        <h1>Infra Monitor</h1>
        <SearchContainer onPick={tree.reveal} />
        <StatusFilter value={tree.filterKey} onChange={tree.setFilter} />
        <div className="tree-actions">
          <button onClick={tree.expandAll} disabled={tree.expandingAll}>
            {tree.expandingAll ? '불러오는 중…' : '전체 펼치기'}
          </button>
          <button onClick={tree.collapseAll}>전체 접기</button>
          <span className="muted">표시 중 {tree.rows.length.toLocaleString()}줄</span>
        </div>
        <span className="sync muted">
          3초마다 자동 갱신{lastSync && ` · 마지막 ${lastSync.toLocaleTimeString()}`}
        </span>
      </header>

      <div className="main">
        <TreeView
          rows={tree.rows}
          nodes={tree.nodes}
          expanded={tree.expanded}
          selectedId={tree.selectedId}
          scrollTargetId={tree.scrollTargetId}
          onToggle={tree.toggle}
          onSelect={tree.select}
          onScrolled={tree.clearScrollTarget}
        />
        <DetailPanel resource={tree.selected} breadcrumb={tree.breadcrumb} />
      </div>
    </div>
  );
};

export default MonitorContainer;
