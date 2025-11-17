import { getTranslations } from 'next-globe-gen';
import { Suspense } from 'react';

import { Block } from 'src/components';

import {
  FlowsList,
  FlowsListSkeleton,
  StatisticsCard,
  StatisticsCardSkeleton,
} from './components';

export default function Home() {
  const t = getTranslations('pages.dashboard');

  return (
    <Block>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('title')}</h1>
      </div>

      <div className='space-y-6'>
        <Suspense fallback={<StatisticsCardSkeleton />}>
          <StatisticsCard />
        </Suspense>
        <Suspense fallback={<FlowsListSkeleton />}>
          <FlowsList />
        </Suspense>
      </div>
    </Block>
  );
}
