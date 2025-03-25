import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Google AI with API key and WeatherAPI key
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const weatherApiKey = process.env.WEATHERAPI_KEY || "";
  let model: any;

  // Get or initialize the model
  function getModel() {
    if (!model) {
      model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    }
    return model;
  }

  // Helper function to fetch actual weather data from WeatherAPI
  async function fetchWeatherData() {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=Sapporo&aqi=yes&lang=ja`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API responded with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching weather data:", error);
      throw error;
    }
  }

  // Format weather data into a nice Markdown format
  function formatWeatherData(data: any) {
    const current = data.current;
    const location = data.location;
    
    // Get air quality data if available
    const aqi = current.air_quality || {};
    const pm25 = aqi.pm2_5 ? Math.round(aqi.pm2_5) : "不明";
    
    // Format the output in Markdown
    return `# 今日の札幌の天気

**☁️☔️ 天気:** ${current.condition.text}
**🌡️ 気温:** 現在 ${current.temp_c}℃ / 体感温度 ${current.feelslike_c}℃
**🍃 風:** ${current.wind_kph} km/h (${current.wind_dir})
**💧 湿度:** ${current.humidity} %
**⬇️ 気圧:** ${current.pressure_mb} hPa

**🌲 花粉:** データなし

**💛 黄砂:** データなし

**🌫 PM2.5:** ${pm25} μg/m³

**📝 一言:**
札幌市の現在の天気です。データは ${location.localtime} に更新されました。
`;
  }

  // Weather API endpoint - now using real data
  app.post('/api/weather', async (req, res) => {
    try {
      // Check if we have the weather API key
      if (!weatherApiKey) {
        throw new Error("Weather API key is not configured");
      }

      // Fetch actual weather data from the API
      const weatherData = await fetchWeatherData();
      
      // Format the weather data
      const formattedWeather = formatWeatherData(weatherData);

      return res.json({ text: formattedWeather });
      
    } catch (error) {
      console.error("Error fetching weather:", error);
      
      // Fallback to AI generation if API fails
      try {
        const { prompt } = req.body;
        
        if (!prompt) {
          return res.status(400).json({ error: "Prompt is required" });
        }

        const model = getModel();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Send AI-generated data but indicate it's a fallback
        return res.json({ 
          text: text,
          isAIFallback: true
        });
      } catch (aiError) {
        return res.status(500).json({ 
          error: "Failed to get weather data", 
          details: (error as Error).message 
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
