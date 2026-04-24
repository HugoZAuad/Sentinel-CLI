import { Module } from '@nestjs/common';
import { HttpModule } from '../../../core/http/http.module';
import { CrawlerService } from './crawler.service';
import { InteractionEngine } from './interaction/interaction.engine';

@Module({
  imports: [HttpModule],
  providers: [
    CrawlerService,
    InteractionEngine,
  ],
  exports: [CrawlerService],
})
export class CrawlerModule {}