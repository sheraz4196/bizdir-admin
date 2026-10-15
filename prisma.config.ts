import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
config({ path: ['.env.local', '.env', 'bizdir/.env.local', 'bizdir/.env'], quiet: true });
export default defineConfig({
  schema: 'prisma/schema',
  datasource: { url: process.env.DATABASE_URL }
});
