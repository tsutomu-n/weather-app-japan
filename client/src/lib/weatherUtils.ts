import { PROMPT_TEMPLATE } from "../constants";

// Response type from the Gemini API
export interface GenerateResponse {
  text?: string;
  error?: string;
  details?: string;
}

// Function to fetch weather data from the server
export const fetchWeatherData = async (): Promise<string> => {
  try {
    const response = await fetch('/api/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: PROMPT_TEMPLATE }),
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
    
    return data.text;

  } catch (error: any) {
    console.error('Error fetching weather data:', error);
    throw new Error(error.message || 'Unknown error occurred');
  }
};
