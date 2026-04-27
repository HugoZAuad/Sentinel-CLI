export interface Finding {
  type: string;
  evidence: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  team: 'RED' | 'BLUE';
  category?: 'webscan' | 'portscan';
}

export interface EndpointAnalysisDetail {
  endpoint: string;
  status?: number;
  discovered: boolean;
  analyzed: boolean;
  checks: string[];
  findings: string[];
}

export interface ScanMeta {
  duration?: string;
  portsScanned?: number;
  endpointsAnalyzed?: number;
  endpointsDiscovered?: number;
  endpointsScanned?: number;
  headersAnalyzed?: number;
  openPorts?: { port: number; service: string; version?: string }[];
  endpointDetails?: EndpointAnalysisDetail[];
}