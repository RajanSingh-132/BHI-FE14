'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, BarChart3, TrendingUp, Megaphone, FileText } from 'lucide-react';
import { useDataset } from '@/lib/store';

export default function MobileNav() {
  const pathname = usePathname();
  const { dataset } = useDataset();

  const navItems = [
    { label: 'UPLOAD', href: '/', id: 'upload', icon: Upload },
    { label: 'LEADS', href: '/analysis/leads', id: 'leads', icon: BarChart3 },
    { label: 'REVENUE', href: '/analysis/revenue', id: 'revenue', icon: TrendingUp },
    { label: 'ADS', href: '/analysis/ads', id: 'ads', icon: Megaphone },
    { label: 'SUMMARY', href: '/analysis/summary', id: 'summary', icon: FileText }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bottom-nav-blur border-t border-[var(--border)] z-50 pb-safe bg-[var(--bg)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const isDisabled = item.id !== 'upload' && !dataset;
          const Icon = item.icon;

          const content = (
            <div className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${
              isDisabled ? 'opacity-20 cursor-not-allowed grayscale' : isActive ? 'text-[var(--accent)] cursor-pointer' : 'text-[var(--text-muted)] cursor-pointer'
            }`}>
              <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-[var(--accent-soft)]' : 'bg-transparent'}`}>
                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
              </div>
              <span className={`text-[9px] font-bold tracking-wider ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </div>
          );

          if (isDisabled) {
            return <div key={item.label} className="flex-1 flex flex-col items-center justify-center h-full">{content}</div>;
          }

          return (
            <Link 
              key={item.label} 
              href={item.href}
              className="flex-1 no-underline h-full"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
