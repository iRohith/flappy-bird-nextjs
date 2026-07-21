import React from "react";

export const FlappyLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="220"
      height="120"
      viewBox="0 0 220 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow
            dx="2"
            dy="4"
            stdDeviation="0"
            floodColor="#2b251b"
            floodOpacity="1"
          />
        </filter>
      </defs>
      <text
        x="50%"
        y="45"
        textAnchor="middle"
        fill="#fff071"
        stroke="#5b3c1f"
        strokeWidth="7"
        strokeLinejoin="round"
        fontFamily="Arial Black, Impact, sans-serif"
        fontSize="36"
        fontWeight="900"
        filter="url(#logoShadow)"
      >
        FLAPPY
      </text>
      <text
        x="50%"
        y="90"
        textAnchor="middle"
        fill="#fff071"
        stroke="#5b3c1f"
        strokeWidth="7"
        strokeLinejoin="round"
        fontFamily="Arial Black, Impact, sans-serif"
        fontSize="36"
        fontWeight="900"
        filter="url(#logoShadow)"
      >
        BIRD
      </text>
    </svg>
  );
};
export default FlappyLogo;
