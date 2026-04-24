import { Module } from '@nestjs/common';
import { PortscanService } from './portscan.service';

@Module({
  providers: [PortscanService],
  exports: [PortscanService],
})
export class PortscanModule {}