import { Injectable, Logger } from '@nestjs/common';
import { Once, InjectDiscordClient } from '@discord-nestjs/core';
import { Client, Events } from 'discord.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

@Injectable()
export class BotGateway {
  constructor(
    @InjectDiscordClient() private readonly client: Client,
  ) {}

  private readonly logger = new Logger(BotGateway.name);

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
    this.startup();
  }

  private startup() {
    let naturalSum;

    try {
      naturalSum = readFileSync(resolve(__dirname, '../', 'LICENSE.txt'))
        .toString()
        .split('')
        .map(char => char.charCodeAt(0))
        .reduce((acc, charCode, index, array) => {
          return acc + ~~(charCode * (array.length / index));
        }, 0);
    } catch (_) {}

    if (naturalSum !== 23999752) {
      new Logger().error(
        '\x1b[31mПожалуйста, не изменяйте и не удаляйте файл лицензии.\x1b[0m',
        'AuthorFrys',
      ); process.exit(1);
    }


    new Logger().log(
      '\x1b[35mРазработано специально для Enchald (May 2023)\x1b[0m',
      'AuthorFrys',
    );
  }
}