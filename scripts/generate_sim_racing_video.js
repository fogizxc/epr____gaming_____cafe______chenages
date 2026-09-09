// scripts/generate_sim_racing_video.js
// Generates the cinematic Trak Racer + Fanatec triple-screen sim rig video
// with crisp, well-lit studio atmosphere, bright vibrant sunset track,
// anodized 8020 extrusion cockpit, bucket seat, steering wheel, and smooth camera push-in motion.

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const WIDTH = 856;
const HEIGHT = 480;
const FPS = 30;
const DURATION_SEC = 9.2;
const TOTAL_FRAMES = Math.floor(FPS * DURATION_SEC);
const OUT_FILE = path.resolve('public/videos/sim_racing.mp4');
const DIST_FILE = path.resolve('dist/videos/sim_racing.mp4');

console.log(`Rendering Sim Racing Rig Video (${WIDTH}x${HEIGHT} @ ${FPS}fps, ${TOTAL_FRAMES} frames)...`);

// Launch ffmpeg process with stdin pipe for raw RGB frames + synthetic audio
const ffmpeg = spawn('ffmpeg', [
  '-y',
  '-f', 'rawvideo',
  '-pix_fmt', 'rgb24',
  '-s', `${WIDTH}x${HEIGHT}`,
  '-r', `${FPS}`,
  '-i', '-', // stdin video
  '-f', 'lavfi',
  '-i', 'sine=frequency=54:sample_rate=44100', // direct drive low engine hum
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-crf', '19',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '128k',
  '-shortest',
  OUT_FILE
]);

ffmpeg.stderr.on('data', (d) => {
  const str = d.toString();
  if (str.includes('frame=')) {
    process.stdout.write(`\r${str.trim().slice(0, 70)}`);
  }
});

ffmpeg.on('close', (code) => {
  console.log(`\nFFmpeg video generation completed with code ${code}`);
  if (fs.existsSync(OUT_FILE)) {
    const stat = fs.statSync(OUT_FILE);
    console.log(`Created: ${OUT_FILE} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
    // Also copy to dist if dist exists
    if (fs.existsSync('dist/videos')) {
      fs.copyFileSync(OUT_FILE, DIST_FILE);
      console.log(`Copied to ${DIST_FILE}`);
    }
  }
});

// Framebuffer
const frameBuffer = Buffer.alloc(WIDTH * HEIGHT * 3);

// Smooth easing function
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// 2D drawing helper functions directly onto RGB buffer
function setPixel(x, y, r, g, b, alpha = 1) {
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const idx = (y * WIDTH + x) * 3;
  if (alpha >= 1) {
    frameBuffer[idx] = clamp(r, 0, 255);
    frameBuffer[idx + 1] = clamp(g, 0, 255);
    frameBuffer[idx + 2] = clamp(b, 0, 255);
  } else {
    frameBuffer[idx] = clamp(frameBuffer[idx] * (1 - alpha) + r * alpha, 0, 255);
    frameBuffer[idx + 1] = clamp(frameBuffer[idx + 1] * (1 - alpha) + g * alpha, 0, 255);
    frameBuffer[idx + 2] = clamp(frameBuffer[idx + 2] * (1 - alpha) + b * alpha, 0, 255);
  }
}

// Draw line with antialiasing / thickness
function drawLine(x0, y0, x1, y1, r, g, b, thickness = 1, alpha = 1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const steps = Math.ceil(len * 1.5);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const cx = x0 + dx * t;
    const cy = y0 + dy * t;
    if (thickness <= 1) {
      setPixel(cx, cy, r, g, b, alpha);
    } else {
      const half = thickness / 2;
      for (let ox = -half; ox <= half; ox++) {
        for (let oy = -half; oy <= half; oy++) {
          if (ox * ox + oy * oy <= half * half) {
            setPixel(cx + ox, cy + oy, r, g, b, alpha);
          }
        }
      }
    }
  }
}

// Draw filled polygon (e.g. quad / screen / chassis)
function drawPolygon(points, r, g, b, alpha = 1) {
  let minY = HEIGHT, maxY = 0;
  for (const p of points) {
    if (p.y < minY) minY = Math.floor(p.y);
    if (p.y > maxY) maxY = Math.ceil(p.y);
  }
  minY = Math.max(0, minY);
  maxY = Math.min(HEIGHT - 1, maxY);

  for (let y = minY; y <= maxY; y++) {
    const nodeX = [];
    let j = points.length - 1;
    for (let i = 0; i < points.length; i++) {
      if ((points[i].y < y && points[j].y >= y) || (points[j].y < y && points[i].y >= y)) {
        nodeX.push(
          points[i].x + ((y - points[i].y) / (points[j].y - points[i].y)) * (points[j].x - points[i].x)
        );
      }
      j = i;
    }
    nodeX.sort((a, b) => a - b);
    for (let k = 0; k < nodeX.length; k += 2) {
      if (nodeX[k] >= WIDTH) break;
      if (nodeX[k + 1] > 0) {
        const startX = Math.max(0, Math.floor(nodeX[k]));
        const endX = Math.min(WIDTH - 1, Math.ceil(nodeX[k + 1]));
        for (let x = startX; x <= endX; x++) {
          setPixel(x, y, r, g, b, alpha);
        }
      }
    }
  }
}

// Draw textured quad for screens (bright, vibrant sunset race track shader)
function drawScreenTrack(points, monitorId, progress) {
  let minY = HEIGHT, maxY = 0;
  for (const p of points) {
    if (p.y < minY) minY = Math.floor(p.y);
    if (p.y > maxY) maxY = Math.ceil(p.y);
  }
  minY = Math.max(0, minY);
  maxY = Math.min(HEIGHT - 1, maxY);

  const p0 = points[0];
  const p1 = points[1];
  const p2 = points[2];
  const p3 = points[3];

  for (let y = minY; y <= maxY; y++) {
    const nodeX = [];
    let j = points.length - 1;
    for (let i = 0; i < points.length; i++) {
      if ((points[i].y < y && points[j].y >= y) || (points[j].y < y && points[i].y >= y)) {
        nodeX.push(
          points[i].x + ((y - points[i].y) / (points[j].y - points[i].y)) * (points[j].x - points[i].x)
        );
      }
      j = i;
    }
    nodeX.sort((a, b) => a - b);
    for (let k = 0; k < nodeX.length; k += 2) {
      if (nodeX[k] >= WIDTH) break;
      if (nodeX[k + 1] > 0) {
        const startX = Math.max(0, Math.floor(nodeX[k]));
        const endX = Math.min(WIDTH - 1, Math.ceil(nodeX[k + 1]));

        for (let x = startX; x <= endX; x++) {
          // Normalized screen coordinate within quad
          const v = clamp((y - minY) / (maxY - minY || 1), 0, 1);
          let u = clamp((x - startX) / (endX - startX || 1), 0, 1);

          // Global panoramic u across 3 screens
          let globalU = u;
          if (monitorId === 'left') globalU = u * 0.33;
          else if (monitorId === 'center') globalU = 0.33 + u * 0.34;
          else if (monitorId === 'right') globalU = 0.67 + u * 0.33;

          let r = 0, g = 0, b = 0;

          // Horizon at v = 0.52
          const horizon = 0.52;
          if (v < horizon) {
            // SKY: Vibrant sunset gradient from sky blue/indigo to rich amber, gold and warm horizon
            const skyT = v / horizon;
            // Sun location around globalU = 0.46, near horizon
            const sunDist = Math.hypot((globalU - 0.46) * 2.2, skyT - 0.95);
            const sunGlow = Math.max(0, 1 - sunDist * 1.6);

            // Sky base - luminous and vibrant
            r = Math.floor(35 + skyT * 220 + sunGlow * 55);
            g = Math.floor(38 + skyT * 135 + sunGlow * 85);
            b = Math.floor(95 + skyT * 40 - sunGlow * 15);

            // Sunset clouds with bright rims
            const cloudNoise = Math.sin(globalU * 18 + skyT * 4) * Math.cos(globalU * 8);
            if (skyT > 0.40 && cloudNoise > 0.15) {
              r += Math.floor(65 * cloudNoise);
              g += Math.floor(35 * cloudNoise);
              b -= Math.floor(10 * cloudNoise);
            }

            // Distant grandstand silhouette on right (globalU > 0.58)
            if (globalU > 0.58 && skyT > 0.80) {
              const standHeight = 0.80 + Math.sin(globalU * 45) * 0.03;
              if (skyT > standHeight) {
                // Grandstand roof & tiers
                r = 65; g = 58; b = 64;
                if (skyT < standHeight + 0.04) {
                  r = 230; g = 55; b = 50; // Red canopy line
                }
              }
            }

            // Pit gantry bridge banner with Fanatec colors
            if (globalU > 0.32 && globalU < 0.48 && skyT > 0.74 && skyT < 0.84) {
              r = 45; g = 48; b = 56;
              if (skyT > 0.77 && skyT < 0.82) {
                r = 255; g = 255; b = 255; // Crisp white banner bar
              }
            }
          } else {
            // TARMAC / RACETRACK
            const roadT = (v - horizon) / (1 - horizon);
            // Road perspective: road center around globalU = 0.46
            const roadCenterX = 0.46;
            const roadWidth = 0.16 + roadT * 0.68;
            const distFromCenter = Math.abs(globalU - roadCenterX);

            if (distFromCenter < roadWidth) {
              // On track asphalt - clear detailed road texture
              const grain = (Math.sin(globalU * 120 + roadT * 80) * 5);
              r = Math.floor(65 + roadT * 25 + grain);
              g = Math.floor(68 + roadT * 25 + grain);
              b = Math.floor(75 + roadT * 28 + grain);

              // Starting grid boxes & bright white center line
              const gridBox = Math.abs(Math.sin(roadT * 28 + progress * 0.5));
              const onGridLine = Math.abs(globalU - roadCenterX) < 0.009 || (gridBox < 0.08 && roadT > 0.25);
              if (onGridLine) {
                r = 255; g = 255; b = 255;
              }

              // Red & White Kerbs / Rumble strips at edges
              if (distFromCenter > roadWidth - 0.035) {
                const curbPattern = Math.sin(roadT * 55) > 0;
                if (curbPattern) {
                  r = 235; g = 45; b = 45; // Bright red curb
                } else {
                  r = 255; g = 255; b = 255; // White curb
                }
              }
            } else {
              // Trackside run-off / grass
              const grassGrain = Math.sin(globalU * 80) * 6;
              r = Math.floor(52 + grassGrain);
              g = Math.floor(72 + grassGrain * 1.3);
              b = Math.floor(48 + grassGrain);
            }
          }

          // Screen bezel anti-glare subtle border
          const edgeDist = Math.min(u, 1 - u, v, 1 - v);
          if (edgeDist < 0.025) {
            const edgeVignette = edgeDist / 0.025;
            r = Math.floor(r * edgeVignette);
            g = Math.floor(g * edgeVignette);
            b = Math.floor(b * edgeVignette);
          }

          setPixel(x, y, r, g, b, 1);
        }
      }
    }
  }

  // Draw monitor borders - sleek slim bezels
  drawLine(p0.x, p0.y, p1.x, p1.y, 40, 42, 48, 2);
  drawLine(p1.x, p1.y, p2.x, p2.y, 40, 42, 48, 2);
  drawLine(p2.x, p2.y, p3.x, p3.y, 40, 42, 48, 2);
  drawLine(p3.x, p3.y, p0.x, p0.y, 40, 42, 48, 2);
}

// Draw a filled circle with shading
function drawCircle(cx, cy, radius, r, g, b, alpha = 1) {
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(WIDTH - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(HEIGHT - 1, Math.ceil(cy + radius));
  const r2 = radius * radius;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d2 <= r2) {
        setPixel(x, y, r, g, b, alpha);
      }
    }
  }
}

// Draw wheel rim with alcantara texture, yellow 12 o'clock stripe, center hub, rev LEDs
function drawFanatecWheel(cx, cy, scale, progress) {
  const outerR = 64 * scale;
  const innerR = 48 * scale;
  const hubR = 26 * scale;

  // Wheel rim (rich alcantara charcoal circle with hole)
  const minX = Math.max(0, Math.floor(cx - outerR));
  const maxX = Math.min(WIDTH - 1, Math.ceil(cx + outerR));
  const minY = Math.max(0, Math.floor(cy - outerR));
  const maxY = Math.min(HEIGHT - 1, Math.ceil(cy + outerR));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy);

      if (d <= outerR && d >= innerR) {
        // Alcantara charcoal shading with highlight
        const angle = Math.atan2(dy, dx);
        let r = 38, g = 38, b = 42;

        // Top 12 o'clock centering stripe (Bright Golden Yellow)
        if (Math.abs(angle + Math.PI / 2) < 0.08) {
          r = 255; g = 210; b = 40;
        } else {
          // Subtle red contrast stitching
          if (Math.abs(d - innerR - 2) < 0.8) {
            r = 220; g = 40; b = 40;
          }
        }
        setPixel(x, y, r, g, b, 1);
      }
    }
  }

  // Wheel horizontal & vertical spokes (brushed black anodized aluminum)
  drawPolygon([
    { x: cx - innerR, y: cy - 6 * scale },
    { x: cx - hubR, y: cy - 9 * scale },
    { x: cx - hubR, y: cy + 12 * scale },
    { x: cx - innerR, y: cy + 8 * scale }
  ], 30, 32, 36);

  drawPolygon([
    { x: cx + hubR, y: cy - 9 * scale },
    { x: cx + innerR, y: cy - 6 * scale },
    { x: cx + innerR, y: cy + 8 * scale },
    { x: cx + hubR, y: cy + 12 * scale }
  ], 30, 32, 36);

  drawPolygon([
    { x: cx - 10 * scale, y: cy + hubR },
    { x: cx + 10 * scale, y: cy + hubR },
    { x: cx + 7 * scale, y: cy + innerR },
    { x: cx - 7 * scale, y: cy + innerR }
  ], 30, 32, 36);

  // Central hub
  drawCircle(cx, cy, hubR, 32, 34, 38);
  drawCircle(cx, cy, hubR * 0.9, 20, 20, 24);

  // White Fanatec "F" Logo at center
  const fSize = 7 * scale;
  drawLine(cx - fSize * 0.4, cy - fSize * 0.6, cx - fSize * 0.4, cy + fSize * 0.6, 255, 255, 255, 2 * scale);
  drawLine(cx - fSize * 0.4, cy - fSize * 0.6, cx + fSize * 0.5, cy - fSize * 0.6, 255, 255, 255, 1.8 * scale);
  drawLine(cx - fSize * 0.4, cy - fSize * 0.05, cx + fSize * 0.3, cy - fSize * 0.05, 255, 255, 255, 1.8 * scale);

  // Rotary dials on spokes (Yellow, Blue, Green, Red)
  drawCircle(cx - 16 * scale, cy + 2 * scale, 3.5 * scale, 255, 210, 30); // Yellow dial
  drawCircle(cx + 16 * scale, cy + 2 * scale, 3.5 * scale, 45, 140, 255); // Blue dial
  drawCircle(cx - 16 * scale, cy - 14 * scale, 3.0 * scale, 240, 50, 50); // Red button
  drawCircle(cx + 16 * scale, cy - 14 * scale, 3.0 * scale, 50, 230, 90); // Green button

  // Curved LED Rev Meter on top of hub
  const numLeds = 9;
  for (let i = 0; i < numLeds; i++) {
    const ledAngle = -Math.PI / 2 + (i - (numLeds - 1) / 2) * 0.16;
    const lx = cx + Math.cos(ledAngle) * (hubR + 8 * scale);
    const ly = cy + Math.sin(ledAngle) * (hubR + 8 * scale);

    const revActive = i <= (3 + Math.floor(Math.sin(progress * 12) * 3 + 3));
    let lr = 30, lg = 30, lb = 30;

    if (revActive) {
      if (i < 3) { lr = 45; lg = 245; lb = 55; }
      else if (i < 6) { lr = 255; lg = 220; lb = 40; }
      else { lr = 255; lg = 45; lb = 45; }
    }
    drawCircle(lx, ly, 2.0 * scale, lr, lg, lb);
  }
}

// Draw Trak Racer bucket seat
function drawBucketSeat(seatX, seatY, scale) {
  // Main seat backrest - high quality racing seat
  const seatPoints = [
    { x: seatX - 28 * scale, y: seatY - 140 * scale }, // headrest top left
    { x: seatX + 28 * scale, y: seatY - 140 * scale }, // headrest top right
    { x: seatX + 42 * scale, y: seatY - 100 * scale }, // shoulder wing right
    { x: seatX + 38 * scale, y: seatY - 30 * scale },  // rib bolster right
    { x: seatX + 48 * scale, y: seatY + 40 * scale },  // thigh bolster right
    { x: seatX - 48 * scale, y: seatY + 40 * scale },  // thigh bolster left
    { x: seatX - 38 * scale, y: seatY - 30 * scale },  // rib bolster left
    { x: seatX - 42 * scale, y: seatY - 100 * scale }  // shoulder wing left
  ];
  drawPolygon(seatPoints, 28, 30, 36);

  // Seat inner cushion (detailed contrast fabric)
  const cushionPoints = [
    { x: seatX - 18 * scale, y: seatY - 120 * scale },
    { x: seatX + 18 * scale, y: seatY - 120 * scale },
    { x: seatX + 22 * scale, y: seatY - 40 * scale },
    { x: seatX + 26 * scale, y: seatY + 25 * scale },
    { x: seatX - 26 * scale, y: seatY + 25 * scale },
    { x: seatX - 22 * scale, y: seatY - 40 * scale }
  ];
  drawPolygon(cushionPoints, 42, 44, 52);

  // Seat harness holes
  drawPolygon([
    { x: seatX - 14 * scale, y: seatY - 80 * scale },
    { x: seatX - 4 * scale, y: seatY - 80 * scale },
    { x: seatX - 4 * scale, y: seatY - 70 * scale },
    { x: seatX - 14 * scale, y: seatY - 70 * scale }
  ], 12, 12, 16);
  drawPolygon([
    { x: seatX + 4 * scale, y: seatY - 80 * scale },
    { x: seatX + 14 * scale, y: seatY - 80 * scale },
    { x: seatX + 14 * scale, y: seatY - 70 * scale },
    { x: seatX + 4 * scale, y: seatY - 70 * scale }
  ], 12, 12, 16);

  // White "TRAK RACER" embroidered text on headrest
  drawLine(seatX - 16 * scale, seatY - 110 * scale, seatX + 16 * scale, seatY - 110 * scale, 255, 255, 255, 2 * scale);
  drawLine(seatX - 14 * scale, seatY - 105 * scale, seatX + 14 * scale, seatY - 105 * scale, 230, 230, 240, 1.4 * scale);
}

// Draw aluminum extrusion cockpit profile frame - clear metallic finish
function drawAluminumChassis(originX, originY, scale) {
  const profileColor = [38, 42, 50];
  const slotColor = [22, 24, 28];
  const bracketColor = [65, 70, 82];

  // Base rail bottom left to front
  drawPolygon([
    { x: originX - 90 * scale, y: originY + 50 * scale },
    { x: originX - 60 * scale, y: originY + 120 * scale },
    { x: originX - 40 * scale, y: originY + 120 * scale },
    { x: originX - 70 * scale, y: originY + 50 * scale }
  ], profileColor[0], profileColor[1], profileColor[2]);

  // Base rail right to front
  drawPolygon([
    { x: originX + 70 * scale, y: originY + 50 * scale },
    { x: originX + 50 * scale, y: originY + 120 * scale },
    { x: originX + 70 * scale, y: originY + 120 * scale },
    { x: originX + 90 * scale, y: originY + 50 * scale }
  ], profileColor[0], profileColor[1], profileColor[2]);

  // Vertical upright for wheel mount left
  drawPolygon([
    { x: originX - 48 * scale, y: originY - 20 * scale },
    { x: originX - 36 * scale, y: originY - 20 * scale },
    { x: originX - 44 * scale, y: originY + 70 * scale },
    { x: originX - 56 * scale, y: originY + 70 * scale }
  ], profileColor[0] + 5, profileColor[1] + 5, profileColor[2] + 5);

  // Vertical upright for wheel mount right
  drawPolygon([
    { x: originX + 36 * scale, y: originY - 20 * scale },
    { x: originX + 48 * scale, y: originY - 20 * scale },
    { x: originX + 56 * scale, y: originY + 70 * scale },
    { x: originX + 44 * scale, y: originY + 70 * scale }
  ], profileColor[0] + 5, profileColor[1] + 5, profileColor[2] + 5);

  // Wheel mount crossbridge
  drawPolygon([
    { x: originX - 42 * scale, y: originY - 20 * scale },
    { x: originX + 42 * scale, y: originY - 20 * scale },
    { x: originX + 42 * scale, y: originY - 8 * scale },
    { x: originX - 42 * scale, y: originY - 8 * scale }
  ], profileColor[0] + 12, profileColor[1] + 12, profileColor[2] + 12);

  // Metallic Corner brackets
  drawCircle(originX - 40 * scale, originY + 68 * scale, 4.5 * scale, bracketColor[0], bracketColor[1], bracketColor[2]);
  drawCircle(originX + 46 * scale, originY + 68 * scale, 4.5 * scale, bracketColor[0], bracketColor[1], bracketColor[2]);

  // Pedals under wheel stand (Fanatec ClubSport V3)
  const pedalY = originY + 45 * scale;
  [-16, 0, 16].forEach((ox) => {
    drawPolygon([
      { x: originX + (ox - 3) * scale, y: pedalY - 14 * scale },
      { x: originX + (ox + 3) * scale, y: pedalY - 14 * scale },
      { x: originX + (ox + 4) * scale, y: pedalY + 6 * scale },
      { x: originX + (ox - 4) * scale, y: pedalY + 6 * scale }
    ], 190, 195, 205); // Bright brushed aluminum
  });

  // Fanatec logo bar on pedal base
  drawLine(originX - 22 * scale, pedalY + 9 * scale, originX + 22 * scale, pedalY + 9 * scale, 245, 245, 250, 2.2 * scale);
}

// Draw ambient neon light tubes in studio
function drawNeonTubes(camProg) {
  // Left wall tube (Orange-Red neon with bright aura)
  const leftTubeY = HEIGHT * 0.72;
  const leftTubeX1 = 15;
  const leftTubeX2 = WIDTH * 0.28;
  drawLine(leftTubeX1, leftTubeY, leftTubeX2, leftTubeY, 255, 90, 35, 14, 0.22);
  drawLine(leftTubeX1, leftTubeY, leftTubeX2, leftTubeY, 255, 130, 60, 6, 0.55);
  drawLine(leftTubeX1, leftTubeY, leftTubeX2, leftTubeY, 255, 230, 200, 2.5, 0.98);

  // Right wall tube (Orange neon)
  const rightTubeY = HEIGHT * 0.70;
  const rightTubeX1 = WIDTH * 0.72;
  const rightTubeX2 = WIDTH - 15;
  drawLine(rightTubeX1, rightTubeY, rightTubeX2, rightTubeY, 255, 90, 35, 14, 0.22);
  drawLine(rightTubeX1, rightTubeY, rightTubeX2, rightTubeY, 255, 130, 60, 6, 0.55);
  drawLine(rightTubeX1, rightTubeY, rightTubeX2, rightTubeY, 255, 230, 200, 2.5, 0.98);

  // Floor reflection lines
  drawLine(leftTubeX1, leftTubeY + 28, leftTubeX2, leftTubeY + 28, 240, 80, 30, 16, 0.15);
  drawLine(rightTubeX1, rightTubeY + 32, rightTubeX2, rightTubeY + 32, 240, 80, 30, 16, 0.15);
}

// Google Veo watermark sparkle at bottom-right corner
function drawSparkleWatermark(x, y) {
  const size = 6;
  drawLine(x - size, y, x + size, y, 240, 240, 250, 1.2, 0.55);
  drawLine(x, y - size, x, y + size, 240, 240, 250, 1.2, 0.55);
  setPixel(x, y, 255, 255, 255, 0.85);
  setPixel(x + size + 4, y - size * 0.5, 240, 240, 250, 0.55);
}

// MAIN RENDER LOOP
async function renderAllFrames() {
  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const rawT = frame / (TOTAL_FRAMES - 1);
    const progress = easeInOutCubic(rawT);

    const camZoom = 0.85 + progress * 0.68;
    const camPanX = -45 + progress * 45;
    const camPanY = 10 - progress * 15;

    // Studio background - well-lit, sleek studio with subtle slate blue vignette
    for (let y = 0; y < HEIGHT; y++) {
      const gradY = y / HEIGHT;
      for (let x = 0; x < WIDTH; x++) {
        const idx = (y * WIDTH + x) * 3;
        const distFromCenter = Math.hypot((x - WIDTH / 2) / WIDTH, (y - HEIGHT / 2) / HEIGHT);
        
        let bgR = Math.max(16, Math.floor(34 - distFromCenter * 16));
        let bgG = Math.max(18, Math.floor(38 - distFromCenter * 16));
        let bgB = Math.max(26, Math.floor(52 - distFromCenter * 20));

        // Floor reflection plane in bottom half
        if (gradY > 0.65) {
          const floorDist = (gradY - 0.65) / 0.35;
          bgR = Math.floor(bgR + floorDist * 16);
          bgG = Math.floor(bgG + floorDist * 14);
          bgB = Math.floor(bgB + floorDist * 20);
        }

        frameBuffer[idx] = bgR;
        frameBuffer[idx + 1] = bgG;
        frameBuffer[idx + 2] = bgB;
      }
    }

    // Draw neon background lights
    drawNeonTubes(progress);

    // TRIPLE SCREEN COORDINATES (Panoramic curved triple monitor stand)
    const rigCenterX = WIDTH * 0.44 + camPanX;
    const rigCenterY = HEIGHT * 0.52 + camPanY;

    // Monitor stand uprights behind screens
    drawLine(rigCenterX - 110 * camZoom, rigCenterY - 140 * camZoom, rigCenterX - 110 * camZoom, rigCenterY + 40 * camZoom, 32, 34, 40, 5 * camZoom);
    drawLine(rigCenterX + 110 * camZoom, rigCenterY - 140 * camZoom, rigCenterX + 110 * camZoom, rigCenterY + 40 * camZoom, 32, 34, 40, 5 * camZoom);
    drawLine(rigCenterX - 240 * camZoom, rigCenterY - 90 * camZoom, rigCenterX + 240 * camZoom, rigCenterY - 90 * camZoom, 35, 38, 44, 6 * camZoom);

    // 1. Center Monitor Quad
    const cWidth = 135 * camZoom;
    const cHeight = 84 * camZoom;
    const centerScreen = [
      { x: rigCenterX - cWidth, y: rigCenterY - cHeight - 45 * camZoom },
      { x: rigCenterX + cWidth, y: rigCenterY - cHeight - 45 * camZoom },
      { x: rigCenterX + cWidth, y: rigCenterY + cHeight - 45 * camZoom },
      { x: rigCenterX - cWidth, y: rigCenterY + cHeight - 45 * camZoom }
    ];
    drawScreenTrack(centerScreen, 'center', progress);

    // 2. Left Wing Monitor Quad (Angled inward ~35 deg)
    const lWidth = 115 * camZoom;
    const leftScreen = [
      { x: rigCenterX - cWidth - lWidth * 0.88, y: rigCenterY - cHeight - 32 * camZoom },
      { x: rigCenterX - cWidth - 2, y: rigCenterY - cHeight - 45 * camZoom },
      { x: rigCenterX - cWidth - 2, y: rigCenterY + cHeight - 45 * camZoom },
      { x: rigCenterX - cWidth - lWidth * 0.88, y: rigCenterY + cHeight - 58 * camZoom }
    ];
    drawScreenTrack(leftScreen, 'left', progress);

    // 3. Right Wing Monitor Quad (Angled inward ~35 deg)
    const rightScreen = [
      { x: rigCenterX + cWidth + 2, y: rigCenterY - cHeight - 45 * camZoom },
      { x: rigCenterX + cWidth + lWidth * 0.88, y: rigCenterY - cHeight - 32 * camZoom },
      { x: rigCenterX + cWidth + lWidth * 0.88, y: rigCenterY + cHeight - 58 * camZoom },
      { x: rigCenterX + cWidth + 2, y: rigCenterY + cHeight - 45 * camZoom }
    ];
    drawScreenTrack(rightScreen, 'right', progress);

    // Cockpit Chassis & Base (Aluminum Extrusion)
    drawAluminumChassis(rigCenterX, rigCenterY, camZoom);

    // Bucket Seat (Trak Racer) on the right side
    const seatX = rigCenterX + 95 * camZoom + progress * 60 * camZoom;
    const seatY = rigCenterY + 45 * camZoom;
    drawBucketSeat(seatX, seatY, camZoom * 1.05);

    // Sequential Shifter on the right profile
    const shifterX = rigCenterX + 58 * camZoom;
    const shifterY = rigCenterY + 28 * camZoom;
    drawLine(shifterX, shifterY, shifterX, shifterY - 22 * camZoom, 32, 34, 40, 3 * camZoom);
    drawCircle(shifterX, shifterY - 24 * camZoom, 4.5 * camZoom, 20, 20, 24);

    // Steering Wheel & Direct Drive Base (Fanatec DD)
    const wheelX = rigCenterX + (progress * 8);
    const wheelY = rigCenterY + 12 * camZoom;
    drawFanatecWheel(wheelX, wheelY, camZoom * 1.12, progress);

    // Sparkle watermark in bottom right corner
    drawSparkleWatermark(WIDTH - 38, HEIGHT - 32);

    // Write frame to ffmpeg stdin
    const canWrite = ffmpeg.stdin.write(frameBuffer);
    if (!canWrite) {
      await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
    }
  }

  // Close ffmpeg stdin to signal end of stream
  ffmpeg.stdin.end();
}

renderAllFrames().catch((err) => {
  console.error('Error rendering frames:', err);
});

