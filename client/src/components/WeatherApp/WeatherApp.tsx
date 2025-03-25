import React, { useState, useRef, useEffect, useCallback } from 'react';
import WeatherButton from './WeatherButton';
import WeatherDisplay from './WeatherDisplay';
import { fetchWeatherData, clearWeatherCache } from '@/lib/weatherUtils';
import { SUPPORTED_CITIES, CityConfig, DEFAULT_CITY } from '@/constants';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { type CarouselApi } from "@/components/ui/carousel";

const WeatherApp: React.FC = () => {
  const [showWeather, setShowWeather] = useState(false);
  const [weatherData, setWeatherData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIFallback, setIsAIFallback] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string>(DEFAULT_CITY.id);

  // 現在選択されている都市の設定を取得
  const getSelectedCity = (): CityConfig => {
    return SUPPORTED_CITIES.find(city => city.id === selectedCityId) || DEFAULT_CITY;
  };

  const getWeatherData = async (cityId: string) => {
    // cityIdに対応する都市設定を検索
    const cityConfig = SUPPORTED_CITIES.find(city => city.id === cityId);
    if (!cityConfig) {
      setError('指定された都市が見つかりません');
      return;
    }

    setLoading(true);
    setShowWeather(true);
    setWeatherData('');
    setError(null);
    setIsAIFallback(false);
    setSelectedCityId(cityId);

    try {
      const { text, isFallback, fromCache: cached, cachedAt: cachedTime } = await fetchWeatherData(cityId);
      setWeatherData(text);
      setIsAIFallback(!!isFallback);
      setFromCache(!!cached);
      if (cachedTime !== undefined) {
        setCachedAt(cachedTime);
      }
    } catch (error: any) {
      setError(error.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // リフレッシュ処理（キャッシュを無視して最新データを取得）
  const handleRefresh = async () => {
    if (loading) return; // 処理中なら何もしない
    
    const cityId = selectedCityId;
    setLoading(true);
    
    try {
      // 強制リフレッシュでデータを取得
      const { text, isFallback, fromCache: cached, cachedAt: cachedTime } = 
        await fetchWeatherData(cityId, true);
      
      setWeatherData(text);
      setIsAIFallback(!!isFallback);
      setFromCache(!!cached);
      if (cachedTime !== undefined) {
        setCachedAt(cachedTime);
      }
    } catch (error: any) {
      setError(error.message || 'リフレッシュ処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 選択された都市の情報
  const selectedCity = getSelectedCity();

  const isMobile = useIsMobile();

  // 初期データの読み込み
  useEffect(() => {
    if (!showWeather && SUPPORTED_CITIES.length > 0) {
      getWeatherData(DEFAULT_CITY.id);
    }
  }, []);

  // 選択された都市情報を取得（ここではデフォルト都市を使用）
  const cityInfo = SUPPORTED_CITIES.find(city => city.id === selectedCityId) || DEFAULT_CITY;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-2 sm:p-6 bg-gradient-to-b from-sky-50 to-white">
      <header className="w-full max-w-2xl text-center mb-3 sm:mb-6 mt-2 sm:mt-6">
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          今日の天気
        </h1>
        <div className="mt-2 text-lg font-medium text-gray-700">
          {cityInfo.nameJa}
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
