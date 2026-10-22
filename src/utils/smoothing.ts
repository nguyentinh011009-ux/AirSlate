import { Point, Stroke } from '../types';

/**
 * Calculates stroke width based on nominal tool size, pressure, and drawing speed
 */
export function getCalculatedWidth(
  baseSize: number,
  tool: 'pen' | 'highlighter' | 'eraser',
  pressure: number,
  prevPoint?: Point,
  currPoint?: Point
): number {
  if (tool === 'eraser') {
    return baseSize * 3;
  }
  if (tool === 'highlighter') {
    return baseSize * 3.5;
  }

  // Active stylus pressure (e.g. Apple Pencil or S-Pen) provides values > 0 and != 0.5
  if (pressure > 0.05 && pressure < 0.95 && pressure !== 0.5) {
    return baseSize * (0.35 + pressure * 1.3);
  }

  // Velocity-based dynamic stroke simulation for standard capacitive finger touch
  if (prevPoint && currPoint) {
    const dt = Math.max(currPoint.time - prevPoint.time, 10);
    const dx = currPoint.x - prevPoint.x;
    const dy = currPoint.y - prevPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = dist / dt; // normalized units per ms
    const speedFactor = Math.max(0.6, Math.min(1.4, 1.2 - speed * 300));
    return baseSize * speedFactor;
  }

  return baseSize;
}

/**
 * Renders a single stroke onto an HTML5 Canvas 2D context using Quadratic Bezier Splines
 */
export function drawStrokeOnCanvas(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  canvasWidth: number,
  canvasHeight: number
) {
  const points = stroke.points;
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else if (stroke.tool === 'highlighter') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.globalAlpha = 0.35;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.globalAlpha = stroke.opacity ?? 1.0;
  }

  if (points.length === 1) {
    // Single tap dot
    const p = points[0];
    const width = getCalculatedWidth(stroke.size, stroke.tool, p.pressure);
    ctx.fillStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
    ctx.beginPath();
    ctx.arc(p.x * canvasWidth, p.y * canvasHeight, width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (points.length === 2) {
    const p0 = points[0];
    const p1 = points[1];
    const width = getCalculatedWidth(stroke.size, stroke.tool, p1.pressure, p0, p1);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(p0.x * canvasWidth, p0.y * canvasHeight);
    ctx.lineTo(p1.x * canvasWidth, p1.y * canvasHeight);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Multi-point spline rendering with mid-point quadratic curves
  ctx.beginPath();
  let prevP = points[0];
  ctx.moveTo(prevP.x * canvasWidth, prevP.y * canvasHeight);

  for (let i = 1; i < points.length - 1; i++) {
    const currentP = points[i];
    const nextP = points[i + 1];

    const midX = ((currentP.x + nextP.x) / 2) * canvasWidth;
    const midY = ((currentP.y + nextP.y) / 2) * canvasHeight;

    const width = getCalculatedWidth(
      stroke.size,
      stroke.tool,
      currentP.pressure,
      prevP,
      currentP
    );
    ctx.lineWidth = width;

    ctx.quadraticCurveTo(
      currentP.x * canvasWidth,
      currentP.y * canvasHeight,
      midX,
      midY
    );
    prevP = currentP;
  }

  // Draw last point
  const lastP = points[points.length - 1];
  const secondLastP = points[points.length - 2];
  const finalWidth = getCalculatedWidth(
    stroke.size,
    stroke.tool,
    lastP.pressure,
    secondLastP,
    lastP
  );
  ctx.lineWidth = finalWidth;
  ctx.lineTo(lastP.x * canvasWidth, lastP.y * canvasHeight);
  ctx.stroke();

  ctx.restore();
}
