import { Module } from '@nestjs/common';
import { ScoreModule } from './score/score.module';
import { AuthModule } from './web/auth/auth.module';
import { FingerprintModule } from './web/fingerprint/fingerprint.module';

@Module({
  imports: [
    AuthModule,
    FingerprintModule,
    ScoreModule,
  ],
  providers: [],
  exports: [
    ScoreModule,
    AuthModule,
    FingerprintModule,
  ],
})
export class BlueModule {}