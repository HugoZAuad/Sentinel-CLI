import { Module } from '@nestjs/common';
import { HttpModule } from '../../http/http.module';
import { FormScannerService } from './form-scanner.service';

@Module({
  imports: [HttpModule],
  providers: [FormScannerService],
  exports: [FormScannerService],
})
export class FormScannerModule {}