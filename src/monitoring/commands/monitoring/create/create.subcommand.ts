import { SlashCommandPipe } from "@discord-nestjs/common";
import { Handler, IA, On, SubCommand } from "@discord-nestjs/core";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Colors, EmbedBuilder, Events, Interaction, InteractionReplyOptions } from "discord.js";
import { MonitoringRecordStatusEnum } from "~/monitoring/enums/monitoringRecordStatus.enum";
import { VersionEnum } from "~/monitoring/enums/version.enum";
import { MonitoringService } from "~/monitoring/monitoring.service";
import { convertMinutesToOffset, convertOffsetToMinutes } from "~/monitoring/utils";
import { CreateDto } from "./create.dto";

const confirmButtonCustomIdConstant = 'commands.monitoring.create.confirm';
const  cancelButtonCustomIdConstant = 'commands.monitoring.create.cancel';

const timezoneUtcOffsetRegex = /^(-1[0-2]|0\d|\+1[0-4]):(00|15|30|45)$/;
const addressRegex           = /^(?:[\w-]+\.)+[\w-]{2,}(?::\d+)?|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/i;
const cronRegex              = /^(\*|[0-9-\/]+)\s+(\*|[0-9-\/]+)\s+(\*|[0-9-\/]+)\s+(\*|[0-9-\/]+)\s+(\*|[0-9-\/]+)(\s+(\*|[0-9-\/]+))?$/;

const reply = (content: string): InteractionReplyOptions => ({ content, ephemeral: true });

@SubCommand({
  name: 'create',
  nameLocalizations: { ru: 'создать' },
  description: 'Create a new monitoring and send it to this channel.',
  descriptionLocalizations: { ru: 'Создать новый мониторинг и отправить его в этот канал.' },
})

export class CreateSubcommand {
  constructor(
    private readonly monitoringService: MonitoringService,
  ) {}

  @Handler()
  async handler(
    @IA(SlashCommandPipe) options: CreateDto,
    @IA() interaction: ChatInputCommandInteraction
  ): Promise<InteractionReplyOptions> {

    console.log(options);

    if (!cronRegex.test(options.restartStartCron)) {
      return reply('Время перезагрузки указано неверно. Проверьте синтаксис или воспользуйтесь https://crontab.guru/'); }
    if (!cronRegex.test(options.backupStartCron)) {
      return reply('Время бекапа указано неверно. Проверьте синтаксис или воспользуйтесь https://crontab.guru/'); }
    if (!addressRegex.test(options.address)) {
      return reply('Адрес указан неверно.'); }
    if (options.timezoneUtcOffset && !timezoneUtcOffsetRegex.test(options.timezoneUtcOffset)) {
      return reply('Смещение часового пояса относительно UTC указано неверно. https://en.wikipedia.org/wiki/List_of_UTC_offsets'); }

    let timezoneUtcOffset = new Date().getTimezoneOffset();
    if (options.timezoneUtcOffset) timezoneUtcOffset = convertOffsetToMinutes(options.timezoneUtcOffset);

    const address = options.address.split(':');
    const record = await this.monitoringService.createMonitoring({
      serverName:         options.serverName,
      token:              options.token,
      version:            options.version,
      address:            address[0],
      port:               address[1] ? Number(address[1]) : 25565,
      restartStartCron:   options.restartStartCron,
      backupStartCron:    options.backupStartCron,
      backupDurationTime: options.backupDurationTime,
      hiddenPlayers:      options.hiddenPlayers ?? '',
      updateInterval:     options.updateInterval ?? 60,
      timezoneUtcOffset:  timezoneUtcOffset,
      channelId:          interaction.channelId,
    });

    const confirmationEmbed = new EmbedBuilder()
      .setAuthor({ name: `IID: ${record.id}` }) // It's not a mistake, just trust me
      .setColor(Colors.Fuchsia)
      .setFields({
        name: 'Подтвердите правильность введённых данных:',
        value:
          `Имя сервера:               **\`${record.serverName}\`**\n` +
          `Токен:                     **\`${record.token.slice(0, 4)}...${record.token.slice(-4)}\`**\n` +
          `Версия:                    **\`${VersionEnum[record.version]}\`**\n` +
          `Адрес:                     **\`${record.address}\`**\n` +
          `Порт:                      **\`${record.port}\`**\n` +
          `Cron начала рестарта:      **\`${record.restartStartCron}\`**\n` +
          `Cron начала бэкапа:        **\`${record.backupStartCron}\`**\n` +
          `Время длительности бэкапа: **\`${record.backupDurationTime}\`**\n` +
          `Скрытые игроки:                ${record.hiddenPlayers.split(',').map(nick => `\`${nick}\``).join(' ')}\n` +
          `Интервал обновления:       **\`${record.updateInterval}\`**\n` +
          `Смещение часового пояса:   **\`${convertMinutesToOffset(record.timezoneUtcOffset)}\`** **\`(${record.timezoneUtcOffset})\`**`,
      })
      .setFooter({ text: 'Данные были валидированы только на наличие грубых или синтаксических ошибок, но тонкости проверены не были. Бот гарантирует неправильную работу при указании неверных данных!' });
      console.log(confirmationEmbed.data.fields?.[0].value);
    const buttonsRow = new ActionRowBuilder<ButtonBuilder>()
      .setComponents(
        new ButtonBuilder()
          .setCustomId(confirmButtonCustomIdConstant)
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅')
          .setLabel('Подтвердить'),
        new ButtonBuilder()
          .setCustomId(cancelButtonCustomIdConstant)
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🛑')
          .setLabel('Отменить'),
      );

    return {
      ephemeral: true,
      embeds: [confirmationEmbed],
      components: [buttonsRow],
    };
  }

  // Подтвердить
  @On(Events.InteractionCreate)
  public async postCreateMonitoringCommandConfirmationButtonHandler(@IA() interaction: Interaction): Promise<InteractionReplyOptions | void> {
    if (!interaction.isButton()) return;
    if (interaction.customId !== confirmButtonCustomIdConstant) return;

    const iid = Number(interaction.message.embeds[0].author?.name.split(' ')[1]);

    const status = await this.monitoringService.getMonitoringRecordStatus(iid);
    if (status === MonitoringRecordStatusEnum.Confirmed) return { content: 'Этот мониторинг уже был подтверждён.', ephemeral: true };
    if (status === MonitoringRecordStatusEnum.Cancelled) return { content: 'Этот мониторинг уже был отменён.', ephemeral: true };

    const embed = new EmbedBuilder().setDescription('Мониторинг создан, идет инициализация...');

    interaction.message.channel.send({ embeds: [embed] }).then(message => {
      this.monitoringService.confirmMonitring(iid, message.id);
    });

    return { content: `Данные подтверждены. Мониторинг IID: ${iid} запущен в произовдство.`, ephemeral: true };
  }

  // Отменить
  @On(Events.InteractionCreate)
  public async postCreateMonitoringCommandCancellationButtonHandler(@IA() interaction: Interaction): Promise<InteractionReplyOptions | void> {
    if (!interaction.isButton()) return;
    if (interaction.customId !== cancelButtonCustomIdConstant) return;

    const iid = Number(interaction.message.embeds[0].author?.name.split(' ')[1]);

    const status = await this.monitoringService.getMonitoringRecordStatus(iid);
    if (status === MonitoringRecordStatusEnum.Confirmed) return { content: 'Этот мониторинг уже был подтверждён.', ephemeral: true };
    if (status === MonitoringRecordStatusEnum.Cancelled) return { content: 'Этот мониторинг уже был отменён.', ephemeral: true };

    this.monitoringService.cancelMonitoring(iid);

    return { content: `Понял тебя, это выбросил в мусорку. Спасибо.`, ephemeral: true };
  }

}