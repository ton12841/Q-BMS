import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale} from 'next-intl/server';
import './globals.css';
import '@/i18n/i18n.css';

import AuthBootGuard from "../components/auth/AuthBootGuard";
export const metadata: Metadata = {
  title: 'Q BMS',
  description: 'Q Business Management System',
  icons: {
    icon: '/qbms-logo.png'
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>
        <AuthBootGuard />
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
