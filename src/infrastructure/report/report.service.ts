import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class ReportService {
  private readonly reportsDir = path.join(process.cwd(), 'reports');

  constructor(private readonly logger: LoggerService) {
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  save(filename: string, data: any): string {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filePath = path.join(this.reportsDir, `${safeFilename}-${timestamp}.json`);

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return filePath;
    } catch (err) {
      this.logger.error(`Falha ao guardar relatório: ${filename}`, err);
      throw err;
    }
  }
}