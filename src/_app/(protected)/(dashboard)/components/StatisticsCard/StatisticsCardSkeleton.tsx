import React from 'react';

import { Card } from 'src/components';

const StatisticsCardSkeleton = () => {
  return (
    <Card>
      <div className='animate-pulse'>
        <div className='mb-4 h-6 w-32 rounded bg-gray-200'></div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='h-24 rounded-lg bg-gray-200'></div>
          <div className='h-24 rounded-lg bg-gray-200'></div>
          <div className='h-24 rounded-lg bg-gray-200'></div>
        </div>
      </div>
    </Card>
  );
};

export default StatisticsCardSkeleton;
