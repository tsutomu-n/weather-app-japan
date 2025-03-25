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
  async function fetchWeatherData(city = "Sapporo") {
    try {
      console.log(`Fetching weather data for city: ${city}`);
      
      // For Takasaki, we need to specify the country to ensure we get the correct city
      const cityQuery = city === "Takasaki" ? "Takasaki,Japan" : city;
      
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(cityQuery)}&days=1&aqi=yes&lang=ja`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API responded with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching weather data for ${city}:`, error);
      throw error;
    }
  }
  
  // Helper function to search for pollen information using Brave Search API
  async function searchPollenInfo(city = "札幌") {
    try {
      if (!braveSearchApiKey) {
        return "データなし (APIキーが設定されていません)";
      }
      
      // Create simple querystring with minimal parameters
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(`${city} 花粉情報`)}&count=3`;
      
      const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
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
      const prompt = `次の検索結果をもとに、今日の${city}の花粉情報を日本語で30文字以内で要約してください。花粉の種類と飛散状況に焦点を当ててください：
      
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
  async function searchYellowSandInfo(city = "札幌") {
    try {
      if (!braveSearchApiKey) {
        return "データなし (APIキーが設定されていません)";
      }
      
      // Create simple querystring with minimal parameters
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(`${city} 黄砂`)}&count=3`;
      
      const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
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
      const prompt = `次の検索結果をもとに、今日の${city}の黄砂の状況を日本語で30文字以内で要約してください：
      
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
  async function formatWeatherData(data: any, cityParam = "Sapporo") {
    const current = data.current;
    const location = data.location;
    const forecast = data.forecast?.forecastday?.[0];
    
    // Get city name in Japanese
    let cityName;
    if (cityParam === "Takasaki") {
      cityName = "高崎";
    } else {
      cityName = "札幌";
    }
    
    console.log(`Formatting weather data for city: ${cityName} (param: ${cityParam})`);
    
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
    
    // Get month for seasonal information (for fallback data)
    const currentMonth = new Date().getMonth() + 1; // January is 0 in JS
    
    // Default pollen and yellow sand info based on season in Japan
    let defaultPollenInfo = "データなし";
    let defaultYellowSandInfo = "データなし";
    
    // Seasonal defaults for pollen
    if (currentMonth >= 2 && currentMonth <= 5) {
      // Spring - cedar and cypress pollen season in Japan
      defaultPollenInfo = "杉・ヒノキ花粉 - 飛散期 (季節的推定)";
    } else if (currentMonth >= 8 && currentMonth <= 10) {
      // Late Summer/Fall - ragweed pollen season
      defaultPollenInfo = "ブタクサ花粉 - 飛散期 (季節的推定)"; 
    } else {
      defaultPollenInfo = "花粉の飛散 - 少量 (季節的推定)";
    }
    
    // Seasonal defaults for yellow sand (Kosa) - most common in spring
    if (currentMonth >= 3 && currentMonth <= 5) {
      defaultYellowSandInfo = "黄砂現象の可能性あり (季節的推定)";
    } else {
      defaultYellowSandInfo = "黄砂の影響 - 少ない (季節的推定)";
    }
    
    // Try to fetch additional information using Brave Search API
    let pollenInfo;
    let yellowSandInfo;
    
    try {
      pollenInfo = await searchPollenInfo(cityName);
      // If API returned an error message, use our season-based fallback
      if (pollenInfo.includes("データなし") || pollenInfo.includes("エラー")) {
        pollenInfo = defaultPollenInfo;
      }
    } catch (e) {
      pollenInfo = defaultPollenInfo;
    }
    
    try {
      yellowSandInfo = await searchYellowSandInfo(cityName);
      // If API returned an error message, use our season-based fallback
      if (yellowSandInfo.includes("データなし") || yellowSandInfo.includes("エラー")) {
        yellowSandInfo = defaultYellowSandInfo;
      }
    } catch (e) {
      yellowSandInfo = defaultYellowSandInfo;
    }
    
    // Format the output in Markdown
    return `# 今日の${cityName}の天気

**☁️☔️ 現在の天気:** ${current.condition.text}
**🌡️ 現在の気温:** ${current.temp_c}℃ / 体感温度 ${current.feelslike_c}℃${forecastInfo}

**🍃 風:** ${current.wind_kph} km/h (${current.wind_dir})
**💧 湿度:** ${current.humidity} %
**⬇️ 気圧:** ${current.pressure_mb} hPa

**🌲 花粉:** ${pollenInfo}

**💛 黄砂:** ${yellowSandInfo}

**🌫 PM2.5:** ${pm25} μg/m³

**📝 一言:**
${cityName}市の天気情報です。データは ${location.localtime} に更新されました。
`;
  }

  // Weather API endpoint - now using real data
  app.post('/api/weather', async (req, res) => {
    try {
      // Check if we have the weather API key
      if (!weatherApiKey) {
        throw new Error("Weather API key is not configured");
      }
      
      const { city } = req.body;
      const targetCity = city === 'takasaki' ? 'Takasaki' : 'Sapporo';

      // Fetch actual weather data from the API
      const weatherData = await fetchWeatherData(targetCity);
      
      // Format the weather data with additional info from Brave Search
      const formattedWeather = await formatWeatherData(weatherData, targetCity);

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
