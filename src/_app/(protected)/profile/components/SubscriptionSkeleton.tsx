import React from 'react';

const SubscriptionSkeleton = () => {
  return (
    <div className='animate-pulse'>
      <div className='rounded-lg border border-gray-200 bg-white p-6'>
        <div className='mb-4 h-6 w-32 rounded bg-gray-200'></div>
        <div className='space-y-3'>
          <div className='h-4 w-full rounded bg-gray-200'></div>
          <div className='h-32 w-full rounded bg-gray-200'></div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSkeleton;
