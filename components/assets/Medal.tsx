import React from "react";

export type MedalType = "platinum" | "gold" | "silver" | "bronze" | "none";

interface MedalProps extends React.SVGProps<SVGSVGElement> {
  score: number;
}

export const Medal: React.FC<MedalProps> = ({ score, ...props }) => {
  let colors = {
    main: "#9cafb6",
    dark: "#687a82",
    light: "#c5d1d6",
    ring: "#526269",
    label: "NONE",
  };

  if (score >= 40) {
    colors = {
      main: "#e8d7f4",
      dark: "#b39bc8",
      light: "#ffffff",
      ring: "#83629e",
      label: "PLAT",
    };
  } else if (score >= 30) {
    colors = {
      main: "#f2cf45",
      dark: "#b58c14",
      light: "#fff18f",
      ring: "#826107",
      label: "GOLD",
    };
  } else if (score >= 20) {
    colors = {
      main: "#d8dce1",
      dark: "#808a96",
      light: "#f0f2f5",
      ring: "#545d69",
      label: "SLVR",
    };
  } else if (score >= 10) {
    colors = {
      main: "#d58a42",
      dark: "#844e1c",
      light: "#fad3ab",
      ring: "#572f09",
      label: "BRNZ",
    };
  }

  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="medalGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="70%" stopColor={colors.main} />
          <stop offset="100%" stopColor={colors.dark} />
        </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="32" cy="32" r="28" fill={colors.ring} />
      <circle cx="32" cy="32" r="25" fill="url(#medalGrad)" />

      {/* Sparkle highlight */}
      <path
        d="M20 20 L24 20 L24 24"
        stroke="#FFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <circle cx="20" cy="20" r="1.5" fill="#FFF" opacity="0.9" />

      {/* Decorative star or text in the center */}
      <polygon
        points="32,18 35,25 43,26 37,31 39,39 32,35 25,39 27,31 21,26 29,25"
        fill={colors.ring}
        opacity="0.8"
      />
      <circle cx="32" cy="32" r="6" fill="#FFF" opacity="0.3" />
    </svg>
  );
};
export default Medal;
