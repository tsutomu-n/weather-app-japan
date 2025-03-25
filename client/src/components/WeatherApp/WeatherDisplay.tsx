import React from 'react';
import WeatherInfo from './WeatherInfo';

interface WeatherDisplayProps {
  showWeather: boolean;
  loading: boolean;
  error: string | null;
  weatherData: string;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ 
  showWeather, 
  loading, 
  error, 
  weatherData 
}) => {
  if (!showWeather) {
    return null;
  }

  return (
    <div className="w-full max-w-lg animate-in fade-in duration-300">
      {loading && (
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground text-lg">生成中...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-start p-4 bg-destructive bg-opacity-10 rounded-lg">
            <div className="text-2xl text-destructive mr-3 mt-1">⚠️</div>
            <div>
              <h3 className="font-bold text-destructive">エラーが発生しました</h3>
              <p className="text-foreground mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && weatherData && (
        <WeatherInfo weatherData={weatherData} />
      )}
    </div>
  );
};

export default WeatherDisplay;
