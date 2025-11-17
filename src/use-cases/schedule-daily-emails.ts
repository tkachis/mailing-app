import * as Sentry from '@sentry/nextjs';

import { allocationService, qstashService } from 'src/services';

/**
 * Configuration for distributing emails over time
 */
const SCHEDULE_CONFIG = {
  startHour: 8, // Start of business day (8:00)
  endHour: 18, // End of business day (18:00)
  randomOffsetMinutes: 15, // Maximum random offset in minutes (±15 min)
  batchSize: 10, // Batch size for scheduling emails via QStash
};

/**
 * Email scheduling result
 */
export interface ScheduleResult {
  success: boolean;
  scheduled: number;
  failed: number;
  scheduledTimes: string[];
  stats: {
    totalCompaniesConsidered: number;
    totalAvailableSlots: number;
    totalAssignments: number;
  };
  duration: number;
}

/**
 * Generates random offset in milliseconds
 */
function getRandomOffset(maxMinutes: number): number {
  const randomMinutes = (Math.random() * 2 - 1) * maxMinutes; // from -maxMinutes to +maxMinutes
  return randomMinutes * 60 * 1000;
}

/**
 * Calculates send time for a specific email
 */
function calculateScheduledTime(
  startTime: number,
  baseIntervalMs: number,
  index: number,
  randomOffsetMinutes: number,
): Date {
  const baseDelay = baseIntervalMs * index;
  const randomOffset = getRandomOffset(randomOffsetMinutes);
  const totalDelay = Math.max(0, baseDelay + randomOffset);
  return new Date(startTime + totalDelay);
}

/**
 * Formats date for logging
 */
function formatScheduledTime(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Use Case: Schedule daily email campaigns
 *
 * Main tasks:
 * 1. Get distribution plan from allocation service
 * 2. Distribute emails over time during business hours
 * 3. Schedule sending via QStash
 *
 * @returns Scheduling result with detailed statistics
 */
export default async function scheduleDailyEmails(): Promise<ScheduleResult> {
  const startTime = Date.now();

  console.log(
    `[${new Date().toISOString()}] 📋 Starting task: Scheduling daily emails...`,
  );

  try {
    // 1. Get distribution plan from allocation service
    console.log('  → Creating distribution plan...');
    const plan = await allocationService.plan();

    console.log('\n📊 Planning results:');
    console.log(
      `  - Total companies considered: ${plan.stats.totalCompaniesConsidered}`,
    );
    console.log(`  - Total available slots: ${plan.stats.totalAvailableSlots}`);
    console.log(`  - Assignments created: ${plan.assignments.length}`);

    // If no assignments, return empty result
    if (plan.assignments.length === 0) {
      console.log('\nℹ️  No available assignments to schedule.');

      return {
        success: true,
        scheduled: 0,
        failed: 0,
        scheduledTimes: [],
        stats: {
          totalCompaniesConsidered: plan.stats.totalCompaniesConsidered,
          totalAvailableSlots: plan.stats.totalAvailableSlots,
          totalAssignments: plan.assignments.length,
        },
        duration: Date.now() - startTime,
      };
    }

    // 2. Distribute emails over time
    console.log(
      `\n📬 Starting distribution of ${plan.assignments.length} emails over time...`,
    );
    console.log(
      `  - Business hours: ${SCHEDULE_CONFIG.startHour}:00 - ${SCHEDULE_CONFIG.endHour}:00`,
    );
    console.log(
      `  - Random offset: ±${SCHEDULE_CONFIG.randomOffsetMinutes} minutes`,
    );

    // Calculate total available time
    const totalWorkMinutes =
      (SCHEDULE_CONFIG.endHour - SCHEDULE_CONFIG.startHour) * 60;
    const totalWorkMs = totalWorkMinutes * 60 * 1000;

    // Base interval between emails
    const baseIntervalMs = totalWorkMs / plan.assignments.length;
    console.log(
      `  - Base interval between emails: ~${Math.round(baseIntervalMs / 1000 / 60)} minutes`,
    );

    // Mailing start time (today at startHour)
    const now = new Date();
    const scheduleStartTime = new Date(now);
    scheduleStartTime.setHours(SCHEDULE_CONFIG.startHour, 0, 0, 0);

    // IMPORTANT: If job starts after startHour, begin from current time
    // This prevents scheduling emails in the past
    const actualStartTime =
      now > scheduleStartTime ? now.getTime() : scheduleStartTime.getTime();

    if (now > scheduleStartTime) {
      console.log(
        `  ⚠️  Job started after ${SCHEDULE_CONFIG.startHour}:00, starting from current time`,
      );
    }

    // 3. Schedule each email via QStash batches of batchSize
    console.log(
      `\n📤 Scheduling via QStash (batches of ${SCHEDULE_CONFIG.batchSize})...`,
    );

    let successCount = 0;
    let failCount = 0;
    const scheduledTimes: string[] = [];

    const totalBatches = Math.ceil(
      plan.assignments.length / SCHEDULE_CONFIG.batchSize,
    );
    console.log(`  - Total batches: ${totalBatches}`);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * SCHEDULE_CONFIG.batchSize;
      const batchEnd = Math.min(
        batchStart + SCHEDULE_CONFIG.batchSize,
        plan.assignments.length,
      );
      const batch = plan.assignments.slice(batchStart, batchEnd);

      // Schedule entire batch in parallel
      const batchPromises = batch.map(async (assignment, indexInBatch) => {
        const globalIndex = batchStart + indexInBatch;

        try {
          const scheduledTime = calculateScheduledTime(
            actualStartTime,
            baseIntervalMs,
            globalIndex,
            SCHEDULE_CONFIG.randomOffsetMinutes,
          );

          await qstashService.scheduleEmail(assignment, scheduledTime);

          scheduledTimes.push(formatScheduledTime(scheduledTime));
          successCount++;
        } catch (error) {
          console.error(
            `  ❌ Scheduling error for assignment ${globalIndex} (company: ${assignment.companyId}):`,
            error instanceof Error ? error.message : 'Unknown error',
          );
          failCount++;

          // Log to Sentry
          Sentry.captureException(error, {
            level: 'error',
            tags: {
              feature: 'email-scheduling',
              use_case: 'scheduleDailyEmails',
              assignment_index: globalIndex,
            },
            extra: {
              assignment,
              totalAssignments: plan.assignments.length,
            },
          });
        }
      });

      // Wait for the entire batch to complete
      await Promise.all(batchPromises);

      // Log progress after each batch
      console.log(
        `  → Scheduled ${batchEnd}/${plan.assignments.length} emails (batch ${batchIndex + 1}/${totalBatches})...`,
      );
    }

    const duration = Date.now() - startTime;

    // 4. Output final statistics
    console.log('\n📅 Sending schedule (first 5 emails):');
    scheduledTimes.slice(0, 5).forEach((time, i) => {
      console.log(`  ${i + 1}. ${time}`);
    });

    if (scheduledTimes.length > 5) {
      console.log(`  ... and ${scheduledTimes.length - 5} more emails`);
      console.log(`  Last email: ${scheduledTimes[scheduledTimes.length - 1]}`);
    }

    console.log(`\n✅ Scheduling completed in ${duration}ms`);
    console.log(
      `📊 Final statistics: ${successCount} successful, ${failCount} errors`,
    );

    return {
      success: failCount === 0,
      scheduled: successCount,
      failed: failCount,
      scheduledTimes,
      stats: {
        totalCompaniesConsidered: plan.stats.totalCompaniesConsidered,
        totalAvailableSlots: plan.stats.totalAvailableSlots,
        totalAssignments: plan.assignments.length,
      },
      duration,
    };
  } catch (error) {
    console.error('\n💥 Critical error in email scheduling task:', error);

    // Log critical error to Sentry
    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        feature: 'email-scheduling',
        use_case: 'scheduleDailyEmails',
      },
    });

    // Throw error further for handling in API route
    throw error;
  }
}
