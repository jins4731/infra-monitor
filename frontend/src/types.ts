export type ResourceType = 'CLUSTER' | 'NODE' | 'NAMESPACE' | 'POD' | 'CONTAINER';
export type Status = 'HEALTHY' | 'WARNING' | 'ERROR';

export interface Resource {
  id: number;
  type: ResourceType;
  status: Status;
  name: string;
}