import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CliService } from "./cli/cli.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const cliService = app.get(CliService);
  await cliService.start();
}
bootstrap();