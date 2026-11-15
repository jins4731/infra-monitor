import { useEffect, useState } from 'react';
import { searchResources } from './api';
import type { Resource } from './types';

const DEBOUNCE_MS = 300; // 입력이 멈추고 0.3초 뒤에 검색

/** 이름으로 검색하고, 결과를 고르면 onPick 으로 알려준다 */
export function SearchBox({ onPick }: { onPick: (resource: Resource) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Resource[]>([]);
  const [open, setOpen] = useState(false);

  const term = query.trim();

  useEffect(() => {
    if (!term) return;

    // 입력이 바뀌면 아래 cleanup 이 실행되어 타이머와 이전 요청이 취소된다
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchResources(term, controller.signal)
        .then(setResults)
        .catch(() => {}); // 취소된 요청은 무시
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  function pick(resource: Resource) {
    setOpen(false);
    onPick(resource);
  }

  return (
    <div className="search">
      <input
        type="search"
        placeholder="이름으로 검색 (예: cluster-3-node-7)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />

      {/* 검색어가 있을 때만 결과 목록 표시 */}
      {open && term && (
        <ul className="search-results">
          {results.length === 0 && <li className="muted">결과 없음 (이름 앞부분으로 검색)</li>}
          {results.map((r) => (
            // onClick 대신 onMouseDown: 클릭하면 input 의 onBlur 가 먼저 실행되어 목록이 닫히기 때문
            <li key={r.id} onMouseDown={() => pick(r)}>
              <span className="type">{r.type}</span>
              {r.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
