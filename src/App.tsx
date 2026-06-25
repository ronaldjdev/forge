import { Routes, Route } from 'react-router-dom'
import { Nav } from './components/sections/Nav'
import { Hero } from './components/sections/Hero'
import { Stats } from './components/sections/Stats'
import { Features } from './components/sections/Features'
import { HowItWorks } from './components/sections/HowItWorks'
import { Architecture } from './components/sections/Architecture'
import { Commands } from './components/sections/Commands'
import { Comparison } from './components/sections/Comparison'
import { Install } from './components/sections/Install'
import { Footer } from './components/sections/Footer'
import { DocsLayout } from './pages/DocsLayout'
import { Overview } from './pages/docs/Overview'
import { Installation } from './pages/docs/Installation'
import { CommandsPage } from './pages/docs/CommandsPage'
import { ArchitecturePage } from './pages/docs/ArchitecturePage'
import { Profiles } from './pages/docs/Profiles'
import { Principles } from './pages/docs/Principles'
import { Patterns } from './pages/docs/Patterns'

function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050505' }}>
      <Nav />
      <Routes>
        <Route path="/" element={
          <main>
            <Hero />
            <Stats />
            <Features />
            <HowItWorks />
            <Architecture />
            <Commands />
            <Comparison />
            <Install />
          </main>
        } />
        <Route path="/docs" element={<DocsLayout />}>
          <Route index element={<Overview />} />
          <Route path="instalacion" element={<Installation />} />
          <Route path="comandos" element={<CommandsPage />} />
          <Route path="arquitectura" element={<ArchitecturePage />} />
          <Route path="perfiles" element={<Profiles />} />
          <Route path="principios" element={<Principles />} />
          <Route path="patrones" element={<Patterns />} />
        </Route>
      </Routes>
      <Footer />
    </div>
  )
}

export default App
