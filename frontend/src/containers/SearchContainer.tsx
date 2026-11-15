import { useEffect, useState } from 'react';
import { searchResources } from '../api';
import { SEARCH_DEBOUNCE_MS } from '../constants';
import type { Resource } from '../types';
import SearchBox from '../components/SearchBox';

type Props = {
  onPick: (resource: Resource) => void; // 검색 결과를 골랐을 때
};

/**
 * Container: 검색어 상태, 디바운스, 요청 취소를 담당한다.
 * 입력창과 결과 목록을 그리는 일은 SearchBox 에 맡긴다.
 */
const SearchContainer = ({ onPick }: Props) => {
  const [query, setQuery] = useState('');
  // 결과와 함께 "어떤 검색어의 결과인지"를 저장한다
  const [searched, setSearched] = useState<{ term: string; items: Resource[] } | null>(null);
  const [open, setOpen] = useState(false);

  const term = query.trim();
  // 지금 입력한 검색어의 결과가 아직 없으면 검색 중 (디바운스 대기 + 응답 대기)
  // → 다른 검색어의 예전 결과나 "결과 없음"을 잘못 보여주지 않는다
  const loading = searched?.term !== term;

  useEffect(() => {
    if (!term) return;

    // 입력이 바뀌면 아래 cleanup 이 실행되어 타이머와 이전 요청이 취소된다
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchResources(term, controller.signal)
        .then((items) => setSearched({ term, items }))
        .catch(() => {}); // 취소된 요청은 무시
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setOpen(true);
  };

  const handlePick = (resource: Resource) => {
    setOpen(false);
    onPick(resource);
  };

  return (
    <SearchBox
      query={query}
      results={loading ? [] : searched.items}
      loading={loading}
      open={open && term !== ''} // 검색어가 있을 때만 결과 목록 표시
      onQueryChange={handleQueryChange}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      onPick={handlePick}
    />
  );
};

export default SearchContainer;
