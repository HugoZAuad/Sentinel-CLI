import { Module } from '@nestjs/common';
import { BrowserModule } from '../../../../core/browser/browser.module';
import { HttpModule } from '../../../../core/http/http.module';
import { DomXssCheck } from './checks/domxss.check';
import { LfiCheck } from './checks/lfi.check';
import { PassiveCheck } from './checks/passive.check';
import { RedirectCheck } from './checks/redirect.check';
import { SensitiveFileCheck } from './checks/sensitive-file.check';
import { SqliCheck } from './checks/sqli.check';
import { SstiCheck } from './checks/ssti.check';
import { XssCheck } from './checks/xss.check';
import { PayloadMutator } from './payload/payload.mutator';
import { VulnEngine } from './vuln.engine';

@Module({
  imports: [HttpModule, BrowserModule],
  providers: [
    VulnEngine,
    PayloadMutator,
    VulnEngine, 
    XssCheck, SqliCheck, SstiCheck, LfiCheck,
    PassiveCheck, SensitiveFileCheck, RedirectCheck, DomXssCheck
  ],
  exports: [
    VulnEngine,
    PayloadMutator,
  ],
})
export class VulnModule {}