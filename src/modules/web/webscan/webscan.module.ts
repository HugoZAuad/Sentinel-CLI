import { Module } from '@nestjs/common';
import { HttpModule } from '../../../core/http/http.module';
import { ScoreModule } from '../../score/score.module';
import { VulnModule } from '../../vuln/vuln.module';
import { CrawlerModule } from '../crawler/crawler.module';
import { EndpointModule } from '../endpoint/endpoint.module';
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
  ],
  providers: [WebscanService],
  exports: [WebscanService],
})
export class WebscanModule {}