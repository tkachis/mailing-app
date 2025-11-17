'use server';

import * as Sentry from '@sentry/nextjs';
import { asc } from 'drizzle-orm';
import { createTranslator, Locale } from 'next-globe-gen';
import { z } from 'zod';

import { flowsRepository } from 'src/db/repositories';
import { pkdNumbersTable } from 'src/db/schema';
import { db, supabaseService, templateService } from 'src/services';
import { ServerActionForm, ServerActionFormField } from 'src/types';

const flowSchema = (t: ReturnType<typeof createTranslator>) =>
  z.object({
    name: z
      .string()
      .nonempty(t('pages.editCreateFlow.form.name.required'))
      .max(255, t('pages.editCreateFlow.form.name.too_long')),
    isActive: z.boolean().default(true),
    emailTemplateHtml: z
      .string()
      .min(1, t('pages.editCreateFlow.form.email_template.required'))
      .refine(
        (template) => {
          const unknownVariables =
            templateService.validateTemplateVariables(template);
          return unknownVariables.length === 0;
        },
        {
          message: t(
            'pages.editCreateFlow.form.email_template.unknown_variables',
          ),
        },
      ),
    accountEmailId: z
      .string()
      .nonempty(t('pages.editCreateFlow.form.account_email.required')),
    pkdNumbers: z
      .array(z.string())
      .min(1, t('pages.editCreateFlow.form.pkd_codes.required')),
  });

export type FlowFormState = ServerActionForm<{
  name: ServerActionFormField<string>;
  isActive: ServerActionFormField<boolean>;
  emailTemplateHtml: ServerActionFormField<string>;
  accountEmailId: ServerActionFormField<string>;
  pkdNumbers: ServerActionFormField<string[]>;
}>;

async function validateAndGetUser() {
  const supabase = await supabaseService.createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication required');
  }

  return user;
}

type CreateFormStateProps = {
  name: string;
  isActive: boolean;
  emailTemplateHtml: string;
  accountEmailId: string;
  pkdNumbers: string[];
  error?: { message: string };
  success?: boolean;
};

function createFormState({
  name,
  isActive,
  emailTemplateHtml,
  accountEmailId,
  pkdNumbers,
  error,
}: CreateFormStateProps): FlowFormState {
  return {
    success: error ? false : true,
    ...(error && { error }),
    form: {
      name: { value: name },
      isActive: { value: isActive },
      emailTemplateHtml: { value: emailTemplateHtml },
      accountEmailId: { value: accountEmailId || '' },
      pkdNumbers: { value: pkdNumbers || [] },
    },
  };
}

type HandleValidationErrorsProps = {
  validationError: z.ZodError<{
    name: string;
    isActive: boolean;
    emailTemplateHtml: string;
    accountEmailId: string;
    pkdNumbers: string[];
  }>;
  name: string;
  isActive: boolean;
  emailTemplateHtml: string;
  accountEmailId: string;
  pkdNumbers: string[];
};

function handleValidationErrors({
  validationError,
  name,
  isActive,
  emailTemplateHtml,
  accountEmailId,
  pkdNumbers,
}: HandleValidationErrorsProps): FlowFormState {
  const treeError = z.treeifyError(validationError);

  return {
    success: false,
    form: {
      isActive: {
        error: treeError.properties?.isActive?.errors[0],
        value: isActive,
      },
      name: {
        error: treeError.properties?.name?.errors[0],
        value: name,
      },
      emailTemplateHtml: {
        error: treeError.properties?.emailTemplateHtml?.errors[0],
        value: emailTemplateHtml,
      },
      accountEmailId: {
        error: treeError.properties?.accountEmailId?.errors[0],
        value: accountEmailId || '',
      },
      pkdNumbers: {
        error: treeError.properties?.pkdNumbers?.errors[0],
        value: pkdNumbers || [],
      },
    },
  };
}

export async function createFlow(
  locale: Locale,
  _initialState: FlowFormState,
  formData: FormData,
): Promise<FlowFormState> {
  const t = createTranslator(locale);
  const name = formData.get('name') as string;
  const isActive = formData.get('isActive') === 'on';
  const emailTemplateHtml = formData.get('emailTemplateHtml') as string;
  const accountEmailId = formData.get('accountEmailId') as string;
  const pkdNumbers = formData.getAll('pkdNumbers') as string[];

  const validatedFields = flowSchema(t).safeParse({
    name,
    isActive,
    accountEmailId,
    emailTemplateHtml,
    pkdNumbers,
  });

  if (!validatedFields.success) {
    return handleValidationErrors({
      name,
      isActive,
      accountEmailId,
      emailTemplateHtml,
      pkdNumbers,
      validationError: validatedFields.error,
    });
  }

  try {
    const user = await validateAndGetUser();

    await flowsRepository.create({
      accountId: user.id,
      name: validatedFields.data.name,
      isActive: validatedFields.data.isActive,
      emailTemplateHtml: validatedFields.data.emailTemplateHtml,
      accountEmailId: validatedFields.data.accountEmailId || null,
      pkdNumbers: validatedFields.data.pkdNumbers.map((pkdId) => ({
        id: pkdId,
      })),
    });

    return createFormState({
      name,
      isActive,
      accountEmailId,
      emailTemplateHtml,
      pkdNumbers,
    });
  } catch (error) {
    console.error('Error creating flow:', error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'flows',
        action: 'createFlow',
      },
      extra: {
        name,
        accountEmailId,
        pkdNumbersCount: pkdNumbers.length,
      },
    });

    return createFormState({
      name,
      isActive,
      accountEmailId,
      emailTemplateHtml,
      pkdNumbers,
      error: { message: t('pages.editCreateFlow.errors.create_flow') },
    });
  }
}

export async function updateFlow(
  flowId: string,
  locale: Locale,
  _initialState: FlowFormState,
  formData: FormData,
): Promise<FlowFormState> {
  const t = createTranslator(locale);
  const name = formData.get('name') as string;
  const isActive = formData.get('isActive') === 'on';
  const emailTemplateHtml = formData.get('emailTemplateHtml') as string;
  const accountEmailId = formData.get('accountEmailId') as string;
  const pkdNumbers = formData.getAll('pkdNumbers') as string[];

  const validatedFields = flowSchema(t).safeParse({
    name,
    isActive,
    accountEmailId,
    emailTemplateHtml,
    pkdNumbers,
  });

  if (!validatedFields.success) {
    return handleValidationErrors({
      name,
      isActive,
      accountEmailId,
      emailTemplateHtml,
      pkdNumbers,
      validationError: validatedFields.error,
    });
  }

  try {
    await validateAndGetUser();

    await flowsRepository.update(flowId, {
      name: validatedFields.data.name,
      isActive: validatedFields.data.isActive,
      emailTemplateHtml: validatedFields.data.emailTemplateHtml,
      accountEmailId: validatedFields.data.accountEmailId || null,
      pkdNumbers: validatedFields.data.pkdNumbers.map((pkdId) => ({
        id: pkdId,
      })),
    });

    return createFormState({
      name,
      isActive,
      accountEmailId,
      emailTemplateHtml,
      pkdNumbers,
    });
  } catch (error) {
    console.error('Error updating flow:', error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'flows',
        action: 'updateFlow',
      },
      extra: {
        flowId,
        name,
        accountEmailId,
        pkdNumbersCount: pkdNumbers.length,
      },
    });

    return createFormState({
      name,
      isActive,
      accountEmailId,
      emailTemplateHtml,
      pkdNumbers,
      error: { message: t('pages.editCreateFlow.errors.update_flow') },
    });
  }
}

export async function getPkdNumberOptions() {
  try {
    const pkdNumbers = await db.query.pkdNumbersTable.findMany({
      columns: {
        id: true,
        name: true,
        pkdNumber: true,
      },
      orderBy: [asc(pkdNumbersTable.createdAt)],
    });

    return pkdNumbers.map((pkd) => ({
      value: pkd.id,
      label: `${pkd.pkdNumber} - ${pkd.name}`,
    }));
  } catch (error) {
    console.error('Error getting PKD numbers:', error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'flows',
        action: 'getPkdNumberOptions',
      },
    });

    return [];
  }
}
