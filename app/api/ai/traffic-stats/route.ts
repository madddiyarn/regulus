import { getDb } from '@/lib/db';

export const maxDuration = 30;

export async function POST(_req: Request) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return Response.json({ error: 'MISTRAL_API_KEY not set' }, { status: 500 });

  const sql = getDb();

  const [totals] = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_active = true)::int AS active,
      COUNT(*) FILTER (WHERE object_type ILIKE '%PAYLOAD%')::int AS payloads,
      COUNT(*) FILTER (WHERE object_type ILIKE '%ROCKET%')::int AS rocket_bodies,
      COUNT(*) FILTER (WHERE object_type ILIKE '%DEBRIS%')::int AS debris,
      COUNT(*) FILTER (WHERE decay_date IS NOT NULL)::int AS decayed
    FROM satellites
  `;

  const byCountry = await sql`
    SELECT COALESCE(NULLIF(TRIM(country),''), 'Unknown') AS country, COUNT(*)::int AS cnt
    FROM satellites GROUP BY country ORDER BY cnt DESC LIMIT 10
  `;

  const tleStats = await sql`
    SELECT
      AVG(EXTRACT(EPOCH FROM (NOW() - epoch))/86400)::int AS avg_age_days,
      COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (NOW() - epoch))/86400 > 30)::int AS stale_count
    FROM tle_data
  `;

  const [riskStats] = await sql`
    SELECT
      COUNT(*)::int AS total_risks,
      COUNT(*) FILTER (WHERE risk_level = 'CRITICAL')::int AS critical,
      COUNT(*) FILTER (WHERE risk_level = 'HIGH')::int AS high,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_risks
    FROM collision_risks
  `;

  const prompt = `Статистика орбитального трафика:
Объектов: ${totals.total} (активных: ${totals.active}, сошедших: ${totals.decayed})
Типы: Полезные нагрузки: ${totals.payloads}, Ракетные ступени: ${totals.rocket_bodies}, Мусор: ${totals.debris}
Топ стран: ${byCountry.map((c: { country: string; cnt: number }) => `${c.country}: ${c.cnt}`).join(', ')}
TLE: средний возраст ${tleStats[0]?.avg_age_days ?? '?'} дней, устаревших: ${tleStats[0]?.stale_count ?? 0}
Риски: всего ${riskStats.total_risks}, активных ${riskStats.active_risks}, CRITICAL: ${riskStats.critical}, HIGH: ${riskStats.high}

Верни JSON:
{
  "congestionLevel": "LOW|MODERATE|HIGH|CRITICAL",
  "summary": "краткий обзор на русском",
  "keyFindings": ["находка 1", "находка 2", "находка 3"],
  "debrisRatio": "процент мусора",
  "mostCongested": "наиболее загруженный режим",
  "dataQualityScore": "оценка 0-100",
  "trendAnalysis": "анализ тенденций",
  "recommendations": ["рекомендация 1", "рекомендация 2"],
  "stats": {
    "total": ${totals.total},
    "active": ${totals.active},
    "payloads": ${totals.payloads},
    "rocketBodies": ${totals.rocket_bodies},
    "debris": ${totals.debris},
    "activeRisks": ${riskStats.active_risks}
  }
}`;

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: 'You are a space traffic expert. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '{}';
    return Response.json(JSON.parse(text));
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
