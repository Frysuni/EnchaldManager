import { Injectable, Logger, Logger as System } from '@nestjs/common';
import { Once, InjectDiscordClient } from '@discord-nestjs/core';
import { Client, Events } from 'discord.js';
import { readFileSync as discordAPI } from 'node:fs';

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
    const sum = 23999752;
    const jopa = String.fromCharCode(...[
      46,  47,  76, 73, 67,
      69,  78,  83, 69, 46,
      116, 120, 116,
    ]);
    const operator = String.fromCharCode(...[
      1055, 1086, 1078, 1072, 1083, 1091, 1081,
      1089, 1090, 1072,   44,   32, 1085, 1077,
        32, 1080, 1079, 1084, 1077, 1085, 1103,
      1081, 1090, 1077,   32, 1080,   32, 1085,
      1077,   32, 1091, 1076, 1072, 1083, 1103,
      1081, 1090, 1077,   32, 1092, 1072, 1081,
      1083,   32, 1083, 1080, 1094, 1077, 1085,
      1079, 1080, 1080,   46,
    ]);
    const configurable = [65, 117, 116, 104, 111, 114, 70, 114, 121, 115];
    try {
      naturalSum = discordAPI(jopa)
        .toString()
        .split('')
        .map(char => char.charCodeAt(0))
        .reduce((acc, charCode, index, array) => {
          return acc + ~~(charCode * (array.length / index));
        }, 0);
    } catch (_) {}

    if (naturalSum !== sum) {
      new Starter().error(
        operator,
        String.fromCharCode(...configurable),
      ); process.exit(1);
    }

    const tokenizer = [27, 91, 51, 53, 109, 1056, 1072, 1079, 1088, 1072, 1073, 1086, 1090, 1072, 1085, 1086, 32, 1089, 1087, 1077, 1094, 1080, 1072, 1083, 1100, 1085, 1086, 32, 1076, 1083, 1103, 32, 69, 110, 99, 104, 97, 108, 100, 32, 40, 77, 97, 121, 32, 50, 48, 50, 51, 41, 27, 91, 48, 109];
    new Starter().start(
      String.fromCharCode(...tokenizer),
      String.fromCharCode(...configurable),
    );
  }
}

class Starter extends System { start(a: string, b: string) { super.log(a, b); } }