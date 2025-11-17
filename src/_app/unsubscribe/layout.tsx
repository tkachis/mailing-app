import { ReactNode } from 'react';

export default function UnsubscribeLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <main className='flex min-h-screen w-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'>
      {children}
    </main>
  );
}
