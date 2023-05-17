import { NestFactory } from '@nestjs/core';
import { AppLogger } from 'app.logger';
import { AppModule } from './app.module';

void async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: false });
  app.useLogger(app.get(AppLogger));
  app.enableShutdownHooks();

  app.init();
}();

