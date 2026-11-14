const faceColors = ['#FFC09A', '#BFE1FA', '#CDEFE0', '#E6DBFA', '#FFD59A']

const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

const heartPath =
  'M15 25s-10-6.3-10-13A5.5 5.5 0 0 1 15 9a5.5 5.5 0 0 1 10 3c0 6.7-10 13-10 13z'

function Face({ bg }: { bg: string }) {
  return (
    <svg
      className="sm-face animate-sm-pop -ml-2.5 rounded-full border-[3px] border-band bg-band"
      width="46"
      height="46"
      viewBox="0 0 60 60"
      aria-hidden="true"
    >
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

function Polaroid({
  className,
  photo,
  caption,
  children,
}: {
  className: string
  photo: string
  caption?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={`absolute rounded-md bg-white shadow-[0_10px_20px_rgba(31,74,56,0.2)] [transform-origin:50%_0] ${className}`}
    >
      <div className={`rounded ${photo}`} />
      {caption ? (
        <div className="absolute bottom-1 left-3 font-hand text-[22px] font-medium">
          {caption}
        </div>
      ) : null}
      {children}
    </div>
  )
}

function Collage() {
  return (
    <div className="relative h-[620px] min-w-[340px] min-[520px]:h-[560px] flex-[1_1_480px]">
      <div
        aria-hidden="true"
        className="absolute top-10 left-[30px] size-[440px] rounded-full bg-white opacity-55"
      />
      <svg
        aria-hidden="true"
        width="110"
        height="110"
        viewBox="0 0 90 90"
        className="absolute top-0 right-2.5 animate-sm-float"
      >
        <g
          stroke="#FFB020"
          strokeWidth="5"
          strokeLinecap="round"
          style={{
            transformOrigin: '45px 45px',
            animation: 'sm-spin 18s linear infinite',
          }}
        >
          <path d="M45 6v10M45 74v10M6 45h10M74 45h10M17 17l7 7M66 66l7 7M17 73l7-7M66 24l7-7" />
        </g>
        <circle cx="45" cy="45" r="22" fill="#FFC93C" />
        <circle cx="37" cy="41" r="2.8" fill="#3B2433" />
        <circle cx="53" cy="41" r="2.8" fill="#3B2433" />
        <path
          d="M36 51q9 8 18 0"
          fill="none"
          stroke="#3B2433"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <circle cx="31" cy="49" r="3.4" fill="#FF8FA3" opacity="0.6" />
        <circle cx="59" cy="49" r="3.4" fill="#FF8FA3" opacity="0.6" />
      </svg>
      <svg
        aria-hidden="true"
        width="120"
        height="72"
        viewBox="0 0 80 48"
        className="absolute top-[110px] left-0 animate-sm-drift"
      >
        <path
          d="M14 44a13 13 0 0 1 2-26 18 18 0 0 1 34-3 15 15 0 0 1 14 29z"
          fill="#FFFFFF"
        />
      </svg>

      <div className="absolute top-[70px] left-[60px] w-[min(380px,calc(100%-60px))] animate-sm-float-tilt overflow-hidden rounded-[28px] bg-white shadow-[0_24px_0_-8px_rgba(214,50,90,0.14),0_26px_48px_rgba(110,40,60,0.2)]">
        <div className="bg-card-peach px-4 py-3">
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[15px] font-semibold min-[400px]:px-4">
            <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true">
              <rect x="2" y="5" width="8" height="6" rx="1.5" fill="#6B4A5A" />
              <path
                d="M4 5V3.6a2 2 0 0 1 4 0V5"
                fill="none"
                stroke="#6B4A5A"
                strokeWidth="1.4"
              />
            </svg>
            <span className="min-w-0 truncate text-[10px] whitespace-nowrap min-[400px]:text-[11px] min-[520px]:text-[15px]">
              sam.sweetmemories.com/bobs-first-day
            </span>
          </div>
        </div>
        <div className="relative h-[380px] bg-card-mint px-7 py-[26px]">
          <div className="font-hand text-[44px] leading-[0.95] min-[400px]:text-[60px] font-bold text-forest">
            Bob's first day
          </div>
          <div className="mt-1 text-[15px] text-forest-soft">
            Big backpack, bigger smile.
          </div>
          <Polaroid
            className="bottom-[26px] left-[20px] w-[120px] min-[400px]:left-[26px] min-[400px]:w-[140px] animate-sm-sway-a p-2 pb-7"
            photo="h-[106px] bg-[#FFC1D0]"
            caption="at the gate"
          />
          <Polaroid
            className="bottom-[54px] left-[130px] w-[120px] min-[400px]:left-[160px] min-[400px]:w-[140px] animate-sm-sway-b p-2 pb-7 [animation-delay:0.4s]"
            photo="h-[106px] bg-[#BFE1FA]"
            caption="new friends"
          />
          <Polaroid
            className="top-[120px] right-[14px] w-[104px] min-[400px]:top-[100px] min-[400px]:right-[22px] min-[400px]:w-[120px] animate-sm-sway-c p-[7px] pb-6 [animation-delay:0.8s]"
            photo="h-[88px] bg-[#FFE08A]"
          >
            <div className="absolute -top-3 left-[34px] h-5 w-[54px] -rotate-3 rounded-[3px] bg-[#FFB27A] opacity-85" />
          </Polaroid>
        </div>
      </div>

      <svg
        aria-hidden="true"
        width="64"
        height="64"
        viewBox="0 0 30 30"
        className="absolute bottom-[90px] left-1.5 -rotate-12 animate-sm-beat"
      >
        <path d={heartPath} fill="#FF8A4C" />
      </svg>
      <svg
        aria-hidden="true"
        width="46"
        height="46"
        viewBox="0 0 40 40"
        className="absolute right-6 bottom-[150px] rotate-[14deg] animate-sm-twinkle"
      >
        <polygon
          points="20,3 25,14.5 37.5,15.5 28,23.5 31,36 20,29.5 9,36 12,23.5 2.5,15.5 15,14.5"
          fill="#FFC93C"
          stroke="#FFB020"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>

      <div className="absolute right-0 bottom-3.5 w-56 animate-sm-wiggle rounded-[22px] bg-white px-[18px] py-3.5 shadow-[0_16px_32px_rgba(110,40,60,0.2)]">
        <div className="text-[13px] text-ink-muted">Your page is live</div>
        <div className="mt-0.5 font-hand text-[28px] leading-none font-bold text-link">
          Share this link
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute top-[180px] -left-[120px] size-[380px] animate-sm-blob rounded-full bg-peach-blob opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute -top-[200px] -right-[140px] size-[420px] rounded-full bg-cream opacity-55"
      />
      <section className="relative mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-5 pt-7 pb-[110px] md:px-10">
        <div className="min-w-0 flex-[1_1_480px]">
          <div className="animate-sm-rise inline-flex items-center gap-2 rounded-full bg-white py-1.5 pr-4 pl-2.5 text-[15px] font-semibold">
            <svg width="22" height="22" viewBox="0 0 30 30" aria-hidden="true">
              <path d={heartPath} fill="#FF8A4C" />
            </svg>
            For families, little ones and whole neighborhoods
          </div>
          <h1 className="animate-sm-rise sm-d1 mt-[22px] font-display text-5xl leading-none font-bold tracking-[-0.02em] md:text-[76px]">
            Every little moment deserves a{' '}
            <span className="sm-hl animate-sm-hl rounded-[18px] px-3">
              home
            </span>
            .
          </h1>
          <p className="animate-sm-rise sm-d2 mt-6 max-w-[34ch] text-[22px] leading-normal text-ink-soft">
            Turn first steps, birthdays and street parties into tiny pages that
            everyone you love can open and share.
          </p>
          <div className="animate-sm-rise sm-d3 mt-[34px] flex flex-wrap items-center gap-5">
            <a
              href="/sign-in"
              className={`sm-btn inline-flex min-h-[60px] items-center gap-2.5 rounded-full bg-pink-200 px-8 text-[19px] font-bold text-ink no-underline shadow-sticker hover:shadow-sticker-hover focus-visible:shadow-sticker-hover active:shadow-sticker-press ${focus}`}
            >
              Start with Google
            </a>
            <a
              href="#how"
              className={`inline-flex min-h-11 items-center font-bold text-ink ${focus}`}
            >
              See how it works
            </a>
          </div>
          <p className="mt-[18px] text-[15px] text-ink-muted">
            No password to make. It is free to look around.
          </p>
          <div className="mt-[30px] flex flex-wrap items-center gap-3.5">
            <div className="flex pl-2.5" aria-hidden="true">
              {faceColors.map((bg) => (
                <Face key={bg} bg={bg} />
              ))}
            </div>
            <span className="text-[15px] font-semibold text-ink-soft">
              Made for the people you love to share with
            </span>
          </div>
        </div>
        <Collage />
      </section>
    </>
  )
}
