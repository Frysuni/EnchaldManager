import { IA, InjectDiscordClient, On, Once } from "@discord-nestjs/core";
import { ActivityType, Client, ColorResolvable, EmbedBuilder, Events, GuildEmoji, Interaction, PresenceData } from "discord.js"
import { divideArray } from "./utils";

interface StatusInterface {
  presence: PresenceData
  embed: EmbedBuilder
}

export class MonitoringStatuses {
  constructor(
    @InjectDiscordClient() private readonly client: Client,
  ) {}
  
  public getBackuping(color: ColorResolvable, serverName: string): StatusInterface {
    return {
      embed: this.getEmbedBase(color, serverName).setFields({ name: `Сервер находится на резервном копировании.`, value: '\u200B' }),
      presence: { status: 'dnd', activities: [{ type: ActivityType.Playing, name: 'BACKUPING'}] }
    }
  }

  public getRestarting(color: ColorResolvable, serverName: string): StatusInterface {
    return {
      embed: this.getEmbedBase(color, serverName).setFields({ name: `Сервер перезагружается... `, value: '\u200B' }),
      presence: { status: 'idle', activities: [] }
    }
  }

  public getServerStopped(color: ColorResolvable, serverName: string, lastOnline: number): StatusInterface {
    const presence: PresenceData = { activities: [], status: 'invisible' };
    const embed = this.getEmbedBase(color, serverName);
    embed.setFields({
      name: `Сервер выключен ${this.emojis.offline?.toString() ?? '{NO_EMOJI=:offline:}'}`,
      value: lastOnline ? `Был выключен <t:${lastOnline}:R>` : 'Ещё ни разу не был включен',
    });

    return {
      embed,
      presence,
    }
  }

  public getServerStarted(color: ColorResolvable, serverName: string, online: string, rawPlayers: string[] | undefined, restartAtInSeconds: number): StatusInterface {
    const noOneIsOnline = online.startsWith('0');
    const title = noOneIsOnline ? 'Никого нет онлайн' : `Онлайн: ${online} игроков.`;
    const parsePlayerName = (name: string): string => `• ${name.replace(/_/g, '\\_').replace(/\*/g, '\\*').replace(/~/g, '\\~').replace(/`/g, '\\`')}\n`;

    const [firstPlayersHalf, secondPlayersHalf] = divideArray(rawPlayers?.map(parsePlayerName));
    
    const embed = this.getEmbedBase(color, serverName);

    embed.setFields({
      name: `Сервер работает ${this.emojis.online?.toString() ?? '{NO_EMOJI=:online:}'}`,
      value: `Рестарт <t:${restartAtInSeconds}:R>`,
    });

    embed.addFields({
      name: title,
      value: firstPlayersHalf.length ? firstPlayersHalf.join('') : (noOneIsOnline ? 'Присоединяйся скорее ;)' : 'Информация о списке игроков недоступна.'),
      inline: true,
    });

    if (secondPlayersHalf.length) {
      embed.addFields({
        name: '\u200B',
        value: secondPlayersHalf.join(''),
        inline: true,
      })
    }
    
    const presence: PresenceData = {
      activities: [{
        type: ActivityType.Watching,
        name: `${online} игроков.`,
      }],
      status: noOneIsOnline ? 'idle' : 'online',
    };

    return {
      embed,
      presence,
    }
  }

  private getEmbedBase(color: ColorResolvable, serverName: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(color)
      .setTitle(`Мониторинг Enchald ${serverName}`)
  }

  private emojis: {
    online:  string,
    offline: string,
    reboot:  string
  } = {
    online:  '{NO_EMOJI=:online:}',
    offline: '{NO_EMOJI=:offline:}',
    reboot:  '{NO_EMOJI=:reboot:}'
  };

  @Once(Events.ClientReady)
  private setEmojis(): any {
    this.emojis = {
      online:  this.client.emojis.cache.find(emoji => emoji.name?.toLowerCase() == 'online' )?.toString() ?? this.emojis.online,
      offline: this.client.emojis.cache.find(emoji => emoji.name?.toLowerCase() == 'offline')?.toString() ?? this.emojis.offline,
      reboot:  this.client.emojis.cache.find(emoji => emoji.name?.toLowerCase() == 'reboot' )?.toString() ?? this.emojis.reboot,
    }
  }

  @On(Events.GuildEmojiCreate) private onGuildEmojiCreate (@IA() guildEmoji: GuildEmoji) { this.updateEmojis(guildEmoji, 'create'); }
  @On(Events.GuildEmojiDelete) private onGuildEmojiDelete (@IA() guildEmoji: GuildEmoji) { this.updateEmojis(guildEmoji, 'delete'); }
  @On(Events.GuildEmojiUpdate) private onGuildEmojiUpdate (@IA() guildEmoji: GuildEmoji) { this.updateEmojis(guildEmoji, 'update'); }

  private updateEmojis(guildEmoji: GuildEmoji, action: 'create' | 'delete' | 'update'): any {
    if (!guildEmoji.name || !Object.keys(this.emojis).includes(guildEmoji.name.toLowerCase())) return;
    this.emojis[guildEmoji.name as keyof typeof this.emojis] = action == 'delete' ? `{NO_EMOJI=:${guildEmoji.name}:}` : guildEmoji.toString()
  }
}
