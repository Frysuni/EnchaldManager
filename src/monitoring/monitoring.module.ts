import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringCommand } from './commands/monitoring/monitoring.command';
import { CreateSubcommand } from './commands/monitoring/create/create.subcommand';
import { MonitoringEntity } from './entities/monitoring.entity';
import { MonitoringService } from './monitoring.service';
import { MonitoringStatuses } from './monitoring.statuses';

@Module({
  imports: [
    DiscordModule.forFeature(),
    TypeOrmModule.forFeature([MonitoringEntity]),
  ],
  providers: [
    MonitoringCommand,
    CreateSubcommand,

    MonitoringService,
    MonitoringStatuses,
  ],
})
export class MonitoringModule {}
