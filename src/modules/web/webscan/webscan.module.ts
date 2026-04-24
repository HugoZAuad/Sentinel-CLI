import { Module } from '@nestjs/common';
import { ReportModule } from 'src/infrastructure/report/report.module';
import { HttpModule } from '../../../core/http/http.module';
import { ScoreModule } from '../../score/score.module';
import { VulnModule } from '../../vuln/vuln.module';
import { CrawlerModule } from '../crawler/crawler.module';
import { EndpointModule } from '../endpoint/endpoint.module';
import { FingerprintModule } from '../fingerprint/fingerprint.module';
import { FormScannerModule } from '../formscanner/form-scanner.module';
import { WebscanService } from './webscan.service';

@Module({
  imports: [
    HttpModule,
    CrawlerModule,
    EndpointModule,
    FormScannerModule,
    VulnModule,
    ScoreModule,
    ReportModule,
    FingerprintModule,
  ],
  providers: [WebscanService],
  exports: [WebscanService],
})
export class WebscanModule {}