import type { Metadata } from 'next';
import { Syne, Outfit, DM_Mono } from 'next/font/google';
import './globals.css';
import { DatasetProvider } from '@/lib/store';
import { ThemeProvider } from '@/lib/theme';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

// ─── Font definitions ──────────────────────────────────────────────────────
const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BHI Analytics Platform',
  description: 'Business Intelligence & Analytics Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${outfit.variable} ${dmMono.variable}`}>
      <body>
        <ThemeProvider>
          <DatasetProvider>
            <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
              <Sidebar />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '240px' }}>
                <Header />
                <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                  {children}
                </main>
              </div>
            </div>
          </DatasetProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}