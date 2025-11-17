import { defineConfig } from 'drizzle-kit';

const drizzleConfig = defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEXT_DATABASE_URL!,
  },
  verbose: true,
  schemaFilter: ['public'],
  migrations: {
    schema: 'drizzle',
    table: 'migrations',
  },
});

export default drizzleConfig;
