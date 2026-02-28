'use client';

import dynamic from 'next/dynamic';
import type { SatelliteData } from './orbit-visualizer';

const OrbitVisualizer = dynamic(
  () => import('./orbit-visualizer').then((m) => ({ default: m.OrbitVisualizer })),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full flex items-center justify-center"
        style={{ height: 'calc(100vh - 120px)', background: '#020817' }}
      >
        <div className="text-center text-white space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mx-auto" />
          <p className="text-sm text-white/50">Loading orbit visualization...</p>
        </div>
      </div>
    ),
  }
);

export { OrbitVisualizer };
export type { SatelliteData };
