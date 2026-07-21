import React from "react";

export const MuteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V10.18L16.45 12.63C16.48 12.43 16.5 12.22 16.5 12ZM19 12C19 12.91 18.8 13.77 18.46 14.55L19.97 16.06C20.62 14.85 21 13.47 21 12C21 7.72 18.01 4.14 14 3.23V5.29C16.89 6.15 19 8.83 19 12ZM4.27 3L3 4.27L7.73 9H3V15H7L12 20V13.27L16.25 17.52C15.58 18.04 14.83 18.44 14 18.67V20.73C15.39 20.44 16.65 19.78 17.7 18.9L20.73 21.93L22 20.66L4.27 3ZM12 4L9.91 6.09L12 8.18V4Z" />
    </svg>
  );
};
export default MuteIcon;
