import { relations } from 'drizzle-orm';
import { pgTable, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

import { accountEmailsTable } from './accountEmails';
import { companiesTable } from './companies';
import { getOnUpdatedAtTrigger, timestamps } from './shared';

export const SUPPRESSION_TABLE_NAME = 'suppression_list';

export const suppressionListTable = pgTable(
  SUPPRESSION_TABLE_NAME,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountEmailId: uuid('account_email_id')
      .notNull()
      .references(() => accountEmailsTable.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companiesTable.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('uq_suppression_per_email').on(t.accountEmailId, t.companyId),
  ],
);

export const suppressionListRelations = relations(
  suppressionListTable,
  ({ one }) => ({
    accountEmail: one(accountEmailsTable, {
      fields: [suppressionListTable.accountEmailId],
      references: [accountEmailsTable.id],
    }),
    company: one(companiesTable, {
      fields: [suppressionListTable.companyId],
      references: [companiesTable.id],
    }),
  }),
);

export const suppressionSchema = createSelectSchema(suppressionListTable);
export const newSuppressionSchema = createInsertSchema(
  suppressionListTable,
).pick({
  accountEmailId: true,
  companyId: true,
});
export const updateSuppressionSchema = createUpdateSchema(
  suppressionListTable,
).pick({
  accountEmailId: true,
  companyId: true,
});

export type Suppression = z.infer<typeof suppressionSchema>;
export type NewSuppression = z.infer<typeof newSuppressionSchema>;
export type UpdateSuppression = z.infer<typeof updateSuppressionSchema>;

export const onSuppressionListUpdated = getOnUpdatedAtTrigger(
  suppressionListTable,
  SUPPRESSION_TABLE_NAME,
);
