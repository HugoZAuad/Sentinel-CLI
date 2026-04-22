import { Module } from '@nestjs/common';
import { PortscanModule } from '../modules/red/portscan/portscan.module';
import { CliService } from './cli.service';

@Module({
  imports: [PortscanModule],
  providers: [CliService],
  exports: [CliService],
})
export class CliModule {}