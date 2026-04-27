import { Module } from '@nestjs/common';
import { CveService } from './cve.service';
import { LoggerModule } from '../../infrastructure/logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [CveService],
  exports: [CveService],
})
export class CveModule {}