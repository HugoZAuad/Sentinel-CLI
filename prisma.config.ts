import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in environment variables.');
}

export default defineConfig({
  engine: 'classic',
  datasource: {
    url: databaseUrl,
  },
});
