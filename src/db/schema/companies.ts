import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

import { companyPkdNumbersTable } from './companyPkdNumbers';
import { emailLogsTable } from './emailLogs';
import { getOnUpdatedAtTrigger, timestamps } from './shared';
import { suppressionListTable } from './suppressionList';

export const COMPANIES_TABLE_NAME = 'companies';

export const companiesTable = pgTable(COMPANIES_TABLE_NAME, {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  krsNumber: text('krs_number').notNull().unique(),
  registrationDate: timestamp('registration_date', {
    withTimezone: true,
  }).notNull(),
  email: text('email'),
  dataJson: jsonb('data_json'),
  uniqueSendersCount: integer('unique_senders_count').notNull().default(0),
  ...timestamps,
});

export const companiesRelations = relations(companiesTable, ({ many }) => ({
  pkdNumbers: many(companyPkdNumbersTable),
  suppressions: many(suppressionListTable),
  asRecipientInLogs: many(emailLogsTable, { relationName: 'recipient' }),
}));

const companyPkdNumbersSchema = z
  .array(
    z.object({
      pkdNumber: z.string(),
      name: z.string(),
    }),
  )
  .optional();

export const companySchema = createSelectSchema(companiesTable);
export const newCompanySchema = createInsertSchema(companiesTable)
  .pick({
    name: true,
    email: true,
    dataJson: true,
    krsNumber: true,
    registrationDate: true,
  })
  .and(
    z.object({
      pkdNumbers: companyPkdNumbersSchema,
    }),
  );
export const updateCompanySchema = createUpdateSchema(companiesTable)
  .pick({
    name: true,
    email: true,
    dataJson: true,
    krsNumber: true,
    registrationDate: true,
  })
  .and(
    z.object({
      pkdNumbers: companyPkdNumbersSchema,
    }),
  );

export type Company = z.infer<typeof companySchema>;
export type NewCompany = z.infer<typeof newCompanySchema>;
export type UpdateCompany = z.infer<typeof updateCompanySchema>;

export const onCompaniesUpdated = getOnUpdatedAtTrigger(
  companiesTable,
  COMPANIES_TABLE_NAME,
);
