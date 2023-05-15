import { Command } from '@discord-nestjs/core';
import { ApplicationCommandType, PermissionFlagsBits } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { CreateSubcommand } from './create/create.subcommand';
import { EditSubcommand } from './edit/edit.subcommand';


@Command({
  name: 'monitoring',
  nameLocalizations: { ru: 'мониторинг' },
  description: 'X',
  defaultMemberPermissions: PermissionFlagsBits.UseApplicationCommands,
  dmPermission: true,
  type: ApplicationCommandType.ChatInput,
  include: [
    CreateSubcommand,
    EditSubcommand,
  ],
})
@Injectable()
export class MonitoringCommand {}