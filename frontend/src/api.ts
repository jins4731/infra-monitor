import type { Resource } from "./types";

export async function fetchClusters(): Promise<Resource[]> { 
  const response = await fetch('/api/clusters');
  return response.json(); 
}