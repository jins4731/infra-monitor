import type { Resource } from '../types';

type Props = {
  query: string;
  results: Resource[];
  loading: boolean; // 지금 검색어의 결과를 기다리는 중
  open: boolean;
  onQueryChange: (value: string) => void;
  onOpen: () => void;
  onClose: () => void;
  onPick: (resource: Resource) => void;
};

/** Presentational: 검색 입력창과 결과 목록. 받은 props 로 그리기만 한다 */
const SearchBox = ({ query, results, loading, open, onQueryChange, onOpen, onClose, onPick }: Props) => {
  return (
    <div className="search">
      <input
        type="search"
        placeholder="이름으로 검색 (예: cluster-3-node-7)"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={onOpen}
        onBlur={onClose}
      />

      {open && (
        <ul className="search-results">
          {loading && <li className="muted">검색 중…</li>}
          {!loading && results.length === 0 && <li className="muted">결과 없음 (이름 앞부분으로 검색)</li>}
          {results.map((r) => (
            // onClick 대신 onMouseDown: 클릭하면 input 의 onBlur 가 먼저 실행되어 목록이 닫히기 때문
            <li key={r.id} onMouseDown={() => onPick(r)}>
              <span className="type">{r.type}</span>
              {r.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;
