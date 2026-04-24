import { Global, Module } from '@nestjs/common';
import { FormatterService } from './formatter.service';

@Global()
@Module({
  providers: [FormatterService],
  exports: [FormatterService],
})
export class FormatterModule {}