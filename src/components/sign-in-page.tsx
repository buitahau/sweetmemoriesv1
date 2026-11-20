import { useCallback, useMemo, useState } from 'react'
import { authClient } from '../lib/auth-client'
import { Logo } from './home/logo'
import {
  IDLE_LABEL,
  LOADING_LABEL,
  createSignInController,
  errorMessageFor,
  type SignInSocial,
} from './sign-in-state'

const FACES = ['#FFC09A', '#BFE1FA', '#CDEFE0', '#E6DBFA']

const PROMISES = [
  {
    text: 'No new password. We only use your name, email and profile photo.',
    bg: 'bg-pink-100',
  },
  {
    text: 'Your drafts stay private until you press Publish.',
    bg: 'bg-card-mint',
  },
]

const focus =
  'focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-link'

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-10l-7.9 6.1C6.6 42.6 14.6 48 24 48z"
      />
    </svg>
  )
}

function Illustration() {
  return (
    <section
      aria-hidden="true"
      className="bg-band relative min-h-[260px] flex-[1_1_560px] overflow-hidden rounded-br-[64px] rounded-tr-[64px] max-md:rounded-tr-none md:min-h-[420px]"
    >
      <div className="bg-peach-blob animate-sm-blob absolute -bottom-[90px] -left-[110px] size-[380px] rounded-full opacity-75" />
      <div className="bg-cream absolute -right-[120px] -top-[100px] size-[360px] rounded-full opacity-55" />

      <svg
        width="110"
        height="110"
        viewBox="0 0 90 90"
        className="animate-sm-float absolute right-[70px] top-[70px] max-md:right-6 max-md:top-6 max-md:size-20"
      >
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
        width="130"
        height="78"
        viewBox="0 0 80 48"
        className="animate-sm-drift absolute left-[60px] top-[120px] max-md:hidden"
      >
        <path
          d="M14 44a13 13 0 0 1 2-26 18 18 0 0 1 34-3 15 15 0 0 1 14 29z"
          fill="#FFFFFF"
        />
      </svg>

      <div className="absolute left-1/2 top-1/2 -ml-[210px] -mt-[150px] hidden h-[360px] w-[420px] min-[1080px]:block">
        <div className="animate-sm-sway-a absolute left-2.5 top-[30px] w-[190px] origin-top rounded-lg bg-white px-2.5 pb-10 pt-2.5 shadow-[0_14px_28px_rgba(110,40,60,0.2)]">
          <div className="h-[170px] rounded-[5px] bg-[#CDEFE0]" />
          <div className="font-hand absolute bottom-2 left-3.5 text-[26px] font-bold">
            first steps
          </div>
          <div className="absolute -top-3 left-[66px] h-[22px] w-[60px] -rotate-[4deg] rounded-[3px] bg-[#FF9DB3] opacity-85" />
        </div>
        <div className="animate-sm-sway-b absolute right-2.5 top-[70px] w-[190px] origin-top rounded-lg bg-white px-2.5 pb-10 pt-2.5 shadow-[0_14px_28px_rgba(110,40,60,0.2)]">
          <div className="h-[170px] rounded-[5px] bg-[#BFE1FA]" />
          <div className="font-hand absolute bottom-2 left-3.5 text-[26px] font-bold">
            Nana's garden
          </div>
          <div className="absolute -top-3 left-[66px] h-[22px] w-[60px] rotate-3 rounded-[3px] bg-[#FFC93C] opacity-85" />
        </div>
        <svg
          width="70"
          height="70"
          viewBox="0 0 30 30"
          className="animate-sm-beat absolute left-[172px] top-[240px]"
        >
          <path
            d="M15 25s-10-6.3-10-13A5.5 5.5 0 0 1 15 9a5.5 5.5 0 0 1 10 3c0 6.7-10 13-10 13z"
            fill="#FF7A93"
          />
        </svg>
      </div>

      <div className="absolute inset-x-0 bottom-6 px-8 text-center md:bottom-14">
        <div className="inline-flex">
          {FACES.map((color) => (
            <svg
              key={color}
              width="56"
              height="56"
              viewBox="0 0 60 60"
              className="animate-sm-pop border-band bg-band -mx-1.5 rounded-full border-[3px]"
            >
              <circle cx="30" cy="30" r="29" fill={color} />
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
          ))}
        </div>
        <div className="font-hand text-ink-soft mt-2.5 text-[26px] font-bold md:text-[30px]">
          Everyone's little moments, in one cozy place
        </div>
      </div>
    </section>
  )
}

export function SignInPage({
  error,
  signInSocial = authClient.signIn.social as SignInSocial,
}: {
  error?: string
  signInSocial?: SignInSocial
}) {
  const [view, setView] = useState<{
    loading: boolean
    message: string | null
  }>({ loading: false, message: errorMessageFor(error) })
  const start = useMemo(
    () => createSignInController(signInSocial, setView),
    [signInSocial],
  )
  const onClick = useCallback(() => {
    void start()
  }, [start])

  return (
    <div className="bg-cream text-ink font-body flex min-h-screen flex-wrap text-[17px] leading-[1.55]">
      <Illustration />
      <main className="box-border flex min-w-0 flex-[1_1_520px] items-center justify-center px-5 py-10 md:px-8 md:py-12">
        <div className="flex w-full max-w-[440px] flex-col gap-7">
          <a
            href="/"
            className={`text-ink animate-sm-rise flex items-center gap-2.5 self-start no-underline ${focus}`}
          >
            <Logo size={40} />
            <span className="font-display text-2xl font-semibold">
              SweetMemories
            </span>
          </a>

          <div className="animate-sm-rise sm-d1">
            <h1 className="font-display text-[36px] font-bold leading-[1.05] tracking-tight md:text-5xl">
              Welcome! Come on in.
            </h1>
            <p className="text-ink-soft mt-3 text-[19px]">
              Sign in to make a page for the moments your family keeps talking
              about.
            </p>
          </div>

          <div className="animate-sm-rise sm-d2 flex flex-col gap-[18px] rounded-panel bg-white px-7 py-8 shadow-[0_8px_0_var(--color-pink-edge)]">
            <button
              type="button"
              aria-busy={view.loading}
              disabled={view.loading}
              onClick={onClick}
              className={`text-ink flex min-h-[60px] w-full cursor-pointer disabled:cursor-wait disabled:opacity-80 items-center justify-center gap-3.5 rounded-full border-0 bg-pink-button text-lg font-bold shadow-[0_5px_0_var(--color-pink-400),inset_0_0_0_1.5px_#3B2433] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 active:translate-y-[3px] ${focus}`}
            >
              <span className="flex size-[34px] items-center justify-center rounded-full bg-white">
                <GoogleMark />
              </span>
              {view.loading ? LOADING_LABEL : IDLE_LABEL}
            </button>

            <div
              role="status"
              aria-live="polite"
              className="text-ink-soft min-h-[21px] text-center text-sm"
            >
              {view.message}
            </div>

            <div className="text-ink-muted flex items-center gap-3 text-sm">
              <span className="h-0.5 flex-1 rounded-[1px] bg-pink-edge" />
              <span>New here?</span>
              <span className="h-0.5 flex-1 rounded-[1px] bg-pink-edge" />
            </div>
            <p className="text-ink-card text-center text-[15px]">
              The same button makes your account.
            </p>
          </div>

          <ul className="animate-sm-rise sm-d3 text-ink-card flex list-none flex-col gap-2.5 p-0 text-[15px]">
            {PROMISES.map((p) => (
              <li key={p.text} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`${p.bg} flex size-7 flex-none items-center justify-center rounded-full`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path
                      d="M3 7.5l2.5 2.5L11 4.5"
                      fill="none"
                      stroke="#3B2433"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>

          <p className="animate-sm-rise sm-d3 text-ink-muted text-[13px]">
            <a
              href="/"
              className={`text-link hover:text-link-hover inline-flex min-h-11 items-center underline ${focus}`}
            >
              Back to home
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
