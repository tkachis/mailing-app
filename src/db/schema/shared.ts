import { sql } from 'drizzle-orm';
import { PgTable, timestamp } from 'drizzle-orm/pg-core';

import { pgFunction, pgTrigger } from '../utils';

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
} as const;

// Universal function to update updated_at timestamp
export const updateUpdatedAt = pgFunction('update_updated_at', {
  returns: 'trigger',
  language: 'plpgsql',
  security: 'definer',
  behavior: 'volatile',
  body: sql`$$
    begin
      new.updated_at = now();
      return new;
    end;
    $$`,
});

export const getOnUpdatedAtTrigger = (table: PgTable, tableName: string) =>
  pgTrigger(`on_${tableName}_updated`, {
    table,
    events: ['update'],
    triggerType: 'before',
    orientation: 'row',
    function: updateUpdatedAt,
  });
