import { generateText, Output } from 'ai';
import { getDb } from '@/lib/db';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const sql = getDb();

  const collisions = await sql`
    SELECT 
      cr.id, cr.primary_norad_id, cr.secondary_norad_id,
      cr.miss_distance, cr.risk_level, cr.tca,
      cr.relative_velocity, cr.collision_probability,
      s1.name as primary_name, s1.object_type as primary_type,
      s2.name as secondary_name, s2.object_type as secondary_type
    FROM collision_risks cr
    LEFT JOIN satellites s1 ON s1.norad_id = cr.primary_norad_id
    LEFT JOIN satellites s2 ON s2.norad_id = cr.secondary_norad_id
    WHERE cr.status = 'ACTIVE'
    ORDER BY cr.miss_distance ASC
    LIMIT 20
  `;

  const satellites = await sql`
    SELECT s.name, s.norad_id, s.object_type, s.country,
           t.epoch, t.inclination, t.mean_motion
    FROM satellites s
    LEFT JOIN tle_data t ON t.satellite_id = s.id
    ORDER BY t.epoch DESC NULLS LAST
    LIMIT 20
  `;

  if (collisions.length === 0 && satellites.length === 0) {
    return Response.json({
      summary: 'В базе данных нет данных для анализа. Импортируйте TLE данные с Space-Track.org.',
      risks: [],
      recommendations: ['Импортируйте данные с Space-Track.org через вкладку Import Data'],
      overallRisk: 'UNKNOWN',
    });
  }

  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    output: Output.object({
      schema: z.object({
        summary: z.string(),
        overallRisk: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN']),
        risks: z.array(z.object({
          id: z.number().nullable(),
          primaryName: z.string(),
          secondaryName: z.string(),
          missDistanceKm: z.number().nullable(),
          riskLevel: z.string(),
          priority: z.number(),
          recommendation: z.string(),
          urgency: z.enum(['IMMEDIATE', 'SOON', 'MONITOR', 'LOW']),
        })),
        recommendations: z.array(z.string()),
        tleDataQuality: z.string(),
      }),
    }),
    prompt: `Ты эксперт по космической безопасности. Проанализируй данные о спутниках и рисках столкновений из системы мониторинга.

Спутники в базе данных (${satellites.length} шт):
${satellites.map((s: any) => `- ${s.name} (NORAD: ${s.norad_id}, тип: ${s.object_type}, страна: ${s.country}, эпоха TLE: ${s.epoch ? new Date(s.epoch).toLocaleDateString() : 'нет'})`).join('\n')}

Активные риски столкновений (${collisions.length} шт):
${collisions.length > 0
  ? collisions.map((c: any) => `- ID:${c.id} | ${c.primary_name || c.primary_norad_id} ↔ ${c.secondary_name || c.secondary_norad_id} | расстояние: ${c.miss_distance?.toFixed(2)} км | риск: ${c.risk_level} | скорость: ${c.relative_velocity} м/с | TCA: ${c.tca}`).join('\n')
  : 'Нет активных рисков столкновений'}

Задача:
1. Оцени общий уровень риска для группировки спутников
2. Для каждого столкновения определи приоритет (1=высший) и рекомендацию
3. Оцени качество данных TLE (насколько свежие эпохи)
4. Дай общие рекомендации по улучшению мониторинга

Если данных мало — честно скажи об ограничениях анализа.`,
  });

  return Response.json(result.output);
}
