import { Module } from '@nestjs/common';
import { PortscanModule } from '../core/network/portscan/portscan.module';
import { WebscanModule } from '../core/web/webscan/webscan.module';
import { CliService } from './cli.service';

@Module({
  imports: [
    PortscanModule,
    WebscanModule,
  ],
  providers: [CliService],
  exports: [CliService],
})
export class CliModule {}