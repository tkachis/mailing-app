import { db } from 'src/services';

import { suppressionListTable, type NewSuppression } from '../schema';

class SuppressionListRepository {
  async getSuppressedPairs(): Promise<Set<string>> {
    const rows = await db
      .select({
        accountEmailId: suppressionListTable.accountEmailId,
        companyId: suppressionListTable.companyId,
      })
      .from(suppressionListTable);

    return new Set(rows.map((r) => `${r.accountEmailId}:${r.companyId}`));
  }

  async add(data: NewSuppression): Promise<void> {
    await db.insert(suppressionListTable).values(data).onConflictDoNothing(); // If pair already exists, do nothing
  }
}

const suppressionListRepository = new SuppressionListRepository();

export default suppressionListRepository;
