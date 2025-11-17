import { RiUserLine } from '@remixicon/react';
import { getLocale, getTranslations } from 'next-globe-gen';

import { Card } from 'src/components';

import { getUserInfo } from '../actions';

const UserInfoCard = async () => {
  const locale = getLocale();
  const t = getTranslations('pages.profile.info');
  const userInfo = await getUserInfo();

  if (!userInfo) {
    return null;
  }

  const formattedDate = new Date(userInfo.createdAt).toLocaleDateString(
    locale,
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );

  return (
    <Card
      header={t('header')}
      icon={<RiUserLine className='h-5 w-5 text-blue-600' />}
      iconBgColor='bg-blue-50'
    >
      <div className='space-y-4'>
        <div className='flex items-start gap-3'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-gray-500'>
              {t('email_address')}
            </p>
            <p className='mt-1 text-base text-gray-900'>{userInfo.email}</p>
          </div>
        </div>

        <div className='flex items-start gap-3'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-gray-500'>
              {t('member_since')}
            </p>
            <p className='mt-1 text-base text-gray-900'>{formattedDate}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UserInfoCard;
