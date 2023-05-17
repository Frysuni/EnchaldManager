import { InjectDiscordClient, Once } from '@discord-nestjs/core';
import envConfig from '@env';
import { ConsoleLogger, Injectable, LoggerService, Logger as System } from '@nestjs/common';
import { Client, Events } from 'discord.js';
import { readFileSync } from 'node:fs';

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
    logChannel.send({ content: `**Возникла ошибка!** \n**\`${message ?? 'UNKNOWN'}\`**\n${trace}\n\n\n **И так, что делать?**\nТакого не должно быть. Есть это - значит есть проблема в коде. Окей, я защитил только что себя от выключения, так что если эта ошибка не повторяется в течении 120 секунд, то в принципе, не страшно. Только в случае, если я все еще на Enchald и нахожусь на гарантии - пишите Frys от авторизированного лица. Вам нужно предоставить ошибку, что выше, а так же, желательно, подробную информацию о том, как и при каких обстоятельствах это произошло.` });
  }
}