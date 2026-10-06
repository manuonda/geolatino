type PuppinProps = {
  className?: string;
  size?: number;
};

/** Mascota de deporte: cachorro redondo con antena de Teletubby y pelota. */
export function Puppin({ className = "", size = 64 }: PuppinProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <ellipse cx="32" cy="58" rx="14" ry="3" fill="#03110f" opacity="0.35" />
      <rect x="30" y="6" width="4" height="12" rx="2" fill="#2f6b3a" />
      <circle cx="32" cy="8" r="6" fill="#f4ebd0" />
      <circle cx="32" cy="8" r="6" fill="none" stroke="#1c1410" strokeWidth="2" />
      <circle cx="32" cy="8" r="2.2" fill="#1c1410" />
      <path
        d="M18 28c-6-8-2-18 6-16 4 1 6 6 5 12"
        fill="#d49a32"
        stroke="#1c1410"
        strokeWidth="2"
      />
      <path
        d="M46 28c6-8 2-18-6-16-4 1-6 6-5 12"
        fill="#d49a32"
        stroke="#1c1410"
        strokeWidth="2"
      />
      <ellipse
        cx="32"
        cy="40"
        rx="20"
        ry="18"
        fill="#e4b44c"
        stroke="#1c1410"
        strokeWidth="2.5"
      />
      <path d="M14 42h36" stroke="#2f6b3a" strokeWidth="6" />
      <ellipse cx="32" cy="44" rx="12" ry="9" fill="#f4ebd0" />
      <circle cx="26" cy="38" r="3.2" fill="#1c1410" />
      <circle cx="38" cy="38" r="3.2" fill="#1c1410" />
      <circle cx="25.2" cy="37.2" r="1" fill="#f4ebd0" />
      <circle cx="37.2" cy="37.2" r="1" fill="#f4ebd0" />
      <ellipse cx="32" cy="45" rx="3.2" ry="2.2" fill="#1c1410" />
      <path
        d="M27 50c1.6 2 8.4 2 10 0"
        fill="none"
        stroke="#1c1410"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
