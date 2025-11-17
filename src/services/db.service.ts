import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../db/schema';

export const pgClient = postgres(process.env.NEXT_DATABASE_URL!, {
  prepare: false,
});

const db = drizzle(pgClient, { schema });

export default db;
