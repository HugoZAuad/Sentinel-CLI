import { Module } from '@nestjs/common';
import { HttpModule } from '../../../../core/http/http.module';
import { PayloadMutator } from '../vuln/payload/payload.mutator';
import { VulnModule } from '../vuln/vuln.module';
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
export class FormscannerModule {}
