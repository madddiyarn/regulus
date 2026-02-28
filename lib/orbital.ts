import * as satellite from 'satellite.js';

export interface OrbitalPosition {
  x: number;
  y: number;
  z: number;
  time: Date;
}

export interface TLELines {
  line1: string;
  line2: string;
}

export function computeSatellitePosition(
  tleLine1: string,
  tleLine2: string,
  date: Date
): OrbitalPosition | null {
  try {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (
      typeof positionAndVelocity.position === 'boolean' ||
      !positionAndVelocity.position
    ) {
      return null;
    }

    const position = positionAndVelocity.position;

    return {
      x: position.x,
      y: position.y,
      z: position.z,
      time: date,
    };
  } catch (error) {
    console.error('[v0] Error computing satellite position:', error);
    return null;
  }
}

export function generateOrbitPath(
  tleLine1: string,
  tleLine2: string,
  startDate: Date,
  durationMinutes: number = 90,
  steps: number = 100
): OrbitalPosition[] {
  const positions: OrbitalPosition[] = [];
  const stepMs = (durationMinutes * 60 * 1000) / steps;

  for (let i = 0; i <= steps; i++) {
    const currentDate = new Date(startDate.getTime() + i * stepMs);
    const position = computeSatellitePosition(tleLine1, tleLine2, currentDate);

    if (position) {
      positions.push(position);
    }
  }

  return positions;
}

export function calculateDistance(
  pos1: { x: number; y: number; z: number },
  pos2: { x: number; y: number; z: number }
): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function calculateRelativeVelocity(
  tleLine1_sat1: string,
  tleLine2_sat1: string,
  tleLine1_sat2: string,
  tleLine2_sat2: string,
  date: Date
): number | null {
  try {
    const satrec1 = satellite.twoline2satrec(tleLine1_sat1, tleLine2_sat1);
    const satrec2 = satellite.twoline2satrec(tleLine1_sat2, tleLine2_sat2);

    const pv1 = satellite.propagate(satrec1, date);
    const pv2 = satellite.propagate(satrec2, date);

    if (
      typeof pv1.velocity === 'boolean' ||
      !pv1.velocity ||
      typeof pv2.velocity === 'boolean' ||
      !pv2.velocity
    ) {
      return null;
    }

    const vel1 = pv1.velocity;
    const vel2 = pv2.velocity;

    const dvx = vel1.x - vel2.x;
    const dvy = vel1.y - vel2.y;
    const dvz = vel1.z - vel2.z;

    return Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz) * 1000;
  } catch (error) {
    console.error('[v0] Error calculating relative velocity:', error);
    return null;
  }
}

export function parseTLEEpoch(tleLine1: string): Date | null {
  try {
    const epochStr = tleLine1.substring(18, 32).trim();
    const year = parseInt(epochStr.substring(0, 2));
    const fullYear = year < 57 ? 2000 + year : 1900 + year;
    const dayOfYear = parseFloat(epochStr.substring(2));
    
    const date = new Date(fullYear, 0, 1);
    date.setDate(dayOfYear);
    
    return date;
  } catch (error) {
    console.error('[v0] Error parsing TLE epoch:', error);
    return null;
  }
}

export function extractOrbitalElements(tleLine1: string, tleLine2: string) {
  try {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    
    return {
      inclination: satellite.degreesLat(satrec.inclo),
      rightAscension: satellite.degreesLong(satrec.nodeo),
      eccentricity: satrec.ecco,
      argumentOfPerigee: satellite.degreesLong(satrec.argpo),
      meanAnomaly: satellite.degreesLong(satrec.mo),
      meanMotion: satrec.no * 720 / Math.PI, // Convert to revs/day
    };
  } catch (error) {
    console.error('[v0] Error extracting orbital elements:', error);
    return null;
  }
}
