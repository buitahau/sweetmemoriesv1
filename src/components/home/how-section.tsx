const steps = [
  {
    title: 'Sign in with Google',
    text: 'One click. We use your Google account, so there is nothing new to remember.',
    badge: 'bg-[#FFC93C]',
    line: 'border-card-butter-shadow',
  },
  {
    title: 'Choose a template',
    text: 'Start from a layout made for a person, a first day, an adventure or a childhood.',
    badge: 'bg-[#FFB27A]',
    line: 'border-card-peach-shadow',
  },
  {
    title: 'Add photos and words',
    text: 'Fill in one block at a time while the page takes shape beside you.',
    badge: 'bg-[#9ADBBB]',
    line: 'border-card-mint-shadow',
  },
  {
    title: 'Publish and share',
    text: 'Your memory goes live at its own address. Send the link to anyone.',
    badge: 'bg-[#9CD0F5]',
    line: 'border-card-sky-shadow',
  },
] as const

export function HowSection() {
  return (
    <section
      id="how"
      className="mx-auto max-w-[1200px] px-5 pt-[88px] pb-24 md:px-10"
    >
      <h2 className="max-w-[18ch] font-display text-[32px] leading-[1.08] font-bold tracking-[-0.01em] md:text-5xl">
        From a pile of photos to a page, in four easy steps.
      </h2>
      <ol className="mt-[52px] grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-7 p-0">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className={`sm-step relative rounded-[28px] border-[2.5px] border-dashed bg-white px-6 pt-16 pb-7 ${s.line}`}
          >
            <span
              className={`sm-num absolute top-[-26px] left-6 flex size-16 items-center justify-center rounded-full border-4 border-cream font-display text-[30px] font-bold text-ink ${s.badge}`}
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <h3 className="font-display text-2xl leading-[1.2] font-semibold">
              {s.title}
            </h3>
            <p className="mt-2 text-[17px] text-[#4a3040]">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
