"use client";

import React, { useEffect } from "react";
import { useGameStore } from "../store/useGameStore";
import FlappyBirdCanvas from "./FlappyBirdCanvas";
import FlappyBirdUI from "./FlappyBirdUI";
import PlayIcon from "./assets/PlayIcon";
import PauseIcon from "./assets/PauseIcon";
import VolumeIcon from "./assets/VolumeIcon";
import MuteIcon from "./assets/MuteIcon";

export const FlappyBirdContainer: React.FC = () => {
  const paused = useGameStore((state) => state.paused);
  const muted = useGameStore((state) => state.muted);
  const mode = useGameStore((state) => state.mode);
  const togglePause = useGameStore((state) => state.togglePause);
  const toggleMute = useGameStore((state) => state.toggleMute);
  const beginRound = useGameStore((state) => state.beginRound);
  const flap = useGameStore((state) => state.flap);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (["Space", "ArrowUp", "KeyW", "Enter"].includes(event.code)) {
        event.preventDefault();
        if (paused) return;
        if (mode === "ready" || mode === "gameover") {
          beginRound();
        } else {
          flap();
        }
        return;
      }

      if (event.code === "KeyP" || event.code === "Escape") {
        event.preventDefault();
        togglePause();
        return;
      }

      if (event.code === "KeyM") {
        event.preventDefault();
        toggleMute();
        return;
      }

      if (event.code === "KeyR") {
        event.preventDefault();
        beginRound();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && mode === "playing" && !paused) {
        togglePause();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mode, paused, togglePause, toggleMute, beginRound, flap]);

  return (
    <main
      style={{
        height: "100dvh",
        boxSizing: "border-box",
        display: "grid",
        placeItems: "center",
        padding: "min(20px, 2vh)",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 15%, #273b46 0%, #11181d 48%, #080b0d 100%)",
        fontFamily: "Arial, Helvetica, sans-serif",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(92vw, 430px, calc((100dvh - 32px) * (288 / 512)))",
          maxHeight: "calc(100dvh - 32px)",
          aspectRatio: "288 / 512",
          borderRadius: 18,
          overflow: "hidden",
          background: "#70c5ce",
          boxShadow:
            "0 30px 80px rgba(0,0,0,.38), 0 0 0 2px rgba(255,255,255,.16) inset",
        }}
        aria-label="Flappy Bird game"
      >
        {/* Canvas renderer */}
        <FlappyBirdCanvas />

        {/* HUD & Overlay controls */}
        <FlappyBirdUI />

        {/* Top Control Bar */}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 20,
            display: "flex",
            gap: 7,
            pointerEvents: "auto",
          }}
        >
          {/* Pause / Play Button */}
          {(mode === "playing" || mode === "dying" || paused) && (
            <button
              type="button"
              onClick={() => togglePause()}
              style={{
                width: 34,
                height: 34,
                border: "2px solid rgba(255,255,255,.78)",
                borderRadius: 9,
                background: "rgba(0,0,0,.28)",
                color: "white",
                fontSize: 16,
                fontWeight: 900,
                lineHeight: 1,
                cursor: "pointer",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label={paused ? "Resume game" : "Pause game"}
              title="Pause / resume (P)"
            >
              {paused ? (
                <PlayIcon
                  style={{ width: 14, height: 14 }}
                  fill="currentColor"
                />
              ) : (
                <PauseIcon
                  style={{ width: 14, height: 14 }}
                  fill="currentColor"
                />
              )}
            </button>
          )}

          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={() => toggleMute()}
            style={{
              width: 34,
              height: 34,
              border: "2px solid rgba(255,255,255,.78)",
              borderRadius: 9,
              background: "rgba(0,0,0,.28)",
              color: "white",
              fontSize: 16,
              fontWeight: 900,
              lineHeight: 1,
              cursor: "pointer",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={muted ? "Unmute game" : "Mute game"}
            title="Mute / unmute (M)"
          >
            {muted ? (
              <MuteIcon style={{ width: 14, height: 14 }} fill="currentColor" />
            ) : (
              <VolumeIcon
                style={{ width: 14, height: 14 }}
                fill="currentColor"
              />
            )}
          </button>
        </div>
      </div>
    </main>
  );
};

export default FlappyBirdContainer;
