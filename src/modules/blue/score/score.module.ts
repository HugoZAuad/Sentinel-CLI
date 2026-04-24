import { Module } from '@nestjs/common';
import { SecurityScoreService } from './security-score.service';

@Module({
  providers: [SecurityScoreService],
  exports: [SecurityScoreService],
})
export class ScoreModule {}