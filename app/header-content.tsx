'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import { Sun, Moon, Bell, Settings } from 'lucide-react';
import { useDataset } from '@/lib/store';

export function HeaderContent() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { dataset } = useDataset();

  const navItems = [
    { label: 'Upload', href: '/', id: 'upload' },
    { label: 'Leads', href: '/analysis/leads', id: 'leads' },
    { label: 'Revenue', href: '/analysis/revenue', id: 'revenue' },
    { label: 'Ads', href: '/analysis/ads', id: 'ads' },
    { label: 'Summary', href: '/analysis/summary', id: 'summary' }
  ];

  return (
    <header className="h-[60px] md:h-[80px] bg-[var(--bg)] flex items-center justify-between px-5 md:px-[60px] border-b border-[var(--border)] z-[100] shrink-0">
      <div className="flex-1 flex items-center">
        <Link href="/" className="no-underline">
          <span className="font-inter text-xl md:text-[28px] font-[800] text-[var(--text-primary)] tracking-tighter leading-none antialiased">
            Business Health Index
          </span>
        </Link>
      </div>

      <nav className="hidden md:flex gap-10">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const isDisabled = item.id !== 'upload' && !dataset;

          const content = (
            <div className={`relative py-[10px] ${isDisabled ? 'cursor-not-allowed opacity-30 select-none' : 'cursor-pointer'}`}>
              <span className={`text-[13px] transition-all duration-200 ${isActive ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-muted)]'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--accent)] rounded-[2px]" />
              )}
            </div>
          );

          if (isDisabled) {
            return <div key={item.label}>{content}</div>;
          }

          return (
            <Link key={item.label} href={item.href} className="no-underline">
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 flex items-center justify-end gap-3 md:gap-6">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTheme(); }}
          type="button"
          aria-label="Toggle Theme"
          className="p-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors border border-[var(--border)] flex items-center justify-center min-w-[40px] min-h-[40px]"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        
        <button className="hidden sm:flex bg-none border-none cursor-pointer items-center justify-center text-[var(--text-secondary)]">
          <Bell size={20} />
        </button>
        <button className="hidden md:flex bg-none border-none cursor-pointer items-center justify-center text-[var(--text-secondary)]">
          <Settings size={20} />
        </button>
        <div className="w-[34px] h-[34px] md:w-[38px] md:h-[38px] rounded-full bg-[var(--bg-card)] overflow-hidden border border-[var(--border)] shadow-sm">
          <img src="https://ui-avatars.com/api/?name=Admin&background=111827&color=fff&bold=true" alt="User" className="w-full h-full" />
        </div>
      </div>
    </header>
  );
}
