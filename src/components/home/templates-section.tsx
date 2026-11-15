const templates = [
  {
    name: 'One small moment',
    text: 'A title, a few words and one photo. The simplest way to keep something.',
    count: 3,
    paper: 'bg-card-peach',
    shadow: 'shadow-[0_8px_0_var(--color-card-peach-shadow)]',
    accent: 'bg-[#E8486A]',
  },
  {
    name: 'Growing up: ages 1 to 10',
    text: 'A year-by-year album. One page for each birthday, from one to ten.',
    count: 4,
    paper: 'bg-card-mint',
    shadow: 'shadow-[0_8px_0_var(--color-card-mint-shadow)]',
    accent: 'bg-[#2FA66A]',
  },
  {
    name: 'An adventure',
    text: 'A trip or an outing told in moments, with a route and the best photos.',
    count: 8,
    paper: 'bg-card-sky',
    shadow: 'shadow-[0_8px_0_var(--color-card-sky-shadow)]',
    accent: 'bg-[#2F86D6]',
  },
] as const

const blocks = [
  { name: 'Text', bg: 'bg-card-peach', rot: '-rotate-2' },
  { name: 'Timeline', bg: 'bg-card-sky', rot: 'rotate-2' },
  { name: 'Gallery', bg: 'bg-card-mint', rot: '-rotate-1' },
  { name: 'Carousel', bg: 'bg-card-butter', rot: 'rotate-[1.5deg]' },
  { name: '3×3 Photo Grid', bg: 'bg-card-lilac', rot: '-rotate-[1.5deg]' },
] as const

function MiniPage({ accent }: { accent: string }) {
  return (
    <div
      aria-hidden="true"
      className="relative h-[230px] overflow-hidden p-[26px]"
    >
      <div className="h-[22px] w-[46%] rounded-[11px] bg-ink opacity-85" />
      <div className="mt-2.5 h-[11px] w-[30%] rounded-md bg-ink opacity-30" />
      <div className="absolute top-[22px] right-[26px] h-[120px] w-24 rotate-[5deg] rounded-md bg-white p-[7px] pb-[22px] shadow-[0_8px_16px_rgba(59,36,51,0.16)]">
        <div className={`h-full rounded-[4px] opacity-50 ${accent}`} />
      </div>
      <div className="absolute right-[26px] bottom-6 left-[26px] flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[60px] flex-1 rounded-[14px] bg-white p-3">
            <div className={`h-[7px] rounded-[4px] ${accent}`} />
            <div className="mt-2 h-1.5 rounded-[3px] bg-ink opacity-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TemplatesSection() {
  return (
    <section id="templates" className="mx-5 rounded-[64px] bg-white md:mx-4">
      <div className="mx-auto max-w-[1200px] px-5 pt-24 pb-[100px] md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[16ch] font-display text-[32px] leading-[1.08] font-bold tracking-[-0.01em] md:text-5xl">
            Start simple, or tell the whole story.
          </h2>
          <p className="max-w-[40ch] text-lg text-ink-soft">
            Templates are built from friendly blocks. Some are a title and a
            photo. Others follow a child from one to ten.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-7">
          {templates.map((t) => (
            <article
              key={t.name}
              className={`sm-card flex flex-col overflow-hidden rounded-[32px] ${t.paper} ${t.shadow}`}
            >
              <MiniPage accent={t.accent} />
              <div className="m-[0_10px_10px] flex-auto rounded-3xl bg-white px-[22px] pt-[22px] pb-6">
                <h3 className="font-display text-[25px] leading-[1.2] font-semibold">
                  {t.name}
                </h3>
                <p className="mt-2 text-base text-[#4a3040]">{t.text}</p>
                <div
                  className={`mt-3 inline-block rounded-full px-3 py-0.5 text-sm font-semibold ${t.paper}`}
                >
                  {`${t.count} blocks`}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-[52px] text-center">
          <h3 className="font-display text-[22px] font-semibold">
            Made from building blocks
          </h3>
          <ul className="mt-4 flex list-none flex-wrap justify-center gap-2.5 p-0">
            {blocks.map((b) => (
              <li
                key={b.name}
                className={`inline-flex min-h-11 items-center rounded-full px-5 text-base font-semibold text-ink ${b.bg} ${b.rot}`}
              >
                {b.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
