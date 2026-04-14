import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  glow?: boolean;
}

export function Card({ children, style, glow }: CardProps) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${glow ? 'var(--border-glow)' : 'var(--border)'}`,
      borderRadius: '16px', padding: '24px',
      boxShadow: glow ? 'var(--glow)' : 'none',
      ...style,
    }}>
      {children}
    </div>
  );
}

export default Card;