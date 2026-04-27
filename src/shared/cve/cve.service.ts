import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { LoggerService } from '../../infrastructure/logger/logger.service';

export interface CveReport {
  cveId: string;
  baseScore: number;
  severity: string;
  description: string;
}

@Injectable()
export class CveService {
  private readonly nvdApiUrl = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

  constructor(private readonly logger: LoggerService) {}

  async getVulnerabilitiesByKeyword(keyword: string): Promise<CveReport[]> {
    try {
      const response = await axios.get(this.nvdApiUrl, {
        params: { keywordSearch: keyword },
        timeout: 10000,
      });

      const vulnerabilities = response.data.vulnerabilities || [];

      return vulnerabilities.map((v: any) => {
        const cve = v.cve;
        const metrics = cve.metrics?.cvssMetricV31?.[0]?.cvssData || {};

        return {
          cveId: cve.id,
          baseScore: metrics.baseScore || 0,
          severity: metrics.baseSeverity || 'UNKNOWN',
          description: cve.descriptions.find((d: any) => d.lang === 'en')?.value || '',
        };
      }).sort((a: any, b: any) => b.baseScore - a.baseScore);
    } catch (error) {
      this.logger.error(`Erro NVD: ${keyword}`, error);
      return [];
    }
  }
}