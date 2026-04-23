import { Module } from '@nestjs/common';
import { HttpModule } from '../../http/http.module';
import { EndpointService } from './endpoint.service';

@Module({
  imports: [HttpModule],
  providers: [EndpointService],
  exports: [EndpointService],
})
export class EndpointModule {}