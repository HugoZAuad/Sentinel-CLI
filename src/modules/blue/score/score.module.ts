import { Module } from '@nestjs/common';
import { AuthModule } from '../web/auth/auth.module';
import { FingerprintModule } from '../web/fingerprint/fingerprint.module';
import { WebAnalyzerModule } from '../web/webanalyzer/web-analyzer.module';
import { CveModule } from '../../../shared/cve/cve.module';
import { SecurityScoreService } from './security-score.service';

@Module({
  imports: [FingerprintModule, AuthModule, WebAnalyzerModule, CveModule],
  providers: [SecurityScoreService],
  exports: [SecurityScoreService],
})
export class ScoreModule {}