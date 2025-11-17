import { and, eq, gte, inArray, isNotNull, lt, notInArray } from 'drizzle-orm';

import { db } from 'src/services';

import {
  companiesTable,
  companyPkdNumbersTable,
  NewCompany,
  NewPkdNumber,
  UpdateCompany,
} from '../schema';

import pkdNumbersRepository from './pkdNumbers.repository';

import type { DbClient } from '../types';

class CompaniesRepository {
  private getClient(client?: DbClient) {
    return client ?? db;
  }

  async linkPkdNumbers(companyId: string, pkdIds: string[], client?: DbClient) {
    if (!pkdIds.length) return;

    const cx = this.getClient(client);

    await cx
      .insert(companyPkdNumbersTable)
      .values(pkdIds.map((pkdId) => ({ companyId, pkdId })))
      .onConflictDoNothing();
  }

  async setPkdNumbers(companyId: string, pkdIds: string[], client?: DbClient) {
    const cx = this.getClient(client);

    if (!pkdIds.length) {
      await cx
        .delete(companyPkdNumbersTable)
        .where(eq(companyPkdNumbersTable.companyId, companyId));
    } else {
      await cx
        .delete(companyPkdNumbersTable)
        .where(
          and(
            eq(companyPkdNumbersTable.companyId, companyId),
            notInArray(companyPkdNumbersTable.pkdId, pkdIds),
          ),
        );
      await cx
        .insert(companyPkdNumbersTable)
        .values(pkdIds.map((pkdId) => ({ companyId, pkdId })))
        .onConflictDoNothing();
    }
  }

  async create(input: NewCompany) {
    return db.transaction(async (tx) => {
      const { pkdNumbers, ...rest } = input;

      const [company] = await tx
        .insert(companiesTable)
        .values(rest)
        .returning();

      if (pkdNumbers?.length) {
        const pkdIds = await pkdNumbersRepository.upsertPkdNumbers(
          pkdNumbers,
          tx,
        );
        await this.setPkdNumbers(company.id, pkdIds, tx);
      }

      return company;
    });
  }

  async update(companyId: string, input: UpdateCompany) {
    return db.transaction(async (tx) => {
      const { pkdNumbers, ...rest } = input;

      await tx
        .update(companiesTable)
        .set(rest)
        .where(eq(companiesTable.id, companyId));

      if (pkdNumbers && pkdNumbers.length > 0) {
        const pkdIds = await pkdNumbersRepository.upsertPkdNumbers(
          pkdNumbers,
          tx,
        );
        await this.setPkdNumbers(companyId, pkdIds, tx);
      }
    });
  }

  async upsert(input: NewCompany) {
    return db.transaction(async (tx) => {
      const { pkdNumbers, ...companyData } = input;

      const [company] = await tx
        .insert(companiesTable)
        .values(companyData)
        .onConflictDoUpdate({
          target: companiesTable.krsNumber,
          set: {
            name: companyData.name,
            email: companyData.email,
            registrationDate: companyData.registrationDate,
            dataJson: companyData.dataJson,
          },
        })
        .returning({ id: companiesTable.id });

      if (pkdNumbers && pkdNumbers.length > 0) {
        const pkdIds = await pkdNumbersRepository.upsertPkdNumbers(
          pkdNumbers,
          tx,
        );
        await this.setPkdNumbers(company.id, pkdIds, tx);
      }

      return company;
    });
  }

  /**
   * Массовое сохранение компаний в одной транзакции
   * В 10-100 раз быстрее чем по одной компании
   */
  async batchUpsert(companies: NewCompany[], client?: DbClient) {
    if (companies.length === 0) {
      return { success: 0, failed: 0 };
    }

    const cx = this.getClient(client);

    return cx.transaction(async (tx) => {
      let successCount = 0;
      let failedCount = 0;

      // Обрабатываем все компании внутри одной транзакции
      // Это главное преимущество - один COMMIT вместо сотен
      for (const company of companies) {
        try {
          const { pkdNumbers, ...companyData } = company;

          const [savedCompany] = await tx
            .insert(companiesTable)
            .values(companyData)
            .onConflictDoUpdate({
              target: companiesTable.krsNumber,
              set: {
                name: companyData.name,
                email: companyData.email,
                registrationDate: companyData.registrationDate,
                dataJson: companyData.dataJson,
              },
            })
            .returning({ id: companiesTable.id });

          if (pkdNumbers && pkdNumbers.length > 0) {
            const pkdIds = await pkdNumbersRepository.upsertPkdNumbers(
              pkdNumbers,
              tx,
            );
            await this.setPkdNumbers(savedCompany.id, pkdIds, tx);
          }

          successCount++;
        } catch (error) {
          console.error(
            `Ошибка при сохранении компании ${company.krsNumber}:`,
            error,
          );
          failedCount++;
          // Не прерываем транзакцию, продолжаем сохранять остальные
        }
      }

      return { success: successCount, failed: failedCount };
    });
  }

  async addPkds(companyId: string, pkdCodes: NewPkdNumber[]) {
    const pkdIds = await pkdNumbersRepository.upsertPkdNumbers(pkdCodes);
    await this.linkPkdNumbers(companyId, pkdIds);
  }

  async removePkds(companyId: string, pkdIds: string[]) {
    if (!pkdIds.length) return;

    await db
      .delete(companyPkdNumbersTable)
      .where(
        and(
          eq(companyPkdNumbersTable.companyId, companyId),
          inArray(companyPkdNumbersTable.pkdId, pkdIds),
        ),
      );
  }

  async getByIdWithPkds(companyId: string) {
    const company = await db.query.companiesTable.findFirst({
      where: eq(companiesTable.id, companyId),
      with: {
        pkdNumbers: true,
      },
    });

    return company;
  }

  async getWithPkdsForAllocation({
    client,
    companyAgeLimitDays,
    maxUniqueSendersCountForCompany,
  }: {
    client?: DbClient;
    companyAgeLimitDays: number;
    maxUniqueSendersCountForCompany: number;
  }) {
    const cx = this.getClient(client);
    const companyAgeLimitDate = new Date(
      Date.now() - 1000 * 60 * 60 * 24 * companyAgeLimitDays,
    );
    const rows = await cx.query.companiesTable.findMany({
      where: and(
        lt(companiesTable.uniqueSendersCount, maxUniqueSendersCountForCompany),
        gte(companiesTable.createdAt, companyAgeLimitDate),
        // Only companies with email addresses (for sending emails)
        isNotNull(companiesTable.email),
      ),
      columns: {
        id: true,
        email: true,
        uniqueSendersCount: true,
      },
      with: {
        pkdNumbers: {
          columns: { pkdId: true },
        },
      },
    });

    return rows;
  }
}

const companiesRepository = new CompaniesRepository();

export default companiesRepository;
