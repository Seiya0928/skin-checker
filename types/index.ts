export type SafetyLevel = 'safe' | 'caution' | 'warning' | 'unknown';

export interface IngredientAnalysis {
  name: string;           // 成分名（元の表記）
  normalized: string;     // 正規化された名前
  function: string;       // 機能（保湿剤、防腐剤、香料など）
  safety: SafetyLevel;
  safetyScore: number;    // 1-5（5が最も安全）
  description: string;    // 説明
  concerns: string[];     // 懸念点
  goodFor: string[];      // 向いている肌タイプ
}

export interface AnalysisResult {
  ingredients: IngredientAnalysis[];
  overallSafety: SafetyLevel;
  summary: string;
  warnings: string[];     // 全体的な注意事項
  highlights: string[];   // 良い成分のハイライト
}

export const SAFETY_LABELS: Record<SafetyLevel, { label: string; color: string; bg: string }> = {
  safe:    { label: '安全',   color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  caution: { label: '注意',   color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  warning: { label: '警戒',   color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  unknown: { label: '不明',   color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
};
