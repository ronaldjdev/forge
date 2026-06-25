import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function SectionHeader({ title, description, children }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-20"
    >
      <h2 className="font-display text-4xl font-bold mb-4 text-ink">
        {title}
      </h2>
      {description && (
        <p className="text-lg max-w-2xl mx-auto text-light/70">
          {description}
        </p>
      )}
      {children}
    </motion.div>
  )
}
