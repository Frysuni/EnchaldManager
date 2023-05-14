import { CronJob } from 'cron';
import { Client, EmbedBuilder, GatewayIntentBits, Message, PresenceData, TextBasedChannel } from "discord.js";
import { Repository } from "typeorm";
import { MonitoringEntity } from "./entities/monitoring.entity";
import { ServerStatusEnum } from "./enums/serverStatus.enum";
import { MonitoringStatuses } from "./monitoring.statuses";
import { getServerStatus, ServerStatusType } from "./utils";

export class MonitoringNode {
  private node: MonitoringEntity;
  private restartCronJob: CronJob;
  private  backupCronJob: CronJob;

  private readonly nodeClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
    ],
  });

  constructor(
    private readonly monitoringStatuses: MonitoringStatuses,
    private readonly monitroingRepository: Repository<MonitoringEntity>,
    public readonly monitroingId: number,
  ) {
    this.init();
  }

  private serverIsOnline: boolean;

  private async init(): Promise<any> {
    const node = await this.monitroingRepository.findOne({ where: { id: this.monitroingId } });
    if (!node) return;
    this.node = node;

    await this.nodeClient.login(this.node.token);

    this.restartCronJob = new CronJob(node.restartStartCron, this.restartHandler, undefined, true, undefined, 'restartHandler', undefined, node.timezoneUtcOffset);
    this.backupCronJob  = new CronJob(node.backupStartCron,  this.backupHandler,  undefined, true, undefined, 'backupHandler',  undefined, node.timezoneUtcOffset);

    this.updateNodeStatus();
  }

  private async updateNodeStatus(): Promise<any> {
    const serverStatus = await getServerStatus(this.node.address, this.node.version, this.node.port, this.node.hiddenPlayers.split(','));

    if (serverStatus.status == ServerStatusEnum.Started) {
      this.isRestarting = false;
      this.serverIsOnline = true;
      await this.monitroingRepository.update({ id: this.node.id }, { lastOnline: ~~(Date.now() / 1000) });
      this.node = await this.monitroingRepository.findOne({ where: { id: this.node.id } }) as MonitoringEntity;
    } else {
      this.serverIsOnline = false;
    }

    if (!this.isRestarting && !this.isBackuping) {
      const embedAndPresenceData = this.getNodeStatusAssets(serverStatus);
      this.setStatus(this.node.channelId, this.node.messageId, embedAndPresenceData.embed, embedAndPresenceData.presence);
    }
  }

  private getNodeStatusAssets(serverStatus: ServerStatusType) {
    if (serverStatus.status === ServerStatusEnum.Stopped) return this.monitoringStatuses.getServerStopped(this.node.serverName, this.node.lastOnline);
    return this.monitoringStatuses.getServerStarted(this.node.serverName, serverStatus.online, serverStatus.players, this.restartCronJob.nextDate().get('second'));
  }

  private isRestarting: boolean;
  private restartHandler(): any {
    if (!this.serverIsOnline) return;

    this.isRestarting = true;
    const { embed, presence } = this.monitoringStatuses.getRestarting(this.node.serverName);
    this.setStatus(this.node.channelId, this.node.messageId, embed, presence);
  }

  private isBackuping: boolean;
  private backupHandler(): any {
    if (!this.serverIsOnline) return;

    this.isBackuping = true;
    const { embed, presence } = this.monitoringStatuses.getBackuping(this.node.serverName);
    this.setStatus(this.node.channelId, this.node.messageId, embed, presence);
    setTimeout(() => this.isBackuping = false, this.node.backupDurationTime * 1000);
  }

  private async setStatus(channelId: string, messageId: string, embed: EmbedBuilder, presence: PresenceData): Promise<any> {
    const message = await (this.nodeClient.guilds.cache.first()?.channels.cache.get(channelId) as TextBasedChannel).messages.fetch(messageId) as Message<true>;
    this.nodeClient?.user?.setPresence(presence);
    message.edit({ embeds: [embed] });
  }
}