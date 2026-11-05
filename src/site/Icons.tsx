/** Line icons for the claim types. Drawn for ClaimValuator, 24×24, stroke uses currentColor. */
const PATHS: Record<string, React.ReactNode> = {
  injury: (
    <>
      <rect x="2.6" y="8.2" width="18.8" height="7.6" rx="3.8" transform="rotate(-45 12 12)" />
      <path d="M9.6 9.6l4.8 4.8" />
      <path d="M10.6 12.4h.01M12.4 10.6h.01M11.6 13.4h.01M13.4 11.6h.01" strokeWidth="2.2" />
    </>
  ),
  car: (
    <>
      <path d="M4.6 16.5H3a.9.9 0 0 1-.9-.9v-2.8l2.2-4.9A2 2 0 0 1 6.1 6.7h9.4a2 2 0 0 1 1.6.8l3 3.8 1.3.7a1 1 0 0 1 .5.9v2.8a.9.9 0 0 1-.9.9h-1.4" />
      <path d="M8.9 16.5h6.2" />
      <circle cx="6.8" cy="16.5" r="2" />
      <circle cx="17.2" cy="16.5" r="2" />
      <path d="M3.9 11.2h16.4M11 6.9v4.3" />
    </>
  ),
  truck: (
    <>
      <path d="M2.4 5.8h11v10.6h-11z" />
      <path d="M13.4 9h4l3.4 3.8v3.6h-7.4" />
      <circle cx="6.2" cy="17.6" r="1.8" />
      <circle cx="17.2" cy="17.6" r="1.8" />
      <path d="M15.6 9v3.8h5.2" />
    </>
  ),
  motorcycle: (
    <>
      <circle cx="5.4" cy="15.8" r="3.2" />
      <circle cx="18.6" cy="15.8" r="3.2" />
      <path d="M5.4 15.8l3.6-5.3h5.6l4 5.3" />
      <path d="M13.2 6.6h2.6l2.8 9.2" />
      <path d="M8 10.5l-1.3-2h3" />
    </>
  ),
  slip: (
    <>
      <circle cx="15" cy="4.6" r="1.8" />
      <path d="M14 7.6l-3.4 5.1 3.6 2.8-1.2 5" />
      <path d="M10.6 12.7l-4.8 1.6" />
      <path d="M13.2 9.3l4.3 2" />
      <path d="M2.8 20.8h18.4" />
      <path d="M4.5 18.2c.9 0 1.4-.9 1.4-1.8 0 .9.5 1.8 1.4 1.8" />
    </>
  ),
  dog: (
    <>
      <circle cx="6.6" cy="9.4" r="1.7" />
      <circle cx="10.2" cy="5.9" r="1.7" />
      <circle cx="14.6" cy="5.9" r="1.7" />
      <circle cx="18.1" cy="9.4" r="1.7" />
      <path d="M12.4 11.2c-2.7 0-5.3 3.4-5.3 5.7 0 1.6 1.2 2.6 2.7 2.6 1.1 0 1.7-.5 2.6-.5s1.5.5 2.6.5c1.5 0 2.7-1 2.7-2.6 0-2.3-2.6-5.7-5.3-5.7z" />
    </>
  ),
  medical: (
    <>
      <path d="M5.6 3.2v5a4.2 4.2 0 0 0 8.4 0v-5" />
      <path d="M4.4 3.2h2.4M12.8 3.2h2.4" />
      <path d="M9.8 12.4v2.4a4.6 4.6 0 0 0 9.2 0v-2.2" />
      <circle cx="19" cy="10.4" r="2" />
    </>
  ),
  work: (
    <>
      <path d="M2.4 17.6h19.2" />
      <path d="M4.4 17.6a7.6 7.6 0 0 1 15.2 0" />
      <path d="M9.8 10.6V6.8h4.4v3.8" />
      <path d="M7 17.6v2.2h10v-2.2" />
    </>
  ),
  offer: (
    <>
      <path d="M6 2.8h8.2l4 4v14.4H6z" />
      <path d="M14.2 2.8v4h4" />
      <path d="M9 14.2l2.1 2.1 4-4.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
}

export function ClaimIcon({ name, size = 28 }: { name: keyof typeof PATHS | string; size?: number }) {
  const body = PATHS[name] || PATHS.injury
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {body}
    </svg>
  )
}
