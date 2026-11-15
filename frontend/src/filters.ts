import type { Resource } from './types';

/**
 * 상태 필터 (전략 패턴)
 *
 * 필터 조건(알고리즘)을 각각 함수로 캡슐화해 두고, 런타임에 키로 골라 쓴다.
 * - 트리(useResourceTree)는 "어떤 조건인지" 몰라도 match 만 호출하면 된다
 * - 새 필터(예: 재시작 10회 이상)는 여기에 한 줄 추가하면 끝 (트리 코드 수정 없음)
 */
export type FilterKey = 'ALL' | 'HEALTHY' | 'WARNING' | 'ERROR';

type FilterStrategy = {
  label: string; // 버튼에 표시할 이름
  match: (resource: Resource) => boolean; // 이 리소스를 보여줄지
};

export const STATUS_FILTERS: Record<FilterKey, FilterStrategy> = {
  ALL: { label: '전체', match: () => true },
  HEALTHY: { label: '정상', match: (r) => r.status === 'HEALTHY' },
  WARNING: { label: '경고', match: (r) => r.status === 'WARNING' },
  ERROR: { label: '오류', match: (r) => r.status === 'ERROR' },
};

export const FILTER_KEYS = Object.keys(STATUS_FILTERS) as FilterKey[];
