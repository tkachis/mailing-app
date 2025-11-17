import { RiMailLine } from '@remixicon/react';
import { getTranslations } from 'next-globe-gen';

import { Card } from 'src/components';

import { GmailAccountsManager } from '../../components';

const GmailAccountsCard = () => {
  const t = getTranslations('pages.profile.email_accounts');

  return (
    <Card
      header={t('header')}
      icon={<RiMailLine className='h-5 w-5 text-red-600' />}
      iconBgColor='bg-red-50'
    >
      <GmailAccountsManager />
    </Card>
  );
};

export default GmailAccountsCard;
