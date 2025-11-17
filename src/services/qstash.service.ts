import { Client } from '@upstash/qstash';

import type { Assignment } from './allocation.service';

/**
 * QStash Service
 * Централизованный сервис для работы с Upstash QStash
 */
class QStashService {
  private client: Client;
  private emailUrl: string;
  private failureCallbackUrl: string;

  constructor() {
    if (!process.env.QSTASH_TOKEN) {
      throw new Error('QSTASH_TOKEN is not defined in environment variables');
    }

    this.client = new Client({
      token: process.env.QSTASH_TOKEN,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.emailUrl = `${baseUrl}/api/cron/send-email`;
    this.failureCallbackUrl = `${baseUrl}/api/cron/handle-failed-email`;
  }

  /**
   * Планирует отправку email через QStash
   */
  async scheduleEmail(assignment: Assignment, scheduledAt: Date) {
    const timestamp = Math.floor(scheduledAt.getTime() / 1000); // Unix timestamp in seconds

    const response = await this.client.publishJSON({
      url: this.emailUrl,
      body: {
        accountEmailId: assignment.accountEmailId,
        companyId: assignment.companyId,
        flowId: assignment.flowId,
        // Add time for Dashboard monitoring
        scheduledAt: scheduledAt.toISOString(),
        scheduledAtReadable: scheduledAt.toLocaleString('ru-RU', {
          timeZone: 'Europe/Warsaw',
        }),
      },
      notBefore: timestamp,
      // Failure callback for error tracking
      failureCallback: this.failureCallbackUrl,
      retries: 2, // Maximum 2 retries
    });

    return response;
  }

  /**
   * Создает recurring schedule (cron job)
   * Используется для автоматического запуска задач по расписанию
   */
  async createSchedule(params: { destination: string; cron: string }) {
    const schedule = await this.client.schedules.create({
      destination: params.destination,
      cron: params.cron,
    });

    return schedule;
  }

  /**
   * Получает информацию о schedule
   */
  async getSchedule(scheduleId: string) {
    const schedule = await this.client.schedules.get(scheduleId);
    return schedule;
  }

  /**
   * Удаляет schedule
   */
  async deleteSchedule(scheduleId: string) {
    await this.client.schedules.delete(scheduleId);
  }

  /**
   * Получает список всех schedules
   */
  async listSchedules() {
    const schedules = await this.client.schedules.list();
    return schedules;
  }

  /**
   * Получает информацию о сообщении
   * Note: QStash SDK не имеет прямого метода для получения message
   * Используйте QStash Dashboard для просмотра сообщений
   */
  // async getMessage(messageId: string) {
  //   throw new Error('Not implemented. Use QStash Dashboard to view messages.');
  // }

  /**
   * Получает QStash client для прямого доступа к API
   */
  getClient() {
    return this.client;
  }

  /**
   * Получает URL для отправки email
   */
  getEmailUrl() {
    return this.emailUrl;
  }

  /**
   * Получает URL для failure callback
   */
  getFailureCallbackUrl() {
    return this.failureCallbackUrl;
  }
}

// Export singleton instance
const qstashService = new QStashService();

export default qstashService;
