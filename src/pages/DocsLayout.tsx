import { NavLink, Outlet } from 'react-router-dom'

const sidebarLinks = [
  { to: '/docs', label: 'Introducción', end: true },
  { to: '/docs/instalacion', label: 'Instalación' },
  { to: '/docs/comandos', label: 'Comandos' },
  { to: '/docs/arquitectura', label: 'Arquitectura' },
  { to: '/docs/perfiles', label: 'Perfiles Tecnológicos' },
  { to: '/docs/principios', label: 'Principios' },
  { to: '/docs/patrones', label: 'Convenciones' },
]

export function DocsLayout() {
  return (
    <div className="flex min-h-screen pt-20">
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-accent/10 p-6 gap-1">
        <span className="font-display text-xs tracking-widest text-light/40 uppercase mb-4">Documentación</span>
        {sidebarLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `text-sm py-2 px-3 rounded transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-light/60 hover:text-light hover:bg-white/5'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </aside>
      <div className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
