import { Logo } from './logo'

export function Footer() {
  return (
    <footer className="bg-[#FFC2D1] text-ink">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 pb-11 pt-8 text-[15px] md:px-10">
        <span className="flex items-center gap-2.5 font-display text-xl font-semibold">
          <Logo size={28} inverted />
          SweetMemories
        </span>
        <span>Small pages for the moments worth keeping.</span>
      </div>
    </footer>
  )
}
