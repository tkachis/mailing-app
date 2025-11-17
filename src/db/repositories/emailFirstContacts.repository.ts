// repositories/emailFirstContacts.repository.ts
import { db } from 'src/services';

import { emailFirstContactsTable } from '../schema';

class EmailFirstContactsRepository {
  async getExistingPairs(): Promise<Set<string>> {
    const rows = await db
      .select({
        accountEmailId: emailFirstContactsTable.accountEmailId,
        companyId: emailFirstContactsTable.recipientId,
      })
      .from(emailFirstContactsTable);

    return new Set(rows.map((r) => `${r.accountEmailId}:${r.companyId}`));
  }
}

const emailFirstContactsRepository = new EmailFirstContactsRepository();

export default emailFirstContactsRepository;
