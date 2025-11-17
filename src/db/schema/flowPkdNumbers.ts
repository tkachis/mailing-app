import { relations } from 'drizzle-orm';
import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

import { flowsTable } from './flows';
import { pkdNumbersTable } from './pkdNumbers';
import { timestamps, getOnUpdatedAtTrigger } from './shared';

export const FLOW_PKD_NUMBERS_TABLE_NAME = 'flow_pkd_numbers';

export const flowPkdNumbersTable = pgTable(
  FLOW_PKD_NUMBERS_TABLE_NAME,
  {
    flowId: uuid('flow_id')
      .notNull()
      .references(() => flowsTable.id, { onDelete: 'cascade' }),
    pkdId: uuid('pkd_id')
      .notNull()
      .references(() => pkdNumbersTable.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.flowId, t.pkdId] })],
);

export const flowPkdNumbersRelations = relations(
  flowPkdNumbersTable,
  ({ one }) => ({
    flow: one(flowsTable, {
      fields: [flowPkdNumbersTable.flowId],
      references: [flowsTable.id],
    }),
    pkdNumber: one(pkdNumbersTable, {
      fields: [flowPkdNumbersTable.pkdId],
      references: [pkdNumbersTable.id],
    }),
  }),
);

export const flowPkdNumberSchema = createSelectSchema(flowPkdNumbersTable);
export const newFlowPkdNumberSchema = createInsertSchema(
  flowPkdNumbersTable,
).pick({
  flowId: true,
  pkdId: true,
});
export const updateFlowPkdNumberSchema = createUpdateSchema(
  flowPkdNumbersTable,
).pick({
  flowId: true,
  pkdId: true,
});

export type FlowPkdNumber = z.infer<typeof flowPkdNumberSchema>;
export type NewFlowPkdNumber = z.infer<typeof newFlowPkdNumberSchema>;
export type UpdateFlowPkdNumber = z.infer<typeof updateFlowPkdNumberSchema>;

export const onFlowPkdNumbersUpdated = getOnUpdatedAtTrigger(
  flowPkdNumbersTable,
  FLOW_PKD_NUMBERS_TABLE_NAME,
);
