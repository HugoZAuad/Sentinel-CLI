import { Module } from '@nestjs/common';
import { WebAnalyzerService } from './web-analyzer.service';

@Module({
  providers: [WebAnalyzerService],
  exports: [WebAnalyzerService],
})
export class WebAnalyzerModule {}