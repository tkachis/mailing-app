'use client';

import { RiRefreshLine } from '@remixicon/react';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-globe-gen';
import { FC, useTransition } from 'react';

import { Button, toast } from 'src/components';

import { connectGmail } from './actions';

const AccountEmailsReconnectButton: FC = () => {
  const locale = useLocale();
  const t = useTranslations('components.accountEmails');
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleReconnect = async () => {
    startTransition(async () => {
      const result = await connectGmail(locale, pathname);

      if (result.success && result.authUrl) {
        window.location.href = result.authUrl;
      } else {
        toast.error(t('failed_to_reconnect'));
      }
    });
  };

  return (
    <Button.Root
      onClick={handleReconnect}
      disabled={isPending}
      variant='neutral'
      size='small'
    >
      <RiRefreshLine className='size-4' />
      {isPending ? t('reconnecting') : t('reconnect')}
    </Button.Root>
  );
};

export default AccountEmailsReconnectButton;
