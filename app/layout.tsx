import type { Metadata } from 'next';
import { Syne, Inter } from 'next/font/google';
import './globals.css';
import { DatasetProvider } from '@/lib/store';
import { ThemeProvider } from '@/lib/theme';
import { HeaderContent } from './header-content';
import MobileNav from '@/components/layout/MobileNav';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Business Health Index',
  description: 'Enterprise Business Intelligence & Diagnostics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable}`}>
      <body>
        <ThemeProvider>
          <DatasetProvider>
            <div className="flex flex-col h-screen w-screen overflow-hidden">
              <HeaderContent />
              <main className="flex-1 flex flex-col overflow-y-auto md:overflow-hidden bg-[var(--bg)] pb-20 md:pb-0">
                {children}
              </main>
              <MobileNav />
            </div>
          </DatasetProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}