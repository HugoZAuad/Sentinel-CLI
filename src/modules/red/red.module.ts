import { Module } from '@nestjs/common';
import { PortscanModule } from './network/portscan/portscan.module';
import { CrawlerModule } from './web/crawler/crawler.module';
import { EndpointModule } from './web/endpoint/endpoint.module';
import { FormscannerModule } from './web/formscanner/form-scanner.module';
import { VulnModule } from './web/vuln/vuln.module';
import { WebscanModule } from './web/webscan/webscan.module';

@Module({
  imports: [
    WebscanModule,
    CrawlerModule,
    VulnModule,
    EndpointModule,
    FormscannerModule,
    PortscanModule,
  ],
  exports: [
    WebscanModule,
    PortscanModule,
  ],
})
export class RedModule {}