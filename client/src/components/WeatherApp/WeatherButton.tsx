import { Button } from "@/components/ui/button";
import { MapPinIcon, SunIcon } from "lucide-react";

interface WeatherButtonProps {
  onClick: () => void;
  cityName?: string;
  variant?: "sapporo" | "takasaki";
}

const WeatherButton: React.FC<WeatherButtonProps> = ({ 
  onClick, 
  cityName = "札幌", 
  variant = "sapporo" 
}) => {
  // Choose icon based on variant
  const Icon = variant === "takasaki" ? MapPinIcon : SunIcon;
  
  // Adjust button colors based on variant
  const buttonClass = variant === "takasaki" 
    ? "bg-emerald-600 hover:bg-emerald-700" 
    : "bg-primary hover:bg-primary/90";
  
  return (
    <Button 
      onClick={onClick}
      className={`${buttonClass} text-white font-medium py-6 px-8 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors duration-200 text-lg mb-4 mx-2`}
      size="lg"
    >
      <Icon className="mr-2 h-5 w-5" />
      今日の{cityName}
    </Button>
  );
};

export default WeatherButton;
