import { Footer } from './home/footer'
import { AddressesSection } from './home/addresses-section'
import { Header } from './home/header'
import { Hero } from './home/hero'
import { HowSection } from './home/how-section'
import { MomentsSection } from './home/moments-section'
import { TemplatesSection } from './home/templates-section'
import { WhoSection } from './home/who-section'

export function HomePage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="bg-band">
        <Header />
      </div>
      <main>
        <div className="relative overflow-hidden rounded-b-[64px] bg-band">
          <Hero />
        </div>
        <WhoSection />
        <HowSection />
        <TemplatesSection />
        <MomentsSection />
        <AddressesSection />
      </main>
      <Footer />
    </div>
  )
}
