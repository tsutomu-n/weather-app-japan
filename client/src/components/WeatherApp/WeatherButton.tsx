import { Button } from "@/components/ui/button";
import { SunIcon } from "lucide-react";

interface WeatherButtonProps {
  onClick: () => void;
}

const WeatherButton: React.FC<WeatherButtonProps> = ({ onClick }) => {
  return (
    <Button 
      onClick={onClick}
      className="bg-primary text-white font-medium py-6 px-8 rounded-lg shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors duration-200 text-lg mb-8"
      size="lg"
    >
      <SunIcon className="mr-2 h-5 w-5" />
      今日の札幌
    </Button>
  );
};

export default WeatherButton;
