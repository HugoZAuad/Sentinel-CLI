import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../../../core/http/http.service';
import { IVulnCheck, VulnFinding } from '../vuln-check.interface';

@Injectable()
export class SensitiveFileCheck implements IVulnCheck {
  readonly name = 'Sensitive File Discovery';
  private readonly files = ['.env', '.git/config', 'docker-compose.yml', 'phpinfo.php', 'config.php.bak'];

  constructor(private readonly http: HttpService) {}

  async run(url: string): Promise<VulnFinding[]> {
    const findings: VulnFinding[] = [];
    const baseUrl = new URL(url).origin;

    for (const file of this.files) {
      const target = `${baseUrl}/${file}`;
      try {
        const res = await this.http.get(target);
        
        if (res?.status === 200 && res.data) {
          findings.push({
            type: 'Sensitive File Exposed',
            severity: 'CRITICAL',
            confidence: 'high',
            evidence: `Arquivo sensível acessível publicamente: ${file}`,
            payload: target,
            target: baseUrl
          });
        }
      } catch { continue; }
    }
    return findings;
  }
}