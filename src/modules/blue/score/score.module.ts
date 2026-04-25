import { Module } from '@nestjs/common';
import { AuthModule } from '../web/auth/auth.module';
import { FingerprintModule } from '../web/fingerprint/fingerprint.module';
import { SecurityScoreService } from './security-score.service';

@Module({
  imports: [FingerprintModule, AuthModule],
  providers: [SecurityScoreService],
  exports: [SecurityScoreService],
})
export class ScoreModule {}