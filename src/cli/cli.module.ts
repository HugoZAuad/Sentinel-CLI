import { Module } from '@nestjs/common';
import { RedModule } from '../modules/red/red.module';
import { BlueModule } from '../modules/blue/blue.module';
import { CliService } from './cli.service';

@Module({
  imports: [RedModule, BlueModule],
  providers: [CliService],
  exports: [CliService],
})
export class CliModule {}