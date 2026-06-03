import { registerAs } from '@nestjs/config';
import { databaseConfig } from './database.config';

export default registerAs('typeorm', () => ({
  ...databaseConfig,
}));
