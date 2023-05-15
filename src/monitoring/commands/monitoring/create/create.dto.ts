import { Choice, Param } from "@discord-nestjs/core";
import { VersionEnum } from "~/monitoring/enums/version.enum";
import { MonitoringBaseDto, monitoringBaseParams } from "../baseDtoParams";

export class CreateDto implements Partial<MonitoringBaseDto> {
  @Param({ ...monitoringBaseParams.serverName, required: true })
  serverName: string;

  @Param({ ...monitoringBaseParams.token, required: true })
  token: string;

  @Choice(VersionEnum)
  @Param({ ...monitoringBaseParams.version, required: true })
  version: VersionEnum;

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