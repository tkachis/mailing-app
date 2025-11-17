'use client';

import { Link, useRouter, useTranslations } from 'next-globe-gen';
import { useActionState, FC, useEffect, useState } from 'react';

import { AccountEmailSelect } from 'src/_app/(protected)/components';
import { Button, Card, Divider, toast } from 'src/components';
import { Routes } from 'src/configs';

import { FlowFormState } from '../actions';

import ActivityInput from './ActivityInput';
import NameInput from './NameInput';
import PkdNumbersSelect from './PkdNumbersSelect';
import TemplateInput from './TemplateInput';

type FlowFormMode = 'create' | 'edit';

type FlowFormProps = {
  mode: FlowFormMode;
  action: (
    prevState: FlowFormState,
    formData: FormData,
  ) => Promise<FlowFormState>;
  initialData?: {
    id?: string;
    name?: string;
    isActive?: boolean;
    emailTemplateHtml?: string;
    accountEmailId?: string;
    pkdNumbers?: string[];
  };
};

const FlowForm: FC<FlowFormProps> = ({ mode, action, initialData }) => {
  const router = useRouter();
  const t = useTranslations('pages.editCreateFlow');
  const initialState = {
    success: false,
    error: null,
    form: {
      isActive: {
        value: initialData?.isActive || false,
      },
      name: {
        value: initialData?.name || '',
      },
      emailTemplateHtml: {
        value: initialData?.emailTemplateHtml || '',
      },
      accountEmailId: {
        value: initialData?.accountEmailId || '',
      },
      pkdNumbers: {
        value: initialData?.pkdNumbers || [],
      },
    },
  };

  const [
    {
      form: { name, emailTemplateHtml, accountEmailId, isActive, pkdNumbers },
      error,
      success,
    },
    formAction,
    pending,
  ] = useActionState(action, initialState);

  const [selectedAccountEmailId, setSelectedAccountEmailId] = useState<string>(
    initialData?.accountEmailId || '',
  );

  const isAccountEmailSelected = selectedAccountEmailId.length > 0;

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      router.push(Routes.home());
    }
  }, [success, router]);

  const title = mode === 'create' ? t('create.header') : t('edit.header');
  const subtitle =
    mode === 'create' ? t('create.subheader') : t('edit.subheader');
  const submitText = t('form.submit');
  const pendingText = t('form.pending');

  return (
    <Card header={title} subheader={subtitle}>
      <form action={formAction} className='flex flex-col gap-6'>
        <AccountEmailSelect
          name='accountEmailId'
          label={t('form.account_email.label')}
          error={accountEmailId?.error}
          defaultValue={selectedAccountEmailId}
          onValueChange={setSelectedAccountEmailId}
          redirectPath={
            mode === 'edit'
              ? Routes.editFlow(initialData?.id || '')
              : Routes.createFlow()
          }
        />

        <Divider.Root variant='line' />

        <NameInput
          name='name'
          label={t('form.name.label')}
          error={name?.error}
          defaultValue={name?.value || ''}
          required
          disabled={!isAccountEmailSelected}
        />

        <TemplateInput
          name='emailTemplateHtml'
          label={t('form.email_template.label')}
          error={emailTemplateHtml?.error}
          defaultValue={emailTemplateHtml?.value || ''}
          required
          disabled={!isAccountEmailSelected}
        />

        <PkdNumbersSelect
          name='pkdNumbers'
          label={t('form.pkd_codes.label')}
          error={pkdNumbers?.error}
          defaultValue={pkdNumbers?.value || []}
          disabled={!isAccountEmailSelected}
          required
        />

        <ActivityInput
          name='isActive'
          label={t('form.is_active.label')}
          error={isActive?.error}
          defaultValue={isActive?.value || true}
          disabled={!isAccountEmailSelected}
          required
        />

        <div className='flex flex-row justify-between'>
          <Button.Root
            variant='primary'
            mode='stroke'
            size='medium'
            disabled={pending}
            type='button'
            asChild
          >
            <Link href={Routes.home()}>{t('form.cancel')}</Link>
          </Button.Root>

          <Button.Root disabled={pending} type='submit'>
            {pending ? pendingText : submitText}
          </Button.Root>
        </div>
      </form>
    </Card>
  );
};

export default FlowForm;
