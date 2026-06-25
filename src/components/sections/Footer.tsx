import { useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const anchorLink = [
  { href: '#features', label: 'Características' },
  { href: '#arquitectura', label: 'Arquitectura' },
  { href: '#comandos', label: 'Comandos' },
  { href: '#instalacion', label: 'Instalación' },
]

const currentYear = new Date().getFullYear();

export function Footer() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleAnchor = useCallback((href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const id = href.replace('#', '')
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/' + href)
    }
  }, [pathname, navigate])

  return (
    <footer className="py-16 px-6 bg-dark border-t border-accent/20">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="mb-4">
              <span className="font-display text-xl tracking-tight text-ink">
                FORGE
              </span>
            </div>
            <p className="text-sm leading-relaxed text-light/60">
              Sistema operativo arquitectónico para backend. Modelo, construye,
              audita y evoluciona.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-ink">
              Producto
            </h4>
            <ul className="space-y-2">
              {anchorLink.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={handleAnchor(link.href)}
                    className="text-sm text-light/60 hover:text-light transition-opacity bg-transparent border-none cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-ink">
              Recursos
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/ronaldjdev/forge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-light/60 hover:text-light transition-opacity"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link to="/docs" className="text-sm text-light/60 hover:text-light transition-opacity">
                  Documentación
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/ronaldjdev/forge/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-light/60 hover:text-light transition-opacity"
                >
                  Issues
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-ink">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/ronaldjdev/forge/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-light/60 hover:text-light transition-opacity"
                >
                  Licencia Apache-2.0
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative w-full h-40 md:h-60 flex justify-center items-center pt-20 overflow-hidden">
          <span className="capitalize text-accent font-display tracking-tight text-[120px] md:text-[250px] lg:text-[400px]">
            forge
          </span>
          <div className="absolute inset-0 bg-linear-to-t from-dark to-transparent pointer-events-none" />
        </div>
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-accent/10">
          <p className="text-sm text-light/50">
            © {currentYear} Ronald J. Echeverry. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/ronaldjdev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:opacity-100 transition-opacity"
            >
              @ronaldjdev
            </a>
            <span className="text-sm text-light/30">|</span>
            <span className="text-sm text-light/50">
              Apache-2.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
