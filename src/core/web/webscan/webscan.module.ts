import { Module } from '@nestjs/common';
import { CrawlerModule } from '../crawler/crawler.module';
import { EndpointModule } from '../endpoint/endpoint.module';
import { FormScannerModule } from '../formscanner/form-scanner.module';
import { WebscanService } from './webscan.service';

@Module({
  imports: [CrawlerModule, EndpointModule, FormScannerModule],
  providers: [WebscanService],
  exports: [WebscanService],
})
export class WebscanModule {}