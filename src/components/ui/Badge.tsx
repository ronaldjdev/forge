import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'accent' | 'error' | 'gray'
  className?: string
  children: ReactNode
}

const variants = {
  accent: 'bg-accent/10 border border-accent/30 text-accent',
  error: 'bg-red-900/20 text-accent',
  gray: 'bg-dark/50 text-light/80',
}

export function Badge({ variant = 'accent', className = '', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-mono ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
