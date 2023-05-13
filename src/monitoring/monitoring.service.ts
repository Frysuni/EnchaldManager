import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, DeleteResult, Repository, UpdateResult } from "typeorm";
import { MonitoringEntity } from "./entities/monitoring.entity";
import { MonitoringRecordStatusEnum } from "./enums/monitoringRecordStatus.enum";
import { MonitoringNode } from "./monitoring.node";
import { MonitoringStatuses } from "./monitoring.statuses";

@Injectable()
export class MonitoringService {
  private readonly monitoringNodes = new Set<MonitoringNode>();

  constructor(
    @InjectRepository(MonitoringEntity) private readonly monitoringRepository: Repository<MonitoringEntity>,
    private readonly monitoringStatuses: MonitoringStatuses,
  ) {
    this.monitoringRepository.find().then(monitorings => {
      monitorings.forEach(monitoring => monitoring.confirmed ? this.initNode(monitoring.id) : null)
    })
  }


  public createMonitoring(data: DeepPartial<MonitoringEntity>): Promise<MonitoringEntity> {
    return this.monitoringRepository.save(data);
  }
  public async confirmMonitring(id: number, messageId: string): Promise<UpdateResult> {
    const updateResult = await this.monitoringRepository.update({ id }, { confirmed: true, messageId });
    this.initNode(id);
    return updateResult;
  }
  public cancelMonitoring(id: number): Promise<DeleteResult> {
    return this.monitoringRepository.delete({ id });
  }
  public async getMonitoringRecordStatus(id: number): Promise<MonitoringRecordStatusEnum> {
    const record = await this.monitoringRepository.findOne({ where: { id } });
    if (!record) return MonitoringRecordStatusEnum.Cancelled;
    if (record.confirmed) return MonitoringRecordStatusEnum.Confirmed;
    return MonitoringRecordStatusEnum.Pending;
  }

  private initNode(id: number): any {
    const monitroingNode = new MonitoringNode(this.monitoringStatuses, this.monitoringRepository, id);
    this.monitoringNodes.add(monitroingNode);
  } 
  
}