import React, { useState, useEffect } from 'react';
import WeatherDisplay from './WeatherDisplay';
import { fetchWeatherData } from '@/lib/weatherUtils';
import { DEFAULT_CITY } from '@/constants';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-start min-h-screen p-2 sm:p-6 bg-gradient-to-b from-sky-50 to-white">
      <header className="w-full max-w-2xl text-center mb-3 sm:mb-6 mt-2 sm:mt-6">
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          今日の天気
        </h1>
        <div className="mt-2 text-lg font-medium text-gray-700">
          {DEFAULT_CITY.nameJa}
        </div>
      </header>
      
      {showWeather && (
        <div className="flex justify-center mb-3 sm:mb-4 w-full max-w-xs">
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            onClick={handleRefresh}
            disabled={loading}
            className={`
              flex items-center gap-1 shadow-sm touch-manipulation 
              active:scale-95 transition-transform
              ${isMobile ? 'w-full py-2.5' : ''}
            `}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            最新の情報に更新
          </Button>
        </div>
      )}

      <WeatherDisplay 
        showWeather={showWeather}
        loading={loading}
        error={error}
        weatherData={weatherData}
        isAIFallback={isAIFallback}
        fromCache={fromCache}
        cachedAt={cachedAt}
      />
      
      <footer className="mt-auto py-6 text-center text-muted-foreground text-sm">
        {isAIFallback && (
          <p className="mt-1 text-xs text-amber-500">※現在、APIに接続できないため、バックアップデータを表示しています</p>
        )}
      </footer>
    </div>
  );
};

export default WeatherApp;
