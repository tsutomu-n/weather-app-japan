import React from 'react';
import ReactMarkdown from 'react-markdown';

interface WeatherInfoProps {
  weatherData: string;
}

const WeatherInfo: React.FC<WeatherInfoProps> = ({ weatherData }) => {
  return (
    <div className="bg-background-paper rounded-xl shadow-md overflow-hidden">
      <div className="markdown-content p-5 prose prose-blue max-w-none">
        <ReactMarkdown>{weatherData}</ReactMarkdown>
      </div>
      <div className="bg-background bg-opacity-70 px-4 py-2 text-right text-xs text-muted-foreground">
        更新: {new Date().toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default WeatherInfo;
