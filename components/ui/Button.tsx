import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  style,
  ...props
}: ButtonProps) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s ease', border: 'none', fontFamily: 'inherit',
    opacity: disabled || loading ? 0.6 : 1,
    pointerEvents: disabled || loading ? 'none' : 'auto',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#fff' },
    secondary: { background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' },
    outline: { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: 'none' },
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { height: '32px', padding: '0 12px', fontSize: '12px' },
    md: { height: '38px', padding: '0 16px', fontSize: '13px' },
    lg: { height: '44px', padding: '0 24px', fontSize: '14px' },
  };

  return (
    <button
      style={{ ...baseStyles, ...variants[variant], ...sizes[size], ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span style={{
          width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff', borderRadius: '50%', marginRight: '8px',
          animation: 'spin 0.6s linear infinite', display: 'inline-block',
        }} />
      )}
      {children}
    </button>
  );
};

export default Button;
