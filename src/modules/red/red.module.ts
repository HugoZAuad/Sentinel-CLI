import { Module } from '@nestjs/common';
import { WebscanModule } from './web/webscan/webscan.module';
import { CrawlerModule } from './web/crawler/crawler.module';
import { VulnModule } from './web/vuln/vuln.module';
import { EndpointModule } from './web/endpoint/endpoint.module';
import { FormscannerModule } from '../red/web/formscanner/form-scanner.module';
import { PortscanModule } from './network/portscan/portscan.module';

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
    CrawlerModule,
  ],
})
export class RedModule {}