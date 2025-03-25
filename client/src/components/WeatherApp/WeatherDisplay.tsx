import React from 'react';
import WeatherInfo from './WeatherInfo';
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
    <div className="w-full max-w-2xl animate-in fade-in duration-300">
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
        <>
          <div className="flex justify-end mb-2">
            {fromCache && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                <span className="inline-block mr-1">🕒</span>
                {cachedAt} キャッシュ（3時間有効）
              </Badge>
            )}
            {!fromCache && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <span className="inline-block mr-1">✓</span>
                最新データ
              </Badge>
            )}
          </div>
          
          <WeatherInfo weatherData={weatherData} isMobile={isMobile} />
          
          {isAIFallback && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 text-sm">
                <span className="font-semibold">注意:</span> 現在、APIに接続できないためバックアップデータを表示中
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeatherDisplay;
