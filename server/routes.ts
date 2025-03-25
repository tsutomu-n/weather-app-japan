import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize API keys
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  const weatherApiKey = process.env.WEATHERAPI_KEY || "";
  const braveSearchApiKey = process.env.BRAVE_SEARCH_API_KEY || "";
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
  
  // Helper function to search for pollen information using Brave Search API
  async function searchPollenInfo() {
    try {
      if (!braveSearchApiKey) {
        return "データなし (APIキーが設定されていません)";
      }
      
      // Create URL with query parameters
      const searchParams = new URLSearchParams({
        q: "今日 札幌 花粉情報 速報 花粉飛散状況",
        country: "jp",
        search_lang: "ja",
        count: "3",
        freshness: "pd"  // Past day for fresh results
      });
      
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?${searchParams.toString()}`, 
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": braveSearchApiKey
          }
        }
      );
      
      if (!response.ok) {
        console.error(`Brave Search API responded with status ${response.status}`);
        return "データなし (検索APIエラー)";
      }
      
      const data = await response.json();
      if (!data.web || !data.web.results || data.web.results.length === 0) {
        return "本日の情報なし";
      }
      
      // Use Google AI to summarize the search results
      const model = getModel();
      const prompt = `次の検索結果をもとに、今日の札幌の花粉情報を日本語で30文字以内で要約してください。花粉の種類と飛散状況に焦点を当ててください：
      
${data.web.results.slice(0, 3).map((r: any) => `タイトル: ${r.title}, 抜粋: ${r.description}`).join('\n')}`;
      
      const result = await model.generateContent(prompt);
      const response_text = await result.response.text();
      
      return response_text.trim() || "少ない (検索結果より推定)";
    } catch (error) {
      console.error("Error searching for pollen info:", error);
      return "少ない (推定)";
    }
  }
  
  // Helper function to search for PM2.5 and yellow sand information using Brave Search API
  async function searchYellowSandInfo() {
    try {
      if (!braveSearchApiKey) {
        return "データなし (APIキーが設定されていません)";
      }
      
      // Create URL with query parameters
      const searchParams = new URLSearchParams({
        q: "今日 札幌 黄砂 飛来状況 観測速報",
        country: "jp",
        search_lang: "ja",
        count: "3",
        freshness: "pd"  // Past day for fresh results
      });
      
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?${searchParams.toString()}`, 
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": braveSearchApiKey
          }
        }
      );
      
      if (!response.ok) {
        console.error(`Brave Search API responded with status ${response.status}`);
        return "データなし (検索APIエラー)";
      }
      
      const data = await response.json();
      if (!data.web || !data.web.results || data.web.results.length === 0) {
        return "本日の情報なし";
      }
      
      // Use Google AI to summarize the search results
      const model = getModel();
      const prompt = `次の検索結果をもとに、今日の札幌の黄砂の状況を日本語で30文字以内で要約してください：
      
${data.web.results.slice(0, 3).map((r: any) => `タイトル: ${r.title}, 抜粋: ${r.description}`).join('\n')}`;
      
      const result = await model.generateContent(prompt);
      const response_text = await result.response.text();
      
      return response_text.trim() || "影響なし (検索結果より推定)";
    } catch (error) {
      console.error("Error searching for yellow sand info:", error);
      return "影響なし (推定)";
    }
  }

  // Format weather data into a nice Markdown format
  async function formatWeatherData(data: any) {
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
    
    // Fetch additional information using Brave Search API
    const pollenInfo = await searchPollenInfo();
    const yellowSandInfo = await searchYellowSandInfo();
    
    // Format the output in Markdown
    return `# 今日の札幌の天気

**☁️☔️ 現在の天気:** ${current.condition.text}
**🌡️ 現在の気温:** ${current.temp_c}℃ / 体感温度 ${current.feelslike_c}℃${forecastInfo}

**🍃 風:** ${current.wind_kph} km/h (${current.wind_dir})
**💧 湿度:** ${current.humidity} %
**⬇️ 気圧:** ${current.pressure_mb} hPa

**🌲 花粉:** ${pollenInfo}

**💛 黄砂:** ${yellowSandInfo}

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
      
      // Format the weather data with additional info from Brave Search
      const formattedWeather = await formatWeatherData(weatherData);

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
