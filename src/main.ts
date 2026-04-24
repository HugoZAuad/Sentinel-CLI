import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CliService } from './cli/cli.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cli = app.get(CliService);
  await cli.start();
}

bootstrap();