'use client';

import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-globe-gen';
import { FC, useTransition } from 'react';

import { Button, toast } from 'src/components';
import { useErrorToast } from 'src/hooks';

import { connectGmail } from './actions';

const AccountEmailsConnectButton: FC = () => {
  const pathname = usePathname();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('components.accountEmails');

  useErrorToast('error', {
    auth_error: { message: t('failed_to_connect'), type: 'error' },
    permission_denied: {
      message: t('permission_denied'),
      type: 'error',
    },
  });

  const handleConnect = async () => {
    startTransition(async () => {
      const result = await connectGmail(locale, pathname);

      if (result.success && result.authUrl) {
        window.location.href = result.authUrl;
      } else {
        toast.error(t('failed_to_connect'));
      }
    });
  };

  return (
    <Button.Root onClick={handleConnect} disabled={isPending} variant='primary'>
      {isPending ? t('connecting') : t('connect_email')}
    </Button.Root>
  );
};

export default AccountEmailsConnectButton;
