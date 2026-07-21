# Flappy Bird Next.js

A modular, clean, and highly optimized port of Flappy Bird built on Next.js 16, TypeScript, Tailwind CSS, and Zustand for state management.

Deployed on Cloudflare Workers: [https://flappybird.irx.workers.dev](https://flappybird.irx.workers.dev)

## Features

- **Zustand State Engine**: Entire game simulation (bird physics, pipe tracking, scoring, collision checks) runs inside a central Zustand store.
- **60 FPS Rendering**: Direct store evaluation inside the Canvas animation frame loop prevents rendering lag or unnecessary React component lifecycle overhead.
- **Custom Vector Graphics**: Custom inline SVG components designed as discrete TypeScript assets.
- **Audio Synthesizer**: Tone generator utilizing the HTML5 Web Audio API, reacting immediately to mute toggles.
- **DPR Scaling**: Auto-adjusts resolution for crisp retro pixel art on high-DPI/Retina screens.

## File Structure

```
├── app/
│   ├── page.tsx                       # Next.js main routing entry
│   ├── layout.tsx                     # Layout and global font configurations
│   ├── globals.css                    # Tailored background and custom animation frames
│   └── icon.svg                       # Cute custom pixel art Flappy Bird site icon
├── store/
│   └── useGameStore.ts                # Zustand store housing game states and simulation logic
├── utils/
│   ├── gameConstants.ts               # Core layout coordinates, physics and dimensions
│   ├── audio.ts                       # Tone synthesis functions using Web Audio API
│   └── canvasDraw.ts                  # Pure 2D canvas drawing pipeline
├── components/
│   ├── FlappyBirdContainer.tsx        # Shell style definitions, button bar, keyboard routing
│   ├── FlappyBirdCanvas.tsx           # Setup for HTML5 Canvas and the animation loop
│   ├── FlappyBirdUI.tsx               # UI overlay routing (rendered on canvas)
│   └── assets/                        # SVG icons and graphics
│       ├── FlappyLogo.tsx
│       ├── PlayIcon.tsx
│       ├── PauseIcon.tsx
│       ├── VolumeIcon.tsx
│       ├── MuteIcon.tsx
│       ├── Medal.tsx
│       └── RestartIcon.tsx
```

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) or the port reported in your terminal.

### Production Build

```bash
pnpm build
```

### Start

```bash
pnpm start
```
