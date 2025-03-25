import { PROMPT_TEMPLATE } from "../constants";

// Response type from the Weather API or Gemini fallback
export interface GenerateResponse {
  text?: string;
  error?: string;
  details?: string;
  isAIFallback?: boolean;
  fromCache?: boolean;
  cachedAt?: string | null;
}

// Return type for weather data
export interface WeatherResult {
  text: string;
  isFallback: boolean;
  fromCache?: boolean;
  cachedAt?: string | null;
}

// Function to fetch weather data from the server
export const fetchWeatherData = async (city?: string): Promise<WeatherResult> => {
  try {
    const response = await fetch('/api/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: PROMPT_TEMPLATE,
        city: city || 'sapporo' 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GenerateResponse = await response.json();

    if (data.error) {
      throw new Error(data.error + (data.details ? `: ${data.details}` : ""));
    }

    if (!data.text) {
      throw new Error("No text received from API");
    }
    
    return {
      text: data.text,
      isFallback: !!data.isAIFallback,
      fromCache: !!data.fromCache,
      cachedAt: data.cachedAt
    };

  } catch (error: any) {
    console.error('Error fetching weather data:', error);
    throw new Error(error.message || 'Unknown error occurred');
  }
};
