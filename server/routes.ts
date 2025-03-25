import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Google AI with API key
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
  let model: any;

  // Get or initialize the model
  function getModel() {
    if (!model) {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
    return model;
  }

  // Weather API endpoint
  app.post('/api/weather', async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const model = getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return res.json({ text });
      
    } catch (error) {
      console.error("Error generating content:", error);
      return res.status(500).json({ 
        error: "Failed to generate content", 
        details: (error as Error).message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
