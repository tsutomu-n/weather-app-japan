import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Cloud, 
  Thermometer, 
  Calendar, 
  Clock, 
  RotateCw,
  Wind, 
  Droplet, 
  ArrowDown, 
  Flower2, 
  MoveDown,
  Gauge,
  CloudRain
} from "lucide-react";

interface WeatherInfoProps {
  weatherData: string;
  isMobile?: boolean;
  cardType?: 'basic' | 'forecast' | 'environment' | 'all';
  onlyShowSpecificCard?: boolean;
  fromCache?: boolean;
  cachedAt?: string | null;
  onRefresh?: () => void;
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
  cardType = 'all',
  onlyShowSpecificCard = false,
  fromCache = false,
  cachedAt = null,
  onRefresh
}) => {
  // マークダウンから情報を抽出
  const currentWeather = extractInfo(weatherData, '**☁️☔️ 現在の天気:**', ['**🌡️']);
  const currentTemp = extractInfo(weatherData, '**🌡️ 現在の気温:**', ['**📅']);
  const forecastTemp = extractInfo(weatherData, '**📅 今日の予想気温:**', ['**🌧']);
  const rainProb = extractInfo(weatherData, '**🌧 降水確率:**', ['**🍃', '**⏰']);
  
  // 時間ごとの予報を抽出
  const hourlyForecastSection = extractInfo(weatherData, '**⏰ 時間ごとの予報:**', ['**🍃']);
  const hourlyForecasts = hourlyForecastSection.split('\n').filter(line => line.includes('* '));
  
  // 環境データを抽出
  const wind = extractInfo(weatherData, '**🍃 風:**', ['**💧']);
  const humidity = extractInfo(weatherData, '**💧 湿度:**', ['**⬇️']);
  const pressure = extractInfo(weatherData, '**⬇️ 気圧:**', ['**🌲']);
  
  // 花粉、黄砂、PM2.5用にパターンを修正
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
  
  // PM2.5を抽出（μg/m³の部分も含めて抽出するように修正）
  const pm25Pattern = /\*\*🌫 PM2\.5:\*\*\s*([\d.]+\s*μg\/m³)/;
  const pm25Match = weatherData.match(pm25Pattern);
  let pm25 = pm25Match ? pm25Match[1] : '';
  
  // コンソールに記録
  console.log('PM2.5 Data:', pm25);
  
  // キャッシュされた時間を人間が読みやすい形式に変換する関数
  const formatCachedTime = (cachedTime: string | null): string => {
    if (!cachedTime) return 'キャッシュ';
    
    // 時間だけを抽出（例：「12:34」の形式）
    const timeMatch = cachedTime.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]}のデータ`;
    }
    
    return 'キャッシュデータ';
  };
  
  // 風速を人間が理解しやすい表現に変換する関数
  const getWindDescription = (windStr: string): string => {
    // 風速を数値として抽出
    const windMatch = windStr.match(/(\d+\.?\d*)\s*km\/h/);
    if (!windMatch) return windStr;
    
    const windSpeed = parseFloat(windMatch[1]);
    let description = '';
    
    if (windSpeed < 5) {
      description = '微風（ほぼ無風）';
    } else if (windSpeed < 12) {
      description = '弱い風';
    } else if (windSpeed < 20) {
      description = 'やや強い風';
    } else if (windSpeed < 30) {
      description = '強い風';
    } else {
      description = '非常に強い風';
    }
    
    return `${windStr} - ${description}`;
  };
  
  // 気圧を人間が理解しやすい表現に変換する関数
  const getPressureDescription = (pressureStr: string): string => {
    // 気圧を数値として抽出
    const pressureMatch = pressureStr.match(/(\d+)\s*hPa/);
    if (!pressureMatch) return pressureStr;
    
    const pressure = parseInt(pressureMatch[1]);
    let description = '';
    
    if (pressure < 1000) {
      description = '低気圧（悪天候の可能性）';
    } else if (pressure < 1005) {
      description = 'やや低め';
    } else if (pressure < 1015) {
      description = '平常値';
    } else if (pressure < 1025) {
      description = 'やや高め';
    } else {
      description = '高気圧（安定した天気）';
    }
    
    return `${pressureStr}（${description}）`;
  };
  
  // PM2.5の値を健康への影響度として変換する関数
  const getPM25Description = (pm25Str: string): { value: string, description: string, color: string } => {
    // PM2.5の値を数値として抽出
    const pm25Match = pm25Str.match(/(\d+\.?\d*)\s*μg\/m³/);
    if (!pm25Match) {
      return {
        value: pm25Str || "データなし",
        description: "情報なし",
        color: "text-gray-500"
      };
    }
    
    const pm25Value = parseFloat(pm25Match[1]);
    let description = '';
    let color = '';
    
    if (pm25Value <= 12) {
      description = '良好';
      color = 'text-green-600';
    } else if (pm25Value <= 35.4) {
      description = '普通';
      color = 'text-yellow-600';
    } else if (pm25Value <= 55.4) {
      description = '敏感な方注意';
      color = 'text-orange-600';
    } else if (pm25Value <= 150.4) {
      description = '健康に悪影響';
      color = 'text-red-600';
    } else {
      description = '非常に悪い';
      color = 'text-purple-600';
    }
    
    return {
      value: pm25Str,
      description,
      color
    };
  };
  
  // 気温から数値部分のみを抽出する関数
  const extractTemperature = (tempStr: string): string => {
    const tempMatch = tempStr.match(/(\d+\.\d+)℃/);
    return tempMatch ? tempMatch[1] : '';
  };

  // 体感温度から数値部分のみを抽出する関数
  const extractFeelsLike = (tempStr: string): string => {
    const feelsLikeMatch = tempStr.match(/体感温度\s+(\d+\.\d+)℃/);
    return feelsLikeMatch ? feelsLikeMatch[1] : '';
  };

  // 最高・最低気温を抽出
  const maxTemp = forecastTemp.match(/最高\s+(\d+\.\d+)℃/)?.[1] || '';
  const minTemp = forecastTemp.match(/最低\s+(\d+\.\d+)℃/)?.[1] || '';

  // 時間ごとの予報を処理（フォーマットを調整）
  const formattedHourlyForecasts = hourlyForecasts.map(forecast => {
    const timeMatch = forecast.match(/\*\s+(\d+)時:\s+([^(]+)\s+\(([^)]+)\)/);
    if (timeMatch) {
      const [, time, temp, condition] = timeMatch;
      // 時間を数値に変換
      const hour = parseInt(time);
      // 午前/午後の表記を追加
      const formattedTime = hour < 12 ? `午前${hour}時` : (hour === 12 ? `午後12時` : `午後${hour - 12}時`);
      return { 
        time: formattedTime, 
        hour: hour, // 元の時間を保持（ソート用）
        temp: temp.trim(), 
        condition: condition.trim() 
      };
    }
    return { time: '', hour: 0, temp: '', condition: '' };
  })
  .filter(f => f.time !== '')
  // 時間順にソート
  .sort((a, b) => a.hour - b.hour);

  // 新しいデザインに基づいたコンポーネント
  return (
    <div className="space-y-8 max-w-md mx-auto px-4 py-6">
      {/* 基本情報カード - ダークモードヘッダー */}
      <Card className="overflow-hidden rounded-xl border border-gray-200 shadow-lg">
        <div className="bg-gray-900 text-white p-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">今日の天気</h2>
              <p className="text-gray-300 mt-1">札幌</p>
            </div>
            <div className="flex justify-center items-center w-12 h-12 bg-gray-800 rounded-full">
              <Cloud className="h-7 w-7 text-white" />
            </div>
          </div>
          
          <div className="flex items-end mt-6">
            <div className="text-6xl font-bold">
              {extractTemperature(currentTemp)}°C
            </div>
          </div>
          <div className="text-gray-300 mt-2">
            体感温度 {extractFeelsLike(currentTemp)}°C
          </div>
          
          <div className="mt-3 flex">
            <Badge className="bg-gray-700 text-white hover:bg-gray-700 border-none px-3 py-1">
              {currentWeather}
            </Badge>
            <Badge className="ml-2 bg-gray-700 text-white hover:bg-gray-700 border-none px-3 py-1">
              {fromCache ? formatCachedTime(cachedAt) : '最新データ'}
            </Badge>
          </div>
        </div>
        
        <div className="flex justify-center py-4">
          <button 
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer hover:bg-gray-100 px-4 py-2 rounded-full"
            onClick={() => onRefresh && onRefresh()}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            最新の情報に更新
          </button>
        </div>
      </Card>
      
      {/* 予報情報カード */}
      <Card className="overflow-hidden rounded-xl border border-gray-200 shadow-lg bg-white">
        <div className="flex items-center p-5 border-b border-gray-100">
          <Clock className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold">今日の予報</h3>
        </div>
        
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-gray-500 font-medium">予想気温</div>
              <div className="flex items-baseline mt-2">
                <ArrowDown className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-blue-600 font-medium">{minTemp}°C</span>
                
                <span className="mx-2 text-gray-400">/</span>
                
                <ArrowDown className="h-4 w-4 text-red-500 mr-1 rotate-180" />
                <span className="text-red-600 font-medium">{maxTemp}°C</span>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-gray-500 font-medium">降水確率</div>
              <div className="flex items-center mt-2">
                <CloudRain className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-blue-600 font-medium">{rainProb}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="text-sm text-gray-500 font-medium mb-3">時間ごとの予報</div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {formattedHourlyForecasts.map((forecast, index) => (
                  <div key={index} className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-gray-700 font-medium">{forecast.time}</div>
                    <div className="font-semibold my-1 text-lg">{forecast.temp}</div>
                    <div className="text-xs text-gray-500">{forecast.condition}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* 環境データカード */}
      <Card className="overflow-hidden rounded-xl border border-gray-200 shadow-lg bg-white">
        <div className="flex items-center p-5 border-b border-gray-100">
          <MoveDown className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold">環境データ</h3>
        </div>
        
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500 font-medium">風</div>
              <div className="mt-2 font-medium">
                <div className="text-sm text-gray-700 whitespace-normal">
                  {getWindDescription(wind)}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500 font-medium">湿度</div>
              <div className="mt-2 font-medium">
                {humidity}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500 font-medium">気圧</div>
              <div className="mt-2 font-medium text-sm">
                {getPressureDescription(pressure)}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500 font-medium">PM2.5</div>
              <div className="mt-2">
                {pm25 ? (
                  <>
                    <div className="font-medium">{pm25}</div>
                    <div className={`text-xs mt-1 ${getPM25Description(pm25).color} font-medium`}>
                      {getPM25Description(pm25).description}
                    </div>
                  </>
                ) : (
                  <div className="font-medium">データなし</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="text-sm text-gray-500 font-medium mb-2">環境情報</div>
            
            <div className="px-4 py-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center">
                <Flower2 className="h-5 w-5 text-amber-800 mr-2" />
                <span className="text-sm font-medium text-gray-700">花粉情報</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{pollen || "観測データなし"}</p>
            </div>
            
            <div className="px-4 py-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center">
                <Wind className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">黄砂情報</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{yellowSand || "観測データなし"}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WeatherInfo;