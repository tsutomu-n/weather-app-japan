import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Cloud, 
  Thermometer, 
  Calendar, 
  Droplets, 
  Clock, 
  Wind, 
  Droplet, 
  ArrowDown, 
  Flower2, 
  Sun, 
  Gauge
} from "lucide-react";

interface WeatherInfoProps {
  weatherData: string;
  isMobile?: boolean;
  cardType?: 'basic' | 'forecast' | 'environment' | 'all';
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
  
  // 抽出テキストをログに出力して確認（デバッグ用）
  const extractedText = text.substring(contentStartIndex, endIndex).trim();
  console.log(`Extracted ${startPattern}: "${extractedText}"`);
  return extractedText;
};

const WeatherInfo: React.FC<WeatherInfoProps> = ({ 
  weatherData, 
  isMobile = false,
  cardType = 'all'
}) => {

  // マークダウンから情報を抽出
  const currentWeather = extractInfo(weatherData, '**☁️☔️ 現在の天気:**', ['**🌡️']);
  const currentTemp = extractInfo(weatherData, '**🌡️ 現在の気温:**', ['**📅']);
  const forecastTemp = extractInfo(weatherData, '**📅 今日の予想気温:**', ['**🌧']);
  const rainProb = extractInfo(weatherData, '**🌧 降水確率:**', ['**🍃', '**⏰']);
  
  // 時間ごとの予報を抽出
  const hourlyForecastSection = extractInfo(weatherData, '**⏰ 時間ごとの予報:**', ['**🍃']);
  const hourlyForecasts = hourlyForecastSection.split('\n').filter(line => line.includes('* '));
  
  // 環境データを抽出（正確に抽出するためにパターンを修正）
  const wind = extractInfo(weatherData, '**🍃 風:**', ['**💧']);
  const humidity = extractInfo(weatherData, '**💧 湿度:**', ['**⬇️']);
  const pressure = extractInfo(weatherData, '**⬇️ 気圧:**', ['**🌲']);
  
  // 花粉、黄砂、PM2.5用にパターンを修正しました
  const pollenPattern = '**🌲 花粉:**';
  const pollenIndex = weatherData.indexOf(pollenPattern);
  const pollen = pollenIndex !== -1 
    ? weatherData.substring(pollenIndex + pollenPattern.length, weatherData.indexOf('**💛', pollenIndex)).trim()
    : '';
  console.log('Pollen Data:', pollen);
  
  const yellowSandPattern = '**💛 黄砂:**';
  const yellowSandIndex = weatherData.indexOf(yellowSandPattern);
  const yellowSand = yellowSandIndex !== -1 
    ? weatherData.substring(yellowSandIndex + yellowSandPattern.length, weatherData.indexOf('**🌫', yellowSandIndex)).trim()
    : '';
  console.log('Yellow Sand Data:', yellowSand);
  
  const pm25Pattern = '**🌫 PM2.5:**';
  const pm25Index = weatherData.indexOf(pm25Pattern);
  const pm25 = pm25Index !== -1 
    ? weatherData.substring(pm25Index + pm25Pattern.length, weatherData.indexOf('\n\n', pm25Index) !== -1 ? weatherData.indexOf('\n\n', pm25Index) : weatherData.length).trim()
    : '';
  console.log('PM2.5 Data:', pm25);
  
  // フッター情報を抽出
  const footer = weatherData.substring(weatherData.lastIndexOf('\n')).trim();
  
  // 基本情報カード
  const BasicInfoCard = () => (
    <div className={`px-2 ${isMobile ? 'py-3' : 'py-4'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100/60">
        <div className="touch-manipulation py-3 md:py-0 md:pr-3">
          <div className="flex items-start">
            <div className="bg-gradient-to-br from-blue-500 to-sky-600 p-1.5 rounded-full shadow-sm mr-2.5">
              <Cloud className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">現在の天気</p>
              <p className="text-lg font-medium">{currentWeather}</p>
            </div>
          </div>
        </div>
        <div className="touch-manipulation py-3 md:py-0 md:pl-3">
          <div className="flex items-start">
            <div className="bg-gradient-to-br from-blue-500 to-sky-600 p-1.5 rounded-full shadow-sm mr-2.5">
              <Thermometer className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">現在の気温</p>
              <p className="text-lg font-medium">{currentTemp}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // 予報情報カード
  const ForecastCard = () => (
    <div className={`px-2 ${isMobile ? 'py-3' : 'py-4'}`}>
      <div className="grid grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100/60">
        <div className="touch-manipulation py-3 md:py-0 md:pr-3">
          <div className="flex items-start">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-1.5 rounded-full shadow-sm mr-2.5">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">予想気温</p>
              <p className={`${isMobile ? 'text-sm font-medium' : 'text-base font-medium'}`}>{forecastTemp}</p>
            </div>
          </div>
        </div>
        <div className="touch-manipulation py-3 md:py-0 md:pl-3">
          <div className="flex items-start">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-1.5 rounded-full shadow-sm mr-2.5">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">降水確率</p>
              <p className={`${isMobile ? 'text-sm font-medium' : 'text-base font-medium'}`}>{rainProb}</p>
            </div>
          </div>
        </div>
      </div>
      
      {hourlyForecasts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100/60">
          <div className="flex items-center mb-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-1.5 rounded-full shadow-sm mr-2">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-gray-600 font-medium">時間ごとの予報</p>
          </div>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
            {hourlyForecasts.map((forecast, index) => (
              <div key={index} className="flex items-center py-1.5 touch-manipulation">
                <div className="w-1 h-1 bg-amber-400 rounded-full mr-2"></div>
                <p className={`${isMobile ? 'text-sm' : 'text-base'}`}>
                  {forecast.replace('* ', '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  // 環境データカード
  const EnvironmentCard = () => (
    <div className={`px-2 ${isMobile ? 'py-3' : 'py-4'}`}>
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4 divide-y ${isMobile ? '' : 'md:divide-y-0 md:divide-x'} divide-gray-100/60`}>
        <div className="touch-manipulation py-3 md:py-0 md:pr-3">
          <div className="flex items-start">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-1.5 rounded-full shadow-sm mr-2.5">
              <Wind className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">風</p>
              <p className={`${isMobile ? 'text-sm font-medium' : 'text-base font-medium'}`}>{wind}</p>
            </div>
          </div>
        </div>
        <div className="touch-manipulation py-3 md:py-0 md:px-3">
          <div className="flex items-start">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-1.5 rounded-full shadow-sm mr-2.5">
              <Droplet className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">湿度</p>
              <p className={`${isMobile ? 'text-sm font-medium' : 'text-base font-medium'}`}>{humidity}</p>
            </div>
          </div>
        </div>
        <div className="touch-manipulation py-3 md:py-0 md:pl-3">
          <div className="flex items-start">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-1.5 rounded-full shadow-sm mr-2.5">
              <Gauge className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">気圧</p>
              <p className={`${isMobile ? 'text-sm font-medium' : 'text-base font-medium'}`}>{pressure}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100/60">
        <div className="flex items-center mb-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-1.5 rounded-full shadow-sm mr-2">
            <Sun className="h-4 w-4 text-white" />
          </div>
          <p className="text-sm text-gray-600 font-medium">環境情報</p>
        </div>
        
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-3'}`}>
          <div className="touch-manipulation bg-green-50/50 p-3 rounded-lg shadow-sm">
            <div className="flex items-center mb-1">
              <Flower2 className="h-3.5 w-3.5 text-green-700 mr-1.5" />
              <p className="text-sm text-green-700 font-medium">花粉</p>
            </div>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} break-words min-h-[2rem]`}>{pollen || "データがありません"}</p>
          </div>
          <div className="touch-manipulation bg-amber-50/50 p-3 rounded-lg shadow-sm">
            <div className="flex items-center mb-1">
              <Wind className="h-3.5 w-3.5 text-amber-700 mr-1.5" />
              <p className="text-sm text-amber-700 font-medium">黄砂</p>
            </div>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} break-words min-h-[2rem]`}>{yellowSand || "データがありません"}</p>
          </div>
          <div className="touch-manipulation bg-blue-50/50 p-3 rounded-lg shadow-sm">
            <div className="flex items-center mb-1">
              <Cloud className="h-3.5 w-3.5 text-blue-700 mr-1.5" />
              <p className="text-sm text-blue-700 font-medium">PM2.5</p>
            </div>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} min-h-[2rem]`}>{pm25 || "データがありません"}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-right text-xs text-muted-foreground">
        {footer}
      </div>
    </div>
  );
  
  // 特定のカードタイプを表示
  if (cardType === 'basic') {
    return <BasicInfoCard />;
  } else if (cardType === 'forecast') {
    return <ForecastCard />;
  } else if (cardType === 'environment') {
    return <EnvironmentCard />;
  }
  
  // すべてのカードを表示（デフォルト）
  return (
    <div className="space-y-6">
      {/* 基本情報カード */}
      <Card className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 backdrop-blur-sm border border-white/30 shadow-lg transform hover:translate-y-[-2px] transition-all">
        <CardHeader className="pb-2 border-b border-blue-100/70">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-sky-600 p-2 rounded-full shadow-md mr-3">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 font-bold`}>
              基本情報
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className={`pt-4 ${isMobile ? 'px-3' : 'px-6'}`}>
          <BasicInfoCard />
        </CardContent>
      </Card>
      
      {/* 予報情報カード */}
      <Card className="overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 backdrop-blur-sm border border-white/30 shadow-lg transform hover:translate-y-[-2px] transition-all">
        <CardHeader className="pb-2 border-b border-amber-100/70">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-full shadow-md mr-3">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500 font-bold`}>
              今日の予報
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className={`pt-4 ${isMobile ? 'px-3' : 'px-6'}`}>
          <ForecastCard />
        </CardContent>
      </Card>
      
      {/* 環境データカード */}
      <Card className="overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur-sm border border-white/30 shadow-lg transform hover:translate-y-[-2px] transition-all">
        <CardHeader className="pb-2 border-b border-green-100/70">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-full shadow-md mr-3">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500 font-bold`}>
              環境データ
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className={`pt-4 ${isMobile ? 'px-3' : 'px-6'}`}>
          <EnvironmentCard />
        </CardContent>
        <CardFooter className="bg-white/60 backdrop-blur-sm border-t border-green-100/50 px-4 py-2 text-right text-xs text-muted-foreground">
          {footer}
        </CardFooter>
      </Card>
    </div>
  );
};

export default WeatherInfo;
