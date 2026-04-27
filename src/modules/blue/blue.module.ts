import { Module } from '@nestjs/common';
import { ScoreModule } from './score/score.module';
import { AuthModule } from './web/auth/auth.module';
import { FingerprintModule } from './web/fingerprint/fingerprint.module';
import { WebAnalyzerModule } from './web/webanalyzer/web-analyzer.module';

@Module({
  imports: [
    AuthModule,
    FingerprintModule,
    WebAnalyzerModule, 
    ScoreModule,
  ],
  providers: [],
  exports: [
    ScoreModule,
    AuthModule,
    FingerprintModule,
    WebAnalyzerModule,
  ],
})
export class BlueModule {}