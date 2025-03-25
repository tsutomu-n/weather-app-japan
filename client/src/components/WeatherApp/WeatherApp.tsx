import React, { useState } from 'react';
import WeatherButton from './WeatherButton';
import WeatherDisplay from './WeatherDisplay';
import { fetchWeatherData } from '@/lib/weatherUtils';

const WeatherApp: React.FC = () => {
  const [showWeather, setShowWeather] = useState(false);
  const [weatherData, setWeatherData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWeatherData = async () => {
    setLoading(true);
    setShowWeather(true);
    setWeatherData('');
    setError(null);

    try {
      const text = await fetchWeatherData();
      setWeatherData(text);
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
          札幌市天気情報
        </h1>
        <p className="text-muted-foreground mt-2">
          Google AI Geminiを使用した天気情報サービス
        </p>
      </header>

      <WeatherButton onClick={getWeatherData} />

      <WeatherDisplay 
        showWeather={showWeather}
        loading={loading}
        error={error}
        weatherData={weatherData}
      />
      
      <footer className="mt-auto py-6 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} 札幌天気情報サービス</p>
        <p className="mt-1">Powered by React + Google AI Gemini</p>
      </footer>
    </div>
  );
};

export default WeatherApp;
