import React from 'react';

export function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`gradient-text-animated ${className}`}>
      {children}
    </span>
  );
}
