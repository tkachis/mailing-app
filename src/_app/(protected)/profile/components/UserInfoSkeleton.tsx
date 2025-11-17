import React from 'react';

import { Card } from 'src/components';

const UserInfoSkeleton = () => {
  return (
    <Card>
      <div className='animate-pulse'>
        <div className='mb-4 h-6 w-32 rounded bg-gray-200'></div>
        <div className='space-y-3'>
          <div className='h-4 w-full rounded bg-gray-200'></div>
          <div className='h-4 w-48 rounded bg-gray-200'></div>
        </div>
      </div>
    </Card>
  );
};

export default UserInfoSkeleton;
