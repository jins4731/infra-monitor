import type { Changes, Resource } from "./types";

export async function fetchClusters(): Promise<Resource[]> { 
  const response = await fetch('/api/clusters');
  return response.json(); 
}

export async function fetchChildren(id: number): Promise<Resource[]> {
  const response = await fetch(`/api/resources/${id}/children`);
  return response.json();
}

// 이름 앞부분 일치 검색 (최대 50건). signal: 입력이 바뀌면 이전 요청을 취소하기 위함
export async function searchResources(q: string, signal?: AbortSignal): Promise<Resource[]> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal });
  return response.json();
}

/**
 * 폴링: since 이후 바뀐 리소스
 * @param {string | null} since 이전 응답의 serverTime (첫 요청은 null → 기준 시간만 받음)
 * @return {Promise<Changes>} 다음 since 로 쓸 serverTime + 바뀐 리소스 목록
 */
export async function fetchChanges(since: string | null): Promise<Changes> {
  const query = since ? `?since=${encodeURIComponent(since)}` : '';
  const response = await fetch(`/api/changes${query}`);
  if (!response.ok) throw new Error(`changes ${response.status}`);
  return response.json();
}