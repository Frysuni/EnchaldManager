import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLogger } from './app.logger';
import { BotGateway } from './bot.gateway';
import { DiscordModuleRegister } from './discord-config.service';
import ormConfig from './ormconfig';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    ...DiscordModuleRegister,
    TypeOrmModule.forRoot(ormConfig),

    MonitoringModule,
  ],
  providers: [
    BotGateway,
    AppLogger,
  ],
  exports: [
    AppLogger,
  ],
})
export class AppModule {}
