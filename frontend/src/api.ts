import type { Resource } from "./types";

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