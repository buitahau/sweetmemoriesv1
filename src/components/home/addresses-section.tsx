const HOME_ICON = 'M3.5 9.5L10 4l6.5 5.5V16h-4.2v-4.2H7.7V16H3.5z'
const PAGE_ICON =
  'M10 16.5s-6-3.8-6-8A3.3 3.3 0 0 1 10 6.6a3.3 3.3 0 0 1 6 1.9c0 4.2-6 8-6 8z'

const addresses = [
  {
    url: 'sam.sweetmemories.com',
    text: "Your family's home page. It lists everything you publish.",
    bg: 'bg-card-peach',
    icon: HOME_ICON,
  },
  {
    url: 'sam.sweetmemories.com/bob',
    text: 'A memory page about Bob.',
    bg: 'bg-card-mint',
    icon: PAGE_ICON,
  },
  {
    url: 'sam.sweetmemories.com/first-day-of-bob',
    text: "A memory page about Bob's first day.",
    bg: 'bg-card-butter',
    icon: PAGE_ICON,
  },
  {
    url: 'sam.sweetmemories.com/maple-street-party',
    text: 'A page the whole street can open.',
    bg: 'bg-card-sky',
    icon: PAGE_ICON,
  },
] as const

export function AddressesSection() {
  return (
    <section
      id="addresses"
      className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-14 px-5 pt-20 pb-[110px] md:px-10"
    >
      <div className="min-w-0 flex-[1_1_400px]">
        <h2 className="font-display text-[32px] leading-[1.08] font-bold tracking-[-0.01em] md:text-[46px]">
          Your family name first, then a page for each memory.
        </h2>
        <p className="mt-5 max-w-[38ch] text-[19px] text-ink-soft">
          Choose an address like sam.sweetmemories.com. Every memory you publish
          gets its own page underneath it, easy to say and easy to share at the
          dinner table.
        </p>
      </div>
      <div className="min-w-0 flex-[1_1_460px] overflow-hidden rounded-[28px] bg-white shadow-[0_8px_0_var(--color-cream-shadow)]">
        <ul className="m-0 list-none p-0">
          {addresses.map((a) => (
            <li
              key={a.url}
              className="sm-row flex flex-wrap items-center gap-4 border-t border-[#F1E4D4] px-6 py-[18px] transition-colors duration-200 first:border-t-0 hover:bg-pink-50"
            >
              <span
                className={`flex size-11 flex-none items-center justify-center rounded-full ${a.bg}`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    d={a.icon}
                    fill="none"
                    stroke="#3B2433"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="min-w-0 flex-[1_1_220px]">
                <span className="block text-lg font-bold [overflow-wrap:anywhere]">
                  {a.url}
                </span>
                <span className="block text-[15px] text-ink-soft">
                  {a.text}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
