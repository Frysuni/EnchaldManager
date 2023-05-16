import { Param } from "@discord-nestjs/core";
import { monitoringBaseParams } from "../common";

export class DeleteDto {
  @Param(monitoringBaseParams.target)
  target: number;
}