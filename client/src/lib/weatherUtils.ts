import { PROMPT_TEMPLATE } from "../constants";

// Response type from the Weather API or Gemini fallback
export interface GenerateResponse {
  text?: string;
  error?: string;
  details?: string;
  isAIFallback?: boolean;
  fromCache?: boolean;
  cachedAt?: string | null;
}

// Return type for weather data
export interface WeatherResult {
  text: string;
  isFallback: boolean;
  fromCache?: boolean;
  cachedAt?: string | null;
}

// キャッシュをクリアする関数
export const clearWeatherCache = async (): Promise<boolean> => {
  try {
    // Netlify環境では強制更新を使用する（キャッシュクリアのエンドポイントがないため）
    if (window.location.hostname.includes('netlify.app')) {
      // Netlifyでは各エンドポイントで個別にキャッシュが管理されるため、
      // 強制更新オプションを使って最新データを取得（実質的なキャッシュクリア）
      const apiUrl = '/.netlify/functions/weather';
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: 'sapporo', forceRefresh: true }),
      });
      return true;
    }
    
    const response = await fetch('/api/clear-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

// Function to fetch weather data from the server
export const fetchWeatherData = async (city?: string, forceRefresh = false): Promise<WeatherResult> => {
  try {
    // 環境によってAPIエンドポイントを切り替える
    // 本番環境（Netlify）ではNetlify Functionsのパスを使用
    const apiUrl = window.location.hostname.includes('netlify.app') 
      ? '/.netlify/functions/weather' 
      : '/api/weather';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: PROMPT_TEMPLATE,
        city: city || 'sapporo',
        forceRefresh: forceRefresh // キャッシュを無視して新しいデータを取得
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GenerateResponse = await response.json();

    if (data.error) {
      throw new Error(data.error + (data.details ? `: ${data.details}` : ""));
    }

    if (!data.text) {
      throw new Error("No text received from API");
    }
    
    return {
      text: data.text,
      isFallback: !!data.isAIFallback,
      fromCache: !!data.fromCache,
      cachedAt: data.cachedAt
    };

  } catch (error: any) {
    console.error('Error fetching weather data:', error);
    throw new Error(error.message || 'Unknown error occurred');
  }
};
