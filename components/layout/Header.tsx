'use client';
import { usePathname } from 'next/navigation';
import { useDataset } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const titles: Record<string, string> = {
    '/': 'Dashboard — Upload Dataset',
    '/analysis/leads': 'Analysis — Leads Intelligence',
    '/analysis/revenue': 'Analysis — Revenue Metrics',
    '/analysis/ads': 'Analysis — Ads Performance',
    '/analysis/summary': 'Full Analysis Report',
};

export default function Header() {
    const pathname = usePathname();
    const { dataset } = useDataset();
    const { theme, toggleTheme } = useTheme();
    const title = titles[pathname] || 'BHI Analytics';

    return (
        <header style={{
            height: '64px', background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 32px', position: 'sticky', top: 0, zIndex: 50,
        }}>
            <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '16px', fontWeight: 700 }}>{title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {dataset && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 14px', borderRadius: '20px',
                        background: '#10b98115', border: '1px solid #10b98133',
                        fontSize: '12px', color: 'var(--success)',
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                        {dataset.name} — Active
                    </div>
                )}

                {/* Dark/Light Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    style={{
                        position: 'relative',
                        width: '52px', height: '28px',
                        borderRadius: '14px', border: 'none', cursor: 'pointer',
                        background: theme === 'dark'
                            ? 'linear-gradient(135deg, #1e293b, #334155)'
                            : 'linear-gradient(135deg, #93c5fd, #60a5fa)',
                        boxShadow: theme === 'dark'
                            ? 'inset 0 1px 3px rgba(0,0,0,0.4), 0 0 8px #2563eb22'
                            : 'inset 0 1px 3px rgba(0,0,0,0.1), 0 0 8px #60a5fa33',
                        transition: 'all 0.3s ease',
                        padding: 0,
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: '3px',
                        left: theme === 'dark' ? '3px' : '25px',
                        width: '22px', height: '22px',
                        borderRadius: '50%',
                        background: theme === 'dark'
                            ? 'linear-gradient(135deg, #1e3a5f, #0f172a)'
                            : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        boxShadow: theme === 'dark'
                            ? '0 0 6px #3b82f644'
                            : '0 0 8px #f59e0b55',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px',
                    }}>
                        {theme === 'dark' ? '🌙' : '☀️'}
                    </div>
                </button>
            </div>
        </header>
    );
}