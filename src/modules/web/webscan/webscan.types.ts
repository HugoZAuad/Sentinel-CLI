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
  forms: any[];

  vulnerabilities: any[];

  meta: {
    scannedUrls: number;
    duration: number;
  };
}