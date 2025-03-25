import React from 'react';
import WeatherInfo from './NewWeatherInfo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface WeatherDisplayProps {
  showWeather: boolean;
  loading: boolean;
  error: string | null;
  weatherData: string;
  isAIFallback?: boolean;
  fromCache?: boolean;
  cachedAt?: string | null;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ 
  showWeather, 
  loading, 
  error, 
  weatherData,
  isAIFallback = false,
  fromCache = false,
  cachedAt = null
}) => {
  const isMobile = useIsMobile();
  
  if (!showWeather) {
    return null;
  }

  return (
    <div className="w-full animate-in fade-in duration-300">
      {loading && (
        <Card className="shadow-md text-center border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground text-lg">データ取得中...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card className="shadow-md border-none">
          <CardContent className="pt-6">
            <div className="flex items-start p-4 bg-destructive bg-opacity-10 rounded-lg">
              <div className="text-2xl text-destructive mr-3 mt-1">⚠️</div>
              <div>
                <h3 className="font-bold text-destructive">エラーが発生しました</h3>
                <p className="text-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && weatherData && (
        <div className="relative transition-all duration-300">
          <div className="transition-all duration-500 ease-in-out">
            <WeatherInfo weatherData={weatherData} isMobile={isMobile} cardType="all" />
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherDisplay;
