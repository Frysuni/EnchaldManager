import { Choice, Param, ParamType } from "@discord-nestjs/core";
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
    name: 'restart_start_cron',
    nameLocalizations: { ru: 'cron_начала_рестарта' },
    description: 'Crontab syntax of the restart start time.',
    descriptionLocalizations: { ru: 'Crontab синтаксис времени начала рестарта.' },
    required: true,
    type: ParamType.STRING,
  })
  restartStartCron: string;

  @Param({
    name: 'backup_start_cron',
    nameLocalizations: { ru: 'cron_начала_бэкапа' },
    description: 'Crontab syntax of the backup start time.',
    descriptionLocalizations: { ru: 'Crontab синтаксис времени начала бэкапа.' },
    required: true,
    type: ParamType.STRING,
  })
  backupStartCron: string;

  @Param({
    name: 'backup_duration_time',
    nameLocalizations: { ru: 'время_длительности_бэкапа' },
    description: 'Backup duration in minutes.',
    descriptionLocalizations: { ru: 'Длительность бэкапа в минутах.' },
    required: true,
    minValue: 1,
    maxValue: 1399,
    type: ParamType.INTEGER,
  })
  backupDurationTime: number;

  @Param({
    name: 'hidden_players',
    nameLocalizations: { ru: 'скрытые_игроки' },
    description: 'List of hidden players. Syntax: NICK,NICK,NICK ...',
    descriptionLocalizations: { ru: 'Список скрытых игроков. Синтаксис: НИК,НИК,НИК ...' },
    required: false,
    type: ParamType.STRING,
  })
  hiddenPlayers = '';

  @Param({
    name: 'update_interval',
    nameLocalizations: { ru: 'интервал_обновления' },
    description: 'The time in seconds after which the status will be updated. Default: 60',
    descriptionLocalizations: { ru: 'Время в секундах, через которое статус будет обновлен. По умолчанию: 60' },
    required: false,
    type: ParamType.INTEGER,
    minValue: 10,
    maxValue: 3600,
  })
  updateInterval = 60;

  @Param({
    name: 'timezone_utc_offset',
    description: 'The time zone offset relative to UTC. For example: +05:30',
    descriptionLocalizations: { ru: 'Смещение часового пояса относительно UTC. Например: +05:30' },
    required: false,
    type: ParamType.STRING,
    minLength: 6,
    maxLength: 6,
  })
  timezoneUtcOffset?: string;
}