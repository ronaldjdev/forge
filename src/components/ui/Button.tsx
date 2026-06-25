import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ButtonProps {
  variant?: 'primary' | 'ghost'
  href?: string
  onClick?: () => void
  target?: string
  rel?: string
  className?: string
  children: ReactNode
}

const base = 'inline-flex items-center justify-center font-semibold transition-all'

const variants = {
  primary: 'bg-accent text-dark hover:scale-105',
  ghost: 'bg-surface text-ink border border-accent/30 hover:border-accent/50 hover:scale-105',
}

export function Button({
  variant = 'primary',
  href,
  onClick,
  target,
  rel,
  className = '',
  children,
}: ButtonProps) {
  const cls = `${base} ${variants[variant]} ${className}`

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        whileFocus={{ scale: 1.05, borderColor: 'rgba(231, 255, 165, 0.5)' }}
        className={cls}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      whileFocus={{ scale: 1.05, borderColor: 'rgba(231, 255, 165, 0.5)' }}
      className={cls}
    >
      {children}
    </motion.button>
  )
}
