import { Param } from "@discord-nestjs/core";
import { MonitoringBaseDto, monitoringBaseParams } from "../common";

export class CreateDto implements Partial<MonitoringBaseDto> {
  @Param({ ...monitoringBaseParams.serverName, required: true })
  serverName: string;

  @Param({ ...monitoringBaseParams.token, required: true })
  token: string;

  @Param({ ...monitoringBaseParams.address, required: true })
  address: string;

  @Param({ ...monitoringBaseParams.restartStartCron, required: true })
  restartStartCron: string;

  @Param({ ...monitoringBaseParams.backupStartCron, required: true })
  backupStartCron: string;

  @Param({ ...monitoringBaseParams.backupDurationTime, required: true })
  backupDurationTime: number;

  @Param({ ...monitoringBaseParams.hiddenPlayers, required: false })
  hiddenPlayers = '';

  @Param({ ...monitoringBaseParams.updateInterval, required: false })
  updateInterval = 60;

  @Param({ ...monitoringBaseParams.timezoneUtcOffset, required: false })
  timezoneUtcOffset?: string;
}