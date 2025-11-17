import { RiVipCrownLine } from '@remixicon/react';
import { getTranslations } from 'next-globe-gen';

import { Card } from 'src/components';

import { SubscriptionForm } from '../../components';

const SubscriptionCard = () => {
  const t = getTranslations('pages.profile.subscription');
  return (
    <Card
      header={t('header')}
      icon={<RiVipCrownLine className='h-5 w-5 text-purple-600' />}
      iconBgColor='bg-purple-50'
    >
      <SubscriptionForm />
    </Card>
  );
};

export default SubscriptionCard;
