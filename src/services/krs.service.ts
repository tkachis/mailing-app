import * as Sentry from '@sentry/nextjs';

import {
  KRSCompany,
  KRSCompanySchema,
  KRSInfo,
  KRSInfoSchema,
  KRSRegistry,
} from '../types/krs.types';

import httpService from './http.service';

class KRSService {
  private readonly apiUrl: string;
  private readonly parseBatchSize = 500;
  private readonly batchDelayMs = 1000; // 1 second pause between batches

  constructor() {
    const krsApiUrl = process.env.KRS_API_URL;

    if (!krsApiUrl) {
      throw new Error(
        'KRS_API_URL environment variable is not set. Please add it to your .env file.',
      );
    }

    this.apiUrl = krsApiUrl;
  }

  async getDetailedCompaniesList(
    date: Date,
    godzinaOd = '00',
    godzinaDo = '23',
  ): Promise<KRSCompany[] | null> {
    const krsList = await this.getKRSList(date, godzinaOd, godzinaDo);

    if (!krsList) {
      return null;
    }

    const companies: KRSCompany[] = [];

    console.log(`Found ${krsList.length} companies to parse`);

    const reversed = [...krsList].reverse();
    const totalBatches = Math.ceil(reversed.length / this.parseBatchSize);

    for (let i = 0; i < reversed.length; i += this.parseBatchSize) {
      const batch = reversed.slice(i, i + this.parseBatchSize);
      const batchNumber = Math.floor(i / this.parseBatchSize) + 1;

      console.log(
        `[Batch ${batchNumber}/${totalBatches}] Parsing ${batch.length} companies...`,
      );

      const batchResults = await Promise.allSettled(
        batch.map((item) => this.getParsedCompanyInfo(item)),
      );

      for (let j = 0; j < batch.length; j++) {
        const res = batchResults[j];

        if (res.status === 'rejected') {
          console.error('[getDetailedKRSList] Error:', res.reason);
          continue;
        }

        if (res.value) {
          companies.push(res.value);
          console.log(
            `[getDetailedCompaniesList] Parsed company ${res.value.krsNumber} - ${res.value.name} - ${res.value.registrationDate.toISOString().split('T')[0]} - ${res.value.email || 'no email'}`,
          );
        }
      }

      // Pause between batches to avoid rate limiting
      if (i + this.parseBatchSize < reversed.length) {
        console.log(`Pausing ${this.batchDelayMs}ms before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, this.batchDelayMs));
      }
    }

    return companies;
  }

  async getKRSList(
    date: Date,
    from: string,
    to: string,
  ): Promise<string[] | null> {
    try {
      const dateISO = date.toISOString().split('T')[0];
      const endpoint = `${this.apiUrl}/biuletyn/${dateISO}?godzinaOd=${from}&godzinaDo=${to}`;
      console.log(`[getKRSList] Request to ${endpoint}`);
      const response = await httpService.get(endpoint, {
        requireAuth: false,
      });

      if (!response.success) {
        console.error('[getKRSList] API error:', response.error);
        return null;
      }

      return Array.isArray(response.data)
        ? response.data.map((krs) => krs.padStart(10, '0'))
        : null;
    } catch (error) {
      console.error('[getKRSList] Error:', error);

      // Log to Sentry
      Sentry.captureException(error, {
        tags: {
          feature: 'krs-api',
          service: 'KRSService',
          method: 'getKRSList',
        },
        extra: {
          date: date.toISOString(),
        },
      });

      return null;
    }
  }

  async getCompanyInfo(
    krs: string,
    registry: KRSRegistry,
  ): Promise<KRSInfo | null> {
    const endpoint = `${this.apiUrl}/OdpisAktualny/${krs}?rejestr=${registry}&format=json`;
    const response = await httpService.get(endpoint, {
      requireAuth: false,
    });

    if (!response.success) {
      console.error(
        `[getCompanyInfo] API error for KRS ${krs} in registry ${registry}:`,
        response.error,
      );
      return null;
    }

    const parseResult = KRSInfoSchema.safeParse(response.data);

    if (!parseResult.success) {
      console.error('[getCompanyInfo] Parsing error:', parseResult.error);
      return null;
    }

    return parseResult.data;
  }

  private async getCompanyInfoFromAnyRegistry(krs: string): Promise<{
    report: KRSInfo | null;
    registry: KRSRegistry | null;
  }> {
    // Run both requests in parallel for speed
    const [pResult, sResult] = await Promise.allSettled([
      this.getCompanyInfo(krs, KRSRegistry.P),
      this.getCompanyInfo(krs, KRSRegistry.S),
    ]);

    // Check P registry first (priority)
    if (pResult.status === 'fulfilled' && pResult.value) {
      return { report: pResult.value, registry: KRSRegistry.P };
    }

    // If P not found, check S registry
    if (sResult.status === 'fulfilled' && sResult.value) {
      return { report: sResult.value, registry: KRSRegistry.S };
    }

    return { report: null, registry: null };
  }

  async getParsedCompanyInfo(krs: string): Promise<KRSCompany | null> {
    const { report, registry } = await this.getCompanyInfoFromAnyRegistry(krs);

    if (!report) {
      return null;
    }

    const parseResult = KRSCompanySchema.safeParse(report);

    if (!parseResult.success) {
      console.error('[getParsedCompanyInfo] Parsing error:', parseResult.error);
      return null;
    }

    if (!parseResult.data) {
      return null;
    }

    return {
      ...parseResult.data,
      registry: parseResult.data.registry || registry,
    };
  }
}

const krsService = new KRSService();

export default krsService;
