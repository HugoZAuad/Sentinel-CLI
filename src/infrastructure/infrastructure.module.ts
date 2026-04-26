import { Global, Module } from '@nestjs/common';
import { ScanRepository } from './database/repository/scan.repository';
import { PrismaService } from './database/service/prisma.service';
import { LoggerService } from './logger/logger.service';
import { ReportService } from './report/report.service';

@Global()
@Module({
  providers: [
    PrismaService,
    ScanRepository,
    LoggerService,
    ReportService,
  ],
  exports: [
    PrismaService,
    ScanRepository,
    LoggerService,
    ReportService,
  ],
})
export class InfrastructureModule {}