import { SlashCommandPipe } from "@discord-nestjs/common";
import { Handler, IA, On, SubCommand } from "@discord-nestjs/core";
import { ApplicationCommandOptionChoiceData, ChatInputCommandInteraction, Events, Interaction, InteractionReplyOptions } from "discord.js";
import { MonitoringService } from "~/monitoring/monitoring.service";
import { PauseDto } from "./pause.dto";

@SubCommand({
  name: 'pause',
  nameLocalizations: { ru: 'пауза' },
  description: 'Pause monitoring.',
  descriptionLocalizations: { ru: 'Поставить мониторинг на паузу.' },
})

export class DeleteSubcommand {
  constructor(
    private readonly monitoringService: MonitoringService,
  ) {}

  @Handler()
  async handler(
    @IA(SlashCommandPipe) options: PauseDto,
  ): Promise<InteractionReplyOptions | void> {
    const monitoringName = '**`' + await this.monitoringService.getMonitoringName(options.target) + '`**';

    const paused = await this.monitoringService.pauseMonitoring(options.target);

    const content = paused
      ? `Мониторинг ${monitoringName} был приостановлен.`
      : `Работа мониторинга ${monitoringName} возобновлена.`;

    return { content, ephemeral: true };
  }

  @On(Events.InteractionCreate)
  async targetAutocomplete(@IA() interaction: Interaction): Promise<void> {
    if (!interaction.isAutocomplete()) return;
    if (interaction.commandName !== 'monitoring') return;
    if (interaction.options.getSubcommand() !== 'delete') return;

    const focused = interaction.options.getFocused().trim();

    const search = () => this.monitoringService.searchMonitorings(focused);

    if (focused.length == 0) return interaction.respond([{ name: 'Начните вводить название...', value: 0 }]);

    const searched = (await search()).map(monitoring => ({ name: monitoring.serverName, value: monitoring.id })) as ApplicationCommandOptionChoiceData<number>[];

    if (searched.length == 0) return interaction.respond([{ name: 'Ничего не найдено.', value: 0 }]);

    interaction.respond(searched);
  }
}
