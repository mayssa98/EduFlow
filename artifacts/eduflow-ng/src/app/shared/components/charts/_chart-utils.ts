/**
 * Shared chart math: nice-max axis, catmull→bezier path, area path,
 * and a tooltip helper. Pure functions only — easy to test.
 */
export function niceMax(max: number, ticks = 5): number {
  if (max <= 0) return 1;
  const rough = max / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let nice: number;
  if (norm < 1.5)      nice = 1;
  else if (norm < 3)   nice = 2;
  else if (norm < 7)   nice = 5;
  else                 nice = 10;
  return nice * mag * ticks;
}

export interface Point { x: number; y: number; }

/** Smooth a polyline via Catmull-Rom → cubic Bezier. */
export function smoothPath(pts: Point[]): string {
  if (!pts.length) return '';
  if (pts.length < 3) return pts.map((p, i) => (i ? `L${p.x} ${p.y}` : `M${p.x} ${p.y}`)).join(' ');
  const t = 0.18;
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) * t, y: p1.y + (p2.y - p0.y) * t };
    const c2 = { x: p2.x - (p3.x - p1.x) * t, y: p2.y - (p3.y - p1.y) * t };
    d += ` C${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function areaUnder(pts: Point[], baselineY: number, leftX: number, rightX: number): string {
  return `${smoothPath(pts)} L${rightX} ${baselineY} L${leftX} ${baselineY} Z`;
}
