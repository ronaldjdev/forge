import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../ui/Button'

const navLinks = [
  { href: '#features', label: 'Características' },
  { href: '#arquitectura', label: 'Arquitectura' },
  { href: '#comandos', label: 'Comandos' },
  { href: '#comparacion', label: 'Comparación' },
  { href: '#instalacion', label: 'Instalación' },
  { href: '/docs', label: 'Docs', external: false },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const isDocs = pathname.startsWith('/docs')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-screen"
      style={{
        backgroundColor: scrolled || isDocs ? 'rgba(20, 20, 20, 0.95)' : 'transparent',
        backdropFilter: scrolled || isDocs ? 'blur(12px)' : 'none',
        borderBottom: scrolled || isDocs ? '1px solid rgba(231, 255, 165, 0.1)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-xl tracking-tight text-ink">FORGE</Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.external === false ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-light/80 hover:text-light transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-light/80 hover:text-light transition-colors"
              >
                {link.label}
              </a>
            )
          )}
          <Button variant="primary" href="https://github.com/ronaldjdev/forge" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm">
            GitHub
          </Button>
        </div>

        <button
          className="md:hidden p-3 text-ink"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden px-6 pb-4"
            style={{ backgroundColor: 'rgba(5, 5, 5, 0.98)' }}
          >
            <div className="flex flex-col gap-4 pt-4 border-t border-accent/20">
              {navLinks.map((link) =>
                link.external === false ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-light"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-light"
                  >
                    {link.label}
                  </a>
                )
              )}
              <Button variant="primary" href="https://github.com/ronaldjdev/forge" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="px-4 py-2 text-sm text-center">
                GitHub
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
