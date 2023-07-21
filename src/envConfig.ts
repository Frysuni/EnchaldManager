import { config } from 'dotenv';
import { from } from 'env-var';
import { resolve } from 'node:path';
import { DataSourceOptions } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

config({ path: resolve(process.cwd(), '.env') });

const env = from(process.env);

const main = {
  token: env.get('TOKEN').required().asString(),
  logChannelId: env.get('LOG_CHANNEL_ID').asString(),
  devMode: env.get('NODE_ENV').asString() === 'dev',
  guildId: env.get('GUILD_ID').required().asString(),
};

const database: DataSourceOptions = {
  type: env.get('DB_TYPE').required().asString() as MysqlConnectionOptions['type'],
  host: env.get('DB_HOST').required().asString(),
  port: env.get('DB_PORT').required().asPortNumber(),
  username: env.get('DB_USER').required().asString(),
  password: env.get('DB_PASS').required().asString(),
  database: env.get('DB_DATABASE').required().asString(),
};

export default { ...main, database };