'use client';

const steps = [
    { id: 'upload', label: 'Upload Dataset' },
    { id: 'leads', label: 'Leads Analysis' },
    { id: 'revenue', label: 'Revenue Analysis' },
    { id: 'ads', label: 'Ads Analysis' },
    { id: 'summary', label: 'Full Analysis' },
];

export default function StepIndicator({ current }: { current: string }) {
    const currentIdx = steps.findIndex(s => s.id === current);
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
            {steps.map((step, idx) => {
                const done = idx < currentIdx;
                const active = idx === currentIdx;
                return (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: idx < steps.length - 1 ? 1 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: 700, fontFamily: 'DM Mono, monospace',
                                background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--bg-card)',
                                border: `2px solid ${done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--border)'}`,
                                color: done || active ? '#fff' : 'var(--text-muted)',
                                boxShadow: active ? '0 0 16px var(--accent)44' : 'none',
                                transition: 'all 0.3s',
                            }}>
                                {done ? '✓' : idx + 1}
                            </div>
                            <span style={{
                                fontSize: '10px', whiteSpace: 'nowrap',
                                color: active ? 'var(--accent-bright)' : done ? 'var(--success)' : 'var(--text-muted)',
                                fontWeight: active ? 600 : 400,
                            }}>{step.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div style={{
                                flex: 1, height: '2px', margin: '0 8px', marginBottom: '18px',
                                background: done ? 'var(--success)' : 'var(--border)',
                                transition: 'background 0.3s',
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}