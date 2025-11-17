import { useTranslations } from 'next-globe-gen';
import { Suspense } from 'react';

import { Block } from 'src/components';

import { AccountEmailsManagerSkeleton } from '../components';

import {
  GmailAccountsCard,
  SubscriptionCard,
  SubscriptionSkeleton,
  UserInfoCard,
  UserInfoSkeleton,
} from './components';

const ProfilePage = () => {
  const t = useTranslations('pages.profile');

  return (
    <Block className='py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('header')}</h1>
        <p className='mt-2 text-gray-600'>{t('subheader')}</p>
      </div>

      <div className='space-y-6'>
        <Suspense fallback={<UserInfoSkeleton />}>
          <UserInfoCard />
        </Suspense>

        <Suspense fallback={<SubscriptionSkeleton />}>
          <SubscriptionCard />
        </Suspense>

        <Suspense fallback={<AccountEmailsManagerSkeleton />}>
          <GmailAccountsCard />
        </Suspense>
      </div>
    </Block>
  );
};

export default ProfilePage;
