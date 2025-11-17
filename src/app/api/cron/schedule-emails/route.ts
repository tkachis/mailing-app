import * as Sentry from '@sentry/nextjs';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { NextResponse } from 'next/server';

import { scheduleDailyEmails } from 'src/use-cases';

/**
 * API Route для планирования ежедневных email рассылок
 * Вызывается QStash Schedule каждое утро (после fetch-companies)
 *
 * Задача:
 * - Получить план распределения компаний по аккаунтам
 * - Запланировать отправку писем через QStash
 *
 * ВАЖНО: Защищен QStash signature verification
 */
async function handler() {
  console.log(
    `[${new Date().toISOString()}] 🚀 API Route: Планирование ежедневных рассылок...`,
  );

  try {
    console.log('📋 Создание плана рассылок и планирование через QStash...');

    const result = await scheduleDailyEmails();

    console.log('\n🎉 Планирование завершено успешно!');
    console.log(`📊 Запланировано: ${result.scheduled} писем`);
    console.log(`❌ Ошибок: ${result.failed}`);
    console.log(`⏱️  Время выполнения: ${result.duration}ms`);

    return NextResponse.json({
      success: result.success,
      scheduled: result.scheduled,
      failed: result.failed,
      stats: result.stats,
      duration: result.duration,
    });
  } catch (error) {
    console.error('\n💥 Критическая ошибка при планировании рассылок:', error);

    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        feature: 'email-scheduling',
        endpoint: 'schedule-emails',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// Проверяем подпись QStash для безопасности
export const POST = verifySignatureAppRouter(handler);
