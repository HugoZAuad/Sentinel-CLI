import { Module } from '@nestjs/common';
import { PayloadMutator } from 'src/modules/vuln/payload/payload.mutator';
import { VulnModule } from 'src/modules/vuln/vuln.module';
import { HttpModule } from '../../../core/http/http.module';
import { FormScannerService } from './form-scanner.service';

@Module({
  imports: [
    HttpModule, 
    VulnModule,
  ],
  providers: [
    FormScannerService, 
    PayloadMutator,
  ],
  exports: [FormScannerService],
})
export class FormScannerModule {}
