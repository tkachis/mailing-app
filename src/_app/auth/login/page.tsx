import { RiLock2Line } from '@remixicon/react';

import { LoginForm } from './components';

export default function Login() {
  return (
    <div className='border-stroke-soft-200 flex flex-col items-center gap-6 rounded-[20px] border bg-white p-4 shadow-2xs'>
      <RiLock2Line className='text-text-soft-400 size-12' />
      <LoginForm />
    </div>
  );
}
