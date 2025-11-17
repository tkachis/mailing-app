'use client';

import { useLocale, useRouter, useTranslations } from 'next-globe-gen';
import { useActionState, FC, useEffect } from 'react';

import { Button, toast } from 'src/components';
import { Routes } from 'src/configs';

import { login } from '../actions';

import EmailInput from './EmailInput';
import PasswordInput from './PasswordInput';

const initialState = {
  success: false,
  error: null,
  form: {
    email: {
      value: '',
    },
    password: {
      value: '',
    },
    actionType: {
      value: 'signin' as const,
    },
  },
};

const LoginForm: FC = () => {
  const router = useRouter();
  const locale = useLocale();
  const loginWithLocale = login.bind(null, locale);
  const [
    {
      form: { email, password, actionType },
      error,
      success,
    },
    formAction,
    pending,
  ] = useActionState(loginWithLocale, initialState);
  const t = useTranslations();

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      if (actionType.value === 'signin') {
        router.push(Routes.home());
      } else {
        toast.success(t('pages.login.messages.signup.success'));
      }
    }
  }, [success, actionType.value, router, t]);

  return (
    <form action={formAction} className='flex flex-col items-center gap-6'>
      <EmailInput
        error={email?.error}
        defaultValue={email?.value || ''}
        required
        label={t('pages.login.fields.email.label')}
      />
      <PasswordInput
        error={password?.error}
        defaultValue={password?.value || ''}
        required
        label={t('pages.login.fields.password.label')}
      />
      <Button.Root
        className='w-full'
        disabled={pending}
        type='submit'
        name='actionType'
        value='signin'
      >
        {t('pages.login.buttons.signin')}
      </Button.Root>
      <p className='text-text-soft-400 text-center'>{t('pages.login.or')}</p>
      <Button.Root
        className='w-full'
        disabled={pending}
        type='submit'
        name='actionType'
        value='signup'
      >
        {t('pages.login.buttons.signup')}
      </Button.Root>
    </form>
  );
};

export default LoginForm;
