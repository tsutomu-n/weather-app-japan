import React, { useState } from 'react';
import WeatherButton from './WeatherButton';
import WeatherDisplay from './WeatherDisplay';
import { fetchWeatherData } from '@/lib/weatherUtils';

const WeatherApp: React.FC = () => {
  const [showWeather, setShowWeather] = useState(false);
  const [weatherData, setWeatherData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIFallback, setIsAIFallback] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('札幌');

  const getWeatherData = async (city: string) => {
    setLoading(true);
    setShowWeather(true);
    setWeatherData('');
    setError(null);
    setIsAIFallback(false);
    setSelectedCity(city === 'takasaki' ? '高崎' : '札幌');

    try {
      const { text, isFallback } = await fetchWeatherData(city);
      setWeatherData(text);
      setIsAIFallback(!!isFallback);
    } catch (error: any) {
      setError(error.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6">
      <header className="w-full max-w-lg text-center mb-8 mt-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          日本の都市 天気情報
        </h1>
        <p className="text-muted-foreground mt-2">
          WeatherAPIを使用した実際の天気情報サービス
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <WeatherButton 
          onClick={() => getWeatherData('sapporo')} 
          cityName="札幌" 
          variant="sapporo" 
        />
        <WeatherButton 
          onClick={() => getWeatherData('takasaki')} 
          cityName="高崎" 
          variant="takasaki" 
        />
      </div>

      <WeatherDisplay 
        showWeather={showWeather}
        loading={loading}
        error={error}
        weatherData={weatherData}
        isAIFallback={isAIFallback}
      />
      
      <footer className="mt-auto py-6 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} 日本気象情報サービス</p>
        <p className="mt-1">Powered by React + WeatherAPI</p>
        {isAIFallback && (
          <p className="mt-1 text-xs text-amber-500">※現在、WeatherAPIに接続できないため、Google Geminiの生成データを表示しています</p>
        )}
      </footer>
    </div>
  );
};

export default WeatherApp;
