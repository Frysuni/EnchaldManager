import { NestFactory } from '@nestjs/core';
import { AppLogger } from 'app.logger';
import { AppModule } from './app.module';

void async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  app.useLogger(app.get(AppLogger));
  await app.listen(3000);
}();

