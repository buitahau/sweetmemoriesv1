import { Footer } from './home/footer'
import { Header } from './home/header'
import { Hero } from './home/hero'
import { HowSection } from './home/how-section'
import { TemplatesSection } from './home/templates-section'
import { WhoSection } from './home/who-section'

export function HomePage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="relative overflow-hidden rounded-b-[64px] bg-[#FFE9A8]">
        <Header />
        <Hero />
      </div>
      <main>
        <WhoSection />
        <HowSection />
        <TemplatesSection />
      </main>
      <Footer />
    </div>
  )
}
