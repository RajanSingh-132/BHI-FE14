'use client';

interface AlertProps {
    type: 'error' | 'success' | 'warning' | 'info';
    title: string;
    message: string;
    onClose?: () => void;
}

const colors = {
    error: { bg: '#ef444415', border: '#ef444433', icon: '⚠', color: '#ef4444' },
    success: { bg: '#10b98115', border: '#10b98133', icon: '✓', color: '#10b981' },
    warning: { bg: '#f59e0b15', border: '#f59e0b33', icon: '!', color: '#f59e0b' },
    info: { bg: '#2563eb15', border: '#2563eb33', icon: 'i', color: '#3b82f6' },
};

export default function Alert({ type, title, message, onClose }: AlertProps) {
    const c = colors[type];
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '14px',
            padding: '16px 20px', borderRadius: '12px',
            background: c.bg, border: `1px solid ${c.border}`,
            animation: 'fadeUp 0.3s ease',
        }}>
            <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: c.border, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: c.color, fontWeight: 700, fontSize: '13px',
            }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: c.color, marginBottom: '3px', fontSize: '14px' }}>{title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</div>
            </div>
            {onClose && (
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px' }}>×</button>
            )}
        </div>
    );
}