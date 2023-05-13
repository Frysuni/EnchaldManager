import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { VersionEnum } from "../enums/version.enum";

@Entity('monitoring')
export class MonitoringEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  serverName: string;

  @Column()
  color: number;

  @Column()
  token: string;

  @Column()
  version: VersionEnum;

  @Column()
  address: string;

  @Column()
  port: number;

  @Column()
  channelId: string;

  @Column({ nullable: true })
  messageId: string;

  @Column()
  backupTime: string;

  @Column()
  restartTime: string;

  @Column()
  hiddenPlayers: string;

  @Column()
  updateInterval: number;

  @Column({ default: false })
  confirmed: boolean;

  @Column({ nullable: true })
  lastOnline: number;
}