export function Logo({
  size = 38,
  inverted = false,
}: {
  size?: number
  inverted?: boolean
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <rect
        width="30"
        height="30"
        rx="11"
        fill={inverted ? '#FFFFFF' : '#FF8FAB'}
      />
      <path
        d="M15 22s-6.5-4.1-6.5-8.4A3.6 3.6 0 0 1 15 11.6a3.6 3.6 0 0 1 6.5 2C21.5 17.9 15 22 15 22z"
        fill={inverted ? '#FF8FAB' : '#FFFFFF'}
      />
    </svg>
  )
}
