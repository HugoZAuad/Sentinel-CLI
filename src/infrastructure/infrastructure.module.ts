import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';
import { ReportService } from './report/report.service';

@Global()
@Module({
  providers: [
    LoggerService,
    ReportService,
  ],
  exports: [
    LoggerService,
    ReportService,
  ],
})
export class InfrastructureModule {}