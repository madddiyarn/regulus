'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const OrbitVisualizer = dynamic(
  () => import('./orbit-visualizer').then((mod) => ({ default: mod.OrbitVisualizer })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="w-48 h-48 rounded-full mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          <p className="text-sm text-muted-foreground">Loading 3D visualization...</p>
        </div>
      </div>
    ),
  }
);

export { OrbitVisualizer };
