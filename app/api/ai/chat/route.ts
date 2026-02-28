import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { getDb } from '@/lib/db';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, context }: { messages: UIMessage[]; context?: string } = await req.json();

  const sql = getDb();

  const [satCount] = await sql`SELECT COUNT(*) as count FROM satellites`;
  const [tleCount] = await sql`SELECT COUNT(*) as count FROM tle_data`;
  const recentSats = await sql`
    SELECT name, norad_id, object_type, country FROM satellites ORDER BY created_at DESC LIMIT 5
  `;
  const recentCollisions = await sql`
    SELECT primary_norad_id, secondary_norad_id, miss_distance, risk_level, tca
    FROM collision_risks WHERE status = 'ACTIVE' ORDER BY tca ASC LIMIT 5
  `;

  const systemPrompt = `Ты — AI-ассистент системы мониторинга космических объектов и предотвращения столкновений.
Ты специализируешься на орбитальной механике, анализе TLE данных, оценке рисков столкновений и планировании манёвров уклонения.

Текущие данные системы (из базы данных):
- Всего спутников в базе: ${satCount.count}
- TLE записей: ${tleCount.count}
- Данные от: Space-Track.org

Последние спутники:
${recentSats.map((s: any) => `  • ${s.name} (NORAD: ${s.norad_id}, тип: ${s.object_type}, страна: ${s.country})`).join('\n')}

${recentCollisions.length > 0 ? `Активные риски столкновений:
${recentCollisions.map((c: any) => `  • NORAD ${c.primary_norad_id} ↔ ${c.secondary_norad_id}: ${c.miss_distance?.toFixed(1)} км, уровень: ${c.risk_level}`).join('\n')}` : 'Активных рисков столкновений не обнаружено.'}

${context ? `Дополнительный контекст от пользователя: ${context}` : ''}

Ты можешь:
- Объяснять орбитальные параметры из TLE данных
- Анализировать риски столкновений
- Рекомендовать манёвры уклонения (тип, ΔV, время)
- Объяснять результаты SGP4 пропагации
- Давать рекомендации по мониторингу конкретных спутников

Отвечай на том языке, на котором задан вопрос (русский или английский).
Будь точным, конкретным и используй реальные данные из системы когда это возможно.`;

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse();
}
