import { CronJob } from 'cron';
import { parseExpression } from 'cron-parser';
import { Client, EmbedBuilder, GatewayIntentBits, Message, PresenceData, TextBasedChannel } from "discord.js";
import { Repository } from "typeorm";
import { MonitoringEntity } from "./entities/monitoring.entity";
import { ServerStatusEnum } from "./enums/serverStatus.enum";
import { MonitoringStatuses } from "./monitoring.statuses";
import { getServerStatus, ServerStatusType } from "./utils";

export class MonitoringNode {
  private node:  MonitoringEntity;
  private restartCronJob: CronJob;
  private  backupCronJob: CronJob;
  private serverIsOnline: boolean;
  private isRestarting:   boolean;
  private isBackuping:    boolean;
  private isPaused:       boolean;
  private updateSkipTimes     = 0;

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

  private nodeUpdateInterval: NodeJS.Timer | undefined;
  private async init(): Promise<any> {
    const node = await this.monitroingRepository.findOne({ where: { id: this.monitroingId } });
    if (!node) return;
    this.node = node;
    this.isPaused = this.node.paused;

    await this.nodeClient.login(this.node.token);
    await new Promise(res => setTimeout(res, 500));

    this.nodeClient.user?.setStatus('invisible');

    this.restartCronJob = new CronJob(node.restartStartCron, this.restartHandler.bind(this), undefined, true, undefined, 'restartHandler', undefined, node.timezoneUtcOffset);
    this.backupCronJob  = new CronJob(node.backupStartCron,  this.backupHandler .bind(this), undefined, true, undefined, 'backupHandler',  undefined, node.timezoneUtcOffset);

    // если бот запущен во время бэкапа
    const cronExpression = parseExpression(node.backupStartCron, { tz: this.node.timezone });
    const completedAt = cronExpression.prev().getTime() + this.node.backupDurationTime * 60 * 1000;
    if (completedAt >= Date.now()) this.backupHandler(completedAt - Date.now());

    this.updateNodeStatus();
    this.nodeUpdateInterval = setInterval(this.updateNodeStatus.bind(this), node.updateInterval * 1000);
  }

  public async pause(pause: boolean): Promise<any> {
    this.isPaused = pause;
    this.updateNodeStatus();
  }

  public async destroy(withMessage: boolean): Promise<any> {
    const channel = this.nodeClient.channels.cache.get(this.node.channelId) as TextBasedChannel | undefined;

    if (withMessage && this.node.messageId) {
      const message = await channel?.messages?.fetch(this.node.messageId) as Message<true> | undefined;
      await message?.delete();
    }

    clearInterval(this.nodeUpdateInterval);
    clearTimeout(this.backupTimeout);
    this.restartCronJob.stop();
    this.backupCronJob.stop();
    this.nodeClient.destroy();
    (this.restartCronJob as CronJob | null) = null;
    (this.backupCronJob as CronJob | null) = null;
    this.nodeUpdateInterval = undefined;
    this.backupTimeout = undefined;
    (this.nodeClient as Client | null) = null;
  }

  private async updateNodeStatus(): Promise<any> {
    if (this.updateSkipTimes > 0) return this.updateSkipTimes--;
    if (this.isPaused) {
      const pausedStatus = this.monitoringStatuses.getPaused(this.node.serverName);
      return this.setStatus(pausedStatus.embed, pausedStatus.presence);
    }

    const serverStatus = await getServerStatus(this.node.address, this.node.port, this.node.hiddenPlayers.split(','));

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
      this.setStatus(embedAndPresenceData.embed, embedAndPresenceData.presence);
    }
  }

  private getNodeStatusAssets(serverStatus: ServerStatusType) {
    const restartAt = ~~(this.restartCronJob.nextDate().toMillis() / 1000);
    if (serverStatus.status === ServerStatusEnum.Stopped) return this.monitoringStatuses.getServerStopped(this.node.serverName, this.node.lastOnline);
    return this.monitoringStatuses.getServerStarted(this.node.serverName, serverStatus, restartAt);
  }


  private restartHandler(): any {
    if (!this.serverIsOnline) return;
    if (this.isPaused) return;

    this.isRestarting = true;
    this.updateSkipTimes++;

    const { embed, presence } = this.monitoringStatuses.getRestarting(this.node.serverName);
    this.setStatus(embed, presence);
  }

  private backupTimeout: NodeJS.Timeout | undefined;
  private backupHandler(elapsedTime?: number): any {
    if (this.isPaused) return;

    this.isBackuping = true;

    const { embed, presence } = this.monitoringStatuses.getBackuping(this.node.serverName);
    this.setStatus(embed, presence);

    this.backupTimeout = setTimeout(() => this.isBackuping = false, elapsedTime ?? this.node.backupDurationTime * 1000);
  }

  private async setStatus(embed: EmbedBuilder, presence: PresenceData): Promise<any> {
    const messageId = await this.getMessageId();

    const message = await (this.nodeClient.guilds.cache.first()?.channels.cache.get(this.node.channelId) as TextBasedChannel).messages.fetch(messageId) as Message<true>;
    this.nodeClient?.user?.setPresence(presence);
    message.edit({ embeds: [embed] });
  }

  private async getMessageId(): Promise<string> {
    if (this.node.messageId) return this.node.messageId;

    const embed = new EmbedBuilder().setDescription('Мониторинг создан, идет инициализация...');

    const channel = this.nodeClient.channels.cache.get(this.node.channelId) as TextBasedChannel | undefined;
    if (!channel) throw `Мониторинг **${this.node.serverName}** не обнаружил канал с id ${this.node.channelId}!\nВыполните команду \`/edit ${this.node.serverName}\` для восстановления канала!`;

    const { id } = await channel.send({ embeds: [embed] });

    await this.monitroingRepository.update({ id: this.node.id }, { messageId: id });
    this.node = await this.monitroingRepository.findOne({ where: { id: this.node.id } }) as MonitoringEntity;

    return id;
  }
}