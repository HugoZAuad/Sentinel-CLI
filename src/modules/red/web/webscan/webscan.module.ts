import { Module } from '@nestjs/common';
import { ReportModule } from 'src/infrastructure/report/report.module';
import { HttpModule } from '../../../../core/http/http.module';
import { ScoreModule } from '../../../blue/score/score.module';
import { FingerprintModule } from '../../../blue/web/fingerprint/fingerprint.module';
import { CrawlerModule } from '../crawler/crawler.module';
import { EndpointModule } from '../endpoint/endpoint.module';
import { FormscannerModule } from '../formscanner/form-scanner.module';
import { VulnModule } from '../vuln/vuln.module';
import { WebscanService } from './webscan.service';

@Module({
  imports: [
    HttpModule,
    CrawlerModule,
    EndpointModule,
    FormscannerModule,
    VulnModule,
    ScoreModule,
    ReportModule,
    FingerprintModule,
  ],
  providers: [WebscanService],
  exports: [WebscanService],
})
export class WebscanModule {}