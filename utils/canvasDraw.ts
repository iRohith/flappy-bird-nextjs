import { GameState } from "../store/useGameStore";
import { WIDTH, HEIGHT, GROUND_Y, PIPE_WIDTH, PIPE_GAP } from "./gameConstants";

function drawPixelCloud(
  ctx: CanvasRenderingContext2D,
  theme: "day" | "night",
  x: number,
  y: number,
  scale = 1,
) {
  ctx.fillStyle = theme === "night" ? "#d9e3e7" : "#f7fbef";
  ctx.fillRect(Math.round(x), Math.round(y + 7 * scale), 34 * scale, 9 * scale);
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
  ctx.fillStyle = theme === "night" ? "rgba(122,150,168,.45)" : "#d9eee7";
  ctx.fillRect(
    Math.round(x + 4 * scale),
    Math.round(y + 14 * scale),
    27 * scale,
    3 * scale,
  );
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  theme: "day" | "night",
  backgroundOffset: number,
) {
  const isNight = theme === "night";
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
    for (const [sx, sy] of stars) ctx.fillRect(sx, sy, 2, 2);

    ctx.fillStyle = "#f4f1c6";
    ctx.beginPath();
    ctx.arc(235, 57, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#315779";
    ctx.beginPath();
    ctx.arc(243, 51, 17, 0, Math.PI * 2);
    ctx.fill();
  }

  const cloudShift = backgroundOffset * 0.38;
  drawPixelCloud(ctx, theme, 22 - cloudShift, 88, 0.85);
  drawPixelCloud(ctx, theme, 171 - cloudShift, 126, 1.05);
  drawPixelCloud(ctx, theme, 310 - cloudShift, 72, 0.75);

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
  let bx = -Math.round(backgroundOffset * 0.7) - 20;
  let index = 0;

  while (bx < WIDTH + 50) {
    const width = buildingWidths[index % buildingWidths.length];
    const height = 38 + ((index * 17) % 42);
    const y = GROUND_Y - 36 - height;

    ctx.fillStyle = buildingColor;
    ctx.fillRect(bx, y, width, height);
    ctx.fillStyle = buildingHighlight;
    ctx.fillRect(bx + 4, y + 5, 4, 6);
    ctx.fillRect(bx + 13, y + 5, 4, 6);
    ctx.fillRect(bx + 4, y + 18, 4, 6);
    if (width > 25) ctx.fillRect(bx + 17, y + 18, 4, 6);

    bx += width + 8;
    index += 1;
  }

  ctx.fillStyle = isNight ? "#38605e" : "#5da98c";
  for (let bushX = -20; bushX < WIDTH + 30; bushX += 26) {
    const offset = (backgroundOffset * 0.9) % 26;
    ctx.beginPath();
    ctx.arc(bushX - offset, GROUND_Y - 22, 19, Math.PI, 0);
    ctx.fill();
  }

  ctx.fillStyle = isNight ? "#284c4b" : "#4a9678";
  ctx.fillRect(0, GROUND_Y - 23, WIDTH, 23);
}

function drawPipeBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
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

function drawPipe(
  ctx: CanvasRenderingContext2D,
  pipe: { x: number; gapY: number },
) {
  const x = Math.round(pipe.x);
  const gapTop = Math.round(pipe.gapY - PIPE_GAP / 2);
  const gapBottom = Math.round(pipe.gapY + PIPE_GAP / 2);
  const capHeight = 24;

  drawPipeBody(ctx, x + 4, 0, PIPE_WIDTH - 8, gapTop - capHeight + 2);
  drawPipeBody(ctx, x, gapTop - capHeight, PIPE_WIDTH, capHeight);

  ctx.fillStyle = "#263313";
  ctx.fillRect(x - 2, gapTop - capHeight - 2, PIPE_WIDTH + 4, 4);
  ctx.fillStyle = "#d1f06b";
  ctx.fillRect(x + 7, gapTop - capHeight + 3, 5, capHeight - 6);
  ctx.fillStyle = "#377b20";
  ctx.fillRect(x + PIPE_WIDTH - 11, gapTop - capHeight + 2, 7, capHeight - 4);

  drawPipeBody(ctx, x, gapBottom, PIPE_WIDTH, capHeight);
  drawPipeBody(
    ctx,
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

function drawGround(ctx: CanvasRenderingContext2D, groundOffset: number) {
  ctx.fillStyle = "#283514";
  ctx.fillRect(0, GROUND_Y - 2, WIDTH, 4);
  ctx.fillStyle = "#8fd33e";
  ctx.fillRect(0, GROUND_Y + 2, WIDTH, 9);
  ctx.fillStyle = "#d9ef66";
  ctx.fillRect(0, GROUND_Y + 3, WIDTH, 4);

  const offset = Math.round(groundOffset);
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

function drawBird(ctx: CanvasRenderingContext2D, bird: GameState["bird"]) {
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

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
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

function drawOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string | number,
  x: number,
  y: number,
  size: number,
  {
    fill = "#fff",
    stroke = "#2b251b",
    lineWidth = 5,
    align = "center",
    font = "Arial Black, Impact, sans-serif",
  }: {
    fill?: string;
    stroke?: string;
    lineWidth?: number;
    align?: CanvasTextAlign;
    font?: string;
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

function drawScore(ctx: CanvasRenderingContext2D, score: number) {
  drawOutlinedText(ctx, score, WIDTH / 2, 56, 42, {
    lineWidth: 6,
  });
}

function drawReadyOverlay(ctx: CanvasRenderingContext2D) {
  drawOutlinedText(ctx, "FLAPPY", WIDTH / 2, 82, 36, {
    fill: "#fff071",
    stroke: "#5b3c1f",
    lineWidth: 7,
  });
  drawOutlinedText(ctx, "BIRD", WIDTH / 2, 119, 36, {
    fill: "#fff071",
    stroke: "#5b3c1f",
    lineWidth: 7,
  });
  drawOutlinedText(ctx, "GET READY", WIDTH / 2, 173, 22, {
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

  drawOutlinedText(ctx, "TAP", WIDTH / 2, 296, 15, {
    fill: "#e26f42",
    stroke: "#fff",
    lineWidth: 2,
  });
  drawOutlinedText(ctx, "OR PRESS SPACE", WIDTH / 2, 319, 11, {
    fill: "#4b4435",
    stroke: "#fff",
    lineWidth: 1.5,
    font: "Arial, sans-serif",
  });
}

function medalColor(score: number): string {
  if (score >= 40) return "#e8d7f4";
  if (score >= 30) return "#f2cf45";
  if (score >= 20) return "#d8dce1";
  if (score >= 10) return "#d58a42";
  return "#9cafb6";
}

function drawGameOverOverlay(
  ctx: CanvasRenderingContext2D,
  score: number,
  best: number,
) {
  drawOutlinedText(ctx, "GAME OVER", WIDTH / 2, 121, 31, {
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
  ctx.fillStyle = medalColor(score);
  ctx.beginPath();
  ctx.arc(84, 224, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fillRect(70, 210, 9, 5);
  ctx.fillRect(66, 217, 6, 9);
  ctx.restore();

  drawOutlinedText(ctx, score, 225, 204, 25, {
    align: "right",
    lineWidth: 4,
  });
  drawOutlinedText(ctx, best, 225, 257, 25, {
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

  drawOutlinedText(ctx, "RESTART", WIDTH / 2, 347, 18, {
    fill: "#fff",
    stroke: "#7e351f",
    lineWidth: 4,
  });
  drawOutlinedText(ctx, "tap, space, or R", WIDTH / 2, 387, 11, {
    fill: "#fff",
    stroke: "rgba(38,38,26,.72)",
    lineWidth: 3,
    font: "Arial, sans-serif",
  });
}

function drawPauseOverlay(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgba(20,28,30,.48)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawOutlinedText(ctx, "PAUSED", WIDTH / 2, 226, 31, {
    fill: "#fff",
    lineWidth: 6,
  });
  drawOutlinedText(ctx, "PRESS P TO CONTINUE", WIDTH / 2, 265, 12, {
    fill: "#fff",
    stroke: "#2d2a22",
    lineWidth: 3,
    font: "Arial, sans-serif",
  });
}

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (state.shake > 0) {
    ctx.translate(
      Math.round((Math.random() - 0.5) * state.shake),
      Math.round((Math.random() - 0.5) * state.shake),
    );
  }

  drawBackground(ctx, state.theme, state.backgroundOffset);
  for (const pipe of state.pipes) {
    drawPipe(ctx, pipe);
  }
  drawGround(ctx, state.groundOffset);
  drawBird(ctx, state.bird);

  if (state.mode === "playing" || state.mode === "dying") {
    drawScore(ctx, state.score);
  } else if (state.mode === "ready") {
    drawReadyOverlay(ctx);
  } else if (state.mode === "gameover") {
    drawGameOverOverlay(ctx, state.score, state.best);
  }

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.72, state.flash)})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.restore();

  if (state.paused) {
    drawPauseOverlay(ctx);
  }
}
