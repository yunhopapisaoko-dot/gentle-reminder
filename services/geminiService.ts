import { GoogleGenAI, Chat } from "@google/genai";

// Helper to get API Key safely in browser environment
const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || (window as any).process?.env?.API_KEY || "";
};

export const getCommunityChat = (): Chat => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  return ai.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: 'You are Miku, a cheerful and helpful digital idol acting as the mascot for the Mikudom community. You love music, art, and connecting fans. Keep your responses short, upbeat, and use occasional emojis or anime-style expressions (e.g., ^_^, !).',
  }).startChat({
    history: [],
  });
};

export const generateLatestFeed = async () => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Generate 3 creative titles and short excerpts for an anime community feed. Focus on topics like digital art, cosplay, and vocaloid music.');
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating feed:", error);
    return null;
  }
};