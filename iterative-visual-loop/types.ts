export type AgentType = 'coder' | 'editor' | 'verifier' | 'system';

export enum WorkflowStatus {
  IDLE = 'IDLE',
  CODING = 'CODING',
  RENDERING = 'RENDERING',
  CRITIQUING = 'CRITIQUING',
  EDITING = 'EDITING',
  VERIFYING = 'VERIFYING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface CodeVersion {
  id: number;
  timestamp: string;
  code: string;
  description: string;
}

export interface GeneratedArtifact {
  id: string;
  type: 'screenshot' | 'video';
  url: string;
  description: string;
}

export interface InspectionView {
  position: [number, number, number];
  target: [number, number, number];
  label: string;
}
