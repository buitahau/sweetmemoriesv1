const audiences = [
  {
    title: 'Families',
    text: 'Grandparents, parents and cousins in one place. Everyone can see the photos and the stories behind them.',
    example: "Grandpa's garden",
    card: 'bg-card-peach shadow-[0_8px_0_var(--color-card-peach-shadow)]',
    faces: [
      ['#FFC09A', 92],
      ['#FFD59A', 70],
      ['#BFE1FA', 52],
    ],
  },
  {
    title: 'Little ones',
    text: 'First steps, first days and every birthday from one to ten. A scrapbook that grows up with them.',
    example: 'Mia, one to ten',
    card: 'bg-card-butter shadow-[0_8px_0_var(--color-card-butter-shadow)]',
    faces: [
      ['#FFD59A', 56],
      ['#FFC09A', 78],
      ['#CDEFE0', 44],
    ],
  },
  {
    title: 'Neighborhoods and friends',
    text: 'A street party, a class trip or a team season. Keep the day and share it with everyone who was there.',
    example: 'Maple Street party',
    card: 'bg-card-mint shadow-[0_8px_0_var(--color-card-mint-shadow)]',
    faces: [
      ['#BFE1FA', 60],
      ['#E6DBFA', 84],
      ['#FFD59A', 60],
    ],
  },
] as const

function Face({ bg, size }: { bg: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="29" fill={bg} />
      <circle cx="21" cy="26" r="3.2" fill="#3B2433" />
      <circle cx="39" cy="26" r="3.2" fill="#3B2433" />
      <path
        d="M21 37q9 8 18 0"
        fill="none"
        stroke="#3B2433"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="14" cy="35" r="4" fill="#FF8FA3" opacity="0.6" />
      <circle cx="46" cy="35" r="4" fill="#FF8FA3" opacity="0.6" />
    </svg>
  )
}

export function WhoSection() {
  return (
    <section
      id="who"
      className="mx-auto max-w-[1200px] px-5 pt-[104px] pb-10 md:px-10"
    >
      <div className="text-center">
        <h2 className="mx-auto max-w-[20ch] font-display text-[32px] leading-[1.08] font-bold tracking-[-0.01em] md:text-5xl">
          A little corner of the internet for everyone who loves each other.
        </h2>
        <p className="mx-auto mt-[18px] max-w-[46ch] text-xl text-ink-soft">
          One page can be about one child, one summer or one street. Make it
          once and share it with everyone you love.
        </p>
      </div>
      <div className="mt-[52px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-7">
        {audiences.map((a) => (
          <article
            key={a.title}
            className={`sm-card flex flex-col gap-3.5 rounded-panel px-7 pt-7 pb-8 ${a.card}`}
          >
            <div
              className="sm-faces flex h-24 items-end gap-1.5"
              aria-hidden="true"
            >
              {a.faces.map(([bg, size]) => (
                <Face key={`${bg}-${size}`} bg={bg} size={size} />
              ))}
            </div>
            <h3 className="font-display text-[28px] leading-[1.15] font-semibold">
              {a.title}
            </h3>
            <p className="text-[17px] text-ink-card">{a.text}</p>
            <div className="mt-auto pt-1.5 font-hand text-2xl font-bold text-link-hover">
              {a.example}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
