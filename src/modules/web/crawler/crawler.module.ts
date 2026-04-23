import { Module } from '@nestjs/common';
import { HttpModule } from '../../../core/http/http.module';
import { CrawlerService } from './crawler.service';

@Module({
  imports: [HttpModule],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}