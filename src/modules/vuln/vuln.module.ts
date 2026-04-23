import { Module } from '@nestjs/common';
import { HttpModule } from '../../core/http/http.module';
import { PayloadMutator } from './payload/payload.mutator';
import { VulnEngine } from './vuln.engine';

@Module({
  imports: [HttpModule],
  providers: [
    VulnEngine,
    PayloadMutator,
  ],
  exports: [VulnEngine],
})
export class VulnModule {}