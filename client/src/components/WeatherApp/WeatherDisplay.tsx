import React, { useState } from 'react';
import WeatherInfo from './WeatherInfo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const [expanded, setExpanded] = useState(false);
  
  if (!showWeather) {
    return null;
  }

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

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
        <div className={`relative transition-all duration-300 ${isMobile ? 'pb-16' : ''}`}>
          <div className="flex justify-end items-center mb-2">
            <div>
              {fromCache && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <span className="inline-block mr-1">🕒</span>
                  {cachedAt}のデータ
                </Badge>
              )}
              {!fromCache && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <span className="inline-block mr-1">✓</span>
                  最新データ
                </Badge>
              )}
            </div>
          </div>
          
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expanded ? 'max-h-none' : 'max-h-[700px]'}`}>
            <Accordion type="multiple" defaultValue={["basic-info"]} className="w-full">
              <AccordionItem value="basic-info" className="border-b border-b-primary/20">
                <AccordionTrigger className="py-3 px-4 bg-primary/5 hover:bg-primary/10 rounded-t-lg font-semibold">
                  基本情報
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <WeatherInfo weatherData={weatherData} isMobile={isMobile} cardType="basic" onlyShowSpecificCard={true} />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="forecast" className="border-b border-b-primary/20">
                <AccordionTrigger className="py-3 px-4 bg-amber-500/5 hover:bg-amber-500/10 font-semibold">
                  今日の予報
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <WeatherInfo weatherData={weatherData} isMobile={isMobile} cardType="forecast" onlyShowSpecificCard={true} />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="environment" className="border-b border-b-primary/20">
                <AccordionTrigger className="py-3 px-4 bg-green-500/5 hover:bg-green-500/10 font-semibold">
                  環境データ
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <WeatherInfo weatherData={weatherData} isMobile={isMobile} cardType="environment" />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {isAIFallback && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-700 text-sm">
                  <span className="font-semibold">注意:</span> 現在、APIに接続できないためバックアップデータを表示中
                </p>
              </div>
            )}
          </div>
          
          {isMobile && !expanded && (
            <div 
              className="
                absolute bottom-0 left-0 right-0 
                flex justify-center items-center 
                p-2 bg-gradient-to-t from-white to-transparent
              "
            >
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleExpand}
                className="text-primary flex items-center gap-1 rounded-full bg-white/80 px-4 py-1 shadow-sm border"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="text-xs">すべて表示</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherDisplay;
