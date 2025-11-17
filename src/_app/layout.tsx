import { Playfair_Display } from 'next/font/google';

import { Toaster } from 'src/components';

import type { Metadata, Viewport } from 'next';

import 'src/styles/globals.css';

const playfairDisplay = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mailing App',
  description: 'Mailing App',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${playfairDisplay.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
