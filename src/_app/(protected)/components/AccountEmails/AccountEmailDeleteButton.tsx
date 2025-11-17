'use client';

import { RiDeleteBinLine } from '@remixicon/react';
import { useLocale, useTranslations } from 'next-globe-gen';
import { FC, useTransition } from 'react';

import { Button, toast } from 'src/components';

import { removeAccountEmail } from './actions';

import type { AccountEmail } from 'src/db/schema';

type AccountEmailDeleteButtonProps = {
  email: AccountEmail;
};

const AccountEmailDeleteButton: FC<AccountEmailDeleteButtonProps> = ({
  email,
}) => {
  const locale = useLocale();
  const t = useTranslations('components.accountEmails');
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const confirmed = confirm(t('confirm_delete', { email: email.email }));
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await removeAccountEmail(locale, email.id);

      if (!result.success) {
        toast.error(t('failed_to_remove'));
      }
    });
  };

  return (
    <Button.Root
      onClick={handleDelete}
      disabled={isPending}
      variant='error'
      size='small'
    >
      <RiDeleteBinLine className='size-4' />
    </Button.Root>
  );
};

export default AccountEmailDeleteButton;
