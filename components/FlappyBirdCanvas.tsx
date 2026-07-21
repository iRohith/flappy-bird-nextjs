"use client";

import React, { useEffect, useRef } from "react";
import { useGameStore } from "../store/useGameStore";
import { drawGame } from "../utils/canvasDraw";
import { WIDTH, HEIGHT } from "../utils/gameConstants";

export const FlappyBirdCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(WIDTH * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    let animationFrameId = 0;
    let lastTime = performance.now();

    // Initialize best score from LocalStorage on mount
    useGameStore.getState().initBestScore();

    const loop = (timestamp: number) => {
      const delta = Math.min(34, timestamp - lastTime || 16.67);
      lastTime = timestamp;
      const step = delta / (1000 / 60);

      // Perform physics updates
      useGameStore.getState().updateFrame(step, timestamp);

      // Draw game state
      const state = useGameStore.getState();
      drawGame(ctx, state);

      animationFrameId = window.requestAnimationFrame(loop);
    };

    animationFrameId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="application"
      aria-label="Flappy Bird Canvas"
      tabIndex={0}
      className="block w-full h-full cursor-pointer focus:outline-none"
      style={{
        imageRendering: "pixelated",
        touchAction: "none",
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.focus();
        const store = useGameStore.getState();
        if (store.paused) return;
        if (store.mode === "ready" || store.mode === "gameover") {
          store.beginRound();
        } else {
          store.flap();
        }
      }}
    />
  );
};

export default FlappyBirdCanvas;
