import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const generateTradeLog = async (strategyName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a realistic trade log entry for a trading strategy named "${strategyName}". 
      Return the result as a JSON object with the following fields:
      - asset: string (e.g., "BTC/USD", "ETH/USDT")
      - margin: number (between 500 and 5000)
      - profit: number (between -500 and 1500)
      - isWin: boolean
      - details: string (a brief technical explanation of the trade, e.g., "RSI divergence on 1H chart")
      
      Ensure the profit and isWin are consistent (positive profit means isWin is true).`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const analyzeUserActivity = async (userData: any, transactions: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following user activity for a trading platform:
      User: ${JSON.stringify(userData)}
      Recent Transactions: ${JSON.stringify(transactions.slice(0, 10))}
      
      Provide a brief summary of their behavior and any potential risks or recommendations for the admin.`,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to analyze user activity.";
  }
};
