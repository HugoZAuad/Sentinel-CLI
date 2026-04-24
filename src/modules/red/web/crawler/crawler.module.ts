import { Module } from '@nestjs/common';
import { HttpModule } from '../../../../core/http/http.module';
import { FingerprintModule } from '../../../blue/web/fingerprint/fingerprint.module';
import { CrawlerService } from './crawler.service';
import { InteractionModule } from './interaction/interaction.module';

@Module({
  imports: [HttpModule, FingerprintModule, InteractionModule],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
