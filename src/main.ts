import envConfig from '@env';
import { NestFactory } from '@nestjs/core';
import { AppLogger } from './app.logger';
import { AppModule } from './app.module';

const ASCII =
  ' ______            _           _     _   __  __\n' +
  '|  ____|          | |         | |   | | |  \\/  |\n' +
  '| |__   _ __   ___| |__   __ _| | __| | | \\  / | __ _ _ __   __ _  __ _  ___ _ __\n' +
  '|  __| | \'_ \\ / __| \'_ \\ / _` | |/ _` | | |\\/| |/ _` | \'_ \\ / _` |/ _` |/ _ \\ \'__|\n' +
  '| |____| | | | (__| | | | (_| | | (_| | | |  | | (_| | | | | (_| | (_| |  __/ |\n' +
  '|______|_| |_|\\___|_| |_|\\__,_|_|\\__,_| |_|  |_|\\__,_|_| |_|\\__,_|\\__, |\\___|_|\n' +
  '                                                  by Frys          __/ |\n' +
  '                                                                  |___/';

void async function bootstrap() {
  if (!envConfig.devMode) {
    process.stdout.write(
      '\n' + '\n' +
      '\x1b[35m' + ASCII + '\x1b[0m' +
      '\n' + '\n',
    );
    await new Promise(res => setTimeout(res, 500));
  }

  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: false });
  app.useLogger(app.get(AppLogger));
  app.enableShutdownHooks();

  app.init();
}();
