import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { ingredients, skinType, concerns, isTrial } = await req.json();

    if (!ingredients?.trim()) {
      return NextResponse.json({ ok: false, error: '成分が入力されていません' }, { status: 400 });
    }

    // --- クレジット確認 ---
    let userId: string | null = null;

    if (!isTrial) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (toSet) => {
              toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ ok: false, error: 'ログインが必要です' }, { status: 401 });

      userId = user.id;

      const { data: creditRow } = await supabaseAdmin
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single();

      if (!creditRow || creditRow.credits < 1) {
        return NextResponse.json({ ok: false, error: 'クレジットが不足しています', code: 'no_credits' }, { status: 402 });
      }
    }

    // --- Claude API 呼び出し ---
    const skinContext    = skinType ? `\n【肌タイプ】${skinType}` : '';
    const concernContext = concerns?.length > 0 ? `\n【肌の悩み】${concerns.join('、')}` : '';

    const prompt = `あなたは化粧品成分の専門家（コスメトロジスト）です。以下の成分リストを解析してください。${skinContext}${concernContext}

【成分リスト】
${ingredients}

以下のJSON形式で回答してください。余計なテキストは不要です。JSONのみ返してください。

{
  "ingredients": [
    {
      "name": "元の表記のまま",
      "normalized": "一般的な名称（英語 or 日本語）",
      "function": "機能（例：保湿剤、防腐剤、界面活性剤、香料、酸化防止剤、紫外線吸収剤、着色剤、増粘剤など）",
      "safety": "safe|caution|warning|unknown のいずれか",
      "safetyScore": 1-5の整数（5が最も安全、1が最も懸念あり）,
      "description": "この成分についての簡単な説明（1〜2文）",
      "concerns": ["懸念点1", "懸念点2"],
      "goodFor": ["乾燥肌", "敏感肌"]
    }
  ],
  "overallSafety": "safe|caution|warning|unknown",
  "summary": "全体の評価（2〜3文）",
  "warnings": ["全体的な注意事項1", "注意事項2"],
  "highlights": ["注目すべき良い成分1", "良い成分2"]
}

【安全性の基準】
- safe（5）: セラミド、ヒアルロン酸、グリセリン、スクワランなど安全性が高く広く使われる成分
- safe（4）: ナイアシンアミド、パンテノール、アラントインなど有効性・安全性が確認済み
- caution（3）: アルコール類、一部の防腐剤（フェノキシエタノール等）、香料など人によって刺激になりうる成分
- warning（2以下）: パラベン類（一部）、フォルムアルデヒド放出防腐剤、ラウリル硫酸塩、高濃度の酸類など
- unknown: 情報が少ない成分

【注意】
- 成分リストは配合量の多い順（上位が多い）なので、上位の成分ほど重要
- 日本語・英語・INCI名など様々な表記があるので正確に識別すること
- 全成分が多い場合でも全て解析すること`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSONの解析に失敗しました');
    const data = JSON.parse(jsonMatch[0]);

    // --- クレジット消費（解析成功後に引く）---
    if (userId) {
      const { data: creditRow } = await supabaseAdmin
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single();

      await supabaseAdmin
        .from('user_credits')
        .update({ credits: (creditRow?.credits ?? 1) - 1, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: '解析に失敗しました' }, { status: 500 });
  }
}
