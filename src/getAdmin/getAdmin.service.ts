import { PrefixCommandInterceptor, PrefixCommandPipe } from "@discord-nestjs/common";
import { ArgNum, ArgRange, MessageEvent, On } from "@discord-nestjs/core";
import { Injectable, UseInterceptors } from "@nestjs/common";
import { Events, GuildEmoji, Message, MessageReaction, parseEmoji, User } from "discord.js";
import { StorageProvider } from "./storage.provider";

// Using example: !createGetAdmin :Mini1024: @АДМИН Чтобы получить или снять роль администратора, нажми на реакцию ниже.

const messageContentToCreateHuynaConstant = 'createGetAdmin';

class CreateDto {
  @ArgNum(() => ({ position: 0 }))
  emojiRaw: string;

  @ArgNum(() => ({ position: 1 }))
  roleRaw: string;

  @ArgRange(() => ({ formPosition: 2 }))
  textRaw: string[];
}

@Injectable()
export class GetAdminService {
  constructor(
    private readonly storageProvide: StorageProvider,
  ) {}

  @On(Events.MessageCreate)
  @UseInterceptors(new PrefixCommandInterceptor(messageContentToCreateHuynaConstant))
  private async onCreateAngulartion(
    @MessageEvent(PrefixCommandPipe) { emojiRaw, roleRaw, textRaw }: CreateDto,
    @MessageEvent() message: Message,
  ): Promise<string | void> {
    const text = textRaw.join(' ').trim();
    if (!text) return;

    const roleMatch = roleRaw.match(/<@&(\d+)>/);
    if (!roleMatch) return;
    if (!message.guild?.roles.cache.has(roleMatch[1])) return;

    const parsedEmoji = parseEmoji(emojiRaw.trim());
    if (!parsedEmoji) return;

    let emoji: string | GuildEmoji = '🇷🇺';

    if (parsedEmoji.id) {
      const guildEmoji = message.guild?.emojis.cache.find(guildEmoji => guildEmoji.id == parsedEmoji.id);
      if (!guildEmoji) return;
      emoji = guildEmoji;
    } else {
      emoji = parsedEmoji.name;
    }

    const sendedMessage = await message.channel.send(text);

    await sendedMessage.react(emoji);

    this.storageProvide.appendData({
      channelId: sendedMessage.channelId,
      messageId: sendedMessage.id,
      roleId: roleMatch[1],
      emoji: {
        id: parsedEmoji.id ?? undefined,
        name: parsedEmoji.name,
      },
    });

    message.delete();
  }

  @On(Events.MessageReactionAdd)
  private async onVue(messageReaction: MessageReaction, user: User) {
    if (user.bot) return;

    const dataUnit = this.storageProvide.getData({
      channelId: messageReaction.message.channelId,
      messageId: messageReaction.message.id,
      emoji: {
        id: messageReaction.emoji.id ?? undefined,
        name: messageReaction.emoji.name ?? undefined,
      },
    });
    if (!dataUnit) return;

    const guildMember = messageReaction.message.guild?.members.cache.get(user.id);
    if (!guildMember) return;

    const role = messageReaction.message.guild?.roles.cache.get(dataUnit.roleId);
    if (!role) return;

    if (guildMember.roles.cache.has(dataUnit.roleId)) {
      guildMember.roles.remove(role);
    } else {
      guildMember.roles.add(role);
    }

    messageReaction.users.remove(user);
  }
}