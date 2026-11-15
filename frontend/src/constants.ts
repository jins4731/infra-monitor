import type { Status } from './types';

/** 트리 한 줄 높이(px). 가상 스크롤이 전체 높이와 위치를 계산할 때 사용 */
export const ROW_HEIGHT = 30;

/** 상태별 표시 색 */
export const STATUS_COLOR: Record<Status, string> = {
  HEALTHY: '#16a34a', // 초록
  WARNING: '#d97706', // 주황
  ERROR: '#dc2626', // 빨강
};

/** 검색 입력이 멈추고 이 시간 뒤에 요청 */
export const SEARCH_DEBOUNCE_MS = 300;

/** 변경분 폴링 주기 */
export const POLLING_INTERVAL_MS = 3000;
