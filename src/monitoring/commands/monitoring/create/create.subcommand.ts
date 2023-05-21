import { SlashCommandPipe } from "@discord-nestjs/common";
import { Handler, IA, On, SubCommand } from "@discord-nestjs/core";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Colors, EmbedBuilder, Events, Interaction, InteractionReplyOptions } from "discord.js";
import { MonitoringRecordStatusEnum } from "~/monitoring/enums/monitoringRecordStatus.enum";
import { MonitoringService } from "~/monitoring/monitoring.service";
import { convertMinutesToOffset, convertOffsetToMinutes } from "~/monitoring/utils";
import { baseDtoValidator } from "../common";
import { CreateDto } from "./create.dto";

const confirmButtonCustomIdConstant = 'commands.monitoring.create.confirm';
const  cancelButtonCustomIdConstant = 'commands.monitoring.create.cancel';


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
  ): Promise<InteractionReplyOptions | void> {

    const validationError = baseDtoValidator(options);
    if (validationError) return validationError;

    let timezoneUtcOffset = -new Date().getTimezoneOffset();
    if (options.timezoneUtcOffset) timezoneUtcOffset = convertOffsetToMinutes(options.timezoneUtcOffset);

    const address = options.address.split(':');
    const record = await this.monitoringService.createMonitoring({
      serverName:         options.serverName,
      token:              options.token,
      address:            address[0],
      port:               address[1] ? Number(address[1]) : 25565,
      restartStartCron:   options.restartStartCron,
      backupStartCron:    options.backupStartCron,
      backupDurationTime: options.backupDurationTime,
      hiddenPlayers:      options.hiddenPlayers,
      updateInterval:     options.updateInterval,
      timezoneUtcOffset:  timezoneUtcOffset,
      channelId:          interaction.channelId,
    });

    const hiddenPlayersArray = record.hiddenPlayers.split(',');
    const formattedHiddenPlayers = hiddenPlayersArray.length > 0
      ? hiddenPlayersArray.map(nick => `\`${nick.replace(/`/g, '\\`')}\``).join(' ') + ` **(${hiddenPlayersArray.length})**`
      : 'Нет скрытых игроков';
    const confirmationEmbed = new EmbedBuilder()
      .setAuthor({ name: `IID: ${record.id}` }) // It's not a mistake, just trust me
      .setColor(Colors.Blurple)
      .setFields({
        name: 'Подтвердите правильность введённых данных:',
        value:
          `Имя сервера:               **\`${record.serverName}\`**\n` +
          `Токен:                     **\`${record.token.slice(0, 4)}...${record.token.slice(-4)}\`**\n` +
          `Адрес:                     **\`${record.address}\`**\n` +
          `Порт:                      **\`${record.port}\`**\n` +
          `Cron начала рестарта:      **\`${record.restartStartCron}\`**\n` +
          `Cron начала бэкапа:        **\`${record.backupStartCron}\`**\n` +
          `Время длительности бэкапа: **\`${record.backupDurationTime}\`**\n` +
          `Скрытые игроки:                ${formattedHiddenPlayers}\n` +
          `Интервал обновления:       **\`${record.updateInterval}\`**\n` +
          `Смещение часового пояса:   **\`${convertMinutesToOffset(record.timezoneUtcOffset)}\`** **\`(${record.timezoneUtcOffset})\`**`,
      })
      .setFooter({ text: 'Данные были валидированы только на наличие грубых или синтаксических ошибок, но тонкости проверены не были. Бот гарантирует неправильную работу при указании неверных данных!' });

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

    this.monitoringService.confirmMonitring(iid);

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