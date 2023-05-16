import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

@Injectable()
export class StorageProvider {
  private readonly pathToStore: string = resolve(__dirname, '../', '../', 'getAdminStore');

  constructor() {
    if (!existsSync(this.pathToStore)) writeFileSync(this.pathToStore, '[]');
  }

  getData(): DataType
  getData(filter: FilterType): DataUnitType | null
  getData(filter?: FilterType): DataType | DataUnitType | null {
    const data = JSON.parse(readFileSync(this.pathToStore).toString()) as DataType;
    if (!filter) return data;

    for (const unit of data) {
      if (
        filter.channelId  === unit.channelId  &&
        filter.messageId  === unit.messageId  &&
        (filter.emoji.name ?? undefined) === unit.emoji.name &&
        (filter.emoji.id ?? undefined) === unit.emoji.id
      ) return unit;
    }

    return null;
  }

  appendData(unit: DataUnitType) {
    const data = this.getData();
    data.push(unit);
    writeFileSync(this.pathToStore, JSON.stringify(data));
  }
}

type FilterType = Omit<DataUnitType, 'roleId'>
type DataUnitType = { messageId: string, channelId: string, roleId: string, emoji: { id?: string, name?: string } };
type DataType = Array<DataUnitType>;