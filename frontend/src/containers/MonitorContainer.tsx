import useResourceTree from '../hooks/useResourceTree';
import TreeView from '../components/TreeView';
import DetailPanel from '../components/DetailPanel';
import SearchContainer from './SearchContainer';

/**
 * Container: 훅(useResourceTree)에서 데이터와 동작을 받아
 * Presentational 컴포넌트(TreeView, DetailPanel)에 props 로 내려준다.
 */
const MonitorContainer = () => {
  const tree = useResourceTree();

  return (
    <div className="app">
      <header className="header">
        <h1>Infra Monitor</h1>
        <SearchContainer onPick={tree.reveal} />
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
