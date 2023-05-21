import { InjectDiscordClient, Once } from '@discord-nestjs/core';
import envConfig from '@env';
import { ConsoleLogger, Injectable, LoggerService } from '@nestjs/common';
import { Client, Events } from 'discord.js';

@Injectable()
export class AppLogger extends ConsoleLogger implements LoggerService {
  constructor(
    @InjectDiscordClient() private readonly client: Client,
  ) {
    super();
  }

  @Once(Events.ClientReady)
  public crashHandler(): any {
    process.addListener('unhandledRejection', (error: Error) => this.error(error.message, error.stack ?? ''));
  }

  public override error(message: string, trace: string): void {
    super.error(message, trace);
    this.logErrorToDiscord(message, trace);
  }

  private logErrorToDiscord(message: string, trace: string): void {
    if (!envConfig.logChannelId) return;
    const logChannel = this.client.guilds.cache.first()?.channels.cache.get(envConfig.logChannelId);
    if (!logChannel?.isTextBased()) return;

    let content = '**Ошибка!**\n';
    content += '**`' + message ?? '{UNKNOWN}' + '`**';
    if (trace) content += `\n${trace}`;

    logChannel.send({ content });
  }
}