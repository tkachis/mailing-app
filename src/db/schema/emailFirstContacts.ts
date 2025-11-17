// schema/emailFirstContacts.ts
import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

import { pgFunction, pgTrigger } from '../utils';

import { accountEmailsTable } from './accountEmails';
import { companiesTable } from './companies';
import { getOnUpdatedAtTrigger, timestamps } from './shared';

export const EMAIL_FIRST_CONTACTS_TABLE_NAME = 'email_first_contacts';

export const emailFirstContactsTable = pgTable(
  EMAIL_FIRST_CONTACTS_TABLE_NAME,
  {
    accountEmailId: uuid('account_email_id')
      .notNull()
      .references(() => accountEmailsTable.id, { onDelete: 'cascade' }),
    recipientId: uuid('recipient_id')
      .notNull()
      .references(() => companiesTable.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.accountEmailId, t.recipientId] })],
);

// Relations
export const emailFirstContactsRelations = relations(
  emailFirstContactsTable,
  ({ one }) => ({
    accountEmail: one(accountEmailsTable, {
      fields: [emailFirstContactsTable.accountEmailId],
      references: [accountEmailsTable.id],
    }),
    recipient: one(companiesTable, {
      fields: [emailFirstContactsTable.recipientId],
      references: [companiesTable.id],
    }),
  }),
);

// Schemas
export const emailFirstContactSchema = createSelectSchema(
  emailFirstContactsTable,
);
export const newEmailFirstContactSchema = createInsertSchema(
  emailFirstContactsTable,
).pick({
  accountEmailId: true,
  recipientId: true,
});
export const updateEmailFirstContactSchema = createUpdateSchema(
  emailFirstContactsTable,
).pick({
  accountEmailId: true,
  recipientId: true,
});

export type EmailFirstContact = z.infer<typeof emailFirstContactSchema>;
export type NewEmailFirstContact = z.infer<typeof newEmailFirstContactSchema>;
export type UpdateEmailFirstContact = z.infer<
  typeof updateEmailFirstContactSchema
>;

export const onEmailFirstContactsUpdated = getOnUpdatedAtTrigger(
  emailFirstContactsTable,
  EMAIL_FIRST_CONTACTS_TABLE_NAME,
);

export const bumpCompanyUniqueSendersCount = pgFunction(
  'bump_company_unique_senders_count',
  {
    returns: 'trigger',
    language: 'plpgsql',
    security: 'definer',
    behavior: 'volatile',
    body: sql`$$
      begin
        update public.companies
        set unique_senders_count = unique_senders_count + 1
        where id = new.recipient_id;
        return new;
      end;
    $$`,
  },
);

export const onEmailFirstContactsInserted = pgTrigger(
  'on_email_first_contacts_inserted',
  {
    table: emailFirstContactsTable,
    events: ['insert'],
    triggerType: 'after',
    orientation: 'row',
    function: bumpCompanyUniqueSendersCount,
  },
);
