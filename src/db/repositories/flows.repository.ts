import { and, eq, inArray, notInArray } from 'drizzle-orm';

import { db } from 'src/services';

import {
  flowPkdNumbersTable,
  flowsTable,
  NewFlow,
  NewPkdNumber,
  UpdateFlow,
} from '../schema';
import { DbClient } from '../types';

import pkdNumbersRepository from './pkdNumbers.repository';

class FlowsRepository {
  private getClient(client?: DbClient) {
    return client ?? db;
  }

  private async processPkdNumbers(
    pkdNumbers: Array<{ pkdNumber: string; name: string } | { id: string }>,
    client?: DbClient,
  ): Promise<string[]> {
    const existingIds: string[] = [];
    const newPkdNumbers: Array<{ pkdNumber: string; name: string }> = [];

    pkdNumbers.forEach((item) => {
      if ('id' in item) {
        existingIds.push(item.id);
      } else {
        newPkdNumbers.push(item);
      }
    });

    let createdIds: string[] = [];
    if (newPkdNumbers.length > 0) {
      createdIds = await pkdNumbersRepository.upsertPkdNumbers(
        newPkdNumbers,
        client,
      );
    }

    return [...existingIds, ...createdIds];
  }

  async linkPkd(flowId: string, pkdIds: string[], client?: DbClient) {
    if (!pkdIds.length) return;

    const cx = this.getClient(client);

    await cx
      .insert(flowPkdNumbersTable)
      .values(pkdIds.map((pkdId) => ({ flowId, pkdId })))
      .onConflictDoNothing();
  }

  async setPkdNumbers(flowId: string, pkdIds: string[], client?: DbClient) {
    const cx = this.getClient(client);

    if (!pkdIds.length) {
      await cx
        .delete(flowPkdNumbersTable)
        .where(eq(flowPkdNumbersTable.flowId, flowId));
    } else {
      await cx
        .delete(flowPkdNumbersTable)
        .where(
          and(
            eq(flowPkdNumbersTable.flowId, flowId),
            notInArray(flowPkdNumbersTable.pkdId, pkdIds),
          ),
        );
      await cx
        .insert(flowPkdNumbersTable)
        .values(pkdIds.map((pkdId) => ({ flowId, pkdId })))
        .onConflictDoNothing();
    }
  }

  async create(input: NewFlow) {
    return db.transaction(async (tx) => {
      const { pkdNumbers, ...rest } = input;

      const [flow] = await tx.insert(flowsTable).values(rest).returning();

      if (pkdNumbers?.length) {
        const allPkdIds = await this.processPkdNumbers(pkdNumbers, tx);
        if (allPkdIds.length > 0) {
          await this.setPkdNumbers(flow.id, allPkdIds, tx);
        }
      }

      return flow;
    });
  }

  async update(flowId: string, input: UpdateFlow) {
    return db.transaction(async (tx) => {
      const { pkdNumbers, ...rest } = input;
      await tx.update(flowsTable).set(rest).where(eq(flowsTable.id, flowId));

      if (pkdNumbers && pkdNumbers.length > 0) {
        const allPkdIds = await this.processPkdNumbers(pkdNumbers, tx);
        if (allPkdIds.length > 0) {
          await this.setPkdNumbers(flowId, allPkdIds, tx);
        }
      }
    });
  }

  async addPkd(flowId: string, pkdCodes: NewPkdNumber[]) {
    const pkdIds = await pkdNumbersRepository.upsertPkdNumbers(pkdCodes);
    await this.linkPkd(flowId, pkdIds);
  }

  async removePkd(flowId: string, pkdIds: string[]) {
    if (!pkdIds.length) return;

    await db
      .delete(flowPkdNumbersTable)
      .where(
        and(
          eq(flowPkdNumbersTable.flowId, flowId),
          inArray(flowPkdNumbersTable.pkdId, pkdIds),
        ),
      );
  }

  async getByIdWithPkd(flowId: string) {
    const flow = await db.query.flowsTable.findFirst({
      where: eq(flowsTable.id, flowId),
      with: {
        pkdNumbers: {
          columns: {
            pkdId: true,
          },
          with: {
            pkdNumber: {
              columns: {
                id: true,
                name: true,
                pkdNumber: true,
              },
            },
          },
        },
      },
    });

    return flow;
  }

  async getActiveWithPkd(client?: DbClient) {
    const cx = this.getClient(client);
    const flows = await cx.query.flowsTable.findMany({
      where: eq(flowsTable.isActive, true),
      columns: {
        id: true,
        accountId: true,
      },
      with: {
        pkdNumbers: { columns: { pkdId: true } },
      },
    });

    return flows;
  }

  async getByAccountId(accountId: string, client?: DbClient) {
    const cx = this.getClient(client);
    const flows = await cx.query.flowsTable.findMany({
      where: eq(flowsTable.accountId, accountId),
      with: {
        pkdNumbers: {
          with: {
            pkdNumber: true,
          },
        },
      },
      orderBy: (flows, { desc }) => [desc(flows.createdAt)],
    });

    return flows;
  }
}

const flowsRepository = new FlowsRepository();

export default flowsRepository;
