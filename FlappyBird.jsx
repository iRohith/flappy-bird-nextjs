"use client";

import { useEffect, useRef, useState } from "react";

const WIDTH = 288;
const HEIGHT = 512;
const GROUND_Y = 400;

const BIRD_X = 72;
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;

const PIPE_WIDTH = 52;
const PIPE_GAP = 104;
const PIPE_SPACING = 150;
const PIPE_SPEED = 2.05;

const GRAVITY = 0.285;
const FLAP_VELOCITY = -4.75;
const MAX_FALL_SPEED = 8.5;

const BEST_SCORE_KEY = "pure-jsx-flappy-best";

const shellStyle = {
  position: "relative",
  width: "min(92vw, 430px)",
  aspectRatio: `${WIDTH} / ${HEIGHT}`,
  borderRadius: 18,
  overflow: "hidden",
  background: "#70c5ce",
  boxShadow:
    "0 30px 80px rgba(0,0,0,.38), 0 0 0 2px rgba(255,255,255,.16) inset",
  userSelect: "none",
};

const canvasStyle = {
  display: "block",
  width: "100%",
  height: "100%",
  imageRendering: "pixelated",
  touchAction: "none",
  cursor: "pointer",
};

const controlBarStyle = {
  position: "absolute",
  top: 10,
  right: 10,
  zIndex: 2,
  display: "flex",
  gap: 7,
};

const controlButtonStyle = {
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
};

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function FlappyBird() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const mutedRef = useRef(false);
  const actionRef = useRef(() => {});
  const pauseRef = useRef(() => {});
  const muteActionRef = useRef(() => {});

  const [ui, setUi] = useState({
    mode: "ready",
    score: 0,
    best: 0,
    paused: false,
    muted: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(WIDTH * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    let storedBest = 0;
    try {
      storedBest = Number(window.localStorage.getItem(BEST_SCORE_KEY)) || 0;
    } catch {
      storedBest = 0;
    }

    const game = {
      mode: "ready",
      modeStartedAt: performance.now(),
      paused: false,
      score: 0,
      best: storedBest,
      bird: {
        x: BIRD_X,
        y: 230,
        velocityY: 0,
        rotation: 0,
        wingFrame: 0,
      },
      pipes: [],
      groundOffset: 0,
      backgroundOffset: 0,
      flash: 0,
      shake: 0,
      theme: Math.random() > 0.24 ? "day" : "night",
      lastTime: performance.now(),
      elapsed: 0,
    };

    let animationFrame = 0;

    function syncUi(patch) {
      setUi((current) => ({ ...current, ...patch }));
    }

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function getAudioContext() {
      if (mutedRef.current) return null;

      if (!audioRef.current) {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioRef.current = new AudioContextClass();
      }

      if (audioRef.current.state === "suspended") {
        audioRef.current.resume().catch(() => {});
      }

      return audioRef.current;
    }

    function tone({
      frequency,
      duration,
      delay = 0,
      type = "square",
      volume = 0.035,
      endFrequency = frequency,
    }) {
      const audio = getAudioContext();
      if (!audio) return;

      const start = audio.currentTime + delay;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, endFrequency),
        start + duration,
      );

      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    }

    function playFlap() {
      tone({
        frequency: 560,
        endFrequency: 760,
        duration: 0.07,
        type: "square",
        volume: 0.025,
      });
    }

    function playPoint() {
      tone({
        frequency: 880,
        endFrequency: 1060,
        duration: 0.08,
        type: "square",
        volume: 0.028,
      });
      tone({
        frequency: 1120,
        endFrequency: 1320,
        duration: 0.09,
        delay: 0.075,
        type: "square",
        volume: 0.024,
      });
    }

    function playHit() {
      tone({
        frequency: 170,
        endFrequency: 58,
        duration: 0.22,
        type: "sawtooth",
        volume: 0.055,
      });
    }

    function playGameOver() {
      tone({
        frequency: 260,
        endFrequency: 150,
        duration: 0.16,
        type: "square",
        volume: 0.025,
      });
      tone({
        frequency: 190,
        endFrequency: 95,
        duration: 0.24,
        delay: 0.14,
        type: "square",
        volume: 0.027,
      });
    }

    function createPipe(x) {
      return {
        x,
        gapY: randomBetween(118, GROUND_Y - 112),
        passed: false,
      };
    }

    function resetRound(mode = "ready") {
      game.mode = mode;
      game.modeStartedAt = performance.now();
      game.paused = false;
      game.score = 0;
      game.bird.x = BIRD_X;
      game.bird.y = 230;
      game.bird.velocityY = 0;
      game.bird.rotation = 0;
      game.bird.wingFrame = 0;
      game.pipes = [];
      game.flash = 0;
      game.shake = 0;
      game.theme = Math.random() > 0.24 ? "day" : "night";

      syncUi({
        mode,
        score: 0,
        best: game.best,
        paused: false,
        muted: mutedRef.current,
      });
    }

    function beginRound() {
      resetRound("playing");
      game.pipes = [createPipe(WIDTH + 72)];
      game.bird.velocityY = FLAP_VELOCITY;
      game.bird.rotation = -0.35;
      playFlap();
    }

    function flap() {
      if (game.mode !== "playing" || game.paused) return;
      game.bird.velocityY = FLAP_VELOCITY;
      game.bird.rotation = -0.42;
      game.bird.wingFrame = 0;
      playFlap();
    }

    function finishRound() {
      if (game.mode === "gameover") return;

      game.mode = "gameover";
      game.modeStartedAt = performance.now();
      game.bird.y = GROUND_Y - BIRD_HEIGHT / 2;
      game.bird.velocityY = 0;
      game.bird.rotation = Math.PI / 2;

      if (game.score > game.best) {
        game.best = game.score;
        try {
          window.localStorage.setItem(BEST_SCORE_KEY, String(game.best));
        } catch {
          // The game still works when local storage is unavailable.
        }
      }

      syncUi({
        mode: "gameover",
        score: game.score,
        best: game.best,
        paused: false,
      });
      playGameOver();
    }

    function crash() {
      if (game.mode !== "playing") return;
      game.mode = "dying";
      game.modeStartedAt = performance.now();
      game.bird.velocityY = Math.max(game.bird.velocityY, -1.4);
      game.flash = 1;
      game.shake = 7;
      syncUi({ mode: "dying", paused: false });
      playHit();
    }

    function birdHitsPipe() {
      const left = game.bird.x - BIRD_WIDTH / 2 + 4;
      const right = game.bird.x + BIRD_WIDTH / 2 - 3;
      const top = game.bird.y - BIRD_HEIGHT / 2 + 3;
      const bottom = game.bird.y + BIRD_HEIGHT / 2 - 3;

      for (const pipe of game.pipes) {
        const pipeLeft = pipe.x - 2;
        const pipeRight = pipe.x + PIPE_WIDTH + 2;

        if (right <= pipeLeft || left >= pipeRight) continue;

        const gapTop = pipe.gapY - PIPE_GAP / 2;
        const gapBottom = pipe.gapY + PIPE_GAP / 2;

        if (top < gapTop || bottom > gapBottom) return true;
      }

      return false;
    }

    function setPaused(nextPaused) {
      if (!["playing", "dying"].includes(game.mode)) return;
      game.paused = nextPaused;
      game.lastTime = performance.now();
      syncUi({ paused: nextPaused });
    }

    function togglePause() {
      setPaused(!game.paused);
    }

    function toggleMute() {
      mutedRef.current = !mutedRef.current;
      syncUi({ muted: mutedRef.current });
    }

    actionRef.current = () => {
      if (game.paused) return;

      if (game.mode === "ready" || game.mode === "gameover") {
        beginRound();
        return;
      }

      flap();
    };
    pauseRef.current = togglePause;
    muteActionRef.current = toggleMute;

    function handleKeyDown(event) {
      if (["Space", "ArrowUp", "KeyW", "Enter"].includes(event.code)) {
        event.preventDefault();
        actionRef.current();
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
    }

    function handleVisibilityChange() {
      if (document.hidden && game.mode === "playing" && !game.paused) {
        setPaused(true);
      }
    }

    function update(step, timestamp) {
      if (game.paused) return;

      game.elapsed += step;
      game.groundOffset = (game.groundOffset + PIPE_SPEED * step) % 24;
      game.backgroundOffset =
        (game.backgroundOffset + PIPE_SPEED * 0.24 * step) % WIDTH;

      if (game.mode === "ready") {
        game.bird.y = 226 + Math.sin(timestamp / 280) * 6;
        game.bird.rotation = -0.05 + Math.sin(timestamp / 420) * 0.04;
        game.bird.wingFrame = Math.floor(timestamp / 110) % 3;
        return;
      }

      if (game.mode === "playing") {
        game.bird.velocityY = Math.min(
          MAX_FALL_SPEED,
          game.bird.velocityY + GRAVITY * step,
        );
        game.bird.y += game.bird.velocityY * step;
        game.bird.rotation = Math.min(
          Math.PI / 2,
          game.bird.rotation + 0.055 * step,
        );
        game.bird.wingFrame = Math.floor(timestamp / 95) % 3;

        for (const pipe of game.pipes) {
          pipe.x -= PIPE_SPEED * step;

          if (!pipe.passed && pipe.x + PIPE_WIDTH < game.bird.x) {
            pipe.passed = true;
            game.score += 1;
            syncUi({ score: game.score });
            playPoint();
          }
        }

        const lastPipe = game.pipes[game.pipes.length - 1];
        if (!lastPipe || lastPipe.x < WIDTH - PIPE_SPACING) {
          game.pipes.push(createPipe(WIDTH + 8));
        }

        game.pipes = game.pipes.filter((pipe) => pipe.x > -PIPE_WIDTH - 12);

        if (game.bird.y - BIRD_HEIGHT / 2 <= 0) {
          game.bird.y = BIRD_HEIGHT / 2;
          crash();
          return;
        }

        if (birdHitsPipe()) {
          crash();
          return;
        }

        if (game.bird.y + BIRD_HEIGHT / 2 >= GROUND_Y) {
          playHit();
          finishRound();
        }
      } else if (game.mode === "dying") {
        game.bird.velocityY = Math.min(
          MAX_FALL_SPEED,
          game.bird.velocityY + GRAVITY * 1.25 * step,
        );
        game.bird.y += game.bird.velocityY * step;
        game.bird.rotation = Math.min(
          Math.PI / 2,
          game.bird.rotation + 0.09 * step,
        );

        if (game.bird.y + BIRD_HEIGHT / 2 >= GROUND_Y) {
          finishRound();
        }
      }

      game.flash = Math.max(0, game.flash - 0.08 * step);
      game.shake = Math.max(0, game.shake - 0.45 * step);
    }

    function drawPixelCloud(x, y, scale = 1) {
      ctx.fillStyle = game.theme === "night" ? "#d9e3e7" : "#f7fbef";
      ctx.fillRect(
        Math.round(x),
        Math.round(y + 7 * scale),
        34 * scale,
        9 * scale,
      );
      ctx.fillRect(
        Math.round(x + 7 * scale),
        Math.round(y + 2 * scale),
        20 * scale,
        14 * scale,
      );
      ctx.fillRect(
        Math.round(x + 13 * scale),
        Math.round(y - 3 * scale),
        10 * scale,
        9 * scale,
      );
      ctx.fillStyle =
        game.theme === "night" ? "rgba(122,150,168,.45)" : "#d9eee7";
      ctx.fillRect(
        Math.round(x + 4 * scale),
        Math.round(y + 14 * scale),
        27 * scale,
        3 * scale,
      );
    }

    function drawBackground() {
      const isNight = game.theme === "night";
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, isNight ? "#315779" : "#67c7d5");
      sky.addColorStop(1, isNight ? "#6d8592" : "#d6eee1");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, WIDTH, GROUND_Y);

      if (isNight) {
        ctx.fillStyle = "rgba(255,255,210,.92)";
        const stars = [
          [24, 42],
          [73, 76],
          [111, 34],
          [161, 65],
          [210, 28],
          [255, 88],
          [36, 134],
          [132, 121],
          [234, 149],
        ];
        for (const [x, y] of stars) ctx.fillRect(x, y, 2, 2);

        ctx.fillStyle = "#f4f1c6";
        ctx.beginPath();
        ctx.arc(235, 57, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#315779";
        ctx.beginPath();
        ctx.arc(243, 51, 17, 0, Math.PI * 2);
        ctx.fill();
      }

      const cloudShift = game.backgroundOffset * 0.38;
      drawPixelCloud(22 - cloudShift, 88, 0.85);
      drawPixelCloud(171 - cloudShift, 126, 1.05);
      drawPixelCloud(310 - cloudShift, 72, 0.75);

      ctx.fillStyle = isNight ? "#718b8c" : "#9bd3bc";
      ctx.beginPath();
      ctx.moveTo(0, 315);
      ctx.lineTo(40, 273);
      ctx.lineTo(79, 309);
      ctx.lineTo(126, 257);
      ctx.lineTo(177, 307);
      ctx.lineTo(223, 270);
      ctx.lineTo(288, 315);
      ctx.lineTo(288, GROUND_Y);
      ctx.lineTo(0, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      const buildingColor = isNight ? "#496b70" : "#77b5a6";
      const buildingHighlight = isNight ? "#729094" : "#9cd0bd";
      const buildingWidths = [24, 34, 20, 28, 40, 22, 31, 27, 36];
      let x = -Math.round(game.backgroundOffset * 0.7) - 20;
      let index = 0;

      while (x < WIDTH + 50) {
        const width = buildingWidths[index % buildingWidths.length];
        const height = 38 + ((index * 17) % 42);
        const y = GROUND_Y - 36 - height;

        ctx.fillStyle = buildingColor;
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = buildingHighlight;
        ctx.fillRect(x + 4, y + 5, 4, 6);
        ctx.fillRect(x + 13, y + 5, 4, 6);
        ctx.fillRect(x + 4, y + 18, 4, 6);
        if (width > 25) ctx.fillRect(x + 17, y + 18, 4, 6);

        x += width + 8;
        index += 1;
      }

      ctx.fillStyle = isNight ? "#38605e" : "#5da98c";
      for (let bushX = -20; bushX < WIDTH + 30; bushX += 26) {
        const offset = (game.backgroundOffset * 0.9) % 26;
        ctx.beginPath();
        ctx.arc(bushX - offset, GROUND_Y - 22, 19, Math.PI, 0);
        ctx.fill();
      }

      ctx.fillStyle = isNight ? "#284c4b" : "#4a9678";
      ctx.fillRect(0, GROUND_Y - 23, WIDTH, 23);
    }

    function drawPipeBody(x, y, width, height) {
      if (height <= 0) return;

      ctx.fillStyle = "#263313";
      ctx.fillRect(x - 2, y - 2, width + 4, height + 4);
      ctx.fillStyle = "#65b92e";
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "#9ee44b";
      ctx.fillRect(x + 5, y, 8, height);
      ctx.fillStyle = "#d1f06b";
      ctx.fillRect(x + 10, y, 4, height);
      ctx.fillStyle = "#3a8523";
      ctx.fillRect(x + width - 12, y, 8, height);
      ctx.fillStyle = "rgba(21,66,21,.35)";
      ctx.fillRect(x + width - 4, y, 4, height);
    }

    function drawPipe(pipe) {
      const x = Math.round(pipe.x);
      const gapTop = Math.round(pipe.gapY - PIPE_GAP / 2);
      const gapBottom = Math.round(pipe.gapY + PIPE_GAP / 2);
      const capHeight = 24;

      drawPipeBody(x + 4, 0, PIPE_WIDTH - 8, gapTop - capHeight + 2);
      drawPipeBody(x, gapTop - capHeight, PIPE_WIDTH, capHeight);

      ctx.fillStyle = "#263313";
      ctx.fillRect(x - 2, gapTop - capHeight - 2, PIPE_WIDTH + 4, 4);
      ctx.fillStyle = "#d1f06b";
      ctx.fillRect(x + 7, gapTop - capHeight + 3, 5, capHeight - 6);
      ctx.fillStyle = "#377b20";
      ctx.fillRect(
        x + PIPE_WIDTH - 11,
        gapTop - capHeight + 2,
        7,
        capHeight - 4,
      );

      drawPipeBody(x, gapBottom, PIPE_WIDTH, capHeight);
      drawPipeBody(
        x + 4,
        gapBottom + capHeight - 2,
        PIPE_WIDTH - 8,
        GROUND_Y - gapBottom - capHeight + 2,
      );

      ctx.fillStyle = "#263313";
      ctx.fillRect(x - 2, gapBottom + capHeight - 2, PIPE_WIDTH + 4, 4);
      ctx.fillStyle = "#d1f06b";
      ctx.fillRect(x + 7, gapBottom + 3, 5, capHeight - 6);
      ctx.fillStyle = "#377b20";
      ctx.fillRect(x + PIPE_WIDTH - 11, gapBottom + 2, 7, capHeight - 4);
    }

    function drawGround() {
      ctx.fillStyle = "#283514";
      ctx.fillRect(0, GROUND_Y - 2, WIDTH, 4);
      ctx.fillStyle = "#8fd33e";
      ctx.fillRect(0, GROUND_Y + 2, WIDTH, 9);
      ctx.fillStyle = "#d9ef66";
      ctx.fillRect(0, GROUND_Y + 3, WIDTH, 4);

      const offset = Math.round(game.groundOffset);
      for (let x = -24 - offset; x < WIDTH + 24; x += 24) {
        ctx.fillStyle = "#4e9f31";
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y + 11);
        ctx.lineTo(x + 9, GROUND_Y + 2);
        ctx.lineTo(x + 15, GROUND_Y + 2);
        ctx.lineTo(x + 6, GROUND_Y + 11);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = "#ded895";
      ctx.fillRect(0, GROUND_Y + 11, WIDTH, HEIGHT - GROUND_Y - 11);
      ctx.fillStyle = "#f5e8ad";
      ctx.fillRect(0, GROUND_Y + 16, WIDTH, 4);
      ctx.fillStyle = "#c7bd74";
      ctx.fillRect(0, GROUND_Y + 30, WIDTH, 3);

      for (let x = -offset; x < WIDTH + 20; x += 24) {
        ctx.fillStyle = "rgba(137,119,62,.26)";
        ctx.fillRect(x + 5, GROUND_Y + 44, 8, 3);
        ctx.fillRect(x + 16, GROUND_Y + 68, 5, 3);
      }
    }

    function drawBird() {
      const bird = game.bird;
      ctx.save();
      ctx.translate(Math.round(bird.x), Math.round(bird.y));
      ctx.rotate(bird.rotation);

      const wingOffsets = [3, 6, 0];
      const wingY = wingOffsets[bird.wingFrame % wingOffsets.length];

      ctx.fillStyle = "#2b2414";
      ctx.fillRect(-15, -8, 24, 19);
      ctx.fillRect(-10, -12, 18, 4);
      ctx.fillRect(7, -8, 7, 15);
      ctx.fillRect(-10, 11, 17, 3);

      ctx.fillStyle = "#f2c12b";
      ctx.fillRect(-12, -8, 19, 17);
      ctx.fillStyle = "#ffe55c";
      ctx.fillRect(-8, -8, 14, 5);
      ctx.fillStyle = "#d99a1d";
      ctx.fillRect(-11, 5, 17, 4);

      ctx.fillStyle = "#332719";
      ctx.fillRect(-17, wingY - 3, 13, 10);
      ctx.fillStyle = "#f8dc3f";
      ctx.fillRect(-15, wingY - 2, 10, 7);
      ctx.fillStyle = "#fff17a";
      ctx.fillRect(-13, wingY - 2, 7, 3);

      ctx.fillStyle = "#332719";
      ctx.fillRect(3, -11, 11, 13);
      ctx.fillStyle = "#fff";
      ctx.fillRect(5, -9, 8, 9);
      ctx.fillStyle = "#171717";
      ctx.fillRect(10, -7, 3, 5);
      ctx.fillStyle = "#fff";
      ctx.fillRect(10, -7, 1, 1);

      ctx.fillStyle = "#2f2118";
      ctx.fillRect(12, -1, 13, 9);
      ctx.fillStyle = "#f35a32";
      ctx.fillRect(13, 0, 11, 4);
      ctx.fillStyle = "#dd351f";
      ctx.fillRect(13, 4, 9, 3);
      ctx.fillStyle = "#fff1a0";
      ctx.fillRect(14, 0, 9, 2);

      ctx.restore();
    }

    function drawOutlinedText(
      text,
      x,
      y,
      size,
      {
        fill = "#fff",
        stroke = "#2b251b",
        lineWidth = 5,
        align = "center",
        font = "Arial Black, Impact, sans-serif",
      } = {},
    ) {
      ctx.save();
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.font = `900 ${size}px ${font}`;
      ctx.lineJoin = "round";
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = stroke;
      ctx.fillStyle = fill;
      ctx.strokeText(String(text), x, y);
      ctx.fillText(String(text), x, y);
      ctx.restore();
    }

    function drawScore() {
      drawOutlinedText(game.score, WIDTH / 2, 56, 42, {
        lineWidth: 6,
      });
    }

    function drawReadyOverlay() {
      drawOutlinedText("FLAPPY", WIDTH / 2, 82, 36, {
        fill: "#fff071",
        stroke: "#5b3c1f",
        lineWidth: 7,
      });
      drawOutlinedText("BIRD", WIDTH / 2, 119, 36, {
        fill: "#fff071",
        stroke: "#5b3c1f",
        lineWidth: 7,
      });
      drawOutlinedText("GET READY", WIDTH / 2, 173, 22, {
        fill: "#fff",
        lineWidth: 4,
      });

      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,.94)";
      ctx.strokeStyle = "#5c4a2b";
      ctx.lineWidth = 3;
      roundedRectPath(ctx, 76, 280, 136, 57, 9);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      drawOutlinedText("TAP", WIDTH / 2, 296, 15, {
        fill: "#e26f42",
        stroke: "#fff",
        lineWidth: 2,
      });
      drawOutlinedText("OR PRESS SPACE", WIDTH / 2, 319, 11, {
        fill: "#4b4435",
        stroke: "#fff",
        lineWidth: 1.5,
        font: "Arial, sans-serif",
      });
    }

    function medalColor(score) {
      if (score >= 40) return "#e8d7f4";
      if (score >= 30) return "#f2cf45";
      if (score >= 20) return "#d8dce1";
      if (score >= 10) return "#d58a42";
      return "#9cafb6";
    }

    function drawGameOverOverlay() {
      drawOutlinedText("GAME OVER", WIDTH / 2, 121, 31, {
        fill: "#fff",
        stroke: "#5b3c1f",
        lineWidth: 6,
      });

      ctx.save();
      ctx.fillStyle = "#ead8a1";
      ctx.strokeStyle = "#5b4b2c";
      ctx.lineWidth = 4;
      roundedRectPath(ctx, 29, 156, 230, 142, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f7e9b7";
      roundedRectPath(ctx, 35, 162, 218, 130, 7);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#7b6740";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "900 12px Arial, sans-serif";
      ctx.fillText("MEDAL", 49, 179);
      ctx.fillText("SCORE", 159, 179);
      ctx.fillText("BEST", 165, 232);

      ctx.save();
      ctx.fillStyle = "#5b4b2c";
      ctx.beginPath();
      ctx.arc(84, 224, 31, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = medalColor(game.score);
      ctx.beginPath();
      ctx.arc(84, 224, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.fillRect(70, 210, 9, 5);
      ctx.fillRect(66, 217, 6, 9);
      ctx.restore();

      drawOutlinedText(game.score, 225, 204, 25, {
        align: "right",
        lineWidth: 4,
      });
      drawOutlinedText(game.best, 225, 257, 25, {
        align: "right",
        lineWidth: 4,
      });

      ctx.save();
      ctx.fillStyle = "#e66d37";
      ctx.strokeStyle = "#5b321d";
      ctx.lineWidth = 4;
      roundedRectPath(ctx, 66, 322, 156, 48, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ff9a54";
      ctx.fillRect(74, 328, 140, 5);
      ctx.restore();

      drawOutlinedText("RESTART", WIDTH / 2, 347, 18, {
        fill: "#fff",
        stroke: "#7e351f",
        lineWidth: 4,
      });
      drawOutlinedText("tap, space, or R", WIDTH / 2, 387, 11, {
        fill: "#fff",
        stroke: "rgba(38,38,26,.72)",
        lineWidth: 3,
        font: "Arial, sans-serif",
      });
    }

    function drawPauseOverlay() {
      ctx.fillStyle = "rgba(20,28,30,.48)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      drawOutlinedText("PAUSED", WIDTH / 2, 226, 31, {
        fill: "#fff",
        lineWidth: 6,
      });
      drawOutlinedText("PRESS P TO CONTINUE", WIDTH / 2, 265, 12, {
        fill: "#fff",
        stroke: "#2d2a22",
        lineWidth: 3,
        font: "Arial, sans-serif",
      });
    }

    function draw() {
      ctx.save();
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      if (game.shake > 0) {
        ctx.translate(
          Math.round((Math.random() - 0.5) * game.shake),
          Math.round((Math.random() - 0.5) * game.shake),
        );
      }

      drawBackground();
      for (const pipe of game.pipes) drawPipe(pipe);
      drawGround();
      drawBird();

      if (game.mode === "playing" || game.mode === "dying") {
        drawScore();
      } else if (game.mode === "ready") {
        drawReadyOverlay();
      } else if (game.mode === "gameover") {
        drawGameOverOverlay();
      }

      if (game.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.72, game.flash)})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      ctx.restore();

      if (game.paused) drawPauseOverlay();
    }

    function loop(timestamp) {
      const delta = Math.min(34, timestamp - game.lastTime || 16.67);
      game.lastTime = timestamp;
      const step = delta / (1000 / 60);

      update(step, timestamp);
      draw();
      animationFrame = window.requestAnimationFrame(loop);
    }

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resetRound("ready");
    animationFrame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      actionRef.current = () => {};
      pauseRef.current = () => {};
      muteActionRef.current = () => {};

      if (audioRef.current) {
        audioRef.current.close().catch(() => {});
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 15%, #273b46 0%, #11181d 48%, #080b0d 100%)",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <section style={shellStyle} aria-label="Flappy Bird game">
        <canvas
          ref={canvasRef}
          style={canvasStyle}
          role="application"
          aria-label="Flappy Bird. Tap or press Space to flap."
          tabIndex={0}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.focus();
            actionRef.current();
          }}
        />

        <div style={controlBarStyle}>
          <button
            type="button"
            style={controlButtonStyle}
            aria-label={ui.paused ? "Resume game" : "Pause game"}
            title="Pause / resume (P)"
            onClick={() => pauseRef.current()}
          >
            {ui.paused ? "▶" : "Ⅱ"}
          </button>
          <button
            type="button"
            style={controlButtonStyle}
            aria-label={ui.muted ? "Unmute game" : "Mute game"}
            title="Mute / unmute (M)"
            onClick={() => muteActionRef.current()}
          >
            {ui.muted ? "×" : "♪"}
          </button>
        </div>
      </section>
    </main>
  );
}
