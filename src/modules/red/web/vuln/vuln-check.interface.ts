export interface VulnFinding {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: 'low' | 'medium' | 'high';
  evidence: string;
  payload: string;
  target: string;
  param?: string;
}

export interface IVulnCheck {
  readonly name: string;
  run(url: string, param: string, method: string, baseline: number): Promise<VulnFinding[]>;
}