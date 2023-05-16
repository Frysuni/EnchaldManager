import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringCommand } from './commands/monitoring/monitoring.command';
import { CreateSubcommand } from './commands/monitoring/create/create.subcommand';
import { MonitoringEntity } from './entities/monitoring.entity';
import { MonitoringService } from './monitoring.service';
import { MonitoringStatuses } from './monitoring.statuses';
import { EditSubcommand } from './commands/monitoring/edit/edit.subcommand';
import { DeleteSubcommand } from './commands/monitoring/delete/delete.subcommand';
import { PauseSubcommand } from './commands/monitoring/pause/pause.subcommand';

@Module({
  imports: [
    DiscordModule.forFeature(),
    TypeOrmModule.forFeature([MonitoringEntity]),
  ],
  providers: [
    MonitoringCommand,
    CreateSubcommand,
    EditSubcommand,
    DeleteSubcommand,
    PauseSubcommand,

    MonitoringService,
    MonitoringStatuses,
  ],
})
export class MonitoringModule {}
