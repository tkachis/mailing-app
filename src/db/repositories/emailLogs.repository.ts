import { db } from 'src/services';

import { emailLogsTable, NewEmailLog } from '../schema';

class EmailLogsRepository {
  async create(log: NewEmailLog) {
    return db.insert(emailLogsTable).values(log).returning();
  }
}

const emailLogsRepository = new EmailLogsRepository();

export default emailLogsRepository;
