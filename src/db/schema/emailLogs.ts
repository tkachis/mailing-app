import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, text } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

import { pgFunction, pgTrigger } from '../utils';

import { accountEmailsTable } from './accountEmails';
import { companiesTable } from './companies';
import { flowsTable } from './flows';
import { getOnUpdatedAtTrigger, timestamps } from './shared';

export const EMAIL_LOGS_TABLE_NAME = 'email_logs';

export const emailLogsTable = pgTable(EMAIL_LOGS_TABLE_NAME, {
  id: uuid('id').primaryKey().defaultRandom(),
  flowId: uuid('flow_id')
    .notNull()
    .references(() => flowsTable.id, { onDelete: 'cascade' }),
  recipientId: uuid('recipient_id')
    .notNull()
    .references(() => companiesTable.id, { onDelete: 'cascade' }),
  accountEmailId: uuid('account_email_id').references(
    () => accountEmailsTable.id,
    { onDelete: 'set null' },
  ),
  unsubscribeToken: text('unsubscribe_token').notNull(),
  ...timestamps,
});

export const emailLogsRelations = relations(emailLogsTable, ({ one }) => ({
  flow: one(flowsTable, {
    fields: [emailLogsTable.flowId],
    references: [flowsTable.id],
  }),
  recipient: one(companiesTable, {
    fields: [emailLogsTable.recipientId],
    references: [companiesTable.id],
    relationName: 'recipient',
  }),
  accountEmail: one(accountEmailsTable, {
    fields: [emailLogsTable.accountEmailId],
    references: [accountEmailsTable.id],
  }),
}));

export const emailLogSchema = createSelectSchema(emailLogsTable);
export const newEmailLogSchema = createInsertSchema(emailLogsTable).pick({
  flowId: true,
  recipientId: true,
  accountEmailId: true,
  unsubscribeToken: true,
});
export const updateEmailLogSchema = createUpdateSchema(emailLogsTable).pick({
  flowId: true,
  recipientId: true,
  accountEmailId: true,
  unsubscribeToken: true,
});

export type EmailLog = z.infer<typeof emailLogSchema>;
export type NewEmailLog = z.infer<typeof newEmailLogSchema>;
export type UpdateEmailLog = z.infer<typeof updateEmailLogSchema>;

export const onEmailLogsUpdated = getOnUpdatedAtTrigger(
  emailLogsTable,
  EMAIL_LOGS_TABLE_NAME,
);

export const tryRegisterFirstContact = pgFunction(
  'try_register_first_contact',
  {
    returns: 'trigger',
    language: 'plpgsql',
    security: 'definer',
    behavior: 'volatile',
    body: sql`$$
    begin
      insert into public.email_first_contacts (account_email_id, recipient_id)
      values (new.account_email_id, new.recipient_id)
      on conflict do nothing;
      return new;
    end;
    $$`,
  },
);

export const onEmailLogsInsertedRegisterFirst = pgTrigger(
  'on_email_logs_inserted_register_first',
  {
    table: emailLogsTable,
    events: ['insert'],
    triggerType: 'after',
    orientation: 'row',
    function: tryRegisterFirstContact,
  },
);
