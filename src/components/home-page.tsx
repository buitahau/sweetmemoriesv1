import { Footer } from './home/footer'
import { Header } from './home/header'
import { HowSection } from './home/how-section'
import { TemplatesSection } from './home/templates-section'
import { WhoSection } from './home/who-section'

export function HomePage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />
      <main>
        {/* Task 03 replaces this h1 together with task 11. */}
        <h1 className="p-8 text-center text-4xl font-semibold tracking-tight">
          SweetMemories home page
        </h1>
        <WhoSection />
        <HowSection />
        <TemplatesSection />
      </main>
      <Footer />
    </div>
  )
}
