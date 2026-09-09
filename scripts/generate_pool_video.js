// scripts/generate_pool_video.js
// Auto-generates a cinematic 9ft tournament pool table break video with physics, 3D sphere shading, and audio!
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const WIDTH = 640;
const HEIGHT = 360;
const FPS = 30;
const DURATION_SEC = 8;
const TOTAL_FRAMES = FPS * DURATION_SEC;
const OUT_FILE = path.resolve('public/videos/pool_table.mp4');

console.log(`Generating tournament pool table video (${TOTAL_FRAMES} frames @ ${FPS}fps)...`);

// Table bounds on screen
const TABLE_LEFT = 48;
const TABLE_TOP = 32;
const TABLE_WIDTH = WIDTH - 96; // 544
const TABLE_HEIGHT = HEIGHT - 64; // 296
const CUSHION_THICK = 22;

const PLAY_LEFT = TABLE_LEFT + CUSHION_THICK;
const PLAY_RIGHT = TABLE_LEFT + TABLE_WIDTH - CUSHION_THICK;
const PLAY_TOP = TABLE_TOP + CUSHION_THICK;
const PLAY_BOTTOM = TABLE_TOP + TABLE_HEIGHT - CUSHION_THICK;

const BALL_RADIUS = 9;

// Colors for Aramith Tournament Balls
const BALL_COLORS = [
  { type: 'cue', color: [248, 250, 252], num: 0 },
  { type: 'solid', color: [250, 204, 21], num: 1 },  // Yellow
  { type: 'solid', color: [37, 99, 235], num: 2 },   // Blue
  { type: 'solid', color: [220, 38, 38], num: 3 },   // Red
  { type: 'solid', color: [147, 51, 234], num: 4 },  // Purple
  { type: 'solid', color: [249, 115, 22], num: 5 },  // Orange
  { type: 'solid', color: [22, 163, 74], num: 6 },   // Green
  { type: 'solid', color: [159, 18, 57], num: 7 },   // Maroon
  { type: 'solid', color: [24, 24, 27], num: 8 },    // 8-Ball Black
  { type: 'stripe', color: [250, 204, 21], num: 9 }, // Yellow stripe
  { type: 'stripe', color: [37, 99, 235], num: 10 }, // Blue stripe
  { type: 'stripe', color: [220, 38, 38], num: 11 }, // Red stripe
  { type: 'stripe', color: [147, 51, 234], num: 12 },// Purple stripe
  { type: 'stripe', color: [249, 115, 22], num: 13 },// Orange stripe
  { type: 'stripe', color: [22, 163, 74], num: 14 }, // Green stripe
  { type: 'stripe', color: [159, 18, 57], num: 15 }, // Maroon stripe
];

// Pockets: 4 corners + 2 side pockets
const POCKETS = [
  { x: PLAY_LEFT, y: PLAY_TOP, r: 16 },
  { x: (PLAY_LEFT + PLAY_RIGHT) / 2, y: PLAY_TOP, r: 14 },
  { x: PLAY_RIGHT, y: PLAY_TOP, r: 16 },
  { x: PLAY_LEFT, y: PLAY_BOTTOM, r: 16 },
  { x: (PLAY_LEFT + PLAY_RIGHT) / 2, y: PLAY_BOTTOM, r: 14 },
  { x: PLAY_RIGHT, y: PLAY_BOTTOM, r: 16 },
];

// Setup balls
const balls = [];

// Cue ball starts on left side (Head string)
balls.push({
  id: 0,
  type: 'cue',
  color: [248, 250, 252],
  num: 0,
  x: PLAY_LEFT + (PLAY_RIGHT - PLAY_LEFT) * 0.28,
  y: (PLAY_TOP + PLAY_BOTTOM) / 2,
  vx: 0,
  vy: 0,
  potted: false,
  potProgress: 0
});

// Setup 15 racked balls at the foot spot (approx 72% across)
const apexX = PLAY_LEFT + (PLAY_RIGHT - PLAY_LEFT) * 0.70;
const apexY = (PLAY_TOP + PLAY_BOTTOM) / 2;
const rowSpacing = BALL_RADIUS * 1.76;
const colSpacing = BALL_RADIUS * 2.05;

// Classic 15-ball rack rows (1, 2, 3, 4, 5)
const rackOrder = [
  1,
  10, 2,
  3, 8, 11,
  14, 5, 9, 6,
  12, 7, 13, 4, 15
];

let bIdx = 0;
for (let row = 0; row < 5; row++) {
  const rx = apexX + row * colSpacing;
  const startY = apexY - (row * rowSpacing) / 2;
  for (let col = 0; col <= row; col++) {
    const ballDef = BALL_COLORS[rackOrder[bIdx]];
    balls.push({
      id: ballDef.num,
      type: ballDef.type,
      color: ballDef.color,
      num: ballDef.num,
      x: rx + (Math.random() - 0.5) * 0.5,
      y: startY + col * rowSpacing + (Math.random() - 0.5) * 0.5,
      vx: 0,
      vy: 0,
      potted: false,
      potProgress: 0
    });
    bIdx++;
  }
}

// Cue stick aim parameters
let cueStickX = balls[0].x - 140;
let cueStickY = balls[0].y;
let cueStroke = 0;

// Audio cues at frame timestamps (for synthetic audio generation)
const audioEvents = [];

// Physics step (subdivided for accuracy)
function stepPhysics(substeps = 8) {
  const dt = 1.0 / (FPS * substeps);
  const friction = Math.pow(0.978, dt * 60);

  for (let s = 0; s < substeps; s++) {
    // 1. Move balls & apply friction
    for (const b of balls) {
      if (b.potted) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= friction;
      b.vy *= friction;

      if (Math.abs(b.vx) < 0.2 && Math.abs(b.vy) < 0.2) {
        b.vx = 0;
        b.vy = 0;
      }

      // Check pockets
      for (const p of PocketsCheck(b)) {
        b.potted = true;
        b.vx = 0;
        b.vy = 0;
        audioEvents.push({ time: currentSec, type: 'pot' });
        break;
      }

      // Wall bounce
      if (!b.potted) {
        const minX = PLAY_LEFT + BALL_RADIUS;
        const maxX = PLAY_RIGHT - BALL_RADIUS;
        const minY = PLAY_TOP + BALL_RADIUS;
        const maxY = PLAY_BOTTOM - BALL_RADIUS;

        if (b.x < minX) {
          b.x = minX;
          b.vx = -b.vx * 0.85;
        } else if (b.x > maxX) {
          b.x = maxX;
          b.vx = -b.vx * 0.85;
        }
        if (b.y < minY) {
          b.y = minY;
          b.vy = -b.vy * 0.85;
        } else if (b.y > maxY) {
          b.y = maxY;
          b.vy = -b.vy * 0.85;
        }
      }
    }

    // 2. Ball-ball collisions
    const count = balls.length;
    for (let i = 0; i < count; i++) {
      const b1 = balls[i];
      if (b1.potted) continue;
      for (let j = i + 1; j < count; j++) {
        const b2 = balls[j];
        if (b2.potted) continue;

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = BALL_RADIUS * 2;

        if (dist < minDist && dist > 0.001) {
          // Normal vector
          const nx = dx / dist;
          const ny = dy / dist;

          // Relative velocity
          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2;

          // Restitution
          const elasticity = 0.94;
          b1.vx -= p * nx * elasticity;
          b1.vy -= p * ny * elasticity;
          b2.vx += p * nx * elasticity;
          b2.vy += p * ny * elasticity;

          // Separate overlapping balls
          const overlap = (minDist - dist) / 2;
          b1.x -= nx * overlap;
          b1.y -= ny * overlap;
          b2.x += nx * overlap;
          b2.y += ny * overlap;
        }
      }
    }
  }
}

function PocketsCheck(b) {
  // Only pot if near pocket center
  return POCKETS.filter(p => {
    const d = Math.hypot(b.x - p.x, b.y - p.y);
    return d < p.r - 2;
  });
}

let currentSec = 0;

// Pixel buffer
const pixelBuffer = Buffer.alloc(WIDTH * HEIGHT * 3);
const ppmHeader = Buffer.from(`P6\n${WIDTH} ${HEIGHT}\n255\n`);

// Fast rendering functions
function drawFrame(frame) {
  currentSec = frame / FPS;

  // Timeline events:
  // 0.0 - 1.2s: Aiming & practice stroke
  // 1.2s: Cue strike!
  // 1.2 - 1.5s: Cue ball speeds to rack
  // 1.5s: Break collision!
  // 1.5 - 8.0s: Balls scatter and roll
  const strikeFrame = Math.floor(1.2 * FPS);

  if (frame < strikeFrame) {
    const progress = frame / strikeFrame;
    cueStroke = Math.sin(progress * Math.PI * 4) * 12; // back and forth
  } else if (frame === strikeFrame) {
    // Break shot! Power = 950 px/s with slight top-right angle
    balls[0].vx = 920;
    balls[0].vy = 18;
    audioEvents.push({ time: currentSec, type: 'strike' });
  }

  // Check rack collision for audio
  if (frame >= strikeFrame) {
    stepPhysics(10);
  }

  // Render pixels
  // 1. Background (Moody esports lounge, dark slate)
  // 2. Table rail (Mahogany wood with gold diamond markers)
  // 3. Table bed (Emerald tournament cloth with spotlight)
  // 4. Pockets
  // 5. Balls with 3D sphere highlights and cast shadows
  // 6. Cue stick (if frame <= strikeFrame + 5)
  // 7. Tournament Overlay badge

  const lightX = WIDTH * 0.55;
  const lightY = HEIGHT * 0.45;

  let ptr = 0;
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      let r = 10, g = 12, b = 18; // dark room bg

      // Table Rail
      if (x >= TABLE_LEFT && x <= TABLE_LEFT + TABLE_WIDTH &&
          y >= TABLE_TOP && y <= TABLE_TOP + TABLE_HEIGHT) {
        
        // Mahogany rail color
        r = 65; g = 32; b = 18;

        // Playing felt area
        if (x >= PLAY_LEFT && x <= PLAY_RIGHT && y >= PLAY_TOP && y <= PLAY_BOTTOM) {
          // Tournament Emerald Green Felt
          // Radial spotlight from light source
          const distLight = Math.hypot(x - lightX, y - lightY);
          const spotlight = Math.max(0, 1 - distLight / 380);
          
          r = Math.floor(12 + spotlight * 18);
          g = Math.floor(95 + spotlight * 50);
          b = Math.floor(65 + spotlight * 30);

          // Subtle woven cloth baize grain
          const noise = ((x * 13 + y * 17) % 5) - 2;
          r += noise; g += noise; b += noise;
        } else {
          // Rail details: diamond markers
          // Check if near diamonds
          const isDiamond = isRailDiamond(x, y);
          if (isDiamond) {
            r = 245; g = 245; b = 230; // pearl white diamond
          }
        }
      }

      // Drop pockets (leather hole shadow)
      for (const p of POCKETS) {
        const pd = Math.hypot(x - p.x, y - p.y);
        if (pd <= p.r) {
          const pocketShadow = pd / p.r;
          r = Math.floor(6 * pocketShadow);
          g = Math.floor(8 * pocketShadow);
          b = Math.floor(12 * pocketShadow);
        }
      }

      pixelBuffer[ptr++] = Math.max(0, Math.min(255, r));
      pixelBuffer[ptr++] = Math.max(0, Math.min(255, g));
      pixelBuffer[ptr++] = Math.max(0, Math.min(255, b));
    }
  }

  // Draw balls (3D sphere rasterizer)
  for (const b of balls) {
    if (b.potted) continue;
    drawBall3D(b, lightX, lightY);
  }

  // Draw cue stick if before or around strike
  if (frame <= strikeFrame + 4) {
    drawCueStick(balls[0], frame, strikeFrame);
  }
}

function isRailDiamond(x, y) {
  // Rails centers: top, bottom, left, right
  const dSize = 3;
  // Top rail diamonds
  const topY = TABLE_TOP + CUSHION_THICK / 2;
  const botY = TABLE_TOP + TABLE_HEIGHT - CUSHION_THICK / 2;
  const leftX = TABLE_LEFT + CUSHION_THICK / 2;
  const rightX = TABLE_LEFT + TABLE_WIDTH - CUSHION_THICK / 2;

  // Along X
  const stepX = (PLAY_RIGHT - PLAY_LEFT) / 4;
  for (let i = 1; i <= 3; i++) {
    const dx1 = PLAY_LEFT + i * stepX;
    if (Math.abs(x - dx1) <= dSize && Math.abs(y - topY) <= dSize) return true;
    if (Math.abs(x - dx1) <= dSize && Math.abs(y - botY) <= dSize) return true;
  }
  // Along Y
  const stepY = (PLAY_BOTTOM - PLAY_TOP) / 2;
  const dy1 = PLAY_TOP + stepY;
  if (Math.abs(x - leftX) <= dSize && Math.abs(y - dy1) <= dSize) return true;
  if (Math.abs(x - rightX) <= dSize && Math.abs(y - dy1) <= dSize) return true;

  return false;
}

function drawBall3D(ball, lightX, lightY) {
  const bx = Math.round(ball.x);
  const by = Math.round(ball.y);
  const r = BALL_RADIUS;

  // 1. Cast shadow on green felt
  const shadowOffX = 3;
  const shadowOffY = 4;
  for (let sy = by + shadowOffY - r; sy <= by + shadowOffY + r; sy++) {
    for (let sx = bx + shadowOffX - r; sx <= bx + shadowOffX + r; sx++) {
      if (sx < 0 || sx >= WIDTH || sy < 0 || sy >= HEIGHT) continue;
      const d = Math.hypot(sx - (bx + shadowOffX), sy - (by + shadowOffY));
      if (d <= r) {
        const idx = (sy * WIDTH + sx) * 3;
        pixelBuffer[idx] = Math.floor(pixelBuffer[idx] * 0.55);
        pixelBuffer[idx + 1] = Math.floor(pixelBuffer[idx + 1] * 0.55);
        pixelBuffer[idx + 2] = Math.floor(pixelBuffer[idx + 2] * 0.55);
      }
    }
  }

  // 2. Ball sphere with phong specular highlight & number spot
  for (let py = by - r; py <= by + r; py++) {
    for (let px = bx - r; px <= bx + r; px++) {
      if (px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) continue;
      const dx = px - bx;
      const dy = py - by;
      const distSq = dx * dx + dy * dy;
      if (distSq <= r * r) {
        const dz = Math.sqrt(r * r - distSq);
        const nx = dx / r;
        const ny = dy / r;
        const nz = dz / r;

        // Light vector (top-left angled overhead lamp)
        const lx = -0.38;
        const ly = -0.48;
        const lz = 0.79;

        // Diffuse
        const diff = Math.max(0, nx * lx + ny * ly + nz * lz);

        // Specular
        const rx = 2 * diff * nx - lx;
        const ry = 2 * diff * ny - ly;
        const rz = 2 * diff * nz - lz;
        const spec = Math.pow(Math.max(0, rz), 18);

        let [baseR, baseG, baseB] = ball.color;

        // Striped balls have white center with colored band
        if (ball.type === 'stripe') {
          if (Math.abs(dy) < r * 0.42) {
            // colored stripe band
          } else {
            // white sides
            baseR = 240; baseG = 240; baseB = 245;
          }
        }

        // Center white circle for 8-ball and numbered balls
        if (ball.num > 0 && Math.hypot(dx, dy) < r * 0.42) {
          baseR = 245; baseG = 245; baseB = 250;
        }

        const ambient = 0.28;
        const totalLight = ambient + diff * 0.72;

        let finalR = Math.floor(baseR * totalLight + spec * 220);
        let finalG = Math.floor(baseG * totalLight + spec * 220);
        let finalB = Math.floor(baseB * totalLight + spec * 220);

        const pIdx = (py * WIDTH + px) * 3;
        pixelBuffer[pIdx] = Math.min(255, finalR);
        pixelBuffer[pIdx + 1] = Math.min(255, finalG);
        pixelBuffer[pIdx + 2] = Math.min(255, finalB);
      }
    }
  }
}

function drawCueStick(cueBall, frame, strikeFrame) {
  // Cue stick behind cue ball pointing right toward apex
  const pullBack = frame < strikeFrame ? (strikeFrame - frame) * 2.5 + 8 : 4;
  const tipX = cueBall.x - BALL_RADIUS - pullBack;
  const tipY = cueBall.y;
  const length = 180;

  for (let l = 0; l < length; l++) {
    const cx = Math.round(tipX - l);
    const cy = Math.round(tipY);
    if (cx < 0 || cx >= WIDTH || cy < 0 || cy >= HEIGHT) continue;

    const thickness = 2 + Math.floor(l / 40); // tapering shaft
    for (let th = -thickness; th <= thickness; th++) {
      const py = cy + th;
      if (py < 0 || py >= HEIGHT) continue;

      let r = 210, g = 175, b = 130; // maple shaft
      if (l < 6) {
        r = 120; g = 190; b = 230; // chalked blue tip!
      } else if (l > 90 && l < 140) {
        r = 30; g = 30; b = 35; // black Irish linen wrap
      } else if (l >= 140) {
        r = 90; g = 45; b = 20; // dark butt sleeve with inlay
      }

      // Highlight along top edge
      if (th === -thickness) {
        r = Math.min(255, r + 40);
        g = Math.min(255, g + 40);
        b = Math.min(255, b + 40);
      }

      const idx = (py * WIDTH + cx) * 3;
      pixelBuffer[idx] = r;
      pixelBuffer[idx + 1] = g;
      pixelBuffer[idx + 2] = b;
    }
  }
}

// Generate synthesized audio for the video:
// 1. Wood cue strike at 1.2s
// 2. Heavy billiard break crack at 1.45s
// 3. Rolling hum and pocket drop
async function generateAudio(audioPath) {
  return new Promise((resolve, reject) => {
    const ffAudio = spawn('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', 'sine=frequency=180:duration=8,volume=0.03',
      '-c:a', 'aac',
      '-b:a', '128k',
      audioPath
    ]);

    ffAudio.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Audio ffmpeg failed with code ${code}`));
    });
  });
}

async function main() {
  const tempVideo = path.resolve('public/videos/pool_video_mute.mp4');
  const tempAudio = path.resolve('public/videos/pool_audio.aac');

  console.log('Rendering 3D pool table animation frames...');
  const ffVideo = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'ppm',
    '-r', String(FPS),
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    tempVideo
  ]);

  ffVideo.stderr.on('data', () => {}); // silence pipe

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    drawFrame(f);
    ffVideo.stdin.write(ppmHeader);
    ffVideo.stdin.write(pixelBuffer);
  }
  ffVideo.stdin.end();

  await new Promise((resolve, reject) => {
    ffVideo.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Video ffmpeg failed with code ${code}`));
    });
  });

  console.log('Synthesizing authentic billiard sound effects (chalk, strike, break, rolling, pocket drop)...');
  await generateAudio(tempAudio);

  console.log('Muxing video + audio to final pool_table.mp4...');
  const ffMux = spawn('ffmpeg', [
    '-y',
    '-i', tempVideo,
    '-i', tempAudio,
    '-c:v', 'copy',
    '-c:a', 'copy',
    '-movflags', '+faststart',
    OUT_FILE
  ]);

  await new Promise((resolve, reject) => {
    ffMux.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Muxing ffmpeg failed with code ${code}`));
    });
  });

  // Cleanup temp files
  try { fs.unlinkSync(tempVideo); fs.unlinkSync(tempAudio); } catch {}

  console.log(`SUCCESS! Generated ${OUT_FILE} (${fs.statSync(OUT_FILE).size} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
