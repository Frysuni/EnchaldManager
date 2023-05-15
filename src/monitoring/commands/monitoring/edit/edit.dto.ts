import { Choice, Param, ParamType } from "@discord-nestjs/core";
import { VersionEnum } from "~/monitoring/enums/version.enum";
import { MonitoringBaseDto, monitoringBaseParams } from "../baseDtoParams";

type PartialMonitoringBaseDtoWithTargerType = Partial<MonitoringBaseDto> & { target: number }

export class EditDto implements PartialMonitoringBaseDtoWithTargerType {
  @Param({
    name: 'target',
    nameLocalizations: { ru: 'цель' },
    description: 'The target name of the monitoring server.',
    descriptionLocalizations: { ru: 'Целевое имя сервера мониторинга.' },
    autocomplete: true,
    minValue: 1,
    required: true,
    type: ParamType.NUMBER,
  })
  target: number;

  @Param({ ...monitoringBaseParams.serverName, required: false })
  serverName?: string;

  @Param({ ...monitoringBaseParams.token, required: false })
  token?: string;

  @Choice(VersionEnum)
  @Param({ ...monitoringBaseParams.version, required: false })
  version?: VersionEnum;

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