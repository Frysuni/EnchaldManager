import { SlashCommandPipe } from "@discord-nestjs/common";
import { Handler, IA, On, SubCommand } from "@discord-nestjs/core";
import { ActionRowBuilder, ApplicationCommandOptionChoiceData, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Colors, EmbedBuilder, Events, Interaction, InteractionReplyOptions } from "discord.js";
import { MonitoringService } from "~/monitoring/monitoring.service";
import { DeleteDto } from "./delete.dto";

const confirmButtonCustomIdConstant = 'commands.monitoring.delete.confirm';
const  cancelButtonCustomIdConstant = 'commands.monitoring.delete.cancel';

@SubCommand({
  name: 'delete',
  nameLocalizations: { ru: 'удалить' },
  description: 'Delete monitoring.',
  descriptionLocalizations: { ru: 'Удалить мониторинг.' },
})

export class DeleteSubcommand {
  private readonly monitoringDeleteRequests = new Map<string, { id: number, serverName: string }>();

  constructor(
    private readonly monitoringService: MonitoringService,
  ) { }

  @Handler()
  async handler(
    @IA(SlashCommandPipe) options: DeleteDto,
    @IA() interaction: ChatInputCommandInteraction
  ): Promise<InteractionReplyOptions | void> {
    const monitoringName = await this.monitoringService.getMonitoringName(options.target) ?? 'чзх бл..';

    const embed = new EmbedBuilder()
      .setColor(Colors.DarkRed)
      .setDescription(`Подтвердите __удаление__ мониторинга **\`${monitoringName}\`**`);

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

    const message = await interaction.reply({ embeds: [embed], components: [buttonsRow], ephemeral: true });

    this.monitoringDeleteRequests.set(message.id, { id: options.target, serverName: monitoringName });
  }

  @On(Events.InteractionCreate)
  async targetAutocomplete(@IA() interaction: Interaction): Promise<void> {
    if (!interaction.isAutocomplete()) return;
    if (interaction.commandName !== 'monitoring') return;
    if (interaction.options.getSubcommand() !== 'delete') return;

    const focused = interaction.options.getFocused().trim();

    // Without cache.
    const search = () => this.monitoringService.searchMonitorings(focused);
    // Do you know why?
    // But because you're a dirty faggot and I'm talking about you, a motherfucker who decided to fuck up to this.
    // There was no cache here and there will never be, you went to the wrong area at all, asshole, you should not
    // have appeared here and not ask your stupid questions about caching. You know what? I don't give a fuck about
    // your database and about you, too, I absolutely don't give a fuck how many requests you will fly,
    // I would generally send them to you in the fucker, you stinky nit. This is a fucking computer for you,
    // he doesn't give a fuck if there is caching here or not, he will fuck it all, not that you're a dog bitch.
    // This fucking command is fucking used only by admins and then fuck once in 10 years, so fuck you with your claims.
    // Shut your fucking cattle truck, your mother is dead, understand?


    if (focused.length == 0) return interaction.respond([{ name: 'Начните вводить название...', value: 0 }]);

    const searched = (await search()).map(monitoring => ({ name: monitoring.serverName, value: monitoring.id })) as ApplicationCommandOptionChoiceData<number>[];

    if (searched.length == 0) return interaction.respond([{ name: 'Ничего не найдено.', value: 0 }]);

    interaction.respond(searched);
  }

  // Подтвердить
  @On(Events.InteractionCreate)
  public async postDeleteMonitoringCommandConfirmationButtonHandler(@IA() interaction: Interaction): Promise<InteractionReplyOptions | void> {
    if (!interaction.isButton()) return;
    if (interaction.customId !== confirmButtonCustomIdConstant) return;

    const deleteRequest = this.monitoringDeleteRequests.get(interaction.message.id);
    if (!deleteRequest) return { content: 'Этот запрос на удаление более не действителен.', ephemeral: true };
    this.monitoringDeleteRequests.delete(interaction.message.id);

    this.monitoringService.deleteMonitoring(deleteRequest.id);

    return { content: `Мониторинг \`${deleteRequest.serverName}\` удалён.`, ephemeral: true };
  }

  // Отменить
  @On(Events.InteractionCreate)
  public async postDeleteMonitoringCommandCancellationButtonHandler(@IA() interaction: Interaction): Promise<InteractionReplyOptions | void> {
    if (!interaction.isButton()) return;
    if (interaction.customId !== cancelButtonCustomIdConstant) return;

    const deleteRequest = this.monitoringDeleteRequests.get(interaction.message.id);
    if (!deleteRequest) return { content: 'Этот запрос на удаление более не действителен.', ephemeral: true };
    this.monitoringDeleteRequests.delete(interaction.message.id);

    return { content: `Отменено. Мониторинг \`${deleteRequest.serverName}\` **не** был удалён.`, ephemeral: true };
  }
}