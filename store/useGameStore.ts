import { create } from "zustand";
import {
  WIDTH,
  GROUND_Y,
  BIRD_X,
  BIRD_HEIGHT,
  BIRD_WIDTH,
  PIPE_WIDTH,
  PIPE_GAP,
  PIPE_SPACING,
  PIPE_SPEED,
  GRAVITY,
  FLAP_VELOCITY,
  MAX_FALL_SPEED,
  BEST_SCORE_KEY,
} from "../utils/gameConstants";
import { playFlap, playPoint, playHit, playGameOver } from "../utils/audio";

export type GameMode = "ready" | "playing" | "dying" | "gameover";

export interface BirdState {
  x: number;
  y: number;
  velocityY: number;
  rotation: number;
  wingFrame: number;
}

export interface PipeState {
  x: number;
  gapY: number;
  passed: boolean;
}

export interface GameState {
  mode: GameMode;
  score: number;
  best: number;
  paused: boolean;
  muted: boolean;
  bird: BirdState;
  pipes: PipeState[];
  groundOffset: number;
  backgroundOffset: number;
  flash: number;
  shake: number;
  theme: "day" | "night";
  elapsed: number;

  // Actions
  initBestScore: () => void;
  resetRound: (mode?: GameMode) => void;
  beginRound: () => void;
  flap: () => void;
  crash: () => void;
  finishRound: () => void;
  togglePause: () => void;
  toggleMute: () => void;
  updateFrame: (step: number, timestamp: number) => void;
}

const initialBird = (): BirdState => ({
  x: BIRD_X,
  y: 230,
  velocityY: 0,
  rotation: 0,
  wingFrame: 0,
});

export const useGameStore = create<GameState>((set, get) => {
  const birdHitsPipe = (bird: BirdState, pipes: PipeState[]): boolean => {
    const left = bird.x - BIRD_WIDTH / 2 + 4;
    const right = bird.x + BIRD_WIDTH / 2 - 3;
    const top = bird.y - BIRD_HEIGHT / 2 + 3;
    const bottom = bird.y + BIRD_HEIGHT / 2 - 3;

    for (const pipe of pipes) {
      const pipeLeft = pipe.x - 2;
      const pipeRight = pipe.x + PIPE_WIDTH + 2;

      if (right <= pipeLeft || left >= pipeRight) continue;

      const gapTop = pipe.gapY - PIPE_GAP / 2;
      const gapBottom = pipe.gapY + PIPE_GAP / 2;

      if (bird.y > 0 && (top < gapTop || bottom > gapBottom)) return true;
    }
    return false;
  };

  const createPipe = (x: number): PipeState => ({
    x,
    gapY: 118 + Math.random() * (GROUND_Y - 112 - 118),
    passed: false,
  });

  return {
    mode: "ready",
    score: 0,
    best: 0,
    paused: false,
    muted: false,
    bird: initialBird(),
    pipes: [],
    groundOffset: 0,
    backgroundOffset: 0,
    flash: 0,
    shake: 0,
    theme: "day",
    elapsed: 0,

    initBestScore: () => {
      if (typeof window === "undefined") return;
      try {
        const stored = localStorage.getItem(BEST_SCORE_KEY);
        if (stored) set({ best: parseInt(stored, 10) || 0 });
      } catch {}
    },

    resetRound: (mode = "ready") => {
      set({
        mode,
        paused: false,
        score: 0,
        bird: initialBird(),
        pipes: [],
        flash: 0,
        shake: 0,
        theme: Math.random() > 0.24 ? "day" : "night",
      });
    },

    beginRound: () => {
      get().resetRound("playing");
      set((state) => ({
        pipes: [createPipe(WIDTH + 72)],
        bird: {
          ...state.bird,
          velocityY: FLAP_VELOCITY,
          rotation: -0.35,
        },
      }));
      playFlap();
    },

    flap: () => {
      const { mode, paused } = get();
      if (mode !== "playing" || paused) return;
      set((state) => ({
        bird: {
          ...state.bird,
          velocityY: FLAP_VELOCITY,
          rotation: -0.42,
          wingFrame: 0,
        },
      }));
      playFlap();
    },

    crash: () => {
      const { mode } = get();
      if (mode !== "playing") return;
      set((state) => ({
        mode: "dying",
        paused: false,
        flash: 1,
        shake: 7,
        bird: {
          ...state.bird,
          velocityY: Math.max(state.bird.velocityY, -1.4),
        },
      }));
      playHit();
    },

    finishRound: () => {
      const { mode, score } = get();
      if (mode === "gameover") return;

      const nextBest = score;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(BEST_SCORE_KEY, String(score));
        } catch {}
      }

      set((state) => ({
        mode: "gameover",
        best: nextBest,
        paused: false,
        bird: {
          ...state.bird,
          y: GROUND_Y - BIRD_HEIGHT / 2,
          velocityY: 0,
          rotation: Math.PI / 2,
        },
      }));
      playGameOver();
    },

    togglePause: () => {
      const { mode, paused } = get();
      if (mode !== "playing" && mode !== "dying") return;
      set({ paused: !paused });
    },

    toggleMute: () => {
      set((state) => ({ muted: !state.muted }));
    },

    updateFrame: (step, timestamp) => {
      const {
        mode,
        paused,
        bird,
        pipes,
        groundOffset,
        backgroundOffset,
        flash,
        shake,
      } = get();
      if (paused) return;

      const nextGroundOffset = (groundOffset + PIPE_SPEED * step) % 24;
      const nextBackgroundOffset =
        (backgroundOffset + PIPE_SPEED * 0.24 * step) % WIDTH;

      if (mode === "ready") {
        set({
          groundOffset: nextGroundOffset,
          backgroundOffset: nextBackgroundOffset,
          bird: {
            ...bird,
            y: 226 + Math.sin(timestamp / 280) * 6,
            rotation: -0.05 + Math.sin(timestamp / 420) * 0.04,
            wingFrame: Math.floor(timestamp / 110) % 3,
          },
        });
        return;
      }

      if (mode === "playing") {
        const nextVelocityY = Math.min(
          MAX_FALL_SPEED,
          bird.velocityY + GRAVITY * step,
        );
        const nextY = bird.y + nextVelocityY * step;
        const nextRotation = Math.min(
          Math.PI / 3,
          bird.rotation + 0.038 * step,
        );
        const nextWingFrame = Math.floor(timestamp / 95) % 3;

        let nextScore = get().score;
        let playPt = false;

        const nextPipes = pipes.map((pipe) => {
          const nextPipeX = pipe.x - PIPE_SPEED * step;
          let passed = pipe.passed;
          if (!passed && nextPipeX < bird.x + 16) {
            passed = true;
            nextScore += 1;
            playPt = true;
          }
          return { ...pipe, x: nextPipeX, passed };
        });

        // Add pipe
        const lastPipe = nextPipes[nextPipes.length - 1];
        if (!lastPipe || lastPipe.x < WIDTH - PIPE_SPACING) {
          nextPipes.push(createPipe(WIDTH + 8));
        }

        // Filter pipes offscreen
        const filteredPipes = nextPipes.filter((p) => p.x > -PIPE_WIDTH - 12);

        // Update bird properties
        const updatedBird = {
          ...bird,
          y: nextY,
          velocityY: nextVelocityY,
          rotation: nextRotation,
          wingFrame: nextWingFrame,
        };

        if (playPt) {
          playPoint();
        }

        // Pipe collision
        if (birdHitsPipe(updatedBird, filteredPipes)) {
          set({ bird: updatedBird, pipes: filteredPipes, score: nextScore });
          get().crash();
          return;
        }

        // Ground collision
        if (nextY + BIRD_HEIGHT / 2 >= GROUND_Y) {
          playHit();
          set({ bird: updatedBird, pipes: filteredPipes, score: nextScore });
          get().finishRound();
          return;
        }

        set({
          bird: updatedBird,
          pipes: filteredPipes,
          score: nextScore,
          groundOffset: nextGroundOffset,
          backgroundOffset: nextBackgroundOffset,
          flash: Math.max(0, flash - 0.08 * step),
          shake: Math.max(0, shake - 0.45 * step),
        });
      } else if (mode === "dying") {
        const nextVelocityY = Math.min(
          MAX_FALL_SPEED,
          bird.velocityY + GRAVITY * 1.25 * step,
        );
        const nextY = bird.y + nextVelocityY * step;
        const nextRotation = Math.min(
          Math.PI / 2.5,
          bird.rotation + 0.06 * step,
        );

        const updatedBird = {
          ...bird,
          y: nextY,
          velocityY: nextVelocityY,
          rotation: nextRotation,
        };

        if (nextY + BIRD_HEIGHT / 2 >= GROUND_Y) {
          set({ bird: updatedBird });
          get().finishRound();
          return;
        }

        set({
          bird: updatedBird,
          groundOffset: nextGroundOffset,
          backgroundOffset: nextBackgroundOffset,
          flash: Math.max(0, flash - 0.08 * step),
          shake: Math.max(0, shake - 0.45 * step),
        });
      } else {
        // gameover mode
        set({
          flash: Math.max(0, flash - 0.08 * step),
          shake: Math.max(0, shake - 0.45 * step),
        });
      }
    },
  };
});
