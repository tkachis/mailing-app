'use client';

import { useLocale, useTranslations } from 'next-globe-gen';
import { FC, useState, useTransition } from 'react';

import { Label, Switch, toast } from 'src/components';
import { cn } from 'src/utils';

import { toggleAccountEmailActive } from './actions';

import type { AccountEmail } from 'src/db/schema';

type AccountEmailToggleProps = {
  email: AccountEmail;
};

const AccountEmailToggle: FC<AccountEmailToggleProps> = ({ email }) => {
  const locale = useLocale();
  const t = useTranslations('components.accountEmails');
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(email.isActive);

  const handleToggle = () => {
    const confirmed = isActive
      ? confirm(t('confirm_toggle_inactive', { email: email.email }))
      : true;

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await toggleAccountEmailActive(locale, email.id);
      if (result.success) {
        setIsActive((prev) => !prev);
      } else {
        toast.error(t('failed_to_toggle'));
      }
    });
  };

  return (
    <div className='flex items-center gap-2'>
      <Switch.Root
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={isPending}
        id={`${email.id}-toggle-email-active`}
      />
      <Label.Root
        htmlFor={`${email.id}-toggle-email-active`}
        className={cn(isActive ? 'text-green-500' : 'text-red-500')}
      >
        {isActive ? t('active') : t('inactive')}
      </Label.Root>
    </div>
  );
};

export default AccountEmailToggle;
