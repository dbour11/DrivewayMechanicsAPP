// Custom vector illustration for the hero: a RAM-style heavy-duty pickup rigged
// to tow a car, wearing the DrivewayMechanics logo, with two uniformed mechanics
// holding tools beside it. Pure SVG — scalable, theme-matched, zero load weight.
// (RAM is a trademark; this is a RAM-inspired silhouette, not their badge.)

function Mechanic({
  x,
  skin,
  tool,
}: {
  x: number;
  skin: string;
  tool: "wrench" | "toolbox";
}) {
  return (
    <g transform={`translate(${x} 0)`}>
      {/* ground shadow */}
      <ellipse cx="0" cy="303" rx="26" ry="6" fill="#0f2e29" opacity="0.12" />
      {/* legs + boots */}
      <rect x="-13" y="258" width="11" height="42" rx="3" fill="#23413b" />
      <rect x="2" y="258" width="11" height="42" rx="3" fill="#23413b" />
      <rect x="-15" y="296" width="15" height="9" rx="2.5" fill="#0f2e29" />
      <rect x="0" y="296" width="15" height="9" rx="2.5" fill="#0f2e29" />
      {/* coveralls torso (brand uniform) */}
      <path
        d="M-17 214 q17 -12 34 0 l0 46 q-17 8 -34 0 Z"
        fill="#17966b"
      />
      <rect x="-17" y="214" width="34" height="10" rx="5" fill="#0f7a56" />
      <line x1="0" y1="222" x2="0" y2="258" stroke="#0f7a56" strokeWidth="2" />
      {/* name patch */}
      <rect x="-13" y="228" width="12" height="7" rx="1.5" fill="#eef6f2" />
      {/* head + cap */}
      <circle cx="0" cy="198" r="13" fill={skin} />
      <path d="M-14 195 q14 -20 28 0 Z" fill="#0f2e29" />
      <rect x="-15" y="193" width="30" height="4" rx="2" fill="#0f2e29" />
      {tool === "wrench" ? (
        <>
          {/* raised arm holding a wrench */}
          <path
            d="M13 224 q16 -6 20 -26"
            fill="none"
            stroke="#17966b"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <g transform="translate(33 196) rotate(24)">
            <rect x="-3.5" y="-2" width="7" height="30" rx="3" fill="#c9d3cf" />
            <path
              d="M-6 -12 a8 8 0 1 1 12 0 l-3 4 -6 0 Z"
              fill="#c9d3cf"
            />
            <circle cx="0" cy="-8" r="3.5" fill="#f2f8f5" />
          </g>
          {/* other arm at side */}
          <path
            d="M-13 224 q-8 12 -6 26"
            fill="none"
            stroke="#17966b"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* both arms down, holding a toolbox */}
          <path
            d="M13 224 q10 10 8 24"
            fill="none"
            stroke="#17966b"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M-13 224 q-10 10 -8 24"
            fill="none"
            stroke="#17966b"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <g transform="translate(0 252)">
            <rect x="-20" y="0" width="40" height="22" rx="3" fill="#e8743b" />
            <rect x="-20" y="0" width="40" height="7" rx="3" fill="#c85a28" />
            <rect x="-7" y="-6" width="14" height="8" rx="3" fill="#0f2e29" />
          </g>
        </>
      )}
    </g>
  );
}

export default function HeroArt() {
  return (
    <svg
      viewBox="0 0 640 470"
      role="img"
      aria-label="A DrivewayMechanics tow pickup towing a car, with two uniformed mechanics holding tools beside it."
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="hero-card">
          <rect x="6" y="6" width="628" height="424" rx="26" />
        </clipPath>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4faf7" />
          <stop offset="1" stopColor="#e7f2ed" />
        </linearGradient>
      </defs>

      <g clipPath="url(#hero-card)">
        {/* backdrop + ground */}
        <rect x="6" y="6" width="628" height="424" fill="url(#sky)" />
        <circle cx="120" cy="90" r="54" fill="#17966b" opacity="0.08" />
        <rect x="6" y="300" width="628" height="130" fill="#dcece4" />
        <line x1="6" y1="300" x2="634" y2="300" stroke="#c7ddd2" strokeWidth="2" />

        {/* ── Towed car (silver) ── */}
        <g>
          <ellipse cx="118" cy="300" rx="92" ry="9" fill="#0f2e29" opacity="0.12" />
          <path
            d="M70 224 q6 -34 34 -34 l40 0 q22 0 30 30 Z"
            fill="#b9c6c0"
          />
          <rect x="52" y="222" width="132" height="42" rx="11" fill="#9aa9a3" />
          <path
            d="M84 222 q4 -22 22 -22 l30 0 q16 0 22 22 Z"
            fill="#cdd8d3"
          />
          <rect x="92" y="204" width="24" height="18" rx="3" fill="#cfe6dd" />
          <rect x="120" y="204" width="24" height="18" rx="3" fill="#cfe6dd" />
          <circle cx="82" cy="266" r="22" fill="#1b2a27" />
          <circle cx="82" cy="266" r="10" fill="#cdd8d3" />
          <circle cx="158" cy="266" r="22" fill="#1b2a27" />
          <circle cx="158" cy="266" r="10" fill="#cdd8d3" />
        </g>

        {/* ── Tow bar / hitch ── */}
        <path
          d="M184 250 l24 4"
          stroke="#0f2e29"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path d="M186 244 l16 12 -16 6 Z" fill="#33514c" />

        {/* ── Pickup truck (brand green, RAM-style) ── */}
        <g>
          <ellipse cx="390" cy="300" rx="200" ry="10" fill="#0f2e29" opacity="0.14" />
          {/* bed side */}
          <rect x="206" y="190" width="168" height="72" rx="10" fill="#17966b" />
          <rect x="216" y="200" width="150" height="20" rx="6" fill="#0f7a56" />
          {/* cab */}
          <path
            d="M360 262 l0 -112 q0 -8 8 -8 l150 0 q10 0 16 12 l22 44 0 64 Z"
            fill="#17966b"
          />
          {/* hood shading */}
          <path d="M540 198 l16 32 0 32 -16 0 Z" fill="#0f7a56" />
          {/* crew-cab windows */}
          <rect x="374" y="158" width="150" height="44" rx="7" fill="#0f2e29" />
          <rect x="379" y="163" width="66" height="34" rx="4" fill="#cfe6dd" />
          <rect x="451" y="163" width="66" height="34" rx="4" fill="#cfe6dd" />
          {/* RAM-style tall blunt grille + slats */}
          <rect x="556" y="196" width="18" height="66" rx="4" fill="#0f2e29" />
          <line x1="560" y1="204" x2="560" y2="256" stroke="#c9d3cf" strokeWidth="2" />
          <line x1="565" y1="204" x2="565" y2="256" stroke="#c9d3cf" strokeWidth="2" />
          <line x1="570" y1="204" x2="570" y2="256" stroke="#c9d3cf" strokeWidth="2" />
          {/* headlight + bumper */}
          <rect x="546" y="200" width="12" height="12" rx="3" fill="#f2f8f5" />
          <rect x="548" y="256" width="30" height="14" rx="4" fill="#0f2e29" />
          {/* wheels */}
          <circle cx="270" cy="264" r="37" fill="#1b2a27" />
          <circle cx="270" cy="264" r="17" fill="#cdd8d3" />
          <circle cx="270" cy="264" r="6" fill="#8a978f" />
          <circle cx="502" cy="264" r="37" fill="#1b2a27" />
          <circle cx="502" cy="264" r="17" fill="#cdd8d3" />
          <circle cx="502" cy="264" r="6" fill="#8a978f" />

          {/* ── DrivewayMechanics logo on the door ── */}
          <g transform="translate(430 228)">
            <rect x="-58" y="-15" width="116" height="30" rx="8" fill="#0f2e29" />
            <circle cx="-42" cy="0" r="9" fill="#17966b" />
            <path
              d="M-46 -4 a4 4 0 1 1 6 5 l4 4 -2 2 -4 -4 a4 4 0 0 1 -4 -7 Z"
              fill="#eef6f2"
            />
            <text
              x="-28"
              y="4"
              fontFamily="Segoe UI, Roboto, Helvetica, Arial, sans-serif"
              fontSize="12.5"
              fontWeight="700"
              fill="#ffffff"
            >
              Driveway<tspan fill="#7fd8b6">Mechanics</tspan>
            </text>
          </g>
        </g>

        {/* ── Two mechanics beside the truck ── */}
        <Mechanic x={300} skin="#d8a67e" tool="wrench" />
        <Mechanic x={356} skin="#a9744e" tool="toolbox" />
      </g>

      {/* frame */}
      <rect
        x="6"
        y="6"
        width="628"
        height="424"
        rx="26"
        fill="none"
        stroke="#dfe8e4"
        strokeWidth="2"
      />
    </svg>
  );
}
