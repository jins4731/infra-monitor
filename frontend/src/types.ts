// 리소스 종류 -> Cluster -> Node -> Namespace -> Pod
export type ResourceType = 'CLUSTER' | 'NODE' | 'NAMESPACE' | 'POD';
export type Status = 'HEALTHY' | 'WARNING' | 'ERROR'; // HEALTHY: 정상, WARNING: 경고, ERROR: 오류

export interface Resource {
  id: number;
  type: ResourceType;
  status: Status;
  name: string;
  path: string; // 최상부터 ID 경로
  updatedAt: string;
  parentId: number | null; // 상위 리소스 id, 최상위 Cluster는 null
  phase: string | null; // Pod만 있는 상태 (Running, CrashLoop 등)
  restarts: number | null; // Pod 재시작 횟수. 오류(CrashLoopBackOff) Pod일수록 높음. Pod만 있음
  cpu: number | null; // CPU 사용률(%). Node, Pod만 있고 Cluster·Namespace는 null
  memory: number | null; // 메모리 사용률(%). Node, Pod만 있음
}

// 화면에 그릴 한 줄: 어떤 리소스를, 몇 단계 들여쓰기로 (트리 평탄화 결과)
export type Row = { id: number; depth: number };