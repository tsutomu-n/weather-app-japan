import { Button } from "@/components/ui/button";
import { MapPinIcon, SunIcon, Cloud, CloudRain, Droplets } from "lucide-react";
import { CityConfig } from "@/constants";

interface WeatherButtonProps {
  onClick: () => void;
  city: CityConfig;
  isSelected?: boolean;
}

// アイコンマッピング
const CITY_ICONS: Record<string, React.ElementType> = {
  "sapporo": SunIcon,
  "takasaki": MapPinIcon,
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
  // 都市のバリアントに基づいてアイコンを選択
  const Icon = CITY_ICONS[city.id] || CITY_ICONS.default;
  
  // 都市のバリアントに基づいてボタンスタイルを選択
  const buttonClass = VARIANT_STYLES[city.variant] || VARIANT_STYLES.default;
  
  // 選択状態のスタイル
  const selectedClass = isSelected 
    ? "ring-2 ring-white ring-opacity-70" 
    : "";
  
  return (
    <Button 
      onClick={onClick}
      className={`${buttonClass} ${selectedClass} text-white font-medium py-6 px-8 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 text-lg mb-4 mx-2`}
      size="lg"
    >
      <Icon className="mr-2 h-5 w-5" />
      今日の{city.nameJa}
    </Button>
  );
};

export default WeatherButton;
