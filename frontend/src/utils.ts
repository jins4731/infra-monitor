import type { Resource } from './types';

/**
 * path "/1/2/3/4/" → 자기 자신을 뺀 상위 id 목록 [1, 2, 3]
 * @param {Resource} resource 대상 리소스
 * @return {number[]} 최상위(Cluster)부터 부모까지의 id
 */
export const ancestorIdsOf = (resource: Resource): number[] => {
  const ids = resource.path.split('/').filter((part) => part !== '').map(Number);
  return ids.slice(0, -1);
};

/**
 * "2026-11-15T13:41:58.947" → "2026-11-15 13:41:58"
 * @param {string} iso 서버가 보낸 날짜 문자열
 * @return {string} 화면 표시용 문자열
 */
export const formatDateTime = (iso: string): string => iso.replace('T', ' ').slice(0, 19);
