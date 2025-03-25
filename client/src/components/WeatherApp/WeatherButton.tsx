import { Button } from "@/components/ui/button";
import { MapPinIcon, SunIcon, Cloud, CloudRain, Droplets } from "lucide-react";
import { CityConfig } from "@/constants";
import { useIsMobile } from "@/hooks/use-mobile";

interface WeatherButtonProps {
  onClick: () => void;
  city: CityConfig;
  isSelected?: boolean;
}

// アイコンマッピング
const CITY_ICONS: Record<string, React.ElementType> = {
  "sapporo": SunIcon,
  "takasaki": MapPinIcon,
  "shimonita": Droplets,  // 下仁田町はネギの産地として知られているため、雫のアイコン
  // 将来的に追加される都市のアイコン
  "tokyo": Cloud,
  "osaka": CloudRain,
  "fukuoka": Droplets,
  // デフォルトアイコン
  "default": MapPinIcon
};

// 色のスタイルマッピング
const VARIANT_STYLES: Record<string, string> = {
  "sapporo": "bg-primary hover:bg-primary/90",
  "takasaki": "bg-emerald-600 hover:bg-emerald-700",
  "shimonita": "bg-amber-700 hover:bg-amber-800",
  // 将来的に追加される都市のスタイル
  "tokyo": "bg-blue-600 hover:bg-blue-700",
  "osaka": "bg-purple-600 hover:bg-purple-700",
  "fukuoka": "bg-amber-600 hover:bg-amber-700",
  // デフォルトスタイル
  "default": "bg-gray-600 hover:bg-gray-700"
};

const WeatherButton: React.FC<WeatherButtonProps> = ({ 
  onClick, 
  city,
  isSelected = false
}) => {
  const isMobile = useIsMobile();
  
  // 都市のバリアントに基づいてアイコンを選択
  const Icon = CITY_ICONS[city.id] || CITY_ICONS.default;
  
  // 都市のバリアントに基づいてボタンスタイルを選択
  const buttonClass = VARIANT_STYLES[city.variant] || VARIANT_STYLES.default;
  
  // 選択状態のスタイル
  const selectedClass = isSelected 
    ? "ring-2 ring-white ring-opacity-70 scale-105" 
    : "";
  
  return (
    <Button 
      onClick={onClick}
      className={`
        ${buttonClass} 
        ${selectedClass} 
        text-white 
        font-medium 
        ${isMobile ? 'py-3 px-3 text-sm w-full' : 'py-6 px-6 text-lg'} 
        rounded-lg 
        shadow-lg 
        focus:outline-none 
        focus:ring-2 
        focus:ring-opacity-50 
        active:scale-95
        touch-manipulation
        transition-all 
        duration-200 
        ${isMobile ? 'mx-0 my-0.5 h-16 flex flex-col items-center justify-center' : 'mx-2 my-2'}
      `}
      size={isMobile ? "default" : "lg"}
    >
      <Icon className={`${isMobile ? 'mb-1 h-5 w-5' : 'mr-2 h-5 w-5'}`} />
      <span className={isMobile ? 'text-center leading-tight' : ''}>
        {isMobile ? city.nameJa : `今日の${city.nameJa}`}
      </span>
    </Button>
  );
};

export default WeatherButton;
