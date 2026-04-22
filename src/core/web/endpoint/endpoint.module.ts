import { Module } from '@nestjs/common';
import { EndpointService } from './endpoint.service';

@Module({
  providers: [EndpointService],
  exports: [EndpointService],
})
export class EndpointModule {}