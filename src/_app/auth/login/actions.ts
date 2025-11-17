'use server';

import * as Sentry from '@sentry/nextjs';
import { AuthError } from '@supabase/auth-js';
import { createTranslator, Locale } from 'next-globe-gen';
import { z } from 'zod';

import { supabaseService } from 'src/services';
import { ServerActionForm, ServerActionFormField } from 'src/types';

const loginSchema = (t: ReturnType<typeof createTranslator<'pages.login'>>) =>
  z.object({
    email: z.email(t('fields.email.validation.email')),
    password: z
      .string()
      .min(8, t('fields.password.validation.minLength', { minLength: 8 }))
      .regex(/[A-Z]/, t('fields.password.validation.uppercase'))
      .regex(/\d/, t('fields.password.validation.number'))
      .regex(
        /[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]/,
        t('fields.password.validation.special_character'),
      ),
    actionType: z.enum(['signin', 'signup']),
  });

type LoginSchema = z.infer<ReturnType<typeof loginSchema>>;

export type SignInUpState = ServerActionForm<{
  email: ServerActionFormField<LoginSchema['email']>;
  password: ServerActionFormField<LoginSchema['password']>;
  actionType: ServerActionFormField<LoginSchema['actionType']>;
}>;

export async function login(
  locale: Locale,
  _initialState: SignInUpState,
  formData: FormData,
): Promise<SignInUpState> {
  const t = createTranslator(locale, 'pages.login');
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const actionType = formData.get('actionType') as 'signin' | 'signup';

  const validatedFields = loginSchema(t).safeParse({
    email,
    password,
    actionType,
  });

  if (!validatedFields.success) {
    const treeError = z.treeifyError(validatedFields.error);

    const res = {
      success: false,
      form: {
        email: {
          error: treeError.properties?.email?.errors[0],
          value: email,
        },
        password: {
          error: treeError.properties?.password?.errors[0],
          value: password,
        },
        actionType: {
          value: actionType,
        },
      },
    };

    console.log('res', res);

    return res;
  }

  const isSignUp = actionType === 'signup';

  try {
    const supabase = await supabaseService.createServerClient();
    const credentials = { email, password };

    const { error } = isSignUp
      ? await supabase.auth.signUp(credentials)
      : await supabase.auth.signInWithPassword(credentials);

    if (error) {
      throw error;
    }

    return {
      success: true,
      form: {
        email: {
          value: email,
        },
        password: {
          value: password,
        },
        actionType: {
          value: actionType,
        },
      },
    };
  } catch (error) {
    const defaultErrorMessage = t('messages.errors.general');
    let errorMessage = defaultErrorMessage;

    if (error instanceof AuthError) {
      switch (error.code) {
        case 'invalid_credentials':
          errorMessage = t('messages.errors.invalid_credentials');
          break;
        case 'email_not_verified':
          errorMessage = t('messages.errors.email_not_verified');
          break;
      }
    }

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'authentication',
        action: 'login',
        action_type: actionType,
      },
      extra: {
        email,
        errorMessage,
      },
    });

    return {
      success: false,
      error: { message: errorMessage },
      form: {
        email: {
          value: email,
        },
        password: {
          value: password,
        },
        actionType: {
          value: actionType,
        },
      },
    };
  }
}
