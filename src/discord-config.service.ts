import {
  DiscordModule,
  DiscordModuleOption,
  DiscordOptionsFactory,
} from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';
import { GatewayIntentBits, Partials } from 'discord.js';
import envConfig from '@env';

@Injectable()
class DiscordConfigService implements DiscordOptionsFactory {
  createDiscordOptions(): DiscordModuleOption {
    return {
      token: envConfig.token,
      autoLogin: true,
      failOnLogin: true,
      shutdownOnAppDestroy: true,
      discordClientOptions: {
        intents: [
          // GatewayIntentBits.AutoModerationConfiguration,
          // GatewayIntentBits.AutoModerationExecution,
          // GatewayIntentBits.DirectMessageReactions,
          // GatewayIntentBits.DirectMessageTyping,
          // GatewayIntentBits.DirectMessages,
          GatewayIntentBits.GuildEmojisAndStickers,
          // GatewayIntentBits.GuildIntegrations,
          // GatewayIntentBits.GuildInvites,
          // GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessageReactions,
          // GatewayIntentBits.GuildMessageTyping,
          GatewayIntentBits.GuildMessages,
          // GatewayIntentBits.GuildModeration,
          // GatewayIntentBits.GuildPresences,
          // GatewayIntentBits.GuildScheduledEvents,
          // GatewayIntentBits.GuildWebhooks,
          GatewayIntentBits.Guilds,
          GatewayIntentBits.MessageContent,
        ],
        partials: [
          Partials.Channel,
          Partials.GuildMember,
          Partials.GuildScheduledEvent,
          Partials.Message,
          Partials.Reaction,
          Partials.ThreadMember,
          Partials.User,
        ],
        allowedMentions: {
          parse: [
            'everyone',
            'roles',
            'users',
          ],
          repliedUser: true,
        },
        presence: { status: 'idle' },
      },
    };
  }
}

export const DiscordModuleRegister = [
  DiscordModule.forRootAsync({
    useClass: DiscordConfigService,
    setupClientFactory: client => {
      client.setMaxListeners(Infinity);
    },
  }),
  DiscordModule.forFeature(),
];
