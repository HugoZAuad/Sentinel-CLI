import { Global, Module } from '@nestjs/common';
import { BrowserService } from './browser.service';
import { DomXssService } from './dom-xss.service';
import { InteractionService } from './interaction.service';

@Global()
@Module({
  providers: [
    BrowserService,
    DomXssService,
    InteractionService,
  ],
  exports: [
    BrowserService,
    DomXssService,
    InteractionService,
  ],
})
export class BrowserModule {}