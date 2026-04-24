import { Module } from '@nestjs/common';
import { BrowserModule } from '../../../../core/browser/browser.module';
import { HttpModule } from '../../../../core/http/http.module';
import { FingerprintModule } from '../../../blue/web/fingerprint/fingerprint.module';
import { CrawlerService } from './crawler.service';

@Module({
  imports: [HttpModule, FingerprintModule, BrowserModule],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
