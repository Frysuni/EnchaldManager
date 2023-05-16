import { ParamType } from "@discord-nestjs/core";
import { ParamOptions } from "@discord-nestjs/core/dist/decorators/option/param/param-options";
import { InteractionReplyOptions } from "discord.js";
import { VersionEnum } from "~/monitoring/enums/version.enum";

export interface MonitoringBaseDto {
  readonly serverName:         string;
  readonly token:              string;
  readonly version:            VersionEnum;
  readonly address:            string;
  readonly restartStartCron:   string;
  readonly backupStartCron:    string;
  readonly backupDurationTime: number;
  readonly hiddenPlayers:      string;
  readonly updateInterval:     number;
  readonly timezoneUtcOffset:  string;
}

export const monitoringBaseParams: Record<'target' | keyof MonitoringBaseDto, ParamOptions> = {
  target: {
    name: 'target',
    nameLocalizations: { ru: 'цель' },
    description: 'The target name of the monitoring server.',
    descriptionLocalizations: { ru: 'Целевое имя сервера мониторинга.' },
    autocomplete: true,
    minValue: 1,
    required: true,
    type: ParamType.NUMBER,
  },
  serverName: {
    name: 'server_name',
    nameLocalizations: { ru: 'имя_сервера' },
    description: 'Name of the monitoring server.',
    descriptionLocalizations: { ru: 'Имя сервера мониторинга.' },
    type: ParamType.STRING,
  },
  token: {
    name: 'token',
    nameLocalizations: { ru: 'токен' },
    description: 'Token of the bot responsible for this monitoring.',
    descriptionLocalizations: { ru: 'Токен бота, отвечающего за этот мониторинг.' },
    type: ParamType.STRING,
  },
  version: {
    name: 'version',
    nameLocalizations: { ru: 'версия' },
    description: 'Legacy < 1.7.2 <= Java, Bedrock',
    descriptionLocalizations: { ru: 'Legacy < 1.7.2 <= Java, Bedrock' },
    type: ParamType.INTEGER,
  },
  address: {
    name: 'address',
    nameLocalizations: { ru: 'адрес' },
    description: '1.1.1.1 or 1.1.1.1:25565 or domain.ru or domain.ru:25565 (SRV supported)',
    descriptionLocalizations: { ru: '1.1.1.1 или 1.1.1.1:25565 или domain.ru или domain.ru:25565 (SRV поддерживается)' },
    type: ParamType.STRING,
  },
  restartStartCron: {
    name: 'restart_start_cron',
    nameLocalizations: { ru: 'cron_начала_рестарта' },
    description: 'Crontab syntax of the restart start time.',
    descriptionLocalizations: { ru: 'Crontab синтаксис времени начала рестарта.' },
    type: ParamType.STRING,
  },
  backupStartCron: {
    name: 'backup_start_cron',
    nameLocalizations: { ru: 'cron_начала_бэкапа' },
    description: 'Crontab syntax of the backup start time.',
    descriptionLocalizations: { ru: 'Crontab синтаксис времени начала бэкапа.' },
    type: ParamType.STRING,
  },
  backupDurationTime: {
    name: 'backup_duration_time',
    nameLocalizations: { ru: 'время_длительности_бэкапа' },
    description: 'Backup duration in minutes.',
    descriptionLocalizations: { ru: 'Длительность бэкапа в минутах.' },
    minValue: 1,
    maxValue: 1399,
    type: ParamType.INTEGER,
  },
  hiddenPlayers: {
    name: 'hidden_players',
    nameLocalizations: { ru: 'скрытые_игроки' },
    description: 'List of hidden players. Syntax: NICK,NICK,NICK ...',
    descriptionLocalizations: { ru: 'Список скрытых игроков. Синтаксис: НИК,НИК,НИК ...' },
    type: ParamType.STRING,
  },
  updateInterval: {
    name: 'update_interval',
    nameLocalizations: { ru: 'интервал_обновления' },
    description: 'The time in seconds after which the status will be updated. Default: 60',
    descriptionLocalizations: { ru: 'Время в секундах, через которое статус будет обновлен. По умолчанию: 60' },
    type: ParamType.INTEGER,
    minValue: 10,
    maxValue: 3600,
  },
  timezoneUtcOffset: {
    name: 'timezone_utc_offset',
    description: 'The time zone offset relative to UTC. For example: +05:30',
    descriptionLocalizations: { ru: 'Смещение часового пояса относительно UTC. Например: +05:30' },
    type: ParamType.STRING,
    minLength: 6,
    maxLength: 6,
  },
};

export function baseDtoValidator(options: Partial<MonitoringBaseDto>) {
  const timezoneUtcOffsetRegex = /^((-1[0-2]|\+1[0-4])|(-0[0-9]|\+0[0-9])):(00|15|30|45)$/;
  const addressRegex           = /^(?:[\w-]+\.)+[\w-]{2,}(?::\d+)?|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/i;
  const cronRegex              = /^(\*|[0-9-\/]+)\s+(\*|[0-9-\/]+)\s+(\*|[0-9-\/]+)\s+(\*|[0-9-\/]+)\s+(\*|[0-9-\/]+)(\s+(\*|[0-9-\/]+))?$/;

  const reply = (content: string): InteractionReplyOptions => ({ content, ephemeral: true });

  if (options.restartStartCron && !cronRegex.test(options.restartStartCron)) {
    return reply('Время перезагрузки указано неверно. Проверьте синтаксис или воспользуйтесь https://crontab.guru/'); }
  if (options.backupStartCron && !cronRegex.test(options.backupStartCron)) {
    return reply('Время бекапа указано неверно. Проверьте синтаксис или воспользуйтесь https://crontab.guru/'); }
  if (options.address && !addressRegex.test(options.address)) {
    return reply('Адрес указан неверно.'); }
  if (options.timezoneUtcOffset && !timezoneUtcOffsetRegex.test(options.timezoneUtcOffset)) {
    return reply('Смещение часового пояса относительно UTC указано неверно. https://en.wikipedia.org/wiki/List_of_UTC_offsets'); }

  return false;
}