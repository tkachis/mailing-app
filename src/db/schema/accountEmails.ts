import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  uuid,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

import { pgFunction, pgTrigger } from '../utils';

import { accountsTable } from './accounts';
import { emailLogsTable } from './emailLogs';
import { flowsTable } from './flows';
import { getOnUpdatedAtTrigger, timestamps } from './shared';

export const ACCOUNT_EMAILS_TABLE_NAME = 'account_emails';

export const emailProviderTypeEnum = pgEnum('email_provider_type', ['gmail']);

export const accountEmailsTable = pgTable(
  ACCOUNT_EMAILS_TABLE_NAME,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accountsTable.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    providerType: emailProviderTypeEnum('provider_type')
      .notNull()
      .default('gmail'),
    googleRefreshToken: text('google_refresh_token'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => [
    // Unique constraint: one email can only belong to one account
    uniqueIndex('uq_account_emails_email').on(t.email),
    // Index for fast email lookup by account
    index('idx_account_emails_account_id').on(t.accountId),
  ],
);

// Relations
export const accountEmailsTableRelations = relations(
  accountEmailsTable,
  ({ one, many }) => ({
    account: one(accountsTable, {
      fields: [accountEmailsTable.accountId],
      references: [accountsTable.id],
    }),
    flows: many(flowsTable),
    sentEmailLogs: many(emailLogsTable),
  }),
);

// Schemas
export const accountEmailSchema = createSelectSchema(accountEmailsTable);
export const newAccountEmailSchema = createInsertSchema(
  accountEmailsTable,
).pick({
  accountId: true,
  email: true,
  providerType: true,
  googleRefreshToken: true,
  isActive: true,
  isVerified: true,
});
export const updateAccountEmailSchema = createUpdateSchema(
  accountEmailsTable,
).pick({
  email: true,
  googleRefreshToken: true,
  isActive: true,
  isVerified: true,
});

export type AccountEmail = z.infer<typeof accountEmailSchema>;
export type NewAccountEmail = z.infer<typeof newAccountEmailSchema>;
export type UpdateAccountEmail = z.infer<typeof updateAccountEmailSchema>;

// Function to deactivate flows when account email is deactivated or deleted
export const deactivateFlowsOnAccountEmailDeactivation = pgFunction(
  'deactivate_flows_on_account_email_deactivation',
  {
    returns: 'trigger',
    language: 'plpgsql',
    security: 'definer',
    behavior: 'volatile',
    body: sql`$$
      begin
        -- Check if isActive changed from true to false (update case)
        if TG_OP = 'UPDATE' and old.is_active = true and new.is_active = false then
          -- Deactivate all flows that use this account email
          update public.flows
          set is_active = false
          where account_email_id = new.id;
        end if;
        
        -- Handle delete case - deactivate flows before deletion
        if TG_OP = 'DELETE' then
          -- Deactivate all flows that use this account email
          update public.flows
          set is_active = false
          where account_email_id = old.id;
          
          return old;
        end if;
        
        return new;
      end;
      $$`,
  },
);

// Trigger to deactivate flows when account email is deactivated or deleted
export const onAccountEmailDeactivated = pgTrigger(
  'on_account_email_deactivated',
  {
    table: accountEmailsTable,
    events: ['update', 'delete'],
    triggerType: 'before',
    orientation: 'row',
    function: deactivateFlowsOnAccountEmailDeactivation,
  },
);

export const onAccountEmailsUpdated = getOnUpdatedAtTrigger(
  accountEmailsTable,
  ACCOUNT_EMAILS_TABLE_NAME,
);
