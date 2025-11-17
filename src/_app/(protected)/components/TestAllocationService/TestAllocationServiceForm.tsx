'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

import { Button } from 'src/components/ui';

import { runAllocation } from './actions';

import type { PlanResult } from 'src/services';

export function TestAllocationServiceForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAllocation = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await runAllocation();

      if (response.success) {
        setResult(response.data || null);
        console.log('Allocation completed successfully:', response.data);
      } else {
        setError(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      // Логируем в Sentry
      Sentry.captureException(err, {
        tags: {
          feature: 'allocation',
          component: 'TestAllocationServiceForm',
        },
      });

      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='space-y-4'>
      <Button.Root
        variant='primary'
        mode='filled'
        size='medium'
        onClick={handleRunAllocation}
        disabled={isLoading}
      >
        {isLoading ? 'Running Allocation...' : 'Run Allocation Test'}
      </Button.Root>

      {error && (
        <div className='rounded-md border border-red-200 bg-red-50 p-4'>
          <h3 className='text-sm font-medium text-red-800'>Error:</h3>
          <p className='mt-1 text-sm text-red-700'>{error}</p>
        </div>
      )}

      {result && (
        <div className='rounded-md border border-green-200 bg-green-50 p-4'>
          <h3 className='mb-2 text-sm font-medium text-green-800'>
            Allocation Results:
          </h3>
          <div className='space-y-2 text-sm text-green-700'>
            <div>
              <strong>Total Assignments:</strong>{' '}
              {result.assignments?.length || 0}
            </div>
            <div>
              <strong>Companies Considered:</strong>{' '}
              {result.stats?.totalCompaniesConsidered || 0}
            </div>
            <div>
              <strong>Available Slots:</strong>{' '}
              {result.stats?.totalAvailableSlots || 0}
            </div>

            {result.stats?.perAccountEmail &&
              Object.keys(result.stats.perAccountEmail).length > 0 && (
                <div>
                  <strong>Per Email Address:</strong>
                  <ul className='mt-1 ml-4'>
                    {Object.entries(result.stats.perAccountEmail).map(
                      ([accountEmailId, count]) => (
                        <li key={accountEmailId}>
                          {accountEmailId}: {count as number} assignments
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

            {result.stats?.perFlow &&
              Object.keys(result.stats.perFlow).length > 0 && (
                <div>
                  <strong>Per Flow:</strong>
                  <ul className='mt-1 ml-4'>
                    {Object.entries(result.stats.perFlow).map(
                      ([flowId, count]) => (
                        <li key={flowId}>
                          {flowId}: {count as number} assignments
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

            {result.assignments && result.assignments.length > 0 && (
              <details className='mt-3'>
                <summary className='cursor-pointer font-medium'>
                  View All Assignments ({result.assignments.length})
                </summary>
                <div className='mt-2 max-h-40 overflow-y-auto'>
                  <pre className='rounded border bg-white p-2 text-xs'>
                    {JSON.stringify(result.assignments, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
