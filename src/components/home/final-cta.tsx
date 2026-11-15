const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink'

export function FinalCta() {
  return (
    <section
      id="start"
      className="relative mx-5 mt-[100px] mb-[60px] overflow-hidden rounded-[48px] bg-pink-200 px-6 py-16 text-center md:mx-10 md:py-20"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="absolute -top-10 -left-10 size-40 rounded-full bg-band" />
        <span className="absolute -right-8 -bottom-12 size-48 rounded-full bg-peach-blob" />
        <span className="absolute top-10 right-[14%] size-8 rotate-12 rounded-[10px] bg-card-lilac" />
        <span className="absolute bottom-10 left-[12%] size-6 rounded-full bg-card-mint" />
      </div>
      <div className="relative">
        <h2 className="mx-auto max-w-[20ch] font-display text-[32px] leading-[1.1] font-bold text-ink md:text-[44px]">
          Start with the memory everyone keeps telling.
        </h2>
        <p className="mx-auto mt-3.5 max-w-[44ch] text-[19px] text-ink-soft">
          It takes a template, a few photos and a few cozy minutes.
        </p>
        <a
          href="/sign-in"
          className={`sm-btn mt-8 inline-flex min-h-[60px] items-center rounded-full bg-cream px-8 text-[19px] font-bold text-ink no-underline shadow-sticker hover:shadow-sticker-hover focus-visible:shadow-sticker-hover active:shadow-sticker-press ${focus}`}
        >
          Start with Google
        </a>
      </div>
    </section>
  )
}
