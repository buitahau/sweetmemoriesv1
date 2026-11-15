import { Logo } from './logo'

const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'
const anchorLink = `hidden min-h-11 items-center whitespace-nowrap px-3.5 font-semibold text-ink no-underline md:inline-flex ${focus}`

export function Header() {
  return (
    <header className="relative mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-5 md:gap-6 py-5 md:px-10">
      <a
        href="/"
        className={`flex items-center gap-2.5 text-ink no-underline ${focus}`}
      >
        <Logo />
        <span className="font-display text-xl font-semibold md:text-2xl tracking-tight">
          SweetMemories
        </span>
      </a>
      <nav
        aria-label="Main"
        className="flex flex-1 items-center justify-end gap-1.5 text-base"
      >
        <a href="#who" className={anchorLink}>
          Who it is for
        </a>
        <a href="#how" className={anchorLink}>
          How it works
        </a>
        <a href="#templates" className={anchorLink}>
          Templates
        </a>
        <a
          href="/sign-in"
          className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-white px-5 font-bold text-ink no-underline shadow-[0_4px_0_var(--color-butter-shadow)] ${focus}`}
        >
          Sign in
        </a>
      </nav>
    </header>
  )
}
