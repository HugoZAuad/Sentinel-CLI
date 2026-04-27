export interface WebScanResult {
  url: string;
  status: number;
  time: string;
  https: boolean;

  headers: Record<string, string>;
  tech: string[];

  security: {
    hsts: boolean;
    xss: boolean;
    contentType: boolean;
    frame: boolean;
  };

  links: string[];
  endpoints: string[];
  findings: any[];

  forms: {
    action: string;
    method: string;
    findings: string[];
  }[];

  vulnerabilities: any[];

  score?: any;

  analyzedEndpoints: string[];
  discoveredEndpoints: string[];
  endpointDetails: {
    endpoint: string;
    status?: number;
    discovered: boolean;
    analyzed: boolean;
    checks: string[];
    findings: string[];
  }[];

  meta: {
    scannedUrls: number;
    duration: number;
    endpointsAnalyzed: number;
    endpointsDiscovered: number;
  };
}