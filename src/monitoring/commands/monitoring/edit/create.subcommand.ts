import { SlashCommandPipe } from "@discord-nestjs/common";
import { Handler, IA, On, SubCommand } from "@discord-nestjs/core";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Events, Interaction, InteractionReplyOptions, resolveColor } from "discord.js";
import { MonitoringRecordStatusEnum } from "~/monitoring/enums/monitoringRecordStatus.enum";
import { VersionEnum } from "~/monitoring/enums/version.enum";
import { MonitoringService } from "~/monitoring/monitoring.service";
import { CreateDto } from "./create.dto";

const confirmButtonCustomIdConstant = 'commands.monitoring.create.confirm';
const  cancelButtonCustomIdConstant = 'commands.monitoring.create.cancel';

const restartTimeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const backupTimeRegex  = /^(?:MON|TUE|WED|THU|FRI|SAT|SUN)_(?:[01]\d|2[0-3]):[0-5]\d-(?:MON|TUE|WED|THU|FRI|SAT|SUN)_(?:[01]\d|2[0-3]):[0-5]\d$/;
const addressRegex     = /^(?:[\w-]+\.)+[\w-]{2,}(?::\d+)?|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/i;

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

    let color: number;
    try { color = resolveColor(options.color); }
    catch (_) { return { content: `Цвет \`${options.color}\` не поддерживается или набран неверно.`, ephemeral: true }; }

    if (!restartTimeRegex.test(options.restartTime)) {
      return { content: `Время перезагрузки указано неверно. Проверьте синтаксис: ЧЧ:ММ Получно: \`${options.restartTime}\``, ephemeral: true }; }
    if (!backupTimeRegex.test(options.backupTime)) {
      return { content: `Время бекапа указано неверно. Пример: MON_00:30-TUE_06:00. (XXX - первые три буквы дня недели) Получено: ${options.backupTime}` }; }
    if (!addressRegex.test(options.address)) {
      return { content: `Адрес указан неверно. Получено: \`${options.address}\``, ephemeral: true }; }

    const address = options.address.split(':');
    const record = await this.monitoringService.createMonitoring({
      serverName:     options.serverName,
      color:          color,
      token:          options.token,
      version:        options.version,
      address:        address[0],
      port:           address[1] ? Number(address[1]) : 25565,
      channelId:      interaction.channelId,
      messageId:      undefined,
      restartTime:    options.restartTime,
      backupTime:     options.backupTime,
      hiddenPlayers:  options.hiddenPlayers,
      updateInterval: options.updateInterval ?? 60,
    });

    const confirmationEmbed = new EmbedBuilder()
      .setAuthor({ name: `IID: ${record.id}` }) // It's not a mistake, just trust me
      .setColor(record.color)
      .setFields({
        name: 'Подтвердите правильность введённых данных:',
        value:
          `Имя сервера:    ${record.serverName}\n` +
          `Цвет:           ${options.color} (${record.color})\n` +
          `Токен:        ||${record.token}||\n` + 
          `Версия:         ${VersionEnum[record.version]}\n` +
          `Адрес:          ${record.address}\n` + 
          `Порт:           ${record.port}\n` +
          `Время рестарта: ${record.restartTime}\n` +
          `Время бэкапа:   ${record.backupTime}\n` +
          `Скрытые игроки: ${record.hiddenPlayers.split(',').map(nick => `\`${nick}\``).join(' ')}\n` +
          `Интервал обновления: ${record.updateInterval}`,
      })
      .setFooter({ text: 'Данные были валидированы только на наличие грубых или синтаксических ошибок, но тонкости проверены не были. Бот не гарантирует правильную работу при указании неверных данных!' });

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
    })

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

    return { content: `Понял тебя, это выбросил в мусорку. Спасибо, что следишь за тем, чем меня кормишь.`, ephemeral: true };
  }

}