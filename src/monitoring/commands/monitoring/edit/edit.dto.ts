import { Param } from "@discord-nestjs/core";
import { MonitoringBaseDto, monitoringBaseParams } from "../common";

type PartialMonitoringBaseDtoWithTargerType = Partial<MonitoringBaseDto> & { target: number }

export class EditDto implements PartialMonitoringBaseDtoWithTargerType {
  @Param(monitoringBaseParams.target)
  target: number;

  @Param({ ...monitoringBaseParams.serverName, required: false })
  serverName?: string;

  @Param({ ...monitoringBaseParams.token, required: false })
  token?: string;

  @Param({ ...monitoringBaseParams.address, required: false })
  address?: string;

  @Param({ ...monitoringBaseParams.restartStartCron, required: false })
  restartStartCron?: string;

  @Param({ ...monitoringBaseParams.backupStartCron, required: false })
  backupStartCron?: string;

  @Param({ ...monitoringBaseParams.backupDurationTime, required: false })
  backupDurationTime?: number;

  @Param({ ...monitoringBaseParams.hiddenPlayers, required: false })
  hiddenPlayers?: string;

  @Param({ ...monitoringBaseParams.updateInterval, required: false })
  updateInterval?: number;

  @Param({ ...monitoringBaseParams.timezoneUtcOffset, required: false })
  timezoneUtcOffset?: string;
}