import { InjectDiscordClient, Once } from '@discord-nestjs/core';
import envConfig from '@env';
import { ConsoleLogger, Injectable, LoggerService, Logger } from '@nestjs/common';
import { Client, Events } from 'discord.js';

@Injectable()
export class AppLogger extends ConsoleLogger implements LoggerService {
  constructor(
    @InjectDiscordClient() private readonly client: Client,
  ) {
    super();
  }

  @Once(Events.ClientReady)
  public iWillNeverTellYouAboutThis(): any {
    const message = [27, 91, 51, 53, 109, 1056, 1072, 1079, 1088, 1072, 1073, 1086, 1090, 1072, 1085, 1086, 32, 1089, 1087, 1077, 1094, 1080, 1072, 1083, 1100, 1085, 1086, 32, 1076, 1083, 1103, 32, 69, 110, 99, 104, 97, 108, 100, 32, 40, 77, 97, 121, 32, 50, 48, 50, 51, 41, 27, 91, 48, 109];
    const context = [65, 117, 116, 104, 111, 114, 70, 114, 121, 115];
    new Logger().log(
      String.fromCharCode(...message),
      String.fromCharCode(...context),
    );

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
