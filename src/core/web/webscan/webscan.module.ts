import { Module } from '@nestjs/common';
import { HttpModule } from '../../http/http.module';
import { AuthModule } from '../auth/auth.module';
import { CrawlerModule } from '../crawler/crawler.module';
import { EndpointModule } from '../endpoint/endpoint.module';
import { WebscanService } from './webscan.service';

@Module({
  imports: [
    HttpModule,
    CrawlerModule,
    EndpointModule,
    AuthModule,
  ],
  providers: [WebscanService],
  exports: [WebscanService],
})
export class WebscanModule {}