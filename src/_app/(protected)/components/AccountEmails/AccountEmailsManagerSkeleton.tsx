import { getTranslations } from 'next-globe-gen';

const AccountEmailsManagerSkeleton = () => {
  const t = getTranslations('components.accountEmails');

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-6'>
      <p className='text-gray-500'>{t('loading')}</p>
    </div>
  );
};

export default AccountEmailsManagerSkeleton;
