import { Module } from '@nestjs/common';
import { FormScannerService } from './form-scanner.service';

@Module({
  providers: [FormScannerService],
  exports: [FormScannerService],
})
export class FormScannerModule {}