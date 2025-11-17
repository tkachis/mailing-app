'use client';

import { RiAddLine, RiInformationFill, RiMailLine } from '@remixicon/react';
import * as Sentry from '@sentry/nextjs';
import { useLocale, useTranslations } from 'next-globe-gen';
import { FC, useEffect, useState, useTransition } from 'react';

import { Button, Hint, Label, Select, toast } from 'src/components';
import { useErrorToast } from 'src/hooks';

import { connectGmail, getAccountEmails } from './actions';

import type { AccountEmail } from 'src/db/schema';

type AccountEmailSelectProps = {
  name: string;
  label: string;
  error?: string | null;
  required?: boolean;
  defaultValue?: string;
  redirectPath?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
};

const AccountEmailSelect: FC<AccountEmailSelectProps> = ({
  name,
  error,
  label,
  required,
  redirectPath,
  defaultValue,
  disabled = false,
  onValueChange,
}) => {
  const locale = useLocale();
  const t = useTranslations('components.accountEmails');
  const [emails, setEmails] = useState<AccountEmail[]>([]);
  const [isPending, startTransition] = useTransition();

  useErrorToast('error', {
    auth_error: { message: t('failed_to_connect'), type: 'error' },
    permission_denied: {
      message: t('permission_denied'),
      type: 'error',
    },
  });

  useEffect(() => {
    startTransition(async () => {
      try {
        const accountEmails = await getAccountEmails();
        setEmails(accountEmails);
      } catch (error) {
        // Логируем в Sentry
        Sentry.captureException(error, {
          tags: {
            feature: 'account-emails',
            component: 'AccountEmailSelect',
          },
        });

        toast.error(t('failed_to_load'));
      }
    });
  }, [t]);

  const handleConnectGmail = () => {
    startTransition(async () => {
      const result = await connectGmail(locale, redirectPath);

      if (result.success && result.authUrl) {
        window.location.href = result.authUrl;
      } else {
        toast.error(t('failed_to_connect'));
      }
    });
  };

  const activeEmails = emails.filter((email) => email.isActive);

  return (
    <div className='flex w-full flex-col gap-2'>
      <Label.Root htmlFor={name}>
        {label}
        {required && <Label.Asterisk />}
      </Label.Root>

      <Select.Root
        name={name}
        required={required}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        hasError={!!error}
        disabled={isPending || disabled}
      >
        <Select.Trigger>
          <Select.Value
            placeholder={isPending ? t('loading') : t('select.placeholder')}
          />
        </Select.Trigger>
        <Select.Content>
          {activeEmails.length > 0 ? (
            <>
              {activeEmails.map((email) => (
                <Select.Item key={email.id} value={email.id}>
                  <div className='flex items-center gap-2'>
                    <RiMailLine className='size-4 text-gray-500' />
                    <span>{email.email}</span>
                    {email.providerType === 'gmail' && (
                      <span className='text-xs text-gray-400'>(Gmail)</span>
                    )}
                  </div>
                </Select.Item>
              ))}
              <div className='mt-1 border-t border-gray-100 pt-1'>
                <Button.Root
                  variant='neutral'
                  size='small'
                  className='w-full justify-start'
                  onClick={handleConnectGmail}
                  disabled={isPending}
                  type='button'
                >
                  <RiAddLine className='mr-2 size-4' />
                  {isPending ? t('connecting') : t('connect_email')}
                </Button.Root>
              </div>
            </>
          ) : (
            <div className='p-3 text-center'>
              <div className='mb-3 text-sm text-gray-600'>
                {t('no_email_accounts_connected')}
              </div>
              <Button.Root
                variant='primary'
                size='small'
                onClick={handleConnectGmail}
                disabled={isPending}
                type='button'
              >
                <RiAddLine className='mr-2 size-4' />
                {isPending ? t('connecting') : t('connect_email')}
              </Button.Root>
            </div>
          )}
        </Select.Content>
      </Select.Root>

      <Hint.Root hasError={!!error}>
        {error ? (
          error
        ) : (
          <>
            <Hint.Icon as={RiInformationFill} />
            {t('select.hint')}
          </>
        )}
      </Hint.Root>
    </div>
  );
};

export default AccountEmailSelect;
