import React, { useState, useEffect } from 'react';
import WeatherDisplay from './WeatherDisplay';
import { fetchWeatherData } from '@/lib/weatherUtils';
import { DEFAULT_CITY } from '@/constants';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const WeatherApp: React.FC = () => {
  const [showWeather, setShowWeather] = useState(false);
  const [weatherData, setWeatherData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIFallback, setIsAIFallback] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const getWeatherData = async (forceRefresh = false) => {
    setLoading(true);
    setShowWeather(true);
    setWeatherData('');
    setError(null);
    setIsAIFallback(false);

    try {
      const { text, isFallback, fromCache: cached, cachedAt: cachedTime } = await fetchWeatherData(DEFAULT_CITY.id, forceRefresh);
      setWeatherData(text);
      setIsAIFallback(!!isFallback);
      setFromCache(!!cached);
      if (cachedTime !== undefined) {
        setCachedAt(cachedTime);
      }
    } catch (error: any) {
      setError(error.message || 'データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // リフレッシュ処理（キャッシュを無視して最新データを取得）
  const handleRefresh = async () => {
    if (loading) return; // 処理中なら何もしない
    await getWeatherData(true); // 強制リフレッシュ
  };

  const isMobile = useIsMobile();

  // 初期データの読み込み
  useEffect(() => {
    if (!showWeather) {
      getWeatherData();
    }
  }, []);

  // 定期的な更新 (5分ごと) - ユーザーが長時間アプリを開いている場合
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && showWeather) {
        getWeatherData(); // 自動更新はキャッシュを優先
      }
    }, 5 * 60 * 1000); // 5分
    
    return () => clearInterval(interval);
  }, [loading, showWeather]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-2 sm:p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <WeatherDisplay 
          showWeather={showWeather}
          loading={loading}
          error={error}
          weatherData={weatherData}
          isAIFallback={isAIFallback}
          fromCache={fromCache}
          cachedAt={cachedAt}
        />
        
        {isAIFallback && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm">
              <span className="font-semibold">注意:</span> 現在、APIに接続できないため、バックアップデータを表示しています
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherApp;
