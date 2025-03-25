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
        `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=Sapporo&days=1&aqi=yes&lang=ja`
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
    const forecast = data.forecast?.forecastday?.[0];
    
    // Get air quality data if available
    const aqi = current.air_quality || {};
    const pm25 = aqi.pm2_5 ? Math.round(aqi.pm2_5) : "不明";
    
    // Get forecast data if available
    let forecastInfo = '';
    if (forecast) {
      const day = forecast.day;
      forecastInfo = `
**📅 今日の予想気温:** 最高 ${day.maxtemp_c}℃ / 最低 ${day.mintemp_c}℃
**🌧 降水確率:** ${forecast.day.daily_chance_of_rain}%
**☀️ 日の出:** ${forecast.astro.sunrise}
**🌙 日の入り:** ${forecast.astro.sunset}`;
      
      // Add hourly forecast if available
      if (forecast.hour && forecast.hour.length > 0) {
        forecastInfo += '\n\n**⏰ 時間ごとの予報:**';
        
        // Get current hour
        const now = new Date();
        const currentHour = now.getHours();
        
        // Only show forecast for upcoming hours (next 6 hours)
        const hoursToShow = [];
        for (let i = currentHour; i < currentHour + 12; i += 3) {
          const hourIndex = i % 24;
          if (forecast.hour[hourIndex]) {
            hoursToShow.push(forecast.hour[hourIndex]);
          }
        }
        
        // Format hourly forecast
        hoursToShow.forEach(hour => {
          const hourTime = new Date(hour.time).getHours();
          forecastInfo += `\n* ${hourTime}時: ${hour.temp_c}℃ (${hour.condition.text})`;
        });
      }
    }
    
    // Format the output in Markdown
    return `# 今日の札幌の天気

**☁️☔️ 現在の天気:** ${current.condition.text}
**🌡️ 現在の気温:** ${current.temp_c}℃ / 体感温度 ${current.feelslike_c}℃${forecastInfo}

**🍃 風:** ${current.wind_kph} km/h (${current.wind_dir})
**💧 湿度:** ${current.humidity} %
**⬇️ 気圧:** ${current.pressure_mb} hPa

**🌲 花粉:** データなし

**💛 黄砂:** データなし

**🌫 PM2.5:** ${pm25} μg/m³

**📝 一言:**
札幌市の天気情報です。データは ${location.localtime} に更新されました。
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
