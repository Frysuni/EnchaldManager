import { Injectable, Logger } from '@nestjs/common';
import { Once, InjectDiscordClient } from '@discord-nestjs/core';
import { Client, Events } from 'discord.js';

@Injectable()
export class BotGateway {
  constructor(
    @InjectDiscordClient() private readonly client: Client,
  ) {}

  private readonly logger = new Logger(BotGateway.name);

  // Внимание, не удаляйте и не модифицируйте данный метод. В случае изменения гарантия может быть аннулирована.
  @Once(Events.ClientReady)
  private async onReady(): Promise<any> {
    this.client.guilds.fetch().then(guilds => {
      if (guilds.size > 1) {
        this.logger.error('Бот не может быть запущен в нескольких гильдиях!');
        process.exit(1);
      }
      if (guilds.size == 0) {
        this.logger.error('Бот должен находится в гильдии для начала работы!');
        process.exit(1);
      }

      this.logger.log(`Бот ${this.client.user?.tag} запущен!`);
    });

    new Logger().log(
      '\x1b[35mРазработано специально для Enchald (May 2023)\x1b[0m',
      'AuthorFrys',
    );
  }
}
