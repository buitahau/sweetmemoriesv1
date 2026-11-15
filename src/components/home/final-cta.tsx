const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink'

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="relative mt-[100px] overflow-hidden rounded-t-[64px] bg-pink-footer text-ink"
    >
      <div
        aria-hidden="true"
        className="animate-sm-blob pointer-events-none absolute -top-[90px] -right-[90px] size-[300px] rounded-full bg-[#ffd6e0]"
      />
      <div
        aria-hidden="true"
        className="animate-sm-blob pointer-events-none absolute -bottom-[110px] -left-[70px] size-[260px] rounded-full bg-[#ffadc0] [animation-direction:reverse] [animation-duration:12s]"
      />
      <div className="relative mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-8 px-5 pt-16 pb-[72px] md:px-10 md:pt-[88px] md:pb-[92px]">
        <div className="min-w-0 flex-[1_1_420px]">
          <h2
            id="final-cta-heading"
            className="font-display text-[36px] leading-[1.05] font-bold tracking-[-0.01em] md:text-[54px]"
          >
            Start with the memory everyone keeps telling.
          </h2>
          <p className="mt-3.5 max-w-[40ch] text-[18px] md:text-[21px]">
            It takes a template, a few photos and a few cozy minutes.
          </p>
        </div>
        <a
          href="/sign-in"
          className={`sm-btn inline-flex min-h-[64px] items-center rounded-full bg-white px-9 text-xl font-bold text-ink no-underline shadow-[0_6px_0_#e89aae] hover:shadow-[0_9px_0_#e89aae] focus-visible:shadow-[0_9px_0_#e89aae] active:shadow-[0_2px_0_#e89aae] ${focus}`}
        >
          Start with Google
        </a>
      </div>
    </section>
  )
}
