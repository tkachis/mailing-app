'use server';

import { redirect } from 'next-globe-gen';

import { Routes } from 'src/configs';
import { supabaseService } from 'src/services';

export async function logout() {
  const supabase = await supabaseService.createServerClient();

  await supabase.auth.signOut();

  redirect(Routes.login(), { locale: 'en' });
}
