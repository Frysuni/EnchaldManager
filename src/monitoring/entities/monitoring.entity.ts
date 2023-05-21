import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('monitoring')
export class MonitoringEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  serverName: string;

  @Column()
  token: string;

  @Column()
  address: string;

  @Column()
  port: number;

  @Column()
  restartStartCron: string;

  @Column()
  backupStartCron: string;

  @Column()
  backupDurationTime: number;

  @Column()
  hiddenPlayers: string;

  @Column()
  updateInterval: number;

  @Column()
  timezoneUtcOffset: number;

  @Column()
  timezone: string;

  @Column()
  channelId: string;

  @Column({ nullable: true })
  messageId?: string;

  @Column({ default: false })
  confirmed: boolean;

  @Column({ nullable: true })
  lastOnline: number;

  @Column({ default: false })
  paused: boolean;
}