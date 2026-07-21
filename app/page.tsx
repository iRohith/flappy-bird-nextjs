import React from "react";
import FlappyBirdContainer from "../components/FlappyBirdContainer";

export const metadata = {
  title: "Flappy Bird - Next.js",
  description:
    "A retro pixel Flappy Bird game built with Next.js, Zustand, and TypeScript SVG graphics.",
};

export default function Page() {
  return <FlappyBirdContainer />;
}
