import { Module } from '@nestjs/common';
import { CliModule } from './cli/cli.module';
import { HttpModule } from './core/http/http.module';

@Module({
  imports: [
    HttpModule,
    CliModule,
  ],
})
export class AppModule {}