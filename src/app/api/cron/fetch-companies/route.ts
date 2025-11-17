import * as Sentry from '@sentry/nextjs';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { NextResponse } from 'next/server';

import { fetchNewCompanies } from 'src/use-cases';

/**
 * API Route для получения новых компаний из KRS
 * Вызывается QStash Schedule каждое утро
 *
 * Задача:
 * - Получить новые компании за вчера из KRS API
 * - Сохранить их в базу данных
 *
 * ВАЖНО: Защищен QStash signature verification
 */
async function handler() {
  console.log(
    `[${new Date().toISOString()}] 🚀 API Route: Получение новых компаний...`,
  );

  try {
    const date = new Date();
    date.setDate(date.getDate() - 1); // Получаем компании за вчера

    console.log(
      `📊 Получение компаний за ${date.toISOString().split('T')[0]}...`,
    );

    await fetchNewCompanies(date);

    console.log('✅ Компании успешно получены и сохранены!');

    return NextResponse.json({
      success: true,
      date: date.toISOString().split('T')[0],
      message: 'Companies fetched successfully',
    });
  } catch (error) {
    console.error('\n💥 Критическая ошибка при получении компаний:', error);

    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        feature: 'company-import',
        endpoint: 'fetch-companies',
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
