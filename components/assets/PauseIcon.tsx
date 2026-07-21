import React from "react";

export const PauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z" />
    </svg>
  );
};
export default PauseIcon;
