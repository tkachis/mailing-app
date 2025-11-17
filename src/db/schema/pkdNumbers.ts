import { relations } from 'drizzle-orm';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

import { companyPkdNumbersTable } from './companyPkdNumbers';
import { flowPkdNumbersTable } from './flowPkdNumbers';
import { getOnUpdatedAtTrigger, timestamps } from './shared';

export const PKD_NUMBERS_TABLE_NAME = 'pkd_numbers';

export const pkdNumbersTable = pgTable(PKD_NUMBERS_TABLE_NAME, {
  id: uuid('id').primaryKey().defaultRandom(),
  pkdNumber: text('pkd_number').notNull().unique(),
  name: text('name').notNull(),
  ...timestamps,
});

export const pkdNumbersRelations = relations(pkdNumbersTable, ({ many }) => ({
  companyLinks: many(companyPkdNumbersTable),
  flowLinks: many(flowPkdNumbersTable),
}));

export const pkdNumberSchema = createSelectSchema(pkdNumbersTable);
export const newPkdNumberSchema = createInsertSchema(pkdNumbersTable).pick({
  name: true,
  pkdNumber: true,
});
export const updatePkdNumberSchema = createUpdateSchema(pkdNumbersTable).pick({
  name: true,
  pkdNumber: true,
});

export type PkdNumber = z.infer<typeof pkdNumberSchema>;
export type NewPkdNumber = z.infer<typeof newPkdNumberSchema>;
export type UpdatePkdNumber = z.infer<typeof updatePkdNumberSchema>;

export const onPkdNumbersUpdated = getOnUpdatedAtTrigger(
  pkdNumbersTable,
  PKD_NUMBERS_TABLE_NAME,
);
