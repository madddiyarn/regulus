'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface SatelliteData {
  id: number;
  name: string;
  norad_id: string;
  orbitPath?: [number, number, number][];
  color?: string;
}

interface OrbitVisualizerProps {
  satellites: SatelliteData[];
  onSelectSatellite?: (id: number) => void;
}

const EARTH_RADIUS_KM = 6371;

const COLORS = [
  '#60a5fa', '#34d399', '#f59e0b', '#f87171',
  '#a78bfa', '#38bdf8', '#fb923c', '#4ade80',
  '#e879f9', '#fbbf24', '#2dd4bf', '#f472b6',
];

function project3d(
  x: number, y: number, z: number,
  cx: number, cy: number,
  rx: number, ry: number,
  zoom: number
): [number, number, number] {
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  const fov = 600 * zoom;
  const p = fov / (fov + z2 + 2000);
  return [cx + x1 * p, cy + y2 * p, z2];
}

export function OrbitVisualizer({ satellites, onSelectSatellite }: OrbitVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const rotationRef = useRef({ x: 0.3, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) return;
    const cx = W / 2;
    const cy = H / 2;
    const rx = rotationRef.current.x;
    const ry = rotationRef.current.y;
    const zoom = zoomRef.current;
    const earthR = Math.min(W, H) * 0.28 * zoom;
    const scaleKm = earthR / EARTH_RADIUS_KM;

    ctx.fillStyle = '#020817';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 280; i++) {
      const sx = ((i * 7919 + 31) % (W - 4)) + 2;
      const sy = ((i * 6271 + 17) % (H - 4)) + 2;
      const alpha = 0.2 + (i % 5) * 0.12;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 5 === 0 ? 1.3 : 0.65, 0, Math.PI * 2);
      ctx.fill();
    }

    const atmGrad = ctx.createRadialGradient(cx, cy, earthR * 0.9, cx, cy, earthR * 1.4);
    atmGrad.addColorStop(0, 'rgba(56,130,246,0.15)');
    atmGrad.addColorStop(1, 'rgba(56,130,246,0)');
    ctx.fillStyle = atmGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR * 1.4, 0, Math.PI * 2);
    ctx.fill();

    const earthGrad = ctx.createRadialGradient(
      cx - earthR * 0.28, cy - earthR * 0.28, earthR * 0.04,
      cx, cy, earthR
    );
    earthGrad.addColorStop(0, '#2c85c1');
    earthGrad.addColorStop(0.3, '#1b5e8e');
    earthGrad.addColorStop(0.6, '#1e6b38');
    earthGrad.addColorStop(1, '#0d2b14');
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
    ctx.fill();

    const patches = [
      { lat: 50,  lon: 15,   rw: 22, rh: 13 },
      { lat: 5,   lon: 22,   rw: 20, rh: 24 },
      { lat: 55,  lon: 95,   rw: 32, rh: 20 },
      { lat: 38,  lon: -100, rw: 22, rh: 15 },
      { lat: -15, lon: -52,  rw: 15, rh: 18 },
      { lat: -25, lon: 133,  rw: 13, rh: 11 },
      { lat: 65,  lon: -45,  rw: 10, rh: 8  },
    ];
    ctx.fillStyle = 'rgba(38,100,50,0.70)';
    for (const p of patches) {
      const latR = (p.lat * Math.PI) / 180;
      const lonR = (p.lon * Math.PI) / 180;
      const ex = earthR * Math.cos(latR) * Math.cos(lonR);
      const ey = -earthR * Math.sin(latR);
      const ez = earthR * Math.cos(latR) * Math.sin(lonR);
      const [sx, sy, sz] = project3d(ex, ey, ez, cx, cy, rx, ry, zoom);
      if (sz > -earthR * 0.1) {
        const vis = Math.max(0, Math.min(1, (sz + earthR) / (2 * earthR)));
        ctx.globalAlpha = vis * 0.72;
        ctx.beginPath();
        ctx.ellipse(sx, sy, p.rw * zoom * vis, p.rh * zoom * vis, lonR + ry, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const [sx, sy] = project3d(earthR * Math.cos(a), 0, earthR * Math.sin(a), cx, cy, rx, ry, zoom);
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const [sx, sy] = project3d(earthR * Math.cos(a), earthR * Math.sin(a), 0, cx, cy, rx, ry, zoom);
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    for (let si = 0; si < satellites.length; si++) {
      const sat = satellites[si];
      const color = sat.color || COLORS[si % COLORS.length];

      if (sat.orbitPath && sat.orbitPath.length > 1) {
        ctx.strokeStyle = color + '55';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        let started = false;
        for (const [ox, oy, oz] of sat.orbitPath) {
          const [sx, sy] = project3d(ox * scaleKm, oy * scaleKm, oz * scaleKm, cx, cy, rx, ry, zoom);
          if (!started) { ctx.moveTo(sx, sy); started = true; }
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      let dotX = cx + earthR * 1.5;
      let dotY = cy;
      if (sat.orbitPath && sat.orbitPath.length > 0) {
        const idx = Math.floor(sat.orbitPath.length / 4);
        const [ox, oy, oz] = sat.orbitPath[Math.min(idx, sat.orbitPath.length - 1)];
        const [sx, sy] = project3d(ox * scaleKm, oy * scaleKm, oz * scaleKm, cx, cy, rx, ry, zoom);
        dotX = sx;
        dotY = sy;
      }

      const dotR = Math.max(3, 4 * zoom);

      const glow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, dotR * 3.5);
      glow.addColorStop(0, color + 'bb');
      glow.addColorStop(1, color + '00');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR * 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `${Math.max(9, Math.round(10 * zoom))}px monospace`;
      const label = sat.name.length > 16 ? sat.name.slice(0, 14) + '…' : sat.name;
      ctx.fillText(label, dotX + dotR + 4, dotY + 4);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(W - 150, 8, 142, 50, 8);
    else ctx.rect(W - 150, 8, 142, 50);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '10px sans-serif';
    ctx.fillText('Tracking', W - 140, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`${satellites.length}`, W - 140, 48);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.fillText('satellites', W - 107, 48);

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.font = '10px sans-serif';
    ctx.fillText('Data: Space-Track.org', 8, H - 8);
    ctx.fillText('Drag to rotate  ·  Scroll to zoom', cx - 72, H - 8);
  }, [satellites]);

  useEffect(() => {
    let last = performance.now();
    const animate = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!isDraggingRef.current) {
        rotationRef.current.y += dt * 0.06;
      }
      draw();
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      rotationRef.current.y += (e.clientX - lastMouseRef.current.x) * 0.005;
      rotationRef.current.x += (e.clientY - lastMouseRef.current.y) * 0.005;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { isDraggingRef.current = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = Math.max(0.4, Math.min(3.5, zoomRef.current - e.deltaY * 0.001));
    };
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 130px)', minHeight: 400, background: '#020817' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        style={{ display: 'block' }}
      />
      {satellites.length > 0 && (
        <div className="absolute bottom-8 left-3 bg-black/60 border border-white/10 text-white text-xs px-3 py-2 rounded-lg max-h-44 overflow-y-auto">
          <div className="font-semibold mb-1 text-white/60 uppercase tracking-wide">Satellites</div>
          {satellites.slice(0, 30).map((sat, i) => (
            <div
              key={sat.id}
              className="flex items-center gap-2 py-0.5 cursor-pointer hover:text-white/95 text-white/70 transition-colors"
              onClick={() => onSelectSatellite?.(sat.id)}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: sat.color || COLORS[i % COLORS.length] }}
              />
              <span className="truncate max-w-[160px]">{sat.name}</span>
            </div>
          ))}
          {satellites.length > 30 && (
            <div className="text-white/35 mt-1 text-xs">+{satellites.length - 30} more</div>
          )}
        </div>
      )}
      {satellites.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-white/40 space-y-2">
            <p className="text-sm">No satellite data loaded</p>
            <p className="text-xs">Import TLE data from Space-Track.org via the Import tab</p>
          </div>
        </div>
      )}
    </div>
  );
}
