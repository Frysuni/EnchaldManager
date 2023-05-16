import { Command } from '@discord-nestjs/core';
import { ApplicationCommandType, PermissionFlagsBits } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { CreateSubcommand } from './create/create.subcommand';
import { EditSubcommand } from './edit/edit.subcommand';
import { DeleteSubcommand } from './delete/delete.subcommand';
import { PauseSubcommand } from './pause/pause.subcommand';


@Command({
  name: 'monitoring',
  nameLocalizations: { ru: 'мониторинг' },
  description: 'X',
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  dmPermission: true,
  type: ApplicationCommandType.ChatInput,
  include: [
    CreateSubcommand,
    EditSubcommand,
    DeleteSubcommand,
    PauseSubcommand,
  ],
})
@Injectable()
export class MonitoringCommand {}