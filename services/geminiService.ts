import { GoogleGenAI } from "@google/genai";

// Helper to get API Key safely in browser environment
const getApiKey = () => {
  // Try Vite environment variable first
  const key = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (key) return key;

  // Fallback to global process.env if defined
  try {
    return (window as any).process?.env?.GEMINI_API_KEY || (window as any).process?.env?.VITE_GEMINI_API_KEY || "";
  } catch {
    return "";
  }
};

export const getCommunityChat = () => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
    return null;
  }

  const genAI = new GoogleGenAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: 'You are Miku, a cheerful and helpful digital idol acting as the mascot for the Mikudom community. You love music, art, and connecting fans. Keep your responses short, upbeat, and use occasional emojis or anime-style expressions (e.g., ^_^, !).',
  });

  return model.startChat({
    history: [],
  });
};

export const generateLatestFeed = async () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Generate 3 creative titles and short excerpts for an anime community feed. Focus on topics like digital art, cosplay, and vocaloid music.');
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating feed:", error);
    return null;
  }
};