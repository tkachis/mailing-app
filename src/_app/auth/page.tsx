import { redirect } from 'next-globe-gen';

import { Routes } from 'src/configs';

export default function AuthPage() {
  redirect(Routes.login());
}
