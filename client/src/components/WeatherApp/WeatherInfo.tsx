import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface WeatherInfoProps {
  weatherData: string;
}

// マークダウンテキストから情報を抽出する関数
const extractInfo = (text: string, startPattern: string, endPatterns: string[] = []) => {
  const startIndex = text.indexOf(startPattern);
  if (startIndex === -1) return '';
  
  const contentStartIndex = startIndex + startPattern.length;
  
  let endIndex = text.length;
  for (const endPattern of endPatterns) {
    const tempEndIndex = text.indexOf(endPattern, contentStartIndex);
    if (tempEndIndex !== -1 && tempEndIndex < endIndex) {
      endIndex = tempEndIndex;
    }
  }
  
  return text.substring(contentStartIndex, endIndex).trim();
};

const WeatherInfo: React.FC<WeatherInfoProps> = ({ weatherData }) => {
  // マークダウンから情報を抽出
  const currentWeather = extractInfo(weatherData, '**☁️☔️ 現在の天気:**', ['**🌡️']);
  const currentTemp = extractInfo(weatherData, '**🌡️ 現在の気温:**', ['**📅']);
  const forecastTemp = extractInfo(weatherData, '**📅 今日の予想気温:**', ['**🌧']);
  const rainProb = extractInfo(weatherData, '**🌧 降水確率:**', ['**☀️']);
  const sunrise = extractInfo(weatherData, '**☀️ 日の出:**', ['**🌙']);
  const sunset = extractInfo(weatherData, '**🌙 日の入り:**', ['**⏰', '**🍃']);
  
  // 時間ごとの予報を抽出
  const hourlyForecastSection = extractInfo(weatherData, '**⏰ 時間ごとの予報:**', ['**🍃']);
  const hourlyForecasts = hourlyForecastSection.split('\n').filter(line => line.includes('* '));
  
  // 環境データを抽出
  const wind = extractInfo(weatherData, '**🍃 風:**', ['**💧']);
  const humidity = extractInfo(weatherData, '**💧 湿度:**', ['**⬇️']);
  const pressure = extractInfo(weatherData, '**⬇️ 気圧:**', ['**🌲']);
  const pollen = extractInfo(weatherData, '**🌲 花粉:**', ['**💛']);
  const yellowSand = extractInfo(weatherData, '**💛 黄砂:**', ['**🌫']);
  const pm25 = extractInfo(weatherData, '**🌫 PM2.5:**', ['\n\n']);
  
  // フッター情報を抽出
  const footer = weatherData.substring(weatherData.lastIndexOf('\n')).trim();
  
  return (
    <div className="space-y-4">
      {/* 基本情報カード */}
      <Card className="overflow-hidden border-t-4 border-t-blue-500">
        <CardHeader className="bg-blue-50 pb-2">
          <CardTitle className="text-xl text-blue-700">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-gray-500 mb-1">現在の天気</p>
              <p className="text-lg font-medium">{currentWeather}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">現在の気温</p>
              <p className="text-lg font-medium">{currentTemp}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 予報情報カード */}
      <Card className="overflow-hidden border-t-4 border-t-amber-500">
        <CardHeader className="bg-amber-50 pb-2">
          <CardTitle className="text-xl text-amber-700">今日の予報</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">予想気温</p>
              <p className="text-base">{forecastTemp}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">降水確率</p>
              <p className="text-base">{rainProb}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">日の出</p>
              <p className="text-base">{sunrise}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">日の入り</p>
              <p className="text-base">{sunset}</p>
            </div>
          </div>
          
          {hourlyForecasts.length > 0 && (
            <>
              <Separator className="my-3" />
              <p className="text-sm text-gray-500 mb-2">時間ごとの予報</p>
              <div className="grid grid-cols-2 gap-2">
                {hourlyForecasts.map((forecast, index) => (
                  <p key={index} className="text-base">{forecast.replace('* ', '')}</p>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* 環境データカード */}
      <Card className="overflow-hidden border-t-4 border-t-green-500">
        <CardHeader className="bg-green-50 pb-2">
          <CardTitle className="text-xl text-green-700">環境データ</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">風</p>
              <p className="text-base">{wind}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">湿度</p>
              <p className="text-base">{humidity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">気圧</p>
              <p className="text-base">{pressure}</p>
            </div>
          </div>
          
          <Separator className="my-3" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-sm text-gray-500 mb-1">花粉</p>
              <p className="text-base">{pollen}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">黄砂</p>
              <p className="text-base">{yellowSand}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">PM2.5</p>
              <p className="text-base">{pm25}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-background bg-opacity-70 px-4 py-2 text-right text-xs text-muted-foreground">
          {footer}
        </CardFooter>
      </Card>
    </div>
  );
};

export default WeatherInfo;
