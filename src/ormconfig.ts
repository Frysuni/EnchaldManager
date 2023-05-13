import envConfig from '@env';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist';
import { resolve } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

const ormConfig: DataSourceOptions & TypeOrmModuleOptions = {
  ...envConfig.database,
  autoLoadEntities: true,
  timezone: 'Z',
  synchronize: process.env['NODE_ENV'] === 'dev',
  entities: [ resolve(__dirname, './**/*.entity.{ts,js}') ],
};

export default ormConfig;

export const dataSource = new DataSource(ormConfig);