export const MODEL_NAME = "gemini-2.0-flash-lite";

// 都市の定義
export interface CityConfig {
  id: string;          // システム内部で使用するID (英語小文字)
  nameJa: string;      // 日本語表記の都市名
  apiName: string;     // WeatherAPIで使用する都市名
  variant: string;     // UIスタイルのバリアント名
}

// サポートされている都市（単一都市のみ）
export const SUPPORTED_CITIES: CityConfig[] = [
  {
    id: "sapporo",
    nameJa: "札幌",
    apiName: "Sapporo",
    variant: "default"
  }
];

// デフォルトの都市設定
export const DEFAULT_CITY = SUPPORTED_CITIES[0];

// キャッシュの有効期間 (ミリ秒)
export const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12時間

// 環境データのキャッシュ有効期間 (ミリ秒)
export const ENV_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24時間

export const PROMPT_TEMPLATE = `
  あなたは、札幌の天気情報を提供するアシスタントです。
  今日の札幌市（主に中央区）の天気、気温、気圧、花粉、黄砂、PM2.5の情報を、以下の形式で提供してください。
  データがない場合は、「不明」と記載してください。

  # 今日の札幌の天気

  **☁️☔️ 天気:** [天気]
  **🌡️ 気温:** 最高 [最高気温]℃ / 最低 [最低気温]℃
  **🍃 風:** [風速] m/s
  **💧 湿度:** [湿度] %
  **⬇️ 気圧:** [気圧] hPa (傾向: [上昇/低下/安定])

  **🌲 花粉:**
  *   スギ花粉: [飛散状況]
  *   その他: [その他の花粉情報]

  **💛 黄砂:** [黄砂情報]

  **🌫 PM2.5:** [PM2.5情報]

  **📝 一言:**
  [全体的なコメント]
`;
