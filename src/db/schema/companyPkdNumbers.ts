import { relations } from 'drizzle-orm';
import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

import { companiesTable } from './companies';
import { pkdNumbersTable } from './pkdNumbers';
import { timestamps, getOnUpdatedAtTrigger } from './shared';

export const COMPANY_PKD_NUMBERS_TABLE_NAME = 'company_pkd_numbers';

export const companyPkdNumbersTable = pgTable(
  COMPANY_PKD_NUMBERS_TABLE_NAME,
  {
    companyId: uuid('company_id')
      .notNull()
      .references(() => companiesTable.id, { onDelete: 'cascade' }),
    pkdId: uuid('pkd_id')
      .notNull()
      .references(() => pkdNumbersTable.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.companyId, t.pkdId] })],
);

export const companyPkdNumbersRelations = relations(
  companyPkdNumbersTable,
  ({ one }) => ({
    company: one(companiesTable, {
      fields: [companyPkdNumbersTable.companyId],
      references: [companiesTable.id],
    }),
    pkdNumber: one(pkdNumbersTable, {
      fields: [companyPkdNumbersTable.pkdId],
      references: [pkdNumbersTable.id],
    }),
  }),
);

export const companyPkdNumberSchema = createSelectSchema(
  companyPkdNumbersTable,
);
export const newCompanyPkdNumberSchema = createInsertSchema(
  companyPkdNumbersTable,
).pick({
  companyId: true,
  pkdId: true,
});
export const updateCompanyPkdNumberSchema = createUpdateSchema(
  companyPkdNumbersTable,
).pick({
  companyId: true,
  pkdId: true,
});

export type CompanyPkdNumber = z.infer<typeof companyPkdNumberSchema>;
export type NewCompanyPkdNumber = z.infer<typeof newCompanyPkdNumberSchema>;
export type UpdateCompanyPkdNumber = z.infer<
  typeof updateCompanyPkdNumberSchema
>;

export const onCompanyPkdNumbersUpdated = getOnUpdatedAtTrigger(
  companyPkdNumbersTable,
  COMPANY_PKD_NUMBERS_TABLE_NAME,
);
