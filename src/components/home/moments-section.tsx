const moments = [
  {
    text: "Bob's first day",
    bg: 'bg-card-butter',
    shadow: 'shadow-[0_5px_0_var(--color-card-butter-shadow)]',
    rot: '-rotate-3',
  },
  {
    text: "Grandpa's garden",
    bg: 'bg-card-mint',
    shadow: 'shadow-[0_5px_0_var(--color-card-mint-shadow)]',
    rot: 'rotate-2',
  },
  {
    text: 'Maple Street party',
    bg: 'bg-card-peach',
    shadow: 'shadow-[0_5px_0_var(--color-card-peach-shadow)]',
    rot: '-rotate-1',
  },
  {
    text: 'Class of 3B',
    bg: 'bg-card-sky',
    shadow: 'shadow-[0_5px_0_var(--color-card-sky-shadow)]',
    rot: 'rotate-3',
  },
  {
    text: 'Mia, one to ten',
    bg: 'bg-card-lilac',
    shadow: 'shadow-[0_5px_0_var(--color-card-lilac-shadow)]',
    rot: '-rotate-2',
  },
  {
    text: 'The lake trip',
    bg: 'bg-[#FFE0C2]',
    shadow: 'shadow-[0_5px_0_#F2C08F]',
    rot: 'rotate-[1.5deg]',
  },
  {
    text: "Nana's recipes",
    bg: 'bg-card-butter',
    shadow: 'shadow-[0_5px_0_var(--color-card-butter-shadow)]',
    rot: '-rotate-[2.5deg]',
  },
  {
    text: 'Our new puppy',
    bg: 'bg-card-mint',
    shadow: 'shadow-[0_5px_0_var(--color-card-mint-shadow)]',
    rot: 'rotate-2',
  },
] as const

export function MomentsSection() {
  return (
    <section
      id="moments"
      className="mx-auto max-w-[1200px] px-5 pt-[100px] pb-10 text-center md:px-10"
    >
      <h2 className="mx-auto max-w-[20ch] font-display text-[32px] leading-[1.1] font-bold md:text-[44px]">
        Moments worth keeping
      </h2>
      <p className="mx-auto mt-3.5 max-w-[44ch] text-[19px] text-ink-soft">
        A few of the small pages you could make today.
      </p>
      <ul className="mt-9 flex list-none flex-wrap justify-center gap-x-[18px] gap-y-4 p-0">
        {moments.map((m) => (
          <li
            key={m.text}
            className={`inline-flex min-h-[52px] items-center rounded-[20px] px-6 font-hand text-[26px] font-bold ${m.bg} ${m.shadow} ${m.rot}`}
          >
            {m.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
