import { relations } from 'drizzle-orm';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm/sql';
import { authUsers } from 'drizzle-orm/supabase';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

import { pgFunction, pgTrigger } from '../utils';

import { accountEmailsTable } from './accountEmails';
import { emailLogsTable } from './emailLogs';
import { flowsTable } from './flows';
import { getOnUpdatedAtTrigger, timestamps } from './shared';
import { suppressionListTable } from './suppressionList';

export const ACCOUNTS_TABLE_NAME = 'accounts';

export const accountsTable = pgTable(ACCOUNTS_TABLE_NAME, {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsers.id)
    .notNull(),
  email: text('email').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  ...timestamps,
});

// Relations
export const accountsTableRelations = relations(
  accountsTable,
  ({ one, many }) => ({
    authUser: one(authUsers, {
      fields: [accountsTable.id],
      references: [authUsers.id],
    }),
    accountEmails: many(accountEmailsTable),
    flows: many(flowsTable),
    sentEmailLogs: many(emailLogsTable),
    suppressions: many(suppressionListTable),
  }),
);

// Schemas
export const accountSchema = createSelectSchema(accountsTable);
export const newAccountSchema = createInsertSchema(accountsTable).pick({
  email: true,
});
export const updateAccountSchema = createUpdateSchema(accountsTable).pick({
  email: true,
  stripeCustomerId: true,
});

export type Account = z.infer<typeof accountSchema>;
export type NewAccount = z.infer<typeof newAccountSchema>;
export type UpdateAccount = z.infer<typeof updateAccountSchema>;

// Triggers and Functions
export const handleNewUser = pgFunction('handle_new_user', {
  returns: 'trigger',
  language: 'plpgsql',
  security: 'definer',
  behavior: 'volatile',
  searchPath: '',
  body: sql`$$
    begin
      insert into public.accounts (id, email)
      values (new.id, new.email);
      return new;
    end;
    $$`,
});

export const onAuthUserCreated = pgTrigger('on_auth_user_created', {
  table: authUsers,
  events: ['insert'],
  triggerType: 'after',
  orientation: 'row',
  function: handleNewUser,
});

export const onAccountsUpdated = getOnUpdatedAtTrigger(
  accountsTable,
  ACCOUNTS_TABLE_NAME,
);
