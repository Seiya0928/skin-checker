'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { type AnalysisResult, type SafetyLevel, SAFETY_LABELS } from '@/types';

const SKIN_TYPES = ['普通肌', '乾燥肌', '脂性肌', '混合肌', '敏感肌'];
const CONCERNS = ['ニキビ', '乾燥', '毛穴', 'くすみ', '黒ずみ', 'シミ', '赤み', 'エイジングケア'];

function SafetyBadge({ safety }: { safety: SafetyLevel }) {
  const s = SAFETY_LABELS[safety];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${s.bg} ${s.color}`}>
      {s.label}
    </span>
  );
}

function ScoreDots({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= score
              ? score >= 4 ? 'bg-green-500' : score === 3 ? 'bg-yellow-500' : 'bg-red-500'
              : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [ingredients, setIngredients] = useState('');
  const [skinType, setSkinType]       = useState('');
  const [concerns, setConcerns]       = useState<string[]>([]);
  const [analyzing, setAnalyzing]     = useState(false);
  const [result, setResult]           = useState<AnalysisResult | null>(null);
  const [error, setError]             = useState('');
  const [expanded, setExpanded]       = useState<Set<number>>(new Set());

  const toggleConcern = (c: string) => {
    setConcerns(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const toggleExpand = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleAnalyze = async () => {
    if (!ingredients.trim()) return;
    setAnalyzing(true);
    setError('');
    setResult(null);
    setExpanded(new Set());

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, skinType, concerns }),
      });
      const json = await res.json();
      if (json.ok) {
        setResult(json.data);
      } else {
        setError(json.error ?? '解析に失敗しました');
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setAnalyzing(false);
    }
  };

  const warningCount = result?.ingredients.filter(i => i.safety === 'warning').length ?? 0;
  const cautionCount = result?.ingredients.filter(i => i.safety === 'caution').length ?? 0;
  const safeCount    = result?.ingredients.filter(i => i.safety === 'safe').length ?? 0;

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">成分チェッカー</h2>
        <p className="text-xs text-gray-500">化粧品の成分表をコピー&ペーストして安全性を確認</p>
      </div>

      {/* 成分入力 */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">
              成分リスト <span className="text-red-400">*</span>
            </label>
            <Textarea
              value={ingredients}
              onChange={e => setIngredients(e.target.value)}
              placeholder={`例:\n水、グリセリン、ナイアシンアミド、セラミドNP、ヒアルロン酸Na、フェノキシエタノール...`}
              rows={5}
              className="text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              製品の「全成分」欄をコピーして貼り付けてください
            </p>
          </div>

          {/* 肌タイプ */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">
              肌タイプ（任意）
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SKIN_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setSkinType(prev => prev === t ? '' : t)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    skinType === t
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 bg-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 肌の悩み */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">
              気になること（任意・複数可）
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CONCERNS.map(c => (
                <button
                  key={c}
                  onClick={() => toggleConcern(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    concerns.includes(c)
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'border-gray-300 text-gray-600 bg-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <button
        onClick={handleAnalyze}
        disabled={analyzing || !ingredients.trim()}
        className={`w-full py-4 rounded-xl font-bold text-white text-base transition-colors ${
          analyzing || !ingredients.trim()
            ? 'bg-gray-400'
            : 'bg-blue-600 active:bg-blue-700'
        }`}
      >
        {analyzing ? '🔍 解析中...' : '成分を解析する'}
      </button>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* 解析結果 */}
      {result && (
        <div className="space-y-4">
          {/* 総合評価 */}
          <Card className={`border-2 ${SAFETY_LABELS[result.overallSafety].bg}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-800">総合評価</span>
                <SafetyBadge safety={result.overallSafety} />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{result.summary}</p>

              <div className="flex gap-4 text-xs mb-3">
                {warningCount > 0 && <span className="text-red-600 font-semibold">⚠ 警戒 {warningCount}種</span>}
                {cautionCount > 0 && <span className="text-yellow-600 font-semibold">△ 注意 {cautionCount}種</span>}
                {safeCount > 0 && <span className="text-green-600 font-semibold">✓ 安全 {safeCount}種</span>}
              </div>

              {result.warnings.length > 0 && (
                <div className="bg-red-50 rounded-lg px-3 py-2 mb-2">
                  <p className="text-xs font-semibold text-red-700 mb-1">⚠ 注意事項</p>
                  <ul className="space-y-0.5">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-red-600">• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.highlights.length > 0 && (
                <div className="bg-green-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-green-700 mb-1">✨ 注目成分</p>
                  <ul className="space-y-0.5">
                    {result.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-green-600">• {h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 成分一覧 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-700">
                全成分 ({result.ingredients.length}種)
              </CardTitle>
              <p className="text-xs text-gray-400">タップで詳細表示 • 上から配合量が多い順</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {result.ingredients.map((item, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-4 py-3 active:bg-gray-50"
                    onClick={() => toggleExpand(i)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ScoreDots score={item.safetyScore} />
                        <span className="text-sm text-gray-800 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-gray-400 hidden sm:block">{item.function}</span>
                        <SafetyBadge safety={item.safety} />
                        <span className="text-gray-300 text-xs">{expanded.has(i) ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {expanded.has(i) && (
                      <div className="mt-2 text-left space-y-1.5 pl-6">
                        <p className="text-xs text-gray-500">{item.function}</p>
                        {item.normalized !== item.name && (
                          <p className="text-xs text-gray-400">一般名: {item.normalized}</p>
                        )}
                        <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                        {item.concerns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.concerns.map((c, j) => (
                              <span key={j} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                                ⚠ {c}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.goodFor.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.goodFor.map((g, j) => (
                              <span key={j} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                                ✓ {g}向き
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <button
            onClick={() => { setResult(null); setIngredients(''); setSkinType(''); setConcerns([]); }}
            className="w-full py-3 rounded-xl text-sm text-gray-500 border border-gray-300"
          >
            もう一度チェックする
          </button>
        </div>
      )}
    </div>
  );
}
