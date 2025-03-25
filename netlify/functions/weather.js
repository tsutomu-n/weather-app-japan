const { GoogleGenerativeAI } = require("@google/generative-ai");

// 環境変数からAPIキーを取得
const WEATHER_API_KEY = process.env.WEATHERAPI_KEY;
const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// キャッシュ保持期間（ミリ秒）
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12時間
const ENV_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24時間

// キャッシュ
let weatherCache = {};
let envDataCache = {};
let errorTimestamps = {};

// AI Modelの設定
const MODEL_NAME = "gemini-2.0-flash-lite";
const PROMPT_TEMPLATE = `
以下の情報を元に、簡潔で読みやすい日本の天気レポートを作成してください。
特に人間が読みやすく、理解しやすい形式でフォーマットしてください。

場所: {location}
現在の天気: {current_condition}
現在の気温: {temp_c}℃
体感温度: {feelslike_c}℃
湿度: {humidity}%
風速: {wind_kph} km/h ({wind_dir})
気圧: {pressure_mb} hPa
最高気温: {maxtemp_c}℃
最低気温: {mintemp_c}℃
降水確率: {precip_chance}%

時間ごとの予報:
{hourly_forecast}

花粉情報: {pollen_info}
黄砂情報: {yellow_sand_info}
PM2.5: {pm25_info}

以下の形式でレポートを作成してください:

# 今日の天気

**☁️☔️ 現在の天気:** [現在の天気]
**🌡️ 現在の気温:** [現在の気温]℃ / 体感温度 [体感温度]℃
**📅 今日の予想気温:** 最高 [最高気温]℃ / 最低 [最低気温]℃
**🌧 降水確率:** [降水確率]%

**⏰ 時間ごとの予報:**
[時間ごとの予報を箇条書きで表示]

**🍃 風:** [風速] km/h ([風向き])
**💧 湿度:** [湿度] %
**⬇️ 気圧:** [気圧] hPa

**🌲 花粉:** [花粉情報]
**💛 黄砂:** [黄砂情報]
**🌫 PM2.5:** [PM2.5の値と単位]

すべての項目を必ず順番通りに含めてください。
情報がない場合は「データなし」と記載してください。
`;

// 気象データを取得する関数
async function fetchWeatherData(city = "Sapporo") {
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${city}&days=1&aqi=yes&alerts=no&lang=ja`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API responded with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    throw error;
  }
}

// 花粉情報を検索する関数
async function searchPollenInfo(city = "札幌") {
  try {
    const query = `${city} 花粉 飛散情報 杉 ヒノキ ${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日 速報`;
    
    const response = await fetch("https://api.search.brave.com/res/v1/web/search", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_SEARCH_API_KEY
      },
      params: { q: query }
    });
    
    if (!response.ok) {
      // APIエラーの時刻を記録
      errorTimestamps['pollen'] = Date.now();
      
      if (response.status === 429) {
        return `${city}の花粉飛散状況：スギ・ヒノキ・シラカバの花粉情報は対象外。観測データなし。`;
      }
      
      throw new Error(`Brave Search API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.web && data.web.results && data.web.results.length > 0) {
      // 結果からタイトルと説明を抽出
      const results = data.web.results.slice(0, 2);
      const pollenInfo = results
        .map(result => result.description)
        .filter(desc => 
          desc.includes("花粉") && 
          !desc.includes("アレルギー") && 
          (desc.includes("観測") || desc.includes("状況") || desc.includes("飛散"))
        );
      
      if (pollenInfo.length > 0) {
        return `${city}の花粉情報：${pollenInfo[0]}`;
      }
    }
    
    return `${city}の花粉情報：スギ・ヒノキ・シラカバの花粉情報は対象外。観測データなし。`;
  } catch (error) {
    console.error("Error searching pollen info:", error.message);
    return `${city}の花粉情報：スギ・ヒノキ・シラカバの花粉情報は対象外。観測データなし。`;
  }
}

// 黄砂情報を検索する関数
async function searchYellowSandInfo(city = "札幌") {
  // 最近エラーが発生した場合は再試行しない（30分クールダウン）
  if (errorTimestamps['yellowsand'] && (Date.now() - errorTimestamps['yellowsand'] < 30 * 60 * 1000)) {
    return "観測データなし";
  }
  
  try {
    const query = `${city} 黄砂 観測 ${new Date().getFullYear()}年${new Date().getMonth() + 1}月 気象庁`;
    
    const response = await fetch("https://api.search.brave.com/res/v1/web/search", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_SEARCH_API_KEY
      },
      params: { q: query }
    });
    
    if (!response.ok) {
      // APIエラーの時刻を記録
      errorTimestamps['yellowsand'] = Date.now();
      
      if (response.status === 429) {
        return "観測データなし";
      }
      
      throw new Error(`Brave Search API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.web && data.web.results && data.web.results.length > 0) {
      // 結果からタイトルと説明を抽出
      const results = data.web.results.slice(0, 3);
      const yellowSandInfo = results
        .map(result => result.description)
        .filter(desc => 
          desc.includes("黄砂") && 
          (desc.includes("観測") || desc.includes("状況") || desc.includes("予測"))
        );
      
      if (yellowSandInfo.length > 0) {
        return yellowSandInfo[0];
      }
    }
    
    return "観測データなし";
  } catch (error) {
    console.error("Error searching yellow sand info:", error.message);
    return "観測データなし";
  }
}

// AIモデルを使用して天気データをフォーマットする関数
async function formatWeatherData(data, cityParam = "Sapporo", forceRefresh = false) {
  // AIモデルを初期化
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  const cityJapaneseName = getCityJapaneseName(cityParam);
  
  try {
    // 天気関連のデータを抽出
    const current = data.current;
    const forecast = data.forecast.forecastday[0];
    const hourly = forecast.hour;
    
    // 現在の時間から6時間分の予報を抽出（3時間おき）
    const currentHour = new Date().getHours();
    let hourlyForecast = "";
    
    for (let i = 0; i < 4; i++) {
      const forecastHour = (currentHour + i * 3) % 24;
      const hourData = hourly[forecastHour];
      
      hourlyForecast += `* ${forecastHour}時: ${hourData.temp_c}℃ (${hourData.condition.text})\n`;
    }
    
    // 花粉と黄砂の情報を取得（キャッシュを考慮）
    let pollenInfo = "データなし";
    let yellowSandInfo = "データなし";
    let pm25 = data.current.air_quality?.pm2_5 ? `${Math.round(data.current.air_quality.pm2_5)} μg/m³` : "データなし";
    
    // 環境データ（花粉・黄砂）のキャッシュをチェック
    const cityKey = cityParam.toLowerCase();
    const pollenCacheKey = `pollen_${cityKey}`;
    const yellowSandCacheKey = `yellowsand_${cityKey}`;
    
    // 花粉情報
    if (
      forceRefresh || 
      !envDataCache[pollenCacheKey] || 
      Date.now() - envDataCache[pollenCacheKey].timestamp > ENV_CACHE_DURATION_MS
    ) {
      // キャッシュがない、または古い場合は新しいデータを取得
      pollenInfo = await searchPollenInfo(cityJapaneseName);
      envDataCache[pollenCacheKey] = {
        data: pollenInfo,
        timestamp: Date.now()
      };
    } else {
      // キャッシュから取得
      pollenInfo = envDataCache[pollenCacheKey].data;
    }
    
    // 黄砂情報
    if (
      forceRefresh || 
      !envDataCache[yellowSandCacheKey] || 
      Date.now() - envDataCache[yellowSandCacheKey].timestamp > ENV_CACHE_DURATION_MS
    ) {
      // キャッシュがない、または古い場合は新しいデータを取得
      yellowSandInfo = await searchYellowSandInfo(cityJapaneseName);
      envDataCache[yellowSandCacheKey] = {
        data: yellowSandInfo,
        timestamp: Date.now()
      };
    } else {
      // キャッシュから取得
      yellowSandInfo = envDataCache[yellowSandCacheKey].data;
    }
    
    // プロンプトに値を埋め込む
    const prompt = PROMPT_TEMPLATE
      .replace("{location}", cityJapaneseName)
      .replace("{current_condition}", current.condition.text)
      .replace("{temp_c}", current.temp_c)
      .replace("{feelslike_c}", current.feelslike_c)
      .replace("{humidity}", current.humidity)
      .replace("{wind_kph}", current.wind_kph)
      .replace("{wind_dir}", current.wind_dir)
      .replace("{pressure_mb}", current.pressure_mb)
      .replace("{maxtemp_c}", forecast.day.maxtemp_c)
      .replace("{mintemp_c}", forecast.day.mintemp_c)
      .replace("{precip_chance}", forecast.day.daily_chance_of_rain)
      .replace("{hourly_forecast}", hourlyForecast)
      .replace("{pollen_info}", pollenInfo)
      .replace("{yellow_sand_info}", yellowSandInfo)
      .replace("{pm25_info}", pm25);
    
    // AIモデルでテキスト生成
    const result = await model.generateContent(prompt);
    const response = result.response;
    const formattedText = response.text();
    
    return formattedText;
  } catch (error) {
    console.error('Error formatting weather data:', error);
    
    // フォールバック：エラーが発生した場合は構造化データを直接整形して返す
    return `# 今日の天気

**☁️☔️ 現在の天気:** ${data.current.condition.text}
**🌡️ 現在の気温:** ${data.current.temp_c}℃ / 体感温度 ${data.current.feelslike_c}℃
**📅 今日の予想気温:** 最高 ${data.forecast.forecastday[0].day.maxtemp_c}℃ / 最低 ${data.forecast.forecastday[0].day.mintemp_c}℃
**🌧 降水確率:** ${data.forecast.forecastday[0].day.daily_chance_of_rain}%

**⏰ 時間ごとの予報:**
* ${new Date().getHours()}時: ${data.current.temp_c}℃ (${data.current.condition.text})

**🍃 風:** ${data.current.wind_kph} km/h (${data.current.wind_dir})
**💧 湿度:** ${data.current.humidity} %
**⬇️ 気圧:** ${data.current.pressure_mb} hPa

**🌲 花粉:** データなし
**💛 黄砂:** データなし
**🌫 PM2.5:** ${data.current.air_quality?.pm2_5 ? `${Math.round(data.current.air_quality.pm2_5)} μg/m³` : 'データなし'}
`;
  }
}

// 都市名を日本語に変換する関数
function getCityJapaneseName(cityId) {
  const cityMap = {
    "sapporo": "札幌",
    "tokyo": "東京",
    "osaka": "大阪",
    "fukuoka": "福岡",
    "sendai": "仙台",
    "takasaki": "高崎",
    "shimonita": "下仁田",
    "maebashi": "前橋",
  };
  
  return cityMap[cityId.toLowerCase()] || cityId;
}

// 天気データをキャッシュ付きで取得する関数
async function getWeatherDataWithCache(cityId = "sapporo", forceRefresh = false) {
  const cityApiName = cityId;
  const cacheKey = cityApiName.toLowerCase();
  
  // forceRefreshが指定されている場合、またはキャッシュがない/古い場合は新しいデータを取得
  if (
    forceRefresh || 
    !weatherCache[cacheKey] || 
    Date.now() - weatherCache[cacheKey].timestamp > CACHE_DURATION_MS
  ) {
    console.log(forceRefresh ? 
      `force refresh requested for ${cityApiName}, fetching fresh data...` : 
      `cache miss or expired for ${cityApiName}, fetching fresh data...`
    );
    
    try {
      // 新しい天気データを取得
      const data = await fetchWeatherData(cityApiName);
      
      // 天気データをフォーマット
      const formattedData = await formatWeatherData(data, cityId, forceRefresh);
      
      // キャッシュを更新
      weatherCache[cacheKey] = {
        data: data,
        timestamp: Date.now(),
        formattedData: formattedData
      };
      
      console.log(`Weather data for ${cacheKey} (${cityApiName}) served freshly fetched`);
      
      return {
        text: formattedData,
        fromCache: false
      };
    } catch (error) {
      console.error('Error getting weather data:', error);
      
      // エラー時にキャッシュが利用可能ならそれを使用
      if (weatherCache[cacheKey]) {
        console.log(`Error fetching fresh data, using cached data for ${cityApiName}`);
        return {
          text: weatherCache[cacheKey].formattedData,
          fromCache: true,
          cachedAt: new Date(weatherCache[cacheKey].timestamp).toLocaleTimeString('ja-JP')
        };
      }
      
      // キャッシュもない場合はエラーをスロー
      throw error;
    }
  } else {
    // キャッシュを使用
    const cacheAge = Math.floor((Date.now() - weatherCache[cacheKey].timestamp) / 60000);
    console.log(`Using cached data for ${cityApiName} (cached ${cacheAge} minutes ago)`);
    
    return {
      text: weatherCache[cacheKey].formattedData,
      fromCache: true,
      cachedAt: new Date(weatherCache[cacheKey].timestamp).toLocaleTimeString('ja-JP')
    };
  }
}

// Netlify Function ハンドラー
exports.handler = async (event, context) => {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // OPTIONSリクエスト（プリフライト）に対するレスポンス
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  // POSTリクエストのみを処理
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    const requestBody = JSON.parse(event.body);
    const city = requestBody.city || 'sapporo';
    const forceRefresh = requestBody.forceRefresh || false;
    
    const result = await getWeatherDataWithCache(city, forceRefresh);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error processing weather request:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get weather data',
        details: error.message
      })
    };
  }
};