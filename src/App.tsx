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

function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050505' }}>
      <Nav />
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
      <Footer />
    </div>
  )
}

export default App
