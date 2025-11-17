import { sql } from 'drizzle-orm';

import db from 'src/services/db.service';

import { NewPkdNumber, pkdNumbersTable } from '../schema';

import type { DbClient } from '../types';

class PkdNumbersRepository {
  private getClient(client?: DbClient) {
    return client ?? db;
  }

  async upsertPkdNumbers(
    codes: NewPkdNumber[],
    client?: DbClient,
  ): Promise<string[]> {
    if (!codes?.length) return [];

    const cx = this.getClient(client);

    const rows = await cx
      .insert(pkdNumbersTable)
      .values(codes)
      .onConflictDoUpdate({
        target: [pkdNumbersTable.pkdNumber],
        set: {
          name: sql`EXCLUDED.name`,
        },
      })
      .returning({ id: pkdNumbersTable.id });

    return rows.map((r) => r.id);
  }
}

const pkdNumbersRepository = new PkdNumbersRepository();

export default pkdNumbersRepository;
