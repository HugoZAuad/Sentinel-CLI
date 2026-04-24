import { Module } from '@nestjs/common';
import { InteractionEngine } from './interaction.engine';

@Module({
  providers: [InteractionEngine],
  exports: [InteractionEngine],
})
export class InteractionModule {}