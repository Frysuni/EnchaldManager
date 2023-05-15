import { SlashCommandPipe } from "@discord-nestjs/common";
import { Handler, IA, On, SubCommand } from "@discord-nestjs/core";
import { ApplicationCommandOptionChoiceData, ChatInputCommandInteraction, Events, Interaction, InteractionReplyOptions } from "discord.js";
import { MonitoringEntity } from "~/monitoring/entities/monitoring.entity";
import { MonitoringService } from "~/monitoring/monitoring.service";
import { convertOffsetToMinutes } from "~/monitoring/utils";
import { baseDtoValidator } from "../common";
import { EditDto } from "./edit.dto";

@SubCommand({
  name: 'edit',
  nameLocalizations: { ru: 'изменить' },
  description: 'Edit the settings of an existing monitoring.',
  descriptionLocalizations: { ru: 'Изменить настройки существующего мониторинга.' },
})

export class EditSubcommand {
  constructor(
    private readonly monitoringService: MonitoringService,
  ) {}

  @Handler()
  async handler(
    @IA(SlashCommandPipe) options: EditDto,
    @IA() interaction: ChatInputCommandInteraction
  ): Promise<InteractionReplyOptions | void> {
    const validationError = baseDtoValidator(options);
    if (validationError) return validationError;

    const address = options.address ? options.address.split(':') : [];
    const updateEntity: Partial<MonitoringEntity> = {
      ...options,
      address: address[0],
      port: address[0] ? address[1] ? Number(address[1]) : 25565 : undefined,
      timezoneUtcOffset: options.timezoneUtcOffset ? convertOffsetToMinutes(options.timezoneUtcOffset) : undefined,
    };

    // Delete all undefined values
    delete (updateEntity as Partial<typeof options>)['target'];
    for (const key in updateEntity) if (updateEntity[key as keyof MonitoringEntity] === undefined) delete updateEntity[key as keyof MonitoringEntity];

    this.monitoringService.updateMonitoring(options.target, updateEntity);
  }

  @On(Events.InteractionCreate)
  async targetAutocomplete(@IA() interaction: Interaction): Promise<void> {
    if (!interaction.isAutocomplete()) return;
    if (interaction.commandName !== 'monitoring') return;
    if (interaction.options.getSubcommand() !== 'edit') return;

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
}