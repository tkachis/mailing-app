import { eq } from 'drizzle-orm';

import { db } from 'src/services';

import {
  accountEmailsTable,
  type NewAccountEmail,
  type UpdateAccountEmail,
} from '../schema';

class AccountEmailsRepository {
  async getById(id: string) {
    const accountEmail = await db.query.accountEmailsTable.findFirst({
      where: eq(accountEmailsTable.id, id),
    });

    return accountEmail;
  }

  async getByAccountId(accountId: string) {
    const accountEmails = await db.query.accountEmailsTable.findMany({
      where: eq(accountEmailsTable.accountId, accountId),
      orderBy: (accountEmails, { desc }) => [desc(accountEmails.createdAt)],
    });

    return accountEmails;
  }

  async getActiveByAccountId(accountId: string) {
    const accountEmails = await db.query.accountEmailsTable.findMany({
      where: (accountEmails, { eq, and }) =>
        and(
          eq(accountEmails.accountId, accountId),
          eq(accountEmails.isActive, true),
        ),
      orderBy: (accountEmails, { desc }) => [desc(accountEmails.createdAt)],
    });

    return accountEmails;
  }

  async getByEmail(email: string) {
    const accountEmail = await db.query.accountEmailsTable.findFirst({
      where: eq(accountEmailsTable.email, email),
    });

    return accountEmail;
  }

  async create(data: NewAccountEmail) {
    return db.insert(accountEmailsTable).values(data).returning();
  }

  async update(id: string, data: UpdateAccountEmail) {
    const [updatedAccountEmail] = await db
      .update(accountEmailsTable)
      .set(data)
      .where(eq(accountEmailsTable.id, id))
      .returning();

    return updatedAccountEmail;
  }

  async delete(id: string) {
    return db.delete(accountEmailsTable).where(eq(accountEmailsTable.id, id));
  }
}

const accountEmailsRepository = new AccountEmailsRepository();

export default accountEmailsRepository;
