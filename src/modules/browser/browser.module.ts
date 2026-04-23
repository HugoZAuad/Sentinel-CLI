import { Module } from '@nestjs/common';
import { VulnModule } from '../vuln/vuln.module';
import { BrowserService } from './browser.service';
import { DomXssService } from './dom-xss.service';
import { InteractionService } from './interaction.service';

@Module({
  imports: [VulnModule],
  providers: [
    BrowserService,
    DomXssService,
    InteractionService,
  ],
  exports: [
    DomXssService,
    InteractionService,
  ],
})
export class BrowserModule {}