import React from 'react';

import { Card } from 'src/components';

const FlowsListSkeleton = () => {
  return (
    <Card>
      <div className='space-y-6'>
        {[1, 2, 3].map((index) => (
          <div key={index} className='animate-pulse rounded-lg border p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='h-5 w-1/3 rounded bg-gray-200'></div>
              <div className='flex gap-2'>
                <div className='h-6 w-16 rounded-full bg-gray-200'></div>
                <div className='h-6 w-12 rounded-full bg-gray-200'></div>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='h-4 w-full rounded bg-gray-200'></div>
              <div className='h-4 w-3/4 rounded bg-gray-200'></div>
              <div className='h-4 w-1/2 rounded bg-gray-200'></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default FlowsListSkeleton;
