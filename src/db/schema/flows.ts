import { relations } from 'drizzle-orm';
import { pgTable, text, uuid, boolean } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

import { accountEmailsTable } from './accountEmails';
import { accountsTable } from './accounts';
import { emailLogsTable } from './emailLogs';
import { flowPkdNumbersTable } from './flowPkdNumbers';
import { getOnUpdatedAtTrigger, timestamps } from './shared';

export const FLOWS_TABLE_NAME = 'flows';

export const flowsTable = pgTable(FLOWS_TABLE_NAME, {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accountsTable.id, { onDelete: 'cascade' }),
  accountEmailId: uuid('account_email_id').references(
    () => accountEmailsTable.id,
    { onDelete: 'set null' },
  ),
  name: text('name').notNull(),
  emailTemplateHtml: text('email_template_html').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

export const flowsRelations = relations(flowsTable, ({ many, one }) => ({
  account: one(accountsTable, {
    fields: [flowsTable.accountId],
    references: [accountsTable.id],
  }),
  accountEmail: one(accountEmailsTable, {
    fields: [flowsTable.accountEmailId],
    references: [accountEmailsTable.id],
  }),
  pkdNumbers: many(flowPkdNumbersTable),
  emailLogs: many(emailLogsTable),
}));

export const flowPkdNumbersSchema = z
  .array(
    z
      .object({
        pkdNumber: z.string(),
        name: z.string(),
      })
      .or(
        z.object({
          id: z.string(),
        }),
      ),
  )
  .optional();

export const flowSchema = createSelectSchema(flowsTable);
export const newFlowSchema = createInsertSchema(flowsTable)
  .pick({
    name: true,
    isActive: true,
    accountId: true,
    accountEmailId: true,
    emailTemplateHtml: true,
  })
  .and(
    z.object({
      pkdNumbers: flowPkdNumbersSchema,
    }),
  );
export const updateFlowSchema = createUpdateSchema(flowsTable)
  .pick({
    name: true,
    isActive: true,
    accountId: true,
    accountEmailId: true,
    emailTemplateHtml: true,
  })
  .and(
    z.object({
      pkdNumbers: flowPkdNumbersSchema,
    }),
  );

export type Flow = z.infer<typeof flowSchema>;
export type NewFlow = z.infer<typeof newFlowSchema>;
export type UpdateFlow = z.infer<typeof updateFlowSchema>;

export const onFlowsUpdated = getOnUpdatedAtTrigger(
  flowsTable,
  FLOWS_TABLE_NAME,
);
