'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/', label: 'Dashboard', icon: '⬡' },
    { href: '/analysis/leads', label: 'Leads Analysis', icon: '◈' },
    { href: '/analysis/revenue', label: 'Revenue Analysis', icon: '◇' },
    { href: '/analysis/ads', label: 'Ads Analysis', icon: '◉' },
    { href: '/analysis/summary', label: 'Full Analysis', icon: '◎' },
];

export default function Sidebar() {
    const pathname = usePathname();
    return (
        <aside style={{
            position: 'fixed', left: 0, top: 0, bottom: 0, width: '240px',
            background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', zIndex: 100,
        }}>
            <div style={{ padding: '28px 24px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                    <span style={{ color: 'var(--accent-bright)' }}>BHI</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 400, marginLeft: '6px' }}>ANALYTICS</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', fontFamily: 'var(--font-dm-mono, DM Mono, monospace)' }}>
                    Intelligence Platform
                </div>
            </div>

            <nav style={{ flex: 1, padding: '16px 12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', padding: '8px 12px', marginBottom: '4px' }}>NAVIGATION</div>
                {navItems.map(item => {
                    const active = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '11px 12px', borderRadius: '8px', marginBottom: '2px',
                            textDecoration: 'none', transition: 'all 0.2s',
                            background: active ? 'var(--accent-soft)' : 'transparent',
                            color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
                            borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                        }}>
                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                            <span style={{ fontSize: '13px', fontWeight: active ? 600 : 400 }}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700, color: '#fff',
                    }}>A</div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>Admin User</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>admin@bhi.in</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}