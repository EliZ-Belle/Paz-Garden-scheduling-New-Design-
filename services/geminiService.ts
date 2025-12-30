import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeRequest = async (userPrompt: string, clients: any[]) => {
  if (!process.env.API_KEY) {
    return { error: "API Key not configured." };
  }

  try {
    const model = "gemini-2.5-flash-latest"; // Using the fast model for UI responsiveness
    
    // Minimal context to save tokens, real app would hydrate more
    const clientList = clients.map(c => `${c.name} (ID: ${c.id}, Area: ${c.area})`).join(', ');

    const prompt = `
      You are an assistant for a gardening scheduler app used in Israel (Hebrew language).
      Current Clients: ${clientList}.
      
      User Request (in Hebrew): "${userPrompt}"

      Extract the scheduling intent into JSON.
      Fields:
      - intent: 'schedule' | 'query' | 'unknown'
      - clientId: string (match strictly from list or null)
      - date: string (YYYY-MM-DD, assume current year ${new Date().getFullYear()}, calculate based on 'next tuesday' etc relative to today ${new Date().toISOString().split('T')[0]})
      - startTime: string (HH:mm)
      - durationMinutes: number (default 60)
      - instructions: string (Translate to Hebrew if not already)
      - explanation: string (A short conversational confirmation in Hebrew)

      Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return { error: "Failed to process AI request." };
  }
};
