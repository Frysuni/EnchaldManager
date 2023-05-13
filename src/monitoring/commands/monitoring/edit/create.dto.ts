import { Choice, Param, ParamType } from "@discord-nestjs/core";
import { ColorResolvable } from "discord.js";
import { VersionEnum } from "~/monitoring/enums/version.enum";

export class CreateDto {
  @Param({
    name: 'server_name',
    nameLocalizations: { ru: 'имя_сервера' },
    description: 'Name of the monitoring server.',
    descriptionLocalizations: { ru: 'Имя сервера мониторинга.' },
    required: true,
    type: ParamType.STRING,
  })
  serverName: string;

  @Param({
    name: 'color',
    nameLocalizations: { ru: 'цвет' },
    description: 'The color accent of the server. Accepts any resolvable color in #hex format.',
    descriptionLocalizations: { ru: 'Цветовой акцент сервера. Принимает любой разрешимый цвет в формате #hex.' },
    required: true,
    type: ParamType.STRING,
  })
  color: ColorResolvable;

  @Param({
    name: 'token',
    nameLocalizations: { ru: 'токен' },
    description: 'Token of the bot responsible for this monitoring.',
    descriptionLocalizations: { ru: 'Токен бота, отвечающего за этот мониторинг.' },
    required: true,
    type: ParamType.STRING,
  })
  token: string;

  @Choice(VersionEnum)
  @Param({
    name: 'version',
    nameLocalizations: { ru: 'версия' },
    description: 'Legacy < 1.7.2 <= Java, Bedrock',
    descriptionLocalizations: { ru: 'Legacy < 1.7.2 <= Java, Bedrock' },
    required: true,
    type: ParamType.INTEGER,
  })
  version: VersionEnum;

  @Param({
    name: 'address',
    nameLocalizations: { ru: 'адрес' },
    description: '1.1.1.1 or 1.1.1.1:25565 or domain.ru or domain.ru:25565 (SRV supported)',
    descriptionLocalizations: { ru: '1.1.1.1 или 1.1.1.1:25565 или domain.ru или domain.ru:25565 (SRV поддерживается)' },
    required: true,
    type: ParamType.STRING,
  })
  address: string;

  @Param({
    name: 'restart_time',
    nameLocalizations: { ru: 'время_рестарта' },
    description: 'The moment of time when the restart begins, the bot will do everything automatically. Syntax: HH:MM',
    descriptionLocalizations: { ru: 'Момент времени, когда начинается рестарт, бот дальше все сделает автоматически. Синтаксис: ЧЧ:ММ' },
    required: true,
    type: ParamType.STRING,
  })
  restartTime: string;

  @Param({
    name: 'backup_time',
    nameLocalizations: { ru: 'время_бэкапа' },
    description: 'The time interval when the backup is done. Example: MON_00:30-TUE_06:00.',
    descriptionLocalizations: { ru: 'Промежуток времени, когда делается бэкап. Пример: MON_00:30-TUE_06:00.' },
    required: true,
    type: ParamType.STRING,
  })
  backupTime: string;

  @Param({
    name: 'hidden_players',
    nameLocalizations: { ru: 'скрытые_игроки' },
    description: 'List of hidden players. Syntax: NICK,NICK,NICK ...',
    descriptionLocalizations: { ru: 'Список скрытых игроков. Синтаксис: НИК,НИК,НИК ...' },
    required: true,
    type: ParamType.STRING,
  })
  hiddenPlayers: string;

  @Param({
    name: 'update_interval',
    nameLocalizations: { ru: 'интервал_обновления' },
    description: 'The time in seconds after which the status will be updated. Default: 60',
    descriptionLocalizations: { ru: 'Время в секундах, через которое статус будет обновлен. По умолчанию: 60' },
    required: true,
    type: ParamType.INTEGER,
    minValue: 10,
    maxValue: 3600,
  })
  updateInterval: number;
}