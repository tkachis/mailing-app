import { eq } from 'drizzle-orm';

import { db } from 'src/services';

import { accountsTable, type UpdateAccount } from '../schema';

class AccountsRepository {
  async getById(id: string) {
    const account = await db.query.accountsTable.findFirst({
      where: eq(accountsTable.id, id),
    });

    return account;
  }

  async update(id: string, data: UpdateAccount) {
    return db.update(accountsTable).set(data).where(eq(accountsTable.id, id));
  }
}

const accountsRepository = new AccountsRepository();

export default accountsRepository;
