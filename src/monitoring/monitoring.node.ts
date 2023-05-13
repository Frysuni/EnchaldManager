import { Client, TextBasedChannel, Message, EmbedBuilder, PresenceData, GatewayIntentBits } from "discord.js";
import { Repository } from "typeorm";
import { MonitoringEntity } from "./entities/monitoring.entity";
import { ServerStatusEnum } from "./enums/serverStatus.enum";
import { MonitoringStatuses } from "./monitoring.statuses";
import { getServerStatus, parseBackupTime, parseRestartTime, ServerStatusType } from "./utils";

export class MonitoringNode {
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
    this.init(true);
  }

  private serverIsOnline: boolean;
  private async init(entryPoint?: true): Promise<any> {
    const node = await this.monitroingRepository.findOne({ where: { id: this.monitroingId } });
    if (!node) return;

    if (entryPoint) await this.nodeClient.login(node.token);
  
    await this.updateNodeStatus(node);

    if (entryPoint) {
      setInterval(this.init.bind(this), node.updateInterval * 1000);
      this.restartHandler(node);
      this.backupHandler(node);
    }
  }


  private async updateNodeStatus(node: MonitoringEntity): Promise<any> {
    const serverStatus = await getServerStatus(node.address, node.version, node.port, node.hiddenPlayers.split(','));
    
    if (serverStatus.status == ServerStatusEnum.Started) {
      this.isRestarting = false;
      this.serverIsOnline = true;
      this.monitroingRepository.update({ id: node.id }, { lastOnline: ~~(Date.now() / 1000) });
    } else {
      this.serverIsOnline = false;
    }

    if (!this.isRestarting && !this.isBackuping) {
      const embedAndPresenceData = this.getNodeStatusAssets(node, serverStatus);
      this.setStatus(node.channelId, node.messageId, embedAndPresenceData.embed, embedAndPresenceData.presence);
    }
  }

  private getNodeStatusAssets(node: MonitoringEntity, serverStatus: ServerStatusType) {
    if (serverStatus.status === ServerStatusEnum.Stopped) {
      return this.monitoringStatuses.getServerStopped(node.color, node.serverName, node.lastOnline);
    }

    const { restartAtInSeconds } = parseRestartTime(node.restartTime);
    return this.monitoringStatuses.getServerStarted(node.color, node.serverName, serverStatus.online, serverStatus.players, restartAtInSeconds);
  }

  private isRestarting: boolean;
  private restartHandler(node: MonitoringEntity): any {
    if (!this.serverIsOnline) return setTimeout(() => this.restartHandler(node), node.updateInterval * 1000);

    const { embed, presence } = this.monitoringStatuses.getRestarting(node.color, node.serverName);
    const { restartIn } = parseRestartTime(node.restartTime);

    setTimeout(() => {
      this.isRestarting = true;
      this.setStatus(node.channelId, node.messageId, embed, presence);
      this.restartHandler(node);
    }, restartIn);
  }

  private isBackuping = false;
  private backupHandler(node: MonitoringEntity): any {
    if (!this.serverIsOnline) return setTimeout(() => this.backupHandler(node), node.updateInterval * 1000);

    const { embed, presence } = this.monitoringStatuses.getBackuping(node.color, node.serverName);
    const { backupStartsIn, backupStopsIn } = parseBackupTime(node.backupTime);
    
    setTimeout(() => {
      this.isBackuping = true;
      this.setStatus(node.channelId, node.messageId, embed, presence);
      setTimeout(() => this.isBackuping = false, backupStopsIn)
    }, backupStartsIn)
  }

  private async setStatus(channelId: string, messageId: string, embed: EmbedBuilder, presence: PresenceData): Promise<any> {
    const message = await (this.nodeClient.guilds.cache.first()?.channels.cache.get(channelId) as TextBasedChannel).messages.fetch(messageId) as Message<true>;
    this.nodeClient?.user?.setPresence(presence);
    message.edit({ embeds: [embed] });
  }
}