import { Param } from "@discord-nestjs/core";
import { monitoringBaseParams } from "../common";

export class PauseDto {
  @Param(monitoringBaseParams.target)
  target: number;
}