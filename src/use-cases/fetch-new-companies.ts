import * as Sentry from '@sentry/nextjs';

import companiesRepository from 'src/db/repositories/companies.repository';
import { NewCompany } from 'src/db/schema';
import krsService from 'src/services/krs.service';

type CompaniesToSaveResult = {
  companiesToSave: NewCompany[];
  skippedCount: number;
};

export default async function fetchNewCompanies(date: Date) {
  console.log(
    `[${new Date().toISOString()}] Starting task: Collecting new companies from KRS...`,
  );

  try {
    // Minimum company registration date to consider
    const minRegDateEnv = process.env.MIN_COMPANY_REGISTRATION_DATE;
    const minRegistrationDate = minRegDateEnv
      ? new Date(minRegDateEnv)
      : new Date(date); // If not set - use yesterday

    console.log(
      `Minimum company registration date: ${minRegistrationDate.toISOString().split('T')[0]} ${minRegDateEnv ? '(from ENV)' : '(default: yesterday)'}`,
    );

    console.log(
      `Fetching companies from bulletin for: ${date.toISOString().split('T')[0]}`,
    );

    const newCompanies = await krsService.getDetailedCompaniesList(date);

    if (!newCompanies || newCompanies.length === 0) {
      console.log('No new companies found to save.');
      return;
    }

    console.log(
      `Found ${newCompanies.length} new companies. Starting save process...`,
    );

    // Filter and prepare companies for batch save in one pass
    const { companiesToSave, skippedCount } =
      newCompanies.reduce<CompaniesToSaveResult>(
        (acc, company) => {
          if (
            !company ||
            !company.krsNumber ||
            !company.name ||
            !company.registrationDate
          ) {
            console.warn(
              `Skipping company due to missing required data. KRS: ${company?.krsNumber}, Name: ${company?.name}`,
            );
            return { ...acc, skippedCount: acc.skippedCount + 1 };
          }

          // Filter by minimum registration date
          if (company.registrationDate < minRegistrationDate) {
            console.log(
              `[SKIP] Company ${company.krsNumber} - ${company.name} registered on ${company.registrationDate.toISOString().split('T')[0]} (before minimum date ${minRegistrationDate.toISOString().split('T')[0]})`,
            );
            return { ...acc, skippedCount: acc.skippedCount + 1 };
          }

          acc.companiesToSave.push({
            krsNumber: company.krsNumber,
            name: company.name,
            // TODO: After testing, remove this and use the actual email
            email: company.email ? 'tkachevis4@gmail.com' : undefined,
            registrationDate: company.registrationDate,
            pkdNumbers: company.pkdNumbers,
            dataJson: company.dataJson,
          });

          return acc;
        },
        { companiesToSave: [], skippedCount: 0 },
      );

    console.log(`Companies to save: ${companiesToSave.length}`);

    const result = await companiesRepository.batchUpsert(companiesToSave);

    console.log(
      `Task completed. Total companies found: ${newCompanies.length}, Successfully saved: ${result.success}, Errors: ${result.failed}, Skipped: ${skippedCount}.`,
    );
  } catch (error) {
    console.error('Critical error occurred in company collection task:', error);

    Sentry.captureException(error, {
      tags: {
        feature: 'company-import',
        cron_job: 'fetchNewCompaniesJob',
      },
    });
  }
}
